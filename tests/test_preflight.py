import hashlib, importlib.util, json, tempfile, unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('preflight',Path(__file__).resolve().parents[1]/'scripts/preflight.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class PreflightTest(unittest.TestCase):
 def test_approval_stales_when_script_changes(self):
  with tempfile.TemporaryDirectory() as d:
   p=Path(d);s=p/'script.md';s.write_text('Test fixture only')
   b={'main_language':'en','subtitles':{'mode':'single','languages':['en']},'voice_tool':'VoiceStudio','voice_choice_evidence':'test fixture','language_choice_evidence':'test fixture','script_file':'script.md','script_review':{'status':'pass'},'script_approval':{'sha256':hashlib.sha256(s.read_bytes()).hexdigest(),'user_message':'test fixture, not production approval'}}
   f=p/'brief.json';f.write_text(json.dumps(b));self.assertEqual(m.check(f),[])
   s.write_text('Changed');self.assertIn('Script approval missing or stale',m.check(f))
   del b['voice_tool'];b['subtitles']['languages']=[];f.write_text(json.dumps(b));self.assertIn('Missing voice_tool',m.check(f));self.assertIn('Subtitle language count does not match mode',m.check(f))
 def test_create_without_approval_leaves_no_project(self):
  import subprocess
  with tempfile.TemporaryDirectory() as d:
   dest=Path(d)/'must-not-exist'
   run=subprocess.run(['python3',str(Path(__file__).resolve().parents[1]/'scripts/project.py'),'create',str(dest)],capture_output=True)
   self.assertNotEqual(run.returncode,0);self.assertFalse(dest.exists())
