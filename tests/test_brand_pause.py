import importlib.util,json,shutil,tempfile,unittest,wave,array
from pathlib import Path
spec=importlib.util.spec_from_file_location('brand_pause',Path(__file__).resolve().parents[1]/'scripts/brand_pause_check.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)

@unittest.skipUnless(shutil.which('ffmpeg'),'ffmpeg signal checks require ffmpeg')
class PauseTests(unittest.TestCase):
 def test_declared_silence_must_match_samples(self):
  with tempfile.TemporaryDirectory() as t:
   root=Path(t);p=root/'plan.json';v=root/'voice.wav';p.write_text(json.dumps({'fps':30,'brand':{'occurrences':[{'role':'intro','start':0,'voice_start':12,'voice_end':48,'end':60}]}}))
   samples=array.array('h',[0]*96000)
   def save():
    with wave.open(str(v),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(48000);w.writeframes(samples.tobytes())
   for i in range(19200,76800):samples[i]=1000
   save();self.assertEqual('PASS',m.check(p,v)['status'])
   samples[1000]=1000;save();self.assertEqual('FAIL',m.check(p,v)['status'])
 def test_missing_stem_is_not_silence(self):
  with tempfile.TemporaryDirectory() as t:
   p=Path(t)/'plan.json';p.write_text('{"fps":30}')
   self.assertEqual('FAIL',m.check(p,Path(t)/'missing.wav')['status'])
