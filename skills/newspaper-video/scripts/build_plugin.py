#!/usr/bin/env python3
"""Build a standalone plugin marketplace without productions or machine state."""
import argparse,json,shutil,hashlib
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('output',type=Path);a=p.parse_args()
skill=Path(__file__).resolve().parents[1];repo=skill.parents[1];out=a.output.expanduser().resolve()
if out.exists() or out==repo or repo in out.parents:p.error('Use a nonexistent destination outside source repository')
out.mkdir(parents=True)
for name in ['plugin.json','README.md']:shutil.copy2(repo/name,out/name)
for name in ['.agents','.claude-plugin','.codebuddy-plugin','.workbuddy-plugin']:shutil.copytree(repo/name,out/name)
dest=out/'skills/newspaper-video';dest.mkdir(parents=True)
shutil.copy2(skill/'SKILL.md',dest/'SKILL.md')
for name in ['agents','assets','references','scripts']:
 shutil.copytree(skill/name,dest/name,ignore=shutil.ignore_patterns('node_modules','out','__pycache__','*.pyc','.DS_Store'))
manifest={str(f.relative_to(out)):hashlib.sha256(f.read_bytes()).hexdigest() for f in sorted(out.rglob('*')) if f.is_file()}
(out/'build-hashes.json').write_text(json.dumps(manifest,indent=2)+'\n');print(out)
