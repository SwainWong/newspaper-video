#!/usr/bin/env python3
"""Package only the portable Skill source, never local productions or Git state."""
import argparse
import hashlib
import json
import zipfile
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('output', type=Path)
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
out = args.output.expanduser().resolve()
if out.exists():
    parser.error('Output exists')
if out == root or root in out.parents:
    parser.error('Choose output outside the Skill directory')

files = [root / 'SKILL.md']
for directory in ('agents', 'scripts', 'references', 'assets'):
    files.extend((root / directory).rglob('*'))
files = [p for p in files if p.is_file() and not p.is_symlink() and not any(x in p.parts for x in ('node_modules', '__pycache__', '.git')) and p.suffix != '.pyc']
out.parent.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(out, 'x', zipfile.ZIP_DEFLATED) as archive:
    for p in sorted(files):
        archive.write(p, root.name + '/' + p.relative_to(root).as_posix())
print(json.dumps({'file': str(out), 'files': len(files), 'sha256': hashlib.sha256(out.read_bytes()).hexdigest()}, indent=2))
