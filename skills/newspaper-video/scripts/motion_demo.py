#!/usr/bin/env python3
"""Create a clearly labelled synthetic component fixture, never a production approval."""
import argparse,json,shutil,hashlib,math,wave
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def create(dest):
 if dest.exists():raise ValueError('Destination exists')
 shutil.copytree(ROOT/'assets/template',dest,ignore=shutil.ignore_patterns('node_modules','out','__pycache__'))
 shutil.copytree(ROOT/'assets/sfx',dest/'public/sfx')
 specs=json.loads((ROOT/'references/graphics-fixtures.json').read_text())+json.loads((ROOT/'references/paper-fixtures.json').read_text())
 scenes=[];events=[];catalog=json.loads((ROOT/'references/motion-catalog.json').read_text())
 settles={'split':64,'stage-curve':157,'checklist':140,'market-line':141,'threshold':138,'chapter-tint':23,'calendar-flip':144,'film-frame':21,'keyword':93,'icon-metaphor':27,'date-tiles':45}
 for i,spec in enumerate(specs):
  effect=spec['effect'];start=i*210;kind=catalog[effect]['sound'];entry={'id':effect,'start':15,'end':195,'box':[65,350,950,950],**spec}
  if effect=='chapter-tint':entry['box']=[0,0,1080,1920]
  sound={'kind':'none','reason':'Teaching trace and background are deliberately silent'}
  if kind!='none':
   file=f'sfx/{kind}.wav';entry['sound']={'file':file,'at':settles[effect],'gain':.5,'license':'CC0 original procedural sound; assets/sfx/LICENSE.txt'}
   with wave.open(str(dest/'public'/file)) as w:tail=math.ceil(w.getnframes()/w.getframerate()*30)
   sound={'kind':kind,'file':'public/'+file,'at':start+15+settles[effect],'tail_end':start+15+settles[effect]+tail,'license':entry['sound']['license']}
  scene={'id':f'demo-{effect}','start':start,'end':start+210,'title':catalog[effect]['name'],'kicker':f'{i+1:02d} / 11 · COMPONENT TEST','captions':[{'start':start,'end':start+210,'text':'组件测试 · 合成资料 · 无旁白'}],'motion':[entry]}
  scenes.append(scene);events.append({'id':effect,'effect':effect,'start':start+15,'settle':start+15+settles[effect],'end':start+195,'bbox':entry['box'],'focus':effect!='chapter-tint','meaning':catalog[effect]['match'],'sound':sound})
 transitions=[]
 for index,effect in [(1,'color-wipe'),(6,'iris')]:
  cut=index*210;t={'id':effect,'effect':effect,'start':cut-12,'cut':cut,'end':cut+12,'color':'#a93831','sound':{'file':'sfx/whoosh.wav','at':12,'gain':.5,'license':'CC0 original procedural sound; assets/sfx/LICENSE.txt'}};transitions.append(t)
  events.append({'id':effect,'effect':effect,'start':t['start'],'settle':cut,'end':t['end'],'bbox':[0,0,1080,1920],'focus':True,'meaning':'Change demonstration chapter only while covered','sound':{'kind':'whoosh','file':'public/sfx/whoosh.wav','at':cut,'tail_end':cut+10,'license':t['sound']['license']}})
 data={'masthead':'MOTION FIELD NOTES','eyebrow':'SYNTHETIC COMPONENT FIXTURE','scenes':scenes,'transitions':transitions}
 path=dest/'src/timeline.json';path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
 plan={'duration_frames':len(scenes)*210,'timeline_sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'events':sorted(events,key=lambda e:e['start'])};(dest/'motion-plan.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2)+'\n')
 (dest/'FIXTURE.md').write_text('Technical component test only. No production script approval, narration, BGM or audiovisual acceptance is implied. Includes all eleven components and two transitions.\n')
 print(dest)
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('output',type=Path);a=p.parse_args();create(a.output.expanduser().resolve())
