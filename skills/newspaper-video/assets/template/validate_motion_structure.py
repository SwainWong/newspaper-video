"""Structural/asset checks for executable motion. Detailed data uses TS renderer validators."""
from pathlib import Path
import math,wave
EFFECTS={'split','stage-curve','checklist','market-line','threshold','chapter-tint','calendar-flip','film-frame','keyword','icon-metaphor','date-tiles'}
LEGACY=('images','visualBeats','analysis','editorial','comparison','metric','counter','metricBeats','nestedNotes','timeline','detail')
def check(data, root):
 errors=[];ids=set();duration=max((s.get('end',0) for s in data.get('scenes',[])),default=0)
 def fail(message):errors.append(message)
 def asset(file):
  if not isinstance(file,str) or not file or Path(file).is_absolute() or '..' in Path(file).parts or '\\' in file:return False
  p=(root/'public'/file).resolve()
  return p.is_relative_to((root/'public').resolve()) and p.is_file()
 def sound(s,base):
  if s is None:return
  if not isinstance(s,dict):fail('sound must be object');return
  if not asset(s.get('file')) or not s.get('license'):fail('sound requires local asset and license');return
  if type(s.get('at'))!=int or s['at']<0 or type(s.get('gain')) not in (int,float) or not math.isfinite(s['gain']) or not 0<=s['gain']<=1:fail('sound invalid time/gain');return
  if not s['file'].lower().endswith('.wav'):fail('motion sound requires WAV so tail length is verified');return
  try:
   with wave.open(str(root/'public'/s['file'])) as w:tail=base+s['at']+w.getnframes()/w.getframerate()*30
   if tail>duration:fail('motion sound tail exceeds film')
  except (wave.Error,EOFError):fail('invalid motion WAV')
 for s in data.get('scenes',[]):
  entries=s.get('motion',[])
  if not isinstance(entries,list):fail('motion must be array');continue
  occupied=[]
  for e in entries:
   if not isinstance(e,dict):fail('motion entry must be object');continue
   eid=e.get('id');effect=e.get('effect')
   if not isinstance(eid,str) or not eid or eid in ids:fail('unique motion id required')
   else:ids.add(eid)
   if effect not in EFFECTS:fail('unknown executable motion effect')
   a,b=e.get('start'),e.get('end')
   if type(a)!=int or type(b)!=int or not 0<=a<b<=s['end']-s['start']:fail('motion interval outside scene');continue
   box=e.get('box',[])
   if not isinstance(box,list) or len(box)!=4 or any(type(v) not in (int,float) or not math.isfinite(v) for v in box) or min(box)<0 or min(box[2:])<=0 or box[0]+box[2]>1080 or box[1]+box[3]>1920:fail('invalid motion box');continue
   if not isinstance(e.get('data'),dict):fail('motion data must be object');continue
   if effect!='chapter-tint':
    if any(s.get(k) for k in LEGACY) or s.get('layout')=='impact' or s.get('kind')=='brand':fail('motion content cannot overlay legacy content/brand')
    if box[1]<340 or box[1]+box[3]>1430:fail('foreground box must avoid title and caption regions (y340..1430)')
    for other in occupied:
     x,y,w,h=other['box'];xx,yy,ww,hh=box
     if max(a,other['start'])<min(b,other['end']) and max(x,xx)<min(x+w,xx+ww) and max(y,yy)<min(y+h,yy+hh):fail('overlapping motion boxes')
    occupied.append(e)
   elif any(isinstance(o,dict) and o.get('effect')=='chapter-tint' and o is not e and max(a,o.get('start',b))<min(b,o.get('end',a)) for o in entries):fail('overlapping chapter tints')
   d=e['data']
   if effect=='film-frame' and (not isinstance(d.get('media'),dict) or not asset(d['media'].get('src'))):fail('missing film-frame media')
   if effect=='icon-metaphor' and not asset(d.get('icon')):fail('missing metaphor icon')
   sound(e.get('sound'),s['start']+a)
 for t in data.get('transitions',[]):
  if not isinstance(t,dict):fail('transition must be object');continue
  if t.get('id') in ids:fail('transition/motion id collision')
  ids.add(t.get('id'));sound(t.get('sound'),t.get('start',0))
  if all(type(t.get(k))==int for k in ('start','end')):
   for s in data.get('scenes',[]):
    analysis=s.get('analysis') or {}
    if analysis.get('type')=='evidence':
     d=analysis['data'];a=s['start']+d['focusAt']-12;b=s['start']+d['focusAt']+d.get('zoomFrames',24)
     if max(t['start'],a)<min(t['end'],b):fail('transition overlaps actual evidence camera move')
 return errors
