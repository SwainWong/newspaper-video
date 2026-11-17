#!/usr/bin/env python3
"""Validate motion composition records; never certify perceptual acceptance."""
import argparse, hashlib, json, math
from pathlib import Path
CATALOG=Path(__file__).resolve().parents[1]/'references/motion-catalog.json'
def check(plan, root):
    catalog=json.loads(CATALOG.read_text()); errors=[]; events=plan.get('events',[])
    duration=plan.get('duration_frames',0)
    if not isinstance(duration,int) or duration<=0 or not events:return ['positive duration and nonempty events required']
    seen=set(); valid=[]
    for e in events:
        eid=e.get('id'); effect=e.get('effect'); c=catalog.get(effect)
        if not eid or eid in seen:errors.append('unique event id required')
        seen.add(eid)
        if not c:errors.append(f'{eid}: unknown effect');continue
        if c['status']=='deprecated':errors.append(f'{eid}: deprecated effect')
        if c['status']=='recipe':
            impl=plan.get('recipe_implementations',{}).get(effect,{})
            p=root/impl.get('file','')
            if not p.is_file() or hashlib.sha256(p.read_bytes()).hexdigest()!=impl.get('sha256'):errors.append(f'{eid}: recipe requires hash-bound project implementation')
            if not impl.get('review') or len(impl.get('frames',[]))<3 or any(not (root/f).is_file() for f in impl.get('frames',[])):errors.append(f'{eid}: recipe requires start/mid/end frames and review')
        times=[e.get(k) for k in ('start','settle','end')]
        if any(type(x)!=int for x in times) or not 0<=times[0]<=times[1]<times[2]<=duration:errors.append(f'{eid}: invalid timing');continue
        b=e.get('bbox',[])
        if len(b)!=4 or any(type(x) not in (int,float) or not math.isfinite(x) for x in b) or min(b)<0 or b[2]<=0 or b[3]<=0 or b[0]+b[2]>1080 or b[1]+b[3]>1920:errors.append(f'{eid}: invalid bbox');continue
        if not e.get('meaning') or type(e.get('focus'))!=bool:errors.append(f'{eid}: meaning/focus required')
        sound=e.get('sound',{});kind=sound.get('kind')
        if kind=='none':
            if not sound.get('reason'):errors.append(f'{eid}: silence reason required')
        elif kind in ('paper','tick','whoosh'):
            if kind!=c['sound']:errors.append(f'{eid}: sound category mismatches contract')
            if not (root/sound.get('file','')).is_file() or not sound.get('license'):errors.append(f'{eid}: sound asset/license required')
            at=sound.get('at');tail=sound.get('tail_end')
            if type(at)!=int or type(tail)!=int or not 0<=at<tail<=duration:errors.append(f'{eid}: sound interval invalid')
            elif (kind=='whoosh' and not times[0]<=at<=times[1]) or (kind!='whoosh' and abs(at-times[1])>3):errors.append(f'{eid}: sound not anchored to action')
        else:errors.append(f'{eid}: sound kind required')
        valid.append(e)
    for i,a in enumerate(valid):
        for b in valid[i+1:]:
            ca,cb=catalog[a['effect']],catalog[b['effect']]
            temporal=max(a['start'],b['start'])<min(a['end'],b['end'])
            if not temporal:continue
            if b['effect'] in ca['excludes'] or a['effect'] in cb['excludes']:errors.append(f"{a['id']}/{b['id']}: incompatible effects")
            x,y,w,h=a['bbox'];xx,yy,ww,hh=b['bbox'];spatial=max(x,xx)<min(x+w,xx+ww) and max(y,yy)<min(y+h,yy+hh)
            if spatial and ca['zone']!='background' and cb['zone']!='background':errors.append(f"{a['id']}/{b['id']}: overlapping occupied regions")
            if a['focus'] and b['focus'] and max(a['start'],b['start'])<min(a['settle'],b['settle']):errors.append(f"{a['id']}/{b['id']}: concurrent moving focus")
    return errors
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('plan',type=Path);a=p.parse_args()
    try:errors=check(json.loads(a.plan.read_text()),a.plan.resolve().parent)
    except (OSError,ValueError,TypeError,KeyError,AttributeError) as e:errors=[str(e)]
    print(json.dumps({'status':'FAIL' if errors else 'PASS','errors':errors,'scope':'composition records, not pixel/audio acceptance'},ensure_ascii=False,indent=2));raise SystemExit(bool(errors))
