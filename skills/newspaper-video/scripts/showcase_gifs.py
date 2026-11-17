#!/usr/bin/env python3
"""Make 3–5 source-bound README GIF previews from a final MP4 (ffmpeg required)."""
import argparse, hashlib, json, re, subprocess
from pathlib import Path

def sha(path):return hashlib.sha256(Path(path).read_bytes()).hexdigest()

def generate(plan_path, output):
 plan_path=Path(plan_path);output=Path(output);plan=json.loads(plan_path.read_text())
 source=(plan_path.parent/plan['source']).resolve()
 if sha(source)!=plan.get('source_sha256'):raise ValueError('Source hash differs from approved final MP4')
 clips=plan.get('clips',[])
 if not 3<=len(clips)<=5:raise ValueError('Choose 3–5 meaningful windows per video')
 width=plan.get('width',270);fps=plan.get('fps',12)
 if not isinstance(width,int) or not 240<=width<=360 or not isinstance(fps,int) or not 8<=fps<=15:raise ValueError('Use mobile-sized GIF previews at 8–15 fps')
 probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-of','json',str(source)]))
 duration=float(probe['format']['duration']);names=set()
 for clip in clips:
  name=clip.get('name','');start=clip.get('start',-1);length=clip.get('duration',0)
  if not re.fullmatch(r'[a-z0-9][a-z0-9-]*',name) or name in names:raise ValueError('Unique simple clip names required')
  names.add(name)
  if not clip.get('purpose') or not 3<=length<=5 or start<0 or start+length>duration:raise ValueError('Each explained preview must cover 3–5 seconds inside source')
 if output.exists():raise ValueError('Output exists; use a fresh directory for this candidate')
 output.mkdir(parents=True)
 results=[]
 for clip in clips:
  target=output/(clip['name']+'.gif')
  filters=f'fps={fps},scale={width}:-1:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=3'
  subprocess.run(['ffmpeg','-v','error','-ss',str(clip['start']),'-i',str(source),'-t',str(clip['duration']),'-filter_complex',filters,'-an','-loop','0',str(target)],check=True)
  subprocess.run(['ffmpeg','-v','error','-i',str(target),'-f','null','-'],check=True)
  result=json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','v:0','-count_frames','-show_entries','stream=width,height,nb_read_frames','-of','json',str(target)]))['streams'][0]
  if abs(int(result['nb_read_frames'])-clip['duration']*fps)>1:raise ValueError('GIF frame count differs from selected window')
  results.append({**clip,'file':target.name,'sha256':sha(target),'bytes':target.stat().st_size,**result})
 report={'source':str(source),'source_sha256':sha(source),'width':width,'fps':fps,'clips':results,'scope':'Encoded animation previews; not audio or full-video acceptance'}
 (output/'manifest.json').write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n')
 return report

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('plan',type=Path);parser.add_argument('output',type=Path);args=parser.parse_args()
 print(json.dumps(generate(args.plan,args.output),indent=2,ensure_ascii=False))
