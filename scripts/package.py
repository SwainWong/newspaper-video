#!/usr/bin/env python3
"""Make a versioned Skill archive; no runtime state or local symlinks."""
import argparse,hashlib,json,zipfile
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('output',type=Path);a=p.parse_args();root=Path(__file__).resolve().parents[1];out=a.output.expanduser().resolve()
if out.exists():p.error('Output exists')
if out==root or root in out.parents:p.error('Choose output outside the Skill directory')
paths=[f for f in root.rglob('*') if f.is_file() and not f.is_symlink() and not any(x in f.parts for x in ['node_modules','__pycache__','.git']) and f.suffix!='.pyc']
out.parent.mkdir(parents=True,exist_ok=True)
with zipfile.ZipFile(out,'x',zipfile.ZIP_DEFLATED) as z:
 for f in sorted(paths):z.write(f,root.name+'/'+f.relative_to(root).as_posix())
print(json.dumps({'file':str(out),'files':len(paths),'sha256':hashlib.sha256(out.read_bytes()).hexdigest()},indent=2))
