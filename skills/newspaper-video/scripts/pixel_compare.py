#!/usr/bin/env python3
"""Explicitly aligned, hash-bound image geometry comparisons (Pillow required)."""
import argparse
import hashlib
import io
import json
import math
from pathlib import Path
import re

from PIL import Image, ImageChops, ImageOps

KINDS = ('recreated_graphics', 'reused_source_asset')
RESAMPLING = {name: getattr(Image.Resampling, name.upper()) for name in
              ('nearest', 'bilinear', 'bicubic', 'lanczos')}
SCOPE = 'image_geometry_only; not perceptual, motion, audio, or owner acceptance'


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def integer(value):
    return isinstance(value, int) and not isinstance(value, bool)


def rectangle(value, size):
    if not isinstance(value, list) or len(value) != 4 or not all(integer(v) for v in value):
        raise ValueError('ROI must be integer [x,y,width,height]')
    x, y, w, h = value
    if x < 0 or y < 0 or w <= 0 or h <= 0 or x + w > size[0] or y + h > size[1]:
        raise ValueError('ROI must be nonempty and inside the image')
    return x, y, x + w, y + h


def load_png(spec, base):
    path = (base / spec['path']).resolve()
    data = path.read_bytes()
    digest = sha256(data)
    if 'sha256' in spec and spec['sha256'] != digest:
        raise ValueError('stale SHA256: ' + str(path))
    with Image.open(io.BytesIO(data)) as image:
        if image.format != 'PNG':
            raise ValueError('Inputs must be PNG: ' + str(path))
        image.load()
        result = image.copy()
    return result, {'path': str(path), 'sha256': digest, 'original_size': list(result.size)}


def aligned(spec, alignment, base):
    original, evidence = load_png(spec, base)
    # Alpha would otherwise silently disappear when converted to RGB.
    if 'A' in original.getbands() and original.getchannel('A').getextrema() != (255, 255):
        raise ValueError('Flatten transparent inputs explicitly before comparison')
    if 'transparency' in original.info:
        raise ValueError('Flatten PNG transparency explicitly before comparison')
    crop = rectangle(spec['crop'], original.size)
    image = original.convert('RGB').crop(crop)
    target = alignment['size']
    if not isinstance(target, list) or len(target) != 2 or not all(integer(v) and v > 0 for v in target):
        raise ValueError('alignment.size must contain two positive integers')
    resize = alignment['resize']
    if resize not in ('none', *RESAMPLING):
        raise ValueError('Unknown resize method')
    if image.size != tuple(target):
        if resize == 'none':
            raise ValueError('Dimensions differ with resize=none')
        image = image.resize(tuple(target), RESAMPLING[resize])
    evidence.update(crop=spec['crop'], alignment=alignment)
    return image, evidence


def rect_mask(rect, size):
    box = rectangle(rect, size)
    mask = Image.new('L', size)
    mask.paste(255, box)
    return mask


def count(mask):
    return mask.histogram()[255]


def metrics(diff, mask, thresholds):
    pixels = count(mask)
    if not pixels:
        raise ValueError('Mask or region leaves no evaluated pixels')
    mae = sum(sum(i * n for i, n in enumerate(ch.histogram(mask))) for ch in diff.split()) / (3 * pixels)
    result = {'evaluated_pixels': pixels, 'mean_absolute_rgb_error': mae}
    cutoff = thresholds.get('channel_error')
    if cutoff is not None:
        channels = diff.split()
        maximum = ImageChops.lighter(ImageChops.lighter(channels[0], channels[1]), channels[2])
        hist = maximum.histogram(mask)
        fraction = sum(n for i, n in enumerate(hist) if i > cutoff) / pixels
        result['fraction_pixels_any_channel_above_threshold'] = fraction
    else:
        result['fraction_pixels_any_channel_above_threshold'] = None
    checks = {}
    if 'max_mae' in thresholds:
        checks['mae_within_requested_limit'] = mae <= thresholds['max_mae']
    if 'max_exceed_fraction' in thresholds:
        checks['fraction_within_requested_limit'] = fraction <= thresholds['max_exceed_fraction']
    result['requested_threshold_checks'] = checks
    return result


def validate_thresholds(value):
    if not isinstance(value, dict) or set(value) - {'channel_error', 'max_mae', 'max_exceed_fraction'}:
        raise ValueError('Unknown thresholds')
    for key, number in value.items():
        upper = 1 if key == 'max_exceed_fraction' else 255
        if isinstance(number, bool) or not isinstance(number, (float, int)) or not math.isfinite(number) or not 0 <= number <= upper:
            raise ValueError('Threshold must be finite and within its metric range')
    if 'max_exceed_fraction' in value and 'channel_error' not in value:
        raise ValueError('max_exceed_fraction requires channel_error')


