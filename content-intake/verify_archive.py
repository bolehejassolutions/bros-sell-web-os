#!/usr/bin/env python3
"""Read-only QA/release-eligibility check for private BROS SELL Google Drive batches.

Usage:
  python verify_archive.py --batch-dir /path/to/Drive/batch
  python verify_archive.py --batch-dir /path/to/Drive/batch --release-approval approval.json

This tool does not upload, publish, delete, rename, or invoke remote APIs.
"""
import argparse
import hashlib
import json
import re
import sys
import zipfile
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath

from PIL import Image

EXPECTED_LOGO = '3ce931c79be005ed0fcbb513a14c169364e67bfa17073e068483eebb28584647'
EXPECTED_FILES = {
    'BROS_SELL_IG_FB_1080x1350.jpg': (1080, 1350),
    'BROS_SELL_TIKTOK_1080x1920.jpg': (1080, 1920),
}
PRODUCT = 'BROS SELL™ — Closing OS'
DOCTRINE = 'Menjelaskan, bukan Memujuk.'
FORBIDDEN = re.compile(r'RM\s*(?:50|99|399)\b|early bird|first 100|30\s*sept|jamin(?:an)?\s*jualan|guaranteed|pasti berjaya', re.I)
ID_PATTERN = re.compile(r'BROS-IMG-\d{4}-\d{2}-\d{2}-\d{3}')


def digest(path):
    h = hashlib.sha256()
    with path.open('rb') as source:
        for block in iter(lambda: source.read(1 << 20), b''):
            h.update(block)
    return h.hexdigest()


def require(ok, message):
    if not ok:
        raise ValueError(message)


def batch_check(root):
    registry = json.loads((root / 'DRIVE_ASSET_REGISTER.json').read_text(encoding='utf-8-sig'))
    manifest = json.loads((root / 'QA' / 'intake_manifest.json').read_text(encoding='utf-8-sig'))
    content_id = registry.get('contentId')
    require(bool(ID_PATTERN.fullmatch(content_id or '')), 'Invalid content identifier')
    require(content_id == root.name == manifest.get('id'), 'Batch folder/registry/manifest ID mismatch')
    require(registry.get('storage') == 'Google Drive primary and permanent', 'Google Drive is not marked canonical')
    require(manifest.get('product') == PRODUCT, 'Wrong product')
    require(manifest.get('doctrine') == DOCTRINE, 'Wrong doctrine')
    require(manifest.get('contentStatus') == 'STAGED_NOT_PUBLISHED', 'Stage must be unpublished')
    require(manifest.get('releaseGate') == 'MANUAL_REVIEW_REQUIRED_BEFORE_SCHEDULING', 'Manual release gate missing')
    require(manifest.get('noAutopublish') is True, 'noAutopublish must be true')
    require(manifest.get('officialLogoSha256') == EXPECTED_LOGO, 'Unapproved brand-logo hash')
    require(registry.get('reviewedForPublication') is False, 'Registry should describe pending approval, not publication')
    require(registry.get('githubMediaIngested') is False and registry.get('bufferPostCreated') is False,
            'Registry is not a staging-only snapshot')
    count = 0
    for dirname, entries in registry['files'].items():
        require(dirname in ('Source', 'Approved Staging', 'QA'), 'Unknown/untrusted directory in register')
        for entry in entries:
            name = entry['name']
            require(name == PurePosixPath(name).name and name not in ('.', '..'), 'Unsafe registered file path')
            path = root / dirname / name
            require(path.is_file(), f'Missing archived file: {dirname}/{name}')
            require(path.stat().st_size == entry['bytes'], f'File size mismatch: {dirname}/{name}')
            require(digest(path) == entry['sha256'], f'SHA256 mismatch: {dirname}/{name}')
            count += 1
    source_logo = root / 'Source' / 'official_logo_exact.jpg'
    require(digest(source_logo) == EXPECTED_LOGO, 'Exact official logo missing or altered')
    require(digest(root / 'Source' / 'background_original.png') == manifest.get('originalBackgroundSha256'),
            'AI image original does not match manifest')
    assets = {x['filename']: x for x in manifest['assets']}
    require(set(assets) == set(EXPECTED_FILES), 'Unexpected platform image inventory')
    for name, dimensions in EXPECTED_FILES.items():
        path = root / 'Approved Staging' / name
        require(path.stat().st_size <= 8_000_000, f'Oversized JPG: {name}')
        require(digest(path) == assets[name]['sha256'], f'Asset-manifest hash mismatch: {name}')
        with Image.open(path) as im:
            im.verify()
        with Image.open(path) as im:
            require(im.format == 'JPEG' and im.size == dimensions, f'Image format/dimensions invalid: {name}')
    caption = (root / 'Approved Staging' / 'caption.txt').read_text(encoding='utf-8-sig')
    require(bool(caption.strip()) and len(caption) <= 2200, 'Caption missing/too long')
    require(DOCTRINE in caption and 'Ilustrasi AI' in caption, 'Doctrine/synthetic disclosure missing')
    require(FORBIDDEN.search(caption) is None, 'Forbidden legacy/unsupported offer in caption')
    archives = [e['name'] for e in registry['files']['Approved Staging'] if e['name'].endswith('.zip')]
    require(len(archives) == 1, 'Expected one archived ZIP per batch')
    archive = root / 'Approved Staging' / archives[0]
    with zipfile.ZipFile(archive) as z:
        require(z.testzip() is None, 'ZIP CRC failure')
        names = z.namelist()
        require(len(names) == len(set(names)), 'Duplicate ZIP paths')
        for name in names:
            p = PurePosixPath(name)
            require(not p.is_absolute() and '..' not in p.parts and '\\' not in name, 'Unsafe ZIP filename')
        for name in EXPECTED_FILES:
            require(f'assets/{name}' in names, f'Asset missing from ZIP: {name}')
            require(hashlib.sha256(z.read(f'assets/{name}')).hexdigest() == assets[name]['sha256'],
                    f'ZIP asset hash mismatch: {name}')
    checks = manifest.get('checks', {})
    require(all(v == 'PASS' for v in checks.values()) and len(checks) >= 7, 'Intake QA evidence missing')
    return {'status': 'TECHNICAL_QA_PASS_NOT_APPROVED_FOR_PUBLICATION', 'contentId': content_id,
            'verifiedFiles': count, 'verifiedMedia': list(EXPECTED_FILES),
            'archiveSha256': digest(archive), 'canonicalStorage': 'Google Drive (private, permanent)',
            'publicGithubUploadAllowed': False, 'bufferPublishingAllowed': False}


