#!/usr/bin/env python3
"""Validate actual template inputs and media availability, without claiming creative review."""
import argparse,json,pathlib,sys,wave
parser=argparse.ArgumentParser();parser.add_argument('file');args=parser.parse_args()
p=pathlib.Path(__file__).resolve().parent
try: data=json.loads(pathlib.Path(args.file).read_text())
except (OSError,ValueError) as exc:sys.exit(str(exc))
errors=[]
def err(message): errors.append(message)
for field in ('masthead','eyebrow'):
 if not isinstance(data.get(field),str):err(f'{field} must be a string')
scenes=data.get('scenes')
if not isinstance(scenes,list) or not scenes:err('scenes must be a non-empty array');scenes=[]
if data.get('music') and not (p/'public'/data['music']).is_file():err('missing music asset')
if not isinstance(data.get('musicVolume',.08),(int,float)) or not 0<=data.get('musicVolume',.08)<=1:err('invalid musicVolume')
envelope=data.get('musicEnvelope')
if envelope is not None:
 if not isinstance(envelope,list) or len(envelope)<2:err('musicEnvelope needs at least two points')
 else:
  previous=-1
  for point in envelope:
   if not isinstance(point,dict) or not isinstance(point.get('frame'),int) or point['frame']<=previous or not isinstance(point.get('gain'),(int,float)) or not 0<=point['gain']<=1:err('invalid musicEnvelope point');continue
   previous=point['frame']
