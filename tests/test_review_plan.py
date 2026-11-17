import importlib.util,json,tempfile,unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('review_plan',Path(__file__).resolve().parents[1]/'scripts/review_plan.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)

class PlanTests(unittest.TestCase):
 def plan(self):
  return {'fps':30,'duration_frames':300,'beats':[{'id':'first','at':0,'until':150,'mode':'data','meaning':'First comparable value','anchor':{'text':'first','frame':0,'voice_sha256':'a'*64,'method':'word-aligned'}},{'id':'second','at':150,'until':300,'mode':'data','meaning':'Second comparable value','anchor':{'text':'second','frame':150,'voice_sha256':'a'*64,'method':'word-aligned'}}]}
 def run_plan(self,d):
  with tempfile.TemporaryDirectory() as t:
   p=Path(t)/'plan.json';p.write_text(json.dumps(d));return m.check(p)
 def test_next_event_cannot_appear_early(self):
  d=self.plan();self.assertEqual([],self.run_plan(d));d['beats'][1]['anchor']['frame']=180
  self.assertTrue(any('spoken anchor' in e for e in self.run_plan(d)))
 def test_estimated_critical_timing_and_static_hold(self):
  d=self.plan();d['beats'][0]['anchor']['method']='estimated';d['beats'][0]['until']=240
  e=self.run_plan(d);self.assertTrue(any('verified word' in x for x in e));self.assertTrue(any('long hold' in x for x in e))
 def test_old_city_photo_fails_current_event_even_if_file_exists(self):
  with tempfile.TemporaryDirectory() as t:
   p=Path(t);(p/'city.jpg').write_bytes(b'test');d=self.plan();d['media']=[{'id':'city','file':'city.jpg','current_event':True,'captured_date':'2016-01-01','event_start':'2026-01-01','event_end':'2026-12-31'}];(p/'plan.json').write_text(json.dumps(d))
   self.assertTrue(any('outside event dates' in e for e in m.check(p/'plan.json')))
 def test_brand_identity_and_real_pause_intervals(self):
  d=self.plan();d['brand']={'profile':'swaintalk-v1','logo_sha256':'cdfdaad38a1e8eaf6496e20daaf33b9a7930c61beb6776d56be802345b6dca6c','occurrences':[{'role':r,'start':0,'voice_start':12,'voice_end':100,'end':112,'component_sha256':'a'*64} for r in ['intro','outro']]}
  self.assertEqual([],self.run_plan(d));d['brand']['occurrences'][1]['voice_start']=0;d['brand']['occurrences'][1]['component_sha256']='b'*64
  e=self.run_plan(d);self.assertTrue(any('identical' in x for x in e));self.assertTrue(any('pauses' in x for x in e))
 def test_chart_provenance_and_zero_baseline(self):
  d=self.plan();d['comparisons']=[{'metric':'growth','unit':'%','period':'2026','status':'forecast','source':'IMF','source_version':'October 2026','source_locator':'table 1.1','chart':'bar','zero_baseline':True,'values':[4.5,2.3,.9]}]
  self.assertEqual([],self.run_plan(d));d['comparisons'][0]['status']='';d['comparisons'][0]['zero_baseline']=False
  self.assertEqual(2,len(self.run_plan(d)))

class VisualPlanTests(unittest.TestCase):
 def fixture(self,root):
  (root/'photo.png').write_bytes(b'fixture-image')
  import hashlib
  digest=hashlib.sha256((root/'photo.png').read_bytes()).hexdigest()
  return {'fps':30,'duration_frames':300,'scene_inventory':[
   {'id':'hook','start':0,'end':150,'role':'content','imagery':[{'file':'photo.png','kind':'photo','purpose':'Identify the subject','substantial':True,'from':0,'until':150}]},
   {'id':'analysis','start':150,'end':300,'role':'content','imagery':[]}],
   'visual_hook':{'scene_id':'hook','subject':'Actual subject','image_at':0,'motion_at':0,'recognizable_by':60},
   'evidence_moves':[{'id':'source','file':'photo.png','sha256':digest,'whole_from':150,'zoom_start':180,'zoom_end':204,'method':'same-source-transform','source_swapped':False,'highlight_at':204,'summary_at':220,'review_frames':[180,192,204]}],
   'relationship_maps':[{'nodes':[{'id':'a'},{'id':'b'}],'edges':[{'from':'a','to':'b','label':'supplies','direction':'forward'}]}]}
 def test_half_image_scenes_and_hook(self):
  with tempfile.TemporaryDirectory() as t:
   p=Path(t);d=self.fixture(p);self.assertEqual([],m.check_visual(d,p))
   d['scene_inventory'][0]['imagery'][0]['kind']='document'
   errors=m.check_visual(d,p);self.assertTrue(any('half' in e for e in errors));self.assertTrue(any('substantial scene asset' in e for e in errors))
 def test_zoom_requires_same_source_and_arrival_before_mark(self):
  with tempfile.TemporaryDirectory() as t:
   p=Path(t);d=self.fixture(p);d['evidence_moves'][0].update(source_swapped=True,highlight_at=190)
   errors=m.check_visual(d,p);self.assertTrue(any('persistent' in e for e in errors));self.assertTrue(any('arrival' in e for e in errors))
 def test_dangling_or_unlabelled_line_rejected(self):
  with tempfile.TemporaryDirectory() as t:
   p=Path(t);d=self.fixture(p);d['relationship_maps'][0]['edges'][0]['to']='missing'
   self.assertTrue(any('endpoints' in e for e in m.check_visual(d,p)))
 def test_evidence_hash_detects_replaced_screenshot(self):
  with tempfile.TemporaryDirectory() as t:
   p=Path(t);d=self.fixture(p);(p/'photo.png').write_bytes(b'replacement')
   self.assertTrue(any('hash mismatch' in e for e in m.check_visual(d,p)))
