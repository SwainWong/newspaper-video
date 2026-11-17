#!/usr/bin/env python3
"""Validate declared user choices and hash-bound script approval. No automatic approval."""
import argparse, hashlib, json
from pathlib import Path

def check(path):
    path=Path(path); data=json.loads(path.read_text()); errors=[]
    for key in ('main_language','voice_tool','voice_choice_evidence','language_choice_evidence'):
        if not isinstance(data.get(key),str) or not data[key].strip(): errors.append(f'Missing {key}')
    sub=data.get('subtitles',{})
    if sub.get('mode') not in ('none','single','dual'): errors.append('Choose subtitles: none/single/dual')
    count={'none':0,'single':1,'dual':2}.get(sub.get('mode'),-1)
    if not isinstance(sub.get('languages'),list) or len(sub['languages'])!=count: errors.append('Subtitle language count does not match mode')
    if any(not isinstance(x,str) or not x.strip() for x in sub.get('languages',[])): errors.append('Empty subtitle language')
    script=path.parent/data.get('script_file','__missing__')
    if not script.is_file(): errors.append('Missing review script')
    else:
        digest=hashlib.sha256(script.read_bytes()).hexdigest()
        approval=data.get('script_approval',{})
        if approval.get('sha256')!=digest: errors.append('Script approval missing or stale')
        if not approval.get('user_message'): errors.append('Missing actual user approval message/reference')
    if data.get('script_review',{}).get('status')!='pass': errors.append('Script editorial review not passed')
    return errors
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('brief');a=p.parse_args()
    try: errors=check(a.brief)
    except (OSError,ValueError,TypeError,AttributeError) as e: errors=[str(e)]
    print(json.dumps({'status':'FAIL' if errors else 'PASS','errors':errors,'scope':'Declared choices and script hash; not proof of authentic human approval or creative quality'},ensure_ascii=False,indent=2))
    raise SystemExit(bool(errors))
