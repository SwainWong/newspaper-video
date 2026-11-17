"""Local asset/provenance checks; geometry and field validation use the TS renderer."""
from pathlib import Path

def check(data,root):
 errors=[]
 def asset(file):
  if not isinstance(file,str) or not file or Path(file).is_absolute() or '..' in Path(file).parts or '\\' in file:return False
  p=(root/'public'/file).resolve()
  return p.is_relative_to((root/'public').resolve()) and p.is_file()
 for scene in data.get('scenes',[]):
  c=scene.get('collage')
  if c is None:continue
  if not isinstance(c,dict):errors.append('collage must be object');continue
  if any(scene.get(k) for k in ['motion','analysis','editorial','images','visualBeats','metric','counter','comparison','detail','nestedNotes','timeline','metricBeats']):errors.append('collage owns scene content; do not stack legacy layouts')
  files=[]
  if c.get('background',{}).get('file'):files.append(c['background']['file'])
  for n in c.get('nodes',[]):
   if n.get('kind')=='photo':files.append(n.get('file'))
   if n.get('kind')=='motion':
    spec=n.get('spec',{});d=spec.get('data',{})
    if spec.get('effect')=='film-frame':files.append(d.get('media',{}).get('src'))
    if spec.get('effect')=='icon-metaphor':files.append(d.get('icon'))
  files.extend(cue.get('file') for cue in c.get('sounds',[]))
  for f in files:
   if not asset(f):errors.append('collage asset missing/outside public: '+str(f))
 return errors