def approval_check(summary, file):
    """Separate documented release authority; never publishes by itself."""
    require(file is not None and file.is_file(), 'BLOCKED: written release approval file is required')
    approval = json.loads(file.read_text(encoding='utf-8-sig'))
    require(approval.get('contentId') == summary['contentId'], 'BLOCKED: wrong content ID')
    require(approval.get('archiveSha256') == summary['archiveSha256'], 'BLOCKED: changed content since approval')
    require(approval.get('editorialQa') == 'PASS', 'BLOCKED: editorial QA incomplete')
    require(approval.get('visualQa') == 'PASS', 'BLOCKED: visual QA incomplete')
    require(approval.get('recentCreative6of10') is True, 'BLOCKED: recent creative variation unverified')
    require(approval.get('brandApproval') is True, 'BLOCKED: logo/brand review missing')
    require(approval.get('publicRepoDisclosureApproved') is True, 'BLOCKED: owner has not authorised public GitHub disclosure')
    require(approval.get('ownerApproved') is True and bool(approval.get('approvedBy')), 'BLOCKED: owner approval missing')
    stamp = approval.get('approvedAt', '')
    require(bool(re.fullmatch(r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z', stamp)),
            'BLOCKED: owner approval timestamp missing')
    require(datetime.fromisoformat(stamp.replace('Z', '+00:00')) <= datetime.now(timezone.utc),
            'BLOCKED: future-dated approval')
    summary['releaseEligibility'] = 'APPROVAL_EVIDENCE_VALID_FOR_REVIEW_ONLY'
    summary['publicGithubUploadAllowed'] = False  # Always leave transfers to an explicit separate action.
    summary['bufferPublishingAllowed'] = False
    return summary


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--batch-dir', type=Path, required=True)
    p.add_argument('--release-approval', type=Path)
    a = p.parse_args()
    root = a.batch_dir.resolve(strict=True)
    try:
        result = batch_check(root)
        if a.release_approval is not None:
            result = approval_check(result, a.release_approval)
        print(json.dumps(result, ensure_ascii=False, indent=2))
    except (ValueError, OSError, KeyError, TypeError, zipfile.BadZipFile) as e:
        print('BLOCKED: ' + str(e), file=sys.stderr)
        return 2
    return 0

if __name__ == '__main__':
    sys.exit(main())
