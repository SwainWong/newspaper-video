#!/usr/bin/env python3
"""Portable, non-overwriting project creation and local Remotion execution."""
import argparse,os,shutil,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def main():
 p=argparse.ArgumentParser();p.add_argument('action',choices=['create','still','render']);p.add_argument('project',type=Path);p.add_argument('--brief',type=Path);p.add_argument('--frame',type=int,default=240);p.add_argument('--browser',type=Path);a=p.parse_args();dest=a.project.expanduser().absolute()
 brief=a.brief.expanduser().absolute() if a.brief else dest/'production-brief.json'
 subprocess.run([sys.executable,str(ROOT/'scripts/preflight.py'),str(brief)],check=True)
 if a.action=='create':
  if dest.exists():p.error('Destination already exists; choose a new project folder.')
  shutil.copytree(ROOT/'assets/template',dest,ignore=shutil.ignore_patterns('node_modules','out','__pycache__'));import json
  brief_data=json.loads(brief.read_text());shutil.copy2((brief.parent/brief_data['script_file']).resolve(),dest/'approved-script.md');brief_data['script_file']='approved-script.md';(dest/'production-brief.json').write_text(json.dumps(brief_data,ensure_ascii=False,indent=2));print(dest);return
 if not (dest/'src/timeline.json').is_file():p.error('Not a generated project: missing src/timeline.json')
 cli=dest/'node_modules/@remotion/cli/remotion-cli.js'
 if not cli.is_file():p.error('Run npm ci in the project first.')
 subprocess.run([sys.executable,'validate_timeline.py','src/timeline.json'],cwd=dest,check=True)
 import json
 data=json.loads((dest/'src/timeline.json').read_text());brief_data=json.loads((dest/'production-brief.json').read_text())
 if not data.get('music') and not brief_data.get('no_music_user_message'):p.error('BGM missing: supply music or an explicit user no-music request.')
 if not any(s.get('sfx') for s in data.get('scenes',[])) and not brief_data.get('sfx_omission_reason'):p.error('SFX missing: map animation events to sound cues.')
 if data.get('scenes',[{}])[0].get('kind')=='brand':p.error('Start with the episode hook before the brand transition.')
 output='out/preview.png' if a.action=='still' else 'out/video.mp4'
 if (dest/output).exists():p.error('Output already exists; move it aside before rerendering.')
 cmd=['node',str(cli),a.action,'src/index.ts','NewspaperShort',output,'--log=error']
 if a.action=='still':cmd.append('--frame='+str(a.frame))
 else:cmd.append('--concurrency=2')
 if a.browser:
  browser=a.browser.expanduser().resolve()
  if not browser.is_file():p.error('Browser executable not found')
  cmd.append('--browser-executable='+str(browser))
 env=os.environ.copy();env['NODE_OPTIONS']=(env.get('NODE_OPTIONS','')+' --dns-result-order=ipv4first').strip()
 subprocess.run(cmd,cwd=dest,env=env,check=True);print(dest/output)
if __name__=='__main__':main()
