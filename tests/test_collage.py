import copy,hashlib,importlib.util,json,pathlib,tempfile,unittest
R=pathlib.Path(__file__).resolve().parents[1]
def module(name,path):
 s=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
gen=module('collage_demo',R/'scripts/collage_demo.py');gate=module('collage_gate',R/'scripts/motion_gate.py')
assets=module('collage_assets',R/'assets/template/validate_collage_assets.py')
class CollageTest(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.root=gen.create(pathlib.Path(self.tmp.name)/'fixture');self.path=self.root/'src/timeline.json';self.timeline=json.loads(self.path.read_text());self.plan=json.loads((self.root/'motion-plan.json').read_text())
 def test_all_layouts_and_assets_plan(self):
  self.assertEqual(len(self.timeline['scenes']),16);self.assertFalse(assets.check(self.timeline,self.root));self.assertFalse(gate.check(self.plan,self.root));self.assertFalse(gate.check_timeline(self.plan,self.path))
 def test_stale_timeline_and_omitted_scene_rejected(self):
  self.plan['events'].pop();self.assertTrue(gate.check_timeline(self.plan,self.path));self.plan['timeline_sha256']='old';self.assertTrue(any('SHA' in e for e in gate.check_timeline(self.plan,self.path)))
 def test_rendered_child_sound_cannot_be_omitted(self):
  self.timeline['scenes'][0]['collage']['sounds']=[{'nodeId':'photo','anchor':'settle','file':'sfx/paper.wav'}];self.path.write_text(json.dumps(self.timeline));self.plan['timeline_sha256']=hashlib.sha256(self.path.read_bytes()).hexdigest();self.assertTrue(any('child sound' in e for e in gate.check_timeline(self.plan,self.path)))
 def test_asset_symlink_escape_rejected(self):
  outside=pathlib.Path(self.tmp.name)/'outside.png';outside.write_bytes(b'private');(self.root/'public/escape.png').symlink_to(outside);self.timeline['scenes'][0]['collage']['background']={'file':'escape.png'};self.assertTrue(assets.check(self.timeline,self.root))
 def test_existing_destination_preserved(self):
  before=self.path.read_bytes()
  with self.assertRaises(ValueError):gen.create(self.root)
  self.assertEqual(self.path.read_bytes(),before)
 def test_unrendered_collage_record_rejected(self):
  e=copy.deepcopy(self.plan['events'][0]);e['id']='invented:collage';self.plan['events'].append(e);self.assertTrue(any('unrendered' in e for e in gate.check_timeline(self.plan,self.path)))
