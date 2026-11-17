import copy,hashlib,importlib.util,json,pathlib,subprocess,tempfile,unittest
R=pathlib.Path(__file__).resolve().parents[1];S=R/'skills/newspaper-video'
def load(name,path):
 spec=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
structure=load('structure',S/'assets/template/validate_motion_structure.py');gate=load('motiongate',S/'scripts/motion_gate.py')
class ExecutableMotion(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.root=pathlib.Path(self.temp.name)/'fixture'
  subprocess.run(['python3',str(S/'scripts/motion_demo.py'),str(self.root)],check=True,capture_output=True)
  self.path=self.root/'src/timeline.json';self.data=json.loads(self.path.read_text());self.plan=json.loads((self.root/'motion-plan.json').read_text())
 def tearDown(self):self.temp.cleanup()
 def test_all_effects_and_plan(self):
  effects={e['effect'] for s in self.data['scenes'] for e in s['motion']}|{e['effect'] for e in self.data['transitions']}
  self.assertEqual(len(effects),13);self.assertEqual(structure.check(self.data,self.root),[]);self.assertEqual(gate.check_timeline(self.plan,self.path),[])
 def test_stale_and_missing_plan_event(self):
  self.plan['timeline_sha256']='0'*64;self.assertTrue(gate.check_timeline(self.plan,self.path))
  self.plan['timeline_sha256']=hashlib.sha256(self.path.read_bytes()).hexdigest();self.plan['events']=[];self.assertTrue(gate.check_timeline(self.plan,self.path))
 def test_foreground_overlap_and_legacy(self):
  d=copy.deepcopy(self.data);s=d['scenes'][0];other=copy.deepcopy(s['motion'][0]);other['id']='duplicate-box';s['motion'].append(other);self.assertIn('overlapping motion boxes',structure.check(d,self.root))
  d=copy.deepcopy(self.data);d['scenes'][0]['images']=['template-example.svg'];self.assertTrue(structure.check(d,self.root))
 def test_wrong_sound_mapping(self):
  self.plan['events'][0]['sound']['at']+=1;self.assertTrue(gate.check_timeline(self.plan,self.path))
 def test_sound_file_tail_and_bounds(self):
  e=self.data['scenes'][-1]['motion'][0];e['sound']['at']=10000;self.assertIn('motion sound tail exceeds film',structure.check(self.data,self.root))
 def test_source_escape_and_caption_overlap(self):
  s=next(s for s in self.data['scenes'] if s['motion'][0]['effect']=='film-frame');s['motion'][0]['data']['media']['src']='../private.png';self.assertIn('missing film-frame media',structure.check(self.data,self.root))
  self.data['scenes'][0]['motion'][0]['box']=[65,1400,900,300];self.assertTrue(structure.check(self.data,self.root))
 def test_tint_overlap_rejected(self):
  s=next(s for s in self.data['scenes'] if s['motion'][0]['effect']=='chapter-tint');other=copy.deepcopy(s['motion'][0]);other['id']='tint-2';s['motion'].append(other);self.assertIn('overlapping chapter tints',structure.check(self.data,self.root))

 def test_actual_focus_cannot_be_hidden_by_plan_settle(self):
  scene=self.data['scenes'][0];first=scene['motion'][0];first['box']=[65,350,400,400]
  other=copy.deepcopy(first);other.update(id='second-focus',start=40,end=200,box=[600,350,400,400]);scene['motion'].append(other)
  a=next(e for e in self.plan['events'] if e['id']==first['id']);a['bbox']=first['box'];a['settle']=a['start']
  b=copy.deepcopy(a);b.update(id=other['id'],start=40,end=200,bbox=other['box'],settle=40);b['sound']['at']=104;self.plan['events'].append(b)
  self.path.write_text(json.dumps(self.data));self.plan['timeline_sha256']=hashlib.sha256(self.path.read_bytes()).hexdigest()
  self.assertTrue(any('actual rendered moving focus overlaps' in x for x in gate.check_timeline(self.plan,self.path)))
 def test_transition_cannot_hide_unrecorded_evidence_zoom(self):
  self.data['scenes'][0]['motion']=[]
  self.data['scenes'][0]['analysis']={'type':'evidence','data':{'focusAt':195,'zoomFrames':24}}
  self.assertIn('transition overlaps actual evidence camera move',structure.check(self.data,self.root))
