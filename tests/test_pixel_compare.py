import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from PIL import Image

SPEC = importlib.util.spec_from_file_location('pixel_compare', Path(__file__).resolve().parents[1] / 'skills/newspaper-video/scripts/pixel_compare.py')
pixel = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(pixel)


class PixelCompareTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        for name in ('ref', 'candidate'):
            Image.new('RGB', (8, 8), 'black').save(self.root / (name + '.png'))
        self.case = {'id': 'test', 'reference': {'path': 'ref.png', 'crop': [0, 0, 8, 8]},
                     'candidate': {'path': 'candidate.png', 'crop': [0, 0, 8, 8]},
                     'alignment': {'size': [8, 8], 'resize': 'none'},
                     'regions': [{'name': 'graphics', 'kind': 'recreated_graphics', 'rect': [0, 0, 8, 8]}],
                     'thresholds': {'channel_error': 10, 'max_mae': 0, 'max_exceed_fraction': 0}}

    def run_case(self):
        path = self.root / 'plan.json'
        path.write_text(json.dumps({'cases': [self.case]}))
        return pixel.run(path, self.root / 'out')['cases'][0]

    def test_identical_and_bound_artifacts(self):
        result = self.run_case()
        self.assertEqual(result['overall_geometry']['mean_absolute_rgb_error'], 0)
        self.assertEqual(result['reference']['sha256'], hashlib.sha256((self.root / 'ref.png').read_bytes()).hexdigest())
        for artifact in result['artifacts'].values():
            self.assertEqual(artifact['sha256'], hashlib.sha256((self.root / 'out' / artifact['path']).read_bytes()).hexdigest())
        with self.assertRaises(FileExistsError):
            pixel.run(self.root / 'plan.json', self.root / 'out')

    def test_shifted_line(self):
        for name, x in [('ref', 2), ('candidate', 3)]:
            image = Image.new('RGB', (8, 8))
            image.paste('white', (x, 0, x + 1, 8))
            image.save(self.root / (name + '.png'))
        result = self.run_case()['overall_geometry']
        self.assertEqual(result['mean_absolute_rgb_error'], 63.75)
        self.assertEqual(result['fraction_pixels_any_channel_above_threshold'], .25)
        self.assertFalse(result['requested_threshold_checks']['mae_within_requested_limit'])

    def test_mask_excludes_known_error(self):
        image = Image.new('RGB', (8, 8))
        image.paste('white', (0, 0, 4, 8))
        image.save(self.root / 'candidate.png')
        self.case['ignore_rects'] = [[0, 0, 4, 8]]
        result = self.run_case()['overall_geometry']
        self.assertEqual(result['evaluated_pixels'], 32)
        self.assertEqual(result['mean_absolute_rgb_error'], 0)

    def test_mask_cannot_hide_everything(self):
        self.case['ignore_rects'] = [[0, 0, 8, 8]]
        with self.assertRaisesRegex(ValueError, 'no evaluated'):
            self.run_case()

    def test_binary_png_mask(self):
        Image.new('L', (8, 8), 255).save(self.root / 'mask.png')
        self.case['ignore_mask'] = {'path': 'mask.png'}
        with self.assertRaisesRegex(ValueError, 'no evaluated'):
            self.run_case()

    def test_stale_hash(self):
        self.case['candidate']['sha256'] = '0' * 64
        with self.assertRaisesRegex(ValueError, 'stale SHA256'):
            self.run_case()

    def test_invalid_rois(self):
        for roi in ([0, 0, 9, 8], [0, 0, 0, 8], [-1, 0, 8, 8], [0, 0, float('inf'), 8], [False, 0, 8, 8]):
            with self.subTest(roi=roi), self.assertRaises(ValueError):
                pixel.rectangle(roi, (8, 8))

    def test_separate_graphics_and_source(self):
        image = Image.new('RGB', (8, 8))
        image.paste('white', (0, 0, 2, 8))
        image.save(self.root / 'candidate.png')
        self.case['regions'] = [
            {'name': 'graphic', 'kind': 'recreated_graphics', 'rect': [0, 0, 2, 8]},
            {'name': 'photo', 'kind': 'reused_source_asset', 'rect': [2, 0, 6, 8]}]
        result = self.run_case()
        self.assertEqual(result['aggregates_by_origin']['recreated_graphics']['mean_absolute_rgb_error'], 255)
        self.assertEqual(result['aggregates_by_origin']['reused_source_asset']['mean_absolute_rgb_error'], 0)
        self.assertEqual(result['coverage']['reused_source_asset_fraction'], .75)
        self.assertEqual(result['acceptance'], 'not_assessed')

    def test_no_graphics_no_aggregate(self):
        self.case['regions'] = []
        result = self.run_case()
        self.assertFalse(result['graphics_aggregate_available'])
        self.assertIsNone(result['aggregates_by_origin']['recreated_graphics'])

    def test_cross_origin_overlap_rejected(self):
        self.case['regions'].append({'name': 'photo', 'kind': 'reused_source_asset', 'rect': [0, 0, 1, 1]})
        with self.assertRaisesRegex(ValueError, 'overlap'):
            self.run_case()

    def test_invalid_thresholds(self):
        for thresholds in ({'max_mae': float('nan')}, {'max_exceed_fraction': .2}, {'channel_error': 256}):
            with self.subTest(thresholds=thresholds), self.assertRaises(ValueError):
                pixel.validate_thresholds(thresholds)

    def test_explicit_resize_and_no_threshold(self):
        self.case['candidate']['crop'] = [0, 0, 4, 4]
        self.case['alignment']['resize'] = 'nearest'
        self.case.pop('thresholds')
        result = self.run_case()['overall_geometry']
        self.assertEqual(result['mean_absolute_rgb_error'], 0)
        self.assertIsNone(result['fraction_pixels_any_channel_above_threshold'])
        self.assertEqual(result['requested_threshold_checks'], {})

    def test_same_origin_union_does_not_double_count(self):
        self.case['regions'].append({'name': 'duplicate-area', 'kind': 'recreated_graphics', 'rect': [0, 0, 4, 4]})
        result = self.run_case()
        self.assertEqual(result['aggregates_by_origin']['recreated_graphics']['evaluated_pixels'], 64)

    def test_partial_binary_mask(self):
        mask = Image.new('L', (8, 8))
        mask.paste(255, (0, 0, 4, 8))
        mask.save(self.root / 'mask.png')
        self.case['ignore_mask'] = {'path': 'mask.png'}
        result = self.run_case()
        self.assertEqual(result['overall_geometry']['evaluated_pixels'], 32)
        self.assertEqual(result['ignore_mask']['sha256'], hashlib.sha256((self.root / 'mask.png').read_bytes()).hexdigest())

    def test_resize_requires_explicit_policy(self):
        self.case['candidate']['crop'] = [0, 0, 4, 4]
        with self.assertRaisesRegex(ValueError, 'Dimensions differ'):
            self.run_case()


if __name__ == '__main__':
    unittest.main()