expected=0;ids=set()
for index,scene in enumerate(scenes):
 if not isinstance(scene,dict):err(f'index-{index}: scene must be an object');continue
 if not isinstance(scene.get('id'),str) or not scene.get('id','').strip():err(f'index-{index}: id must be a nonempty string')
 if not isinstance(scene.get('captions'),list):err(f'index-{index}: captions must be an array, including when empty')
 sid=scene.get('id',f'index-{index}');start=scene.get('start');end=scene.get('end')
 if sid in ids:err(f'duplicate id {sid}')
 ids.add(sid)
 if not isinstance(start,int) or not isinstance(end,int):err(f'{sid}: frame bounds must be integers');continue
 if start!=expected:err(f'{sid}: expected start {expected}, got {start}')
 if end<=start:err(f'{sid}: end must be after start')
 expected=end
 for field in ('title','kicker'):
  if not isinstance(scene.get(field),str):err(f'{sid}: {field} must be a string')
 if not isinstance(scene.get('audioOffsetFrames',0),int) or scene.get('audioOffsetFrames',0)<0:err(f'{sid}: audioOffsetFrames must be a nonnegative integer');continue
 images=scene.get('images',[])
 if not isinstance(images,list):err(f'{sid}: images must be an array');images=[]
 if len(images)>2:err(f'{sid}: current layout supports at most two images')
 if scene.get('layout')=='compact' and len(images)>1:err(f'{sid}: compact layout supports at most one image')
 beats=scene.get('visualBeats',[])
 if not isinstance(beats,list):err(f'{sid}: visualBeats must be an array');beats=[]
 beat_end=0
 for beat in beats:
  a,b=beat.get('from'),beat.get('to');beat_images=beat.get('images',[])
  if not isinstance(a,int) or not isinstance(b,int) or a!=beat_end or b<=a or b>end-start:err(f'{sid}: invalid visual beat interval {beat}')
  else:beat_end=b
  if not isinstance(beat_images,list) or len(beat_images)>2:err(f'{sid}: beat supports at most two images')
  else:images+=beat_images
 if beats and beat_end!=end-start:err(f'{sid}: visual beats do not cover the entire scene')
 for file in images+([scene['audio']] if scene.get('audio') else []):
  if not isinstance(file,str) or not (p/'public'/file).is_file():err(f'{sid}: missing asset {file}')
 if scene.get('audio') and (p/'public'/scene['audio']).is_file() and scene['audio'].lower().endswith('.wav'):
  with wave.open(str(p/'public'/scene['audio'])) as wav: frames=wav.getnframes()/wav.getframerate()*30
  if frames+scene.get('audioOffsetFrames',0)>end-start+.1:err(f'{sid}: narration exceeds scene duration')
 effects=scene.get('sfx',[])
 if not isinstance(effects,list):err(f'{sid}: sfx must be an array');effects=[]
 for effect in effects:
  file=effect.get('file');at=effect.get('at');gain=effect.get('gain',.18)
  if not isinstance(file,str) or not (p/'public'/file).is_file():err(f'{sid}: missing sfx asset {file}')
  if not isinstance(at,int) or at<0 or at>=end-start:err(f'{sid}: invalid sfx start {at}')
  if not isinstance(gain,(int,float)) or not 0<=gain<=1:err(f'{sid}: invalid sfx gain {gain}')
  if isinstance(file,str) and (p/'public'/file).is_file() and file.lower().endswith('.wav') and isinstance(at,int):
   with wave.open(str(p/'public'/file)) as effect_audio: effect_frames=effect_audio.getnframes()/effect_audio.getframerate()*30
   if at+effect_frames>end-start+.1:err(f'{sid}: sfx tail exceeds scene')
 if scene.get('layout')=='impact' and (scene.get('analysis') or scene.get('editorial') or scene.get('comparison')):err(f'{sid}: impact background conflicts with exclusive graphic')
 analysis=scene.get('analysis')
 if analysis is not None:
  if any(scene.get(k) for k in ('editorial','images','visualBeats','metric','counter','metricBeats','nestedNotes','timeline','comparison','detail')):err(f'{sid}: analysis graphic must own its content area')
  if not isinstance(analysis,dict) or analysis.get('type') not in ('data','evidence','relations'):err(f'{sid}: unknown analysis graphic')
  elif analysis['type']=='data':
   d=analysis.get('data',{});domain=d.get('domain',[]);rows=d.get('rows',[])
   if not all(d.get(k) for k in ('title','unit','period','status','source')):err(f'{sid}: chart needs source, period, unit and actual/forecast status')
   if len(domain)!=2 or not all(isinstance(v,(int,float)) for v in domain) or not domain[0]<=0<domain[1]:err(f'{sid}: invalid chart domain')
   elif not 1<=len(rows)<=4 or any(not isinstance(r.get('value'),(int,float)) or not domain[0]<=r['value']<=domain[1] or not isinstance(r.get('at'),int) or not 0<=r['at']<end-start for r in rows):err(f'{sid}: invalid chart values or narration anchors')
  elif analysis['type']=='evidence':
   d=analysis.get('data',{})
   if not all(d.get(k) for k in ('file','publisher','published','documentLabel','summary','crop','imageWidth','imageHeight')):err(f'{sid}: evidence identity/crop/summary missing')
   if not (p/'public'/d.get('file','')).is_file():err(f'{sid}: evidence original screenshot missing')
   duration=d.get('zoomFrames',24);focus=d.get('focusAt',-1);crop=d.get('crop',{})
   if not isinstance(duration,int) or not 12<=duration<=45 or not isinstance(focus,int) or focus<12 or focus+duration>=end-start:err(f'{sid}: evidence needs whole-page hold and continuous zoom')
   elif d.get('summaryAt',-1)<focus+duration or any(m.get('at',-1)<focus+duration for m in d.get('marks',[])):err(f'{sid}: evidence marks/summary must follow zoom arrival')
   if not all(isinstance(crop.get(k),(int,float)) for k in ('x','y','width','height')) or crop.get('x',-1)<0 or crop.get('y',-1)<0 or crop.get('width',0)<=0 or crop.get('height',0)<=0 or crop.get('x',0)+crop.get('width',0)>d.get('imageWidth',0) or crop.get('y',0)+crop.get('height',0)>d.get('imageHeight',0):err(f'{sid}: evidence crop outside source')
  else:
   steps=analysis.get('steps',[])
   if not 1<=len(steps)<=4 or any(not isinstance(r.get('at'),int) or not 0<=r['at']<end-start for r in steps):err(f'{sid}: invalid relationship steps')
   for i,step in enumerate(steps):
    if i and not step.get('edgeFromPrevious','').strip():err(f'{sid}: relation connector needs semantic label')
    if step.get('image') and not (p/'public'/step['image']).is_file():err(f'{sid}: relationship image missing')
 editorial=scene.get('editorial')
 if editorial is not None:
  if not isinstance(editorial,dict) or editorial.get('type') not in ('document','schedule','relations'):err(f'{sid}: invalid editorial type')
  else:
   kind=editorial['type']
   if any(scene.get(k) for k in ('images','visualBeats','metric','counter','metricBeats','nestedNotes','timeline','comparison','detail')):err(f'{sid}: editorial cannot share its layout with other visual elements')
   if kind=='document':
    if not all(isinstance(editorial.get(k),str) and editorial[k].strip() for k in ('file','publisher','published','headline')):err(f'{sid}: document needs file, publisher, published and headline')
    elif not (p/'public'/editorial['file']).is_file():err(f'{sid}: missing document image {editorial["file"]}')
   elif kind=='schedule':
    items=editorial.get('items')
    if not isinstance(items,list) or not 1<=len(items)<=4 or any(not isinstance(x,dict) or not isinstance(x.get('date'),str) or not isinstance(x.get('label'),str) for x in items):err(f'{sid}: schedule needs 1-4 dated items')
   else:
    nodes=editorial.get('nodes')
    if not isinstance(nodes,list) or len(nodes)!=3 or any(not isinstance(x,str) or not x.strip() for x in nodes) or not isinstance(editorial.get('center'),str):err(f'{sid}: relations needs three nodes and center text')
 comparison=scene.get('comparison')
 if comparison is not None:
  if not isinstance(comparison,dict) or not isinstance(comparison.get('maxValue'),(int,float)) or comparison.get('maxValue',0)<=0:err(f'{sid}: comparison maxValue must be positive')
  else:
   items=comparison.get('items',[]);precision=comparison.get('precision',0)
   if not isinstance(items,list) or not 1<=len(items)<=3:err(f'{sid}: comparison requires 1–3 items')
   else:
    if 38+18*(len(items)-1)>=end-start:err(f'{sid}: comparison does not settle before scene end')
    for item in items:
     if not isinstance(item,dict) or not isinstance(item.get('value'),(int,float)) or not 0<=item.get('value',-1)<=comparison['maxValue'] or not isinstance(item.get('label'),str) or not isinstance(item.get('color'),str):err(f'{sid}: invalid comparison item {item}')
   if not isinstance(precision,int) or not 0<=precision<=5:err(f'{sid}: comparison precision must be 0–5')
  if any(scene.get(k) for k in ('images','visualBeats','metric','counter','metricBeats','nestedNotes','timeline')):err(f'{sid}: comparison cannot share its layout with other visual elements')
 metric_beats=scene.get('metricBeats',[])
 if not isinstance(metric_beats,list):err(f'{sid}: metricBeats must be an array');metric_beats=[]
 metric_end=0
 for beat in metric_beats:
  a,b=beat.get('from'),beat.get('to')
  if not isinstance(a,int) or not isinstance(b,int) or a!=metric_end or b<=a or b>end-start:err(f'{sid}: invalid metric beat interval {beat}')
  else:metric_end=b
  if not beat.get('metric') and not isinstance(beat.get('counter'),dict):err(f'{sid}: metric beat needs text or counter')
  counter_beat=beat.get('counter')
  if isinstance(counter_beat,dict):
   duration=counter_beat.get('durationFrames',16);delay=counter_beat.get('delayFrames',12);precision=counter_beat.get('precision',0)
   if not isinstance(counter_beat.get('to'),(int,float)) or not isinstance(duration,int) or duration<1 or not isinstance(delay,int) or delay<0 or not isinstance(precision,int) or not 0<=precision<=5:err(f'{sid}: invalid metric beat counter')
   elif isinstance(a,int) and isinstance(b,int) and duration+delay>=b-a:err(f'{sid}: metric beat counter cannot settle')
 if metric_beats and metric_end!=end-start:err(f'{sid}: metric beats do not cover the entire scene')
 counter=scene.get('counter')
 if counter is not None:
  if not isinstance(counter,dict) or not isinstance(counter.get('to'),(int,float)):err(f'{sid}: counter needs numeric to')
  elif not isinstance(counter.get('durationFrames',16),int) or counter.get('durationFrames',16)<1:err(f'{sid}: counter duration must be positive')
  elif not isinstance(counter.get('delayFrames',12),int) or counter.get('delayFrames',12)<0:err(f'{sid}: counter delay must be nonnegative')
  elif not isinstance(counter.get('precision',0),int) or not 0<=counter.get('precision',0)<=5:err(f'{sid}: counter precision must be 0–5')
  elif counter.get('durationFrames',16)+counter.get('delayFrames',12)>=end-start:err(f'{sid}: counter does not settle before scene end')
 cues=scene.get('captions',[]);last=start
 if not isinstance(cues,list):err(f'{sid}: captions must be an array');cues=[]
 for c in cues:
  a,b=c.get('start'),c.get('end')
  if not isinstance(a,int) or not isinstance(b,int) or a<start or b>end or b<=a or a<last:err(f'{sid}: invalid or overlapping caption {c}')
  elif not isinstance(c.get('text'),str) or not c['text'].strip():err(f'{sid}: blank caption')
  else:last=b
for name in ('logo','music'):
 file=data.get(name)
 if file and (not isinstance(file,str) or not (p/'public'/file).is_file()):err(f'missing {name}: {file}')
from validate_collage_assets import check as check_collage_assets
try: errors.extend(check_collage_assets(data,p))
except (TypeError,ValueError,KeyError,AttributeError) as exc: err('malformed collage: '+str(exc))
from validate_motion_structure import check as check_motion_structure
try: errors.extend(check_motion_structure(data,p))
except (TypeError,ValueError,KeyError,AttributeError) as exc: err('malformed motion: '+str(exc))
print(json.dumps({'status':'FAIL' if errors else 'PASS','file':str(pathlib.Path(args.file).resolve()),'scenes':len(scenes),'duration_frames':expected,'fps':30,'errors':errors,'scope':'input structure, frame continuity, cue bounds and local file existence; not creative, rights or audiovisual review'},indent=2))
sys.exit(bool(errors))
