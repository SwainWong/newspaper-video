import copy,hashlib,importlib.util,json,tempfile,unittest
from pathlib import Path
S=Path(__file__).resolve().parents[1]/'skills/newspaper-video'
spec=importlib.util.spec_from_file_location('sourcegate',S/'scripts/review_plan.py');gate=importlib.util.module_from_spec(spec);spec.loader.exec_module(gate)
class ProductionTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.root=Path(self.tmp.name);(self.root/'public').mkdir();(self.root/'public/source.png').write_bytes(b'synthetic fixture, not real evidence');(self.root/'voice.txt').write_text('An attributed statement.')
  self.nodes=[{'id':'evidence','kind':'photo','file':'source.png','at':0,'end':120},{'id':'credit','kind':'text','text':'Publisher 2026-01-01 https://example.org/source','at':0,'end':120}]
  self.timeline={'scenes':[{'id':'s','start':0,'end':120,'sourceClaimIds':['c'],'collage':{'nodes':self.nodes},'captions':[{'text':'A statement.'}]}]}
  self.plan={'production_contract':'1.9.4','timeline_file':'timeline.json','narration_file':'voice.txt','duration_frames':120,'attributed_claims':[{'id':'c','scene_id':'s','node_id':'evidence','kind':'news','claim':'Statement','verified':True,'publisher':'Publisher','date':'2026-01-01','url':'https://example.org/source','from':0,'until':120,'evidence_form':'screenshot','file':'source.png','sha256':hashlib.sha256((self.root/'public/source.png').read_bytes()).hexdigest()}]}
 def check(self):
  (self.root/'timeline.json').write_text(json.dumps(self.timeline));return gate.check_production(self.plan,self.root)
 def test_valid_visible_original_source(self):self.assertEqual([],self.check())
 def test_stale_source_hash(self):
  (self.root/'public/source.png').write_bytes(b'changed');self.assertTrue(any('hash' in x for x in self.check()))
 def test_x_requires_original_post(self):
  self.plan['attributed_claims'][0]['kind']='x';self.assertTrue(any('original post' in x for x in self.check()));self.plan['attributed_claims'][0]['evidence_form']='original-post';self.assertEqual([],self.check())
 def test_summary_logo_and_hidden_metadata_fail(self):
  self.nodes[0]['kind']='entity-item';self.assertTrue(self.check());self.nodes[0]['kind']='photo';self.nodes[1]['at']=1;self.assertTrue(any('visible' in x for x in self.check()))
 def test_claim_visibility_and_undeclared_reference(self):
  self.plan['attributed_claims'][0]['until']=121;self.assertTrue(self.check());self.plan['attributed_claims']=[];self.assertTrue(any('sourceClaimIds' in x for x in self.check()))
 def test_briefing_same_event_and_quote(self):
  c=self.plan['attributed_claims'][0];c.update(kind='government',evidence_form='briefing-photo');self.assertTrue(self.check());c['same_event']=True;self.assertEqual([],self.check());c.update(evidence_form='quote',quote='Original words');self.nodes[0].update(kind='text',text='Original words');self.assertEqual([],self.check())
 def test_semicolon_narration_and_caption(self):
  (self.root/'voice.txt').write_text('Sentence; sentence.');self.timeline['scenes'][0]['captions'][0]['text']='句子；句子';self.assertEqual(2,len(self.check()))
 def test_entity_and_marker_tied_to_timeline(self):
  self.nodes.append({'id':'entity','kind':'entity-item'});self.assertTrue(any('entity' in x for x in self.check()));self.plan['entity_checks']=[dict(scene_id='s',node_id='entity',identity_verified=True,asset_provenance_checked=True,small_format_reviewed=True,text_image_match=True)];self.nodes.append({'id':'chart','kind':'line-chart','eventMarkers':[{'label':'Event','at':60}]});self.assertTrue(any('anchor' in x for x in self.check()));self.plan['beats']=[{'at':60,'anchor':{'text':'Event happened'}}];self.assertEqual([],self.check())
