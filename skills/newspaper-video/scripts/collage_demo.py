#!/usr/bin/env python3
"""Create an inspectable, synthetic 16-layout fixture in a new directory."""
import argparse
import copy
import hashlib
import json
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]


def create(destination):
    destination = Path(destination).expanduser().resolve()
    if destination.is_relative_to((ROOT / 'assets/template').resolve()):
        raise ValueError('Destination must not be inside the source template')
    if destination.exists():
        raise ValueError('Destination already exists; choose a new fixture directory')
    catalog_path = ROOT / 'references/collage-presets.json'
    catalog = json.loads(catalog_path.read_text())
    boards_path = ROOT / 'references/reference-boards-fixtures.json'
    boards = {item['name']: item['spec'] for item in json.loads(boards_path.read_text())['fixtures']}
    scenes = []
    for index, preset in enumerate(catalog['fixtures']):
        duration = preset['durationFrames']
        start = sum(item['durationFrames'] for item in catalog['fixtures'][:index])
        collage = copy.deepcopy(preset['collage'])
        for node in collage['nodes']:
            if node['kind'] == 'board':
                key = preset['boardFixtures'][node['id']]
                node['spec'] = copy.deepcopy(boards[key])
                node['spec'].update(copy.deepcopy(preset.get('boardOverrides', {}).get(node['id'], {})))
        scenes.append({'id': preset['id'], 'start': start, 'end': start + duration,
                       'title': '', 'kicker': '', 'kind': 'story', 'collage': collage,
                       'captions': [{'start': start, 'end': start + duration,
                                     'text': f"合成布局示例 {index + 1:02d} / 16", 'translation': 'SYNTHETIC LAYOUT FIXTURE'}]})
    shutil.copytree(ROOT / 'assets/template', destination,
                    ignore=shutil.ignore_patterns('node_modules', 'out', '__pycache__'))
    shutil.copytree(ROOT / 'assets/sfx', destination / 'public/sfx', dirs_exist_ok=True)
    timeline = {'masthead': 'LAYOUT FIELD NOTES', 'eyebrow': 'SYNTHETIC LAYOUT FIXTURE', 'scenes': scenes}
    timeline_path = destination / 'src/timeline.json'
    timeline_path.write_text(json.dumps(timeline, ensure_ascii=False, indent=2) + '\n')
    plan={'duration_frames':scenes[-1]['end'],'timeline_sha256':hashlib.sha256(timeline_path.read_bytes()).hexdigest(),'events':[{'id':s['id']+':collage','effect':'collage','start':s['start'],'settle':s['end']-1,'end':s['end'],'bbox':[0,0,1080,1920],'focus':True,'meaning':'Synthetic screenshot layout '+s['collage']['preset'],'sound':{'kind':'none','reason':'Sound ownership stays with explicitly anchored collage children'},'child_sounds':s['collage'].get('sounds',[])} for s in scenes]}
    (destination/'motion-plan.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2)+'\n')
    provenance = {'catalog_sha256': hashlib.sha256(catalog_path.read_bytes()).hexdigest(),
                  'board_fixture_sha256': hashlib.sha256(boards_path.read_bytes()).hexdigest(),
                  'timeline_sha256': hashlib.sha256(timeline_path.read_bytes()).hexdigest(),
                  'fps': catalog['fps'], 'durationFrames': scenes[-1]['end'],
                  'media': 'Package-owned template-example.svg only; no reference media copied',
                  'acceptance': 'not_assessed',
                  'layouts': [{'id': p['id'], 'reference': p['reference'], 'sourceGeometry': p['sourceGeometry'],
                               'sampleFrame': scenes[i]['start'] + p['sampleFrame']} for i, p in enumerate(catalog['fixtures'])]}
    (destination / 'layout-source-info.json').write_text(json.dumps(provenance, ensure_ascii=False, indent=2) + '\n')
    (destination / 'FIXTURE.md').write_text(
        '# Synthetic layout fixture\n\n16 distinct screenshot composition families, 400 frames each at 30 fps. '
        'All photos are the package-owned template-example.svg; all chart observations are synthetic. '
        'Phone UI and original screenshots are absent. Captions mark every scene as synthetic.\n\n'
        'The source mapping, review frame for each scene, and provenance hashes are in layout-source-info.json. '
        'This fixture demonstrates reusable composition and staged motion. It is not a faithful news account, '
        'pixel-perfect reproduction, or visual/listening/owner approval. No narration or music is supplied. '
        'Procedural SFX assets are copied for later authorized timing work; no SFX are scheduled automatically.\n\n'
        'Install dependencies using the copied package.json, run npm run check, then use the Remotion commands '
        'documented in the template. Keep any render and pixel comparison output outside the plugin repository.\n')
    return destination


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    try:
        print(create(args.output))
    except (ValueError, OSError, KeyError) as error:
        parser.exit(2, f'Fixture creation failed: {error}\n')


if __name__ == '__main__':
    main()
