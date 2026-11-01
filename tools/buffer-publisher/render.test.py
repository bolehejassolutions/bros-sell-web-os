import json
import unittest
from pathlib import Path
from PIL import Image
from render import render, EXPECTED_LOGO

class RenderTests(unittest.TestCase):
    def test_every_topic_fits_both_platform_aspect_ratios(self):
        packages=json.loads((Path(__file__).parent/'output'/'all-packages.json').read_text(encoding='utf-8'))
        directory=Path(__file__).parent/'output'/'layout-checks'
        directory.mkdir(parents=True,exist_ok=True)
        for package in packages:
            with self.subTest(topic=package['id']):
                manifest=render(package,directory)
                self.assertEqual(len(manifest),6)
                for item in manifest:
                    self.assertLess(item['bytes'],8_000_000)
                    with Image.open(Path(directory)/item['file']) as image:
                        self.assertEqual(image.mode,'RGB')
                        self.assertEqual(image.size,(1080,item['height']))
                        self.assertEqual(image.format,'JPEG')

if __name__=='__main__':
    unittest.main()
