#!/usr/bin/env python3
"""Measure voice-only stem samples in the declared intro/outro pause windows."""
import argparse,array,json,math,shutil,subprocess
from pathlib import Path

def check(plan,voice):
 d=json.loads(Path(plan).read_text());fps=d['fps'];rows=[];errors=[]
 if not shutil.which('ffmpeg'):return {'status':'UNAVAILABLE','errors':['ffmpeg required'],'measurements':[]}
 if not Path(voice).is_file():return {'status':'FAIL','errors':['voice-only stem missing'],'measurements':[]}
 occ=d.get('brand',{}).get('occurrences',[])
 if not occ:errors.append('brand pause windows missing')
 for o in occ:
  for side,a,b in [('before',o['start'],o['voice_start']),('after',o['voice_end'],o['end'])]:
   duration=(b-a)/fps
   if duration<.4:errors.append(f'{o["role"]}/{side}: pause shorter than 0.4s');continue
   r=subprocess.run(['ffmpeg','-v','error','-ss',str(a/fps),'-t',str(duration),'-i',str(voice),'-ac','1','-ar','48000','-f','f32le','pipe:1'],capture_output=True)
   if r.returncode:errors.append(r.stderr.decode(errors='replace'));continue
   samples=array.array('f',r.stdout);peak=max(map(abs,samples),default=0);db=20*math.log10(peak) if peak else None
   if len(samples)<round(duration*48000)-96:errors.append(f'{o["role"]}/{side}: stem does not cover declared window')
   if peak>10**(-50/20):errors.append(f'{o["role"]}/{side}: declared pause contains signal above -50 dBFS')
   rows.append({'role':o['role'],'side':side,'duration_seconds':duration,'peak_dbfs':db,'samples':len(samples)})
 return {'status':'FAIL' if errors else 'PASS','scope':'voice-only signal windows; not perceived pacing or listening approval','errors':errors,'measurements':rows}

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('plan',type=Path);p.add_argument('voice_stem',type=Path);a=p.parse_args();r=check(a.plan,a.voice_stem);print(json.dumps(r,indent=2));raise SystemExit(r['status']!='PASS')
