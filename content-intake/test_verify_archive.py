"""Offline self-contained release-gate unit tests; no network or publishing."""
import hashlib
import io
import json
import os
import shutil
import tempfile
import unittest
import zipfile
from pathlib import Path

from PIL import Image
from verify_archive import EXPECTED_FILES, EXPECTED_LOGO, batch_check, approval_check, digest

TEST_ID = 'BROS-IMG-2026-10-11-001'


def official_logo_path():
    override = os.environ.get('BROS_TEST_OFFICIAL_LOGO')
    if override:
        return Path(override)
    return Path(__file__).resolve().parent.parent / 'tools' / 'buffer-publisher' / 'assets' / 'official-logo.jpg'


def create_fixture(parent):
    root=parent/TEST_ID
    for part in ('Source','Approved Staging','QA'):
        (root/part).mkdir(parents=True)
    logo=official_logo_path()
    if not logo.is_file():
        raise FileNotFoundError('Approved repo logo is required to run offline tests: '+str(logo))
    assert digest(logo)==EXPECTED_LOGO, 'Test official logo has changed'
    shutil.copyfile(logo,root/'Source'/'official_logo_exact.jpg')
    bg=root/'Source'/'background_original.png'
    Image.new('RGB',(64,64),'#aabbcc').save(bg)
    (root/'Source'/'rejected_AI_text_logo_firstpass.png').write_bytes(bg.read_bytes())
    (root/'Source'/'build_bros_image_test.py').write_text('# offline test\n')
    (root/'Source'/'bros_chatgpt_intake.py').write_text('# offline test\n')
    caption='Contoh situasi. Ilustrasi AI, bukan pelanggan sebenar.\nMenjelaskan, bukan Memujuk.\n'
    (root/'Approved Staging'/'caption.txt').write_text(caption,encoding='utf8')
    assets=[]
    for name,dimensions in EXPECTED_FILES.items():
        output=root/'Approved Staging'/name
        Image.new('RGB',dimensions,'#111c29').save(output,'JPEG',quality=85)
        assets.append({'filename':name,'sha256':digest(output)})
    m={'id':TEST_ID,'product':'BROS SELL™ — Closing OS',
       'doctrine':'Menjelaskan, bukan Memujuk.',
       'contentStatus':'STAGED_NOT_PUBLISHED',
       'releaseGate':'MANUAL_REVIEW_REQUIRED_BEFORE_SCHEDULING',
       'noAutopublish':True,'officialLogoSha256':EXPECTED_LOGO,
       'originalBackgroundSha256':digest(bg),'assets':assets,
       'checks':{str(i):'PASS' for i in range(8)}}
    (root/'QA'/'intake_manifest.json').write_text(json.dumps(m))
    (root/'QA'/'README.txt').write_text('Private archive and staging test')
    archive=root/'Approved Staging'/'test.zip'
    with zipfile.ZipFile(archive,'w') as z:
        for entry in assets:
            name=entry['filename']
            z.write(root/'Approved Staging'/name,arcname=f'assets/{name}')
    reg={'contentId':TEST_ID,'storage':'Google Drive primary and permanent',
         'reviewedForPublication':False,'githubMediaIngested':False,'bufferPostCreated':False,
         'files':{}}
    for folder in ('Source','Approved Staging','QA'):
        reg['files'][folder]=[{'name':p.name,'bytes':p.stat().st_size,'sha256':digest(p)}
                              for p in (root/folder).iterdir() if p.is_file()]
    (root/'DRIVE_ASSET_REGISTER.json').write_text(json.dumps(reg))
    return root


class TestReleaseGate(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root=create_fixture(Path(self.tmp.name))

    def test_verified_archive_is_still_not_released(self):
        r=batch_check(self.root)
        self.assertEqual(r['status'],'TECHNICAL_QA_PASS_NOT_APPROVED_FOR_PUBLICATION')
        self.assertFalse(r['publicGithubUploadAllowed'])
        self.assertFalse(r['bufferPublishingAllowed'])

    def test_missing_approval_blocks_release(self):
        with self.assertRaisesRegex(ValueError,'written release approval'):
            approval_check(batch_check(self.root),None)

    def test_fake_approval_does_not_open_gate(self):
        r=batch_check(self.root)
        approval=Path(self.tmp.name)/'approval.json'
        approval.write_text(json.dumps({'contentId':r['contentId'],'archiveSha256':r['archiveSha256'],
               'editorialQa':'PASS','visualQa':'PASS','recentCreative6of10':True,
               'brandApproval':True,'publicRepoDisclosureApproved':True,'ownerApproved':False}))
        with self.assertRaisesRegex(ValueError,'owner approval'):
            approval_check(r,approval)

    def test_image_tamper_fails_hash(self):
        f=self.root/'Approved Staging'/'BROS_SELL_IG_FB_1080x1350.jpg'
        b=bytearray(f.read_bytes()); b[800]^=1; f.write_bytes(b)
        with self.assertRaisesRegex(ValueError,'SHA256 mismatch'):
            batch_check(self.root)

    def test_logo_tamper_fails_hash(self):
        f=self.root/'Source'/'official_logo_exact.jpg'
        b=bytearray(f.read_bytes()); b[800]^=1; f.write_bytes(b)
        with self.assertRaisesRegex(ValueError,'SHA256 mismatch'):
            batch_check(self.root)

    def test_content_id_swap_fails(self):
        f=self.root/'QA'/'intake_manifest.json'
        d=json.loads(f.read_text());d['id']='BROS-IMG-2026-10-11-999';f.write_text(json.dumps(d))
        with self.assertRaisesRegex(ValueError,'ID mismatch'):
            batch_check(self.root)

    def test_drive_archive_integration_when_available(self):
        batch=os.environ.get('BROS_DRIVE_BATCH_DIR')
        if not batch: self.skipTest('Optional actual Drive batch materialization not present in CI')
        r=batch_check(Path(batch))
        self.assertEqual(r['status'],'TECHNICAL_QA_PASS_NOT_APPROVED_FOR_PUBLICATION')
        self.assertEqual(r['verifiedFiles'],11)

if __name__=='__main__':
    unittest.main()
