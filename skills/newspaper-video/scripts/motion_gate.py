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
def moving_until(e):
    """Conservative last moving/reveal frame, derived from executable event data."""
    d=e.get('data',{});effect=e['effect']
    if effect in ('color-wipe','iris'):return e['end']-e['start']
    if effect=='split':return d['settleRelation']
    if effect=='stage-curve':return max(v['labelSettle'] for v in d['segments'])
    if effect=='checklist':return max(v['countAt'] for v in d['items'])
    if effect=='market-line':return d['conclusion']['settle']
    if effect=='threshold':return d['result']['settle']
    if effect=='chapter-tint':return d['at']+d['duration']
    if effect=='calendar-flip':return d['end']
    if effect=='film-frame':return d['out'] if d['media']['type']=='video' else d['in']+15
    if effect=='keyword':return max(w['at'] for w in d['words'])+15
    if effect=='icon-metaphor':return d['at']+15
    if effect=='date-tiles':return d['at']+27
    raise ValueError('Unknown executable motion effect')

def check_timeline(plan, timeline_path):
    path=Path(timeline_path); data=json.loads(path.read_text()); errors=[]
    motions=[(s,e) for s in data.get('scenes',[]) for e in s.get('motion',[])]
    transitions=data.get('transitions',[])
    if not motions and not transitions:return errors
    if plan.get('timeline_sha256')!=hashlib.sha256(path.read_bytes()).hexdigest():errors.append('motion plan must bind current timeline SHA-256')
    recorded={e.get('id'):e for e in plan.get('events',[])}
    root=path.parent.parent
    expected=[]
    for scene,e in motions:expected.append((e,scene['start']+e['start'],scene['start']+e['end'],e['box']))
    for e in transitions:expected.append((e,e['start'],e['end'],[0,0,1080,1920]))
    expected_ids={e['id'] for e,_,_,_ in expected}
    new_effects={e['effect'] for e,_,_,_ in expected}
    if any(e.get('effect') in new_effects and e.get('id') not in expected_ids for e in plan.get('events',[])):errors.append('unrendered motion event in plan')
    for e,start,end,box in expected:
        record=recorded.get(e['id'],{})
        if any(record.get(k)!=v for k,v in {'effect':e['effect'],'start':start,'end':end,'bbox':box}.items()):errors.append(e['id']+': recorded motion differs from rendered timeline')
        if e['effect']!='chapter-tint' and record.get('focus') is not True:errors.append(e['id']+': foreground motion must claim focus')
        actual=e.get('sound'); declared=record.get('sound',{})
        if actual:
            file=(root/'public'/actual['file']).resolve()
            if (Path(timeline_path).parent.parent/declared.get('file','')).resolve()!=file or declared.get('at')!=start+actual['at'] or declared.get('license')!=actual.get('license'):errors.append(e['id']+': sound record differs from render')
        elif declared.get('kind')!='none':errors.append(e['id']+': sound declared but not rendered')
    # Never trust a manually shortened settle value to avoid focus conflicts.
    active=[(e,start,start+moving_until(e)) for e,start,_,_ in expected if e['effect']!='chapter-tint']
    for i,(a,start,end) in enumerate(active):
        for b,bstart,bend in active[i+1:]:
            if max(start,bstart)<min(end,bend):errors.append(a['id']+'/'+b['id']+': actual rendered moving focus overlaps')
    return errors

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('plan',type=Path);p.add_argument('--timeline',type=Path);a=p.parse_args()
    try:
        plan=json.loads(a.plan.read_text()); errors=check(plan,a.plan.resolve().parent)
        if a.timeline:errors.extend(check_timeline(plan,a.timeline))
    except (OSError,ValueError,TypeError,KeyError,AttributeError) as e:errors=[str(e)]
    print(json.dumps({'status':'FAIL' if errors else 'PASS','errors':errors,'scope':'composition records, not pixel/audio acceptance'},ensure_ascii=False,indent=2));raise SystemExit(bool(errors))
