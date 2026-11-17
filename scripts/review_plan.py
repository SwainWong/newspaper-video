#!/usr/bin/env python3
"""Check narrated visual plans, not human audiovisual acceptance."""
import argparse, hashlib, json
from datetime import date
from pathlib import Path

def check(path):
 p=Path(path);errors=[]
 try:d=json.loads(p.read_text())
 except (OSError,ValueError) as e:return [str(e)]
 fps=d.get('fps',30);duration=d.get('duration_frames',0)
 if fps<=0 or duration<=0:return ['positive fps and duration_frames required']
 beats=d.get('beats',[])
 if not beats:errors.append('meaningful beats required')
 previous=-1
 for b in beats:
  label=b.get('id','beat');at=b.get('at',-1);end=b.get('until',at)
  if not (0<=at<end<=duration) or at<previous:errors.append(f'{label}: invalid or unordered frame interval')
  previous=at
  if b.get('mode') not in ('photo','data','evidence','relations','timeline','brand') or not b.get('meaning'):errors.append(f'{label}: semantic purpose and mode required')
  anchor=b.get('anchor',{})
  if not anchor.get('text') or len(anchor.get('voice_sha256',''))!=64:errors.append(f'{label}: voice hash and spoken anchor required')
  delta=(at-anchor.get('frame',at))/fps
  if b.get('mode')!='brand' and (delta<-.1 or delta>.35):errors.append(f'{label}: visual onset differs from spoken anchor by {delta:.2f}s')
  if b.get('critical',True) and anchor.get('method') not in ('word-aligned','listening-verified'):errors.append(f'{label}: critical change needs verified word timing')
  if (end-at)/fps>6 and not b.get('hold_reason'):errors.append(f'{label}: long hold needs reading purpose')
 for a,b in zip(beats,beats[1:]):
  gap=(b['at']-a['at'])/fps
  if gap>6 and not a.get('hold_reason'):errors.append(f'{a.get("id")}: static semantic gap {gap:.1f}s')
  if gap<1.5 and not b.get('rapid_reason'):errors.append(f'{b.get("id")}: rapid semantic change needs review reason')
 for m in d.get('media',[]):
  if not (p.parent/m.get('file','')).is_file():errors.append(f'{m.get("id")}: media file missing')
  if m.get('current_event'):
   try:
    captured=date.fromisoformat(m['captured_date']);start=date.fromisoformat(m['event_start']);end=date.fromisoformat(m['event_end'])
    if not start<=captured<=end:errors.append(f'{m.get("id")}: current-event image outside event dates')
   except (KeyError,ValueError):errors.append(f'{m.get("id")}: capture date and event range required')
 for c in d.get('comparisons',[]):
  if not all(c.get(k) for k in ('metric','unit','period','status','source','source_version','source_locator')):errors.append('comparison missing common measurement provenance')
  if c.get('chart')=='bar' and not c.get('zero_baseline'):errors.append('bar chart must include zero baseline')
  if len(c.get('values',[]))<2 or any(not isinstance(v,(int,float)) for v in c.get('values',[])):errors.append('comparison needs numeric values')
 brand=d.get('brand',{});occ=brand.get('occurrences',[])
 if brand.get('profile')=='swaintalk-v1':
  if brand.get('logo_sha256')!='cdfdaad38a1e8eaf6496e20daaf33b9a7930c61beb6776d56be802345b6dca6c':errors.append('canonical SwainTalk logo changed')
  if {o.get('role') for o in occ}!={'intro','outro'}:errors.append('intro and outro lockups required')
  if len({o.get('component_sha256') for o in occ})!=1 or any(len(o.get('component_sha256',''))!=64 for o in occ):errors.append('brand component must be identical')
  for o in occ:
   if o.get('voice_start',0)-o.get('start',0)<.4*fps or o.get('end',0)-o.get('voice_end',0)<.4*fps:errors.append(f'{o.get("role")}: 0.4s voice pauses required before and after')
 return errors

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('plan',type=Path);args=parser.parse_args();errors=check(args.plan)
 print(json.dumps({'status':'FAIL' if errors else 'PASS','scope':'production records only; visual and listening review separate','errors':errors},ensure_ascii=False,indent=2));raise SystemExit(bool(errors))
