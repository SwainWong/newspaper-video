import pathlib
import subprocess
import tempfile
import unittest
import zipfile

ROOT = pathlib.Path(__file__).resolve().parents[1]

class PackageTest(unittest.TestCase):
    def test_omits_production_and_git_files(self):
        with tempfile.TemporaryDirectory() as tmp:
            base = pathlib.Path(tmp)
            skill = base / 'newspaper-video'
            (skill / 'scripts').mkdir(parents=True)
            (skill / 'work' / 'episode' / 'evidence').mkdir(parents=True)
            (skill / '.git').mkdir()
            (skill / 'SKILL.md').write_text('name: newspaper-video')
            (skill / 'README.md').write_text('Example')
            (skill / 'work' / 'episode' / 'evidence' / 'private.pdf').write_text('PRIVATE')
            (skill / '.git' / 'config').write_text('PRIVATE')
            (skill / 'scripts' / 'package.py').write_bytes((ROOT / 'scripts/package.py').read_bytes())
            output = base / 'skill.zip'
            subprocess.run(['python3', str(skill / 'scripts/package.py'), str(output)], check=True, capture_output=True)
            with zipfile.ZipFile(output) as archive:
                self.assertIsNone(archive.testzip())
                names = archive.namelist()
                self.assertIn('newspaper-video/SKILL.md', names)
                self.assertNotIn('newspaper-video/work/episode/evidence/private.pdf', names)
                self.assertNotIn('newspaper-video/.git/config', names)

if __name__ == '__main__':
    unittest.main()
