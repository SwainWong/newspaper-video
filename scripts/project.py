#!/usr/bin/env python3
"""Portable, non-overwriting project creation and local Remotion execution."""
import argparse,os,shutil,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def main():
 p=argparse.ArgumentParser();p.add_argument('action',choices=['create','still','render']);p.add_argument('project',type=Path);p.add_argument('--frame',type=int,default=240);p.add_argument('--browser',type=Path);a=p.parse_args();dest=a.project.expanduser().absolute()
 if a.action=='create':
  if dest.exists():p.error('Destination already exists; choose a new project folder.')
  shutil.copytree(ROOT/'assets/template',dest,ignore=shutil.ignore_patterns('node_modules','out','__pycache__'));print(dest);return
 if not (dest/'src/timeline.json').is_file():p.error('Not a generated project: missing src/timeline.json')
 cli=dest/'node_modules/@remotion/cli/remotion-cli.js'
 if not cli.is_file():p.error('Run npm ci in the project first.')
 subprocess.run([sys.executable,'validate_timeline.py','src/timeline.json'],cwd=dest,check=True)
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
