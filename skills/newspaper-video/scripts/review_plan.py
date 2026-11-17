#!/usr/bin/env python3
"""Check narrated visual plans, not human audiovisual acceptance."""
import argparse, hashlib, json
from datetime import date
from pathlib import Path

def check_visual(d, root):
 errors=[];fps=d.get('fps',30);duration=d.get('duration_frames',0)
 scenes=d.get('scene_inventory',[])
 if not scenes:return ['scene_inventory required: count complete narrative scenes, not animation beats']
 previous=0;ids=set();eligible=[];pictured=[]
 for scene in scenes:
  sid=scene.get('id');start=scene.get('start',-1);end=scene.get('end',-1)
  if not sid or sid in ids:errors.append('unique inventory scene ids required')
  ids.add(sid)
  if start!=previous or not start<end<=duration:errors.append(f'{sid}: inventory must cover full timeline without gaps')
  previous=end
  if scene.get('role') not in ('content','brand'):errors.append(f'{sid}: role must be content or brand')
  qualifying=[]
  for asset in scene.get('imagery',[]):
   file=root/asset.get('file','')
   if not file.is_file():errors.append(f'{sid}: narrative imagery file missing')
   if asset.get('kind') in ('photo','video','illustration','subject-logo') and asset.get('substantial') is True and asset.get('purpose'):
    a,b=asset.get('from',-1),asset.get('until',-1)
    if not start<=a<b<=end:errors.append(f'{sid}: imagery visibility must fit scene')
    else:qualifying.append(asset)
  if scene.get('role')=='content':
   eligible.append(scene)
   if qualifying:pictured.append(scene)
 if previous!=duration:errors.append('inventory must reach final frame')
 if not eligible or len(pictured)*2<len(eligible):errors.append('at least half of content scenes need substantial narrative imagery; documents/background/watermarks do not count')
 hook=d.get('visual_hook',{});first=next(iter(eligible),{})
 if not first or scenes[0]!=first or hook.get('scene_id')!=first.get('id') or not hook.get('subject'):errors.append('first scene needs an image-led topic hook')
 else:
  image_at=hook.get('image_at',duration);motion_at=hook.get('motion_at',duration);clear_at=hook.get('recognizable_by',duration)
  if not 0<=image_at<fps or not 0<=motion_at<fps or not image_at<=clear_at<=3*fps:errors.append('hook needs imagery and meaningful motion within first second, recognizable subject by 3 seconds')
  if not any(a.get('kind') in ('photo','video','illustration','subject-logo') and a.get('substantial') is True and a.get('purpose') and a.get('from',duration)<=image_at<a.get('until',0) for a in first.get('imagery',[])):errors.append('hook image onset must refer to a substantial scene asset')
 for move in d.get('evidence_moves',[]):
  mid=move.get('id','evidence');file=root/move.get('file','')
  if not file.is_file() or hashlib.sha256(file.read_bytes()).hexdigest()!=move.get('sha256'):errors.append(f'{mid}: evidence source hash mismatch')
  a,b=move.get('zoom_start',-1),move.get('zoom_end',-1)
  if not 0<=move.get('whole_from',-1)<a<b<=duration or not .4*fps<=b-a<=1.5*fps:errors.append(f'{mid}: visible continuous zoom interval required (0.4–1.5 seconds)')
  if move.get('method')!='same-source-transform' or move.get('source_swapped') is not False:errors.append(f'{mid}: whole and detail must share one persistent source plane')
  if move.get('highlight_at',-1)<b or move.get('summary_at',-1)<b:errors.append(f'{mid}: highlight and explanation must follow camera arrival')
  samples=move.get('review_frames',[])
  if not all(any(abs(t-x)<=1 for t in samples) for x in (a,(a+b)//2,b)):errors.append(f'{mid}: record start/mid/end review frames')
 for relation in d.get('relationship_maps',[]):
  nodes=relation.get('nodes',[]);node_ids=[n.get('id') for n in nodes]
  if not nodes or len(set(node_ids))!=len(nodes):errors.append('relationship nodes need unique ids')
  for edge in relation.get('edges',[]):
   if edge.get('from') not in node_ids or edge.get('to') not in node_ids or edge.get('from')==edge.get('to') or not edge.get('label') or edge.get('direction') not in ('forward','both','none'):errors.append('every relationship edge needs distinct endpoints, semantic label and direction')
 return errors

def check(path, require_visual=False):
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
 if require_visual or d.get('visual_contract')=='1.6':errors.extend(check_visual(d,p.parent))
 return errors

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('plan',type=Path);parser.add_argument('--require-visual',action='store_true');args=parser.parse_args();errors=check(args.plan,args.require_visual)
 print(json.dumps({'status':'FAIL' if errors else 'PASS','scope':'production records only; visual and listening review separate','errors':errors},ensure_ascii=False,indent=2));raise SystemExit(bool(errors))
