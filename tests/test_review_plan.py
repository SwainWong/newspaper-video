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