def compare_case(case, base, output):
    name = case['id']
    if not isinstance(name, str) or not re.fullmatch(r'[A-Za-z0-9_-]+', name):
        raise ValueError('Case id must be a safe filename component')
    alignment = case['alignment']
    ref, ref_evidence = aligned(case['reference'], alignment, base)
    candidate, candidate_evidence = aligned(case['candidate'], alignment, base)
    valid = Image.new('L', ref.size, 255)
    for rect in case.get('ignore_rects', []):
        valid.paste(0, rectangle(rect, ref.size))
    mask_evidence = None
    if 'ignore_mask' in case:
        ignored, mask_evidence = load_png(case['ignore_mask'], base)
        if ignored.mode != 'L' or ignored.size != ref.size or set(ignored.getdata()) - {0, 255}:
            raise ValueError('ignore_mask must be aligned binary L PNG: 255 ignored, 0 evaluated')
        valid = ImageChops.multiply(valid, ImageOps.invert(ignored))
    thresholds = case.get('thresholds', {})
    validate_thresholds(thresholds)
    diff = ImageChops.difference(ref, candidate)
    overall = metrics(diff, valid, thresholds)
    unions = {kind: Image.new('L', ref.size) for kind in KINDS}
    region_results = []
    names = set()
    for region in case.get('regions', []):
        kind, label = region['kind'], region['name']
        if kind not in KINDS or not isinstance(label, str) or not label or label in names:
            raise ValueError('Regions require distinct nonempty names and a supported kind')
        names.add(label)
        raw_mask = rect_mask(region['rect'], ref.size)
        other = KINDS[1] if kind == KINDS[0] else KINDS[0]
        if count(ImageChops.multiply(raw_mask, unions[other])):
            raise ValueError('Graphics and source regions must not overlap')
        unions[kind] = ImageChops.lighter(unions[kind], raw_mask)
        region_mask = ImageChops.multiply(raw_mask, valid)
        region_results.append({**region, **metrics(diff, region_mask, thresholds)})
    aggregates = {}
    for kind, mask in unions.items():
        masked = ImageChops.multiply(mask, valid)
        aggregates[kind] = metrics(diff, masked, thresholds) if count(masked) else None
    classified = ImageChops.lighter(*unions.values())
    source_count = count(ImageChops.multiply(unions['reused_source_asset'], valid))
    recreated_count = count(ImageChops.multiply(unions['recreated_graphics'], valid))
    artifacts = {}
    # Gray explicitly marks excluded pixels in every diagnostic image.
    neutral = Image.new('RGB', ref.size, (96, 96, 96))
    left = Image.composite(ref, neutral, valid)
    right = Image.composite(candidate, neutral, valid)
    side = Image.new('RGB', (ref.width * 2, ref.height))
    side.paste(left, (0, 0)); side.paste(right, (ref.width, 0))
    maximum = ImageChops.lighter(ImageChops.lighter(*diff.split()[:2]), diff.split()[2])
    heat = ImageOps.colorize(maximum, (0, 0, 0), (255, 0, 0))
    images = {'side-by-side': side, 'overlay': Image.blend(left, right, .5),
              'heatmap': Image.composite(heat, neutral, valid)}
    for kind, image in images.items():
        path = output / f'{name}-{kind}.png'
        image.save(path)
        artifacts[kind] = {'path': path.name, 'sha256': sha256(path.read_bytes())}
    return {'id': name, 'scope': SCOPE, 'reference': ref_evidence, 'candidate': candidate_evidence,
            'ignore_mask': mask_evidence, 'ignore_rects': case.get('ignore_rects', []),
            'thresholds': thresholds, 'overall_geometry': overall, 'regions': region_results,
            'aggregates_by_origin': aggregates,
            'coverage': {'recreated_graphics_pixels': recreated_count, 'reused_source_asset_pixels': source_count,
                         'unclassified_pixels': count(ImageChops.multiply(ImageOps.invert(classified), valid)),
                         'reused_source_asset_fraction': source_count / count(valid)},
            'graphics_aggregate_available': recreated_count > 0,
            'acceptance': 'not_assessed', 'artifacts': artifacts}


def run(plan_path, output):
    plan_path, output = Path(plan_path).resolve(), Path(output).resolve()
    raw = plan_path.read_bytes()
    plan = json.loads(raw)
    cases = plan['cases']
    if not isinstance(cases, list) or not cases:
        raise ValueError('At least one case is required')
    ids = [case['id'] for case in cases]
    if len(set(ids)) != len(ids):
        raise ValueError('Duplicate case ids')
    output.mkdir(parents=True, exist_ok=False)
    report = {'schema_version': 1, 'scope': SCOPE,
              'limitations': ['Pixel errors do not prove useful visual similarity.',
                             'Copied source pixels cannot establish recreated graphics fidelity.',
                             'No universal pass threshold or pixel-perfect claim is supplied.',
                             'Missing graphics regions means no graphics aggregate is available.',
                             'Region provenance is declared by the plan author, not independently verified.'],
              'plan': {'path': str(plan_path), 'sha256': sha256(raw)},
              'cases': [compare_case(case, plan_path.parent, output) for case in cases]}
    (output / 'report.json').write_text(json.dumps(report, indent=2, allow_nan=False) + '\n')
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('plan', type=Path)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    try:
        run(args.plan, args.output)
    except (ValueError, KeyError, TypeError, OSError) as error:
        parser.exit(2, f'Comparison failed: {error}\n')
    print(args.output / 'report.json')


if __name__ == '__main__':
    main()
