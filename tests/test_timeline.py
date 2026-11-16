import json
import pathlib
import subprocess
import tempfile
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
TEMPLATE = ROOT / 'assets/template'

class TimelineTest(unittest.TestCase):
    def run_validator(self, path):
        return subprocess.run(['python3', str(TEMPLATE / 'validate_timeline.py'), str(path)], capture_output=True, text=True)

    def test_all_examples_are_renderable_inputs(self):
        paths = [TEMPLATE / 'src/timeline.json', *sorted((TEMPLATE / 'examples').glob('*.json'))]
        for path in paths:
            with self.subTest(path=path.name):
                result = self.run_validator(path)
                self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_missing_document_asset_is_rejected(self):
        data = json.loads((TEMPLATE / 'examples/editorial-example.json').read_text())
        data['scenes'][2]['editorial']['file'] = 'not-present.png'
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json') as temp:
            json.dump(data, temp)
            temp.flush()
            result = self.run_validator(temp.name)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('missing document image', result.stdout)

if __name__ == '__main__':
    unittest.main()
