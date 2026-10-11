# BROS SELL™ — Google Drive Creative Archive Release Gate v1

**Status:** Verified locally against materialized Google Drive batch; **NOT** production publishing or a scheduled pipeline.  
**Canonical long-term storage:** Google Drive `BOLEHEJAS/BROS/SELL/Creative Content Bank`. Source, approved staging, QA evidence and source scripts must remain in Drive permanently.  
**Prototype batch:** `BROS-IMG-2026-10-11-001` (still unpublished).  
**GitHub:** Branch `content-intake/chatgpt-images-20261011` only. Public repository! Do not publish unapproved imagery, raw creative source or private evidence to it.

## Verified function

`verify_archive.py` is a strictly **read-only** Python CLI. Given a materialized private Google Drive batch folder with original structure, it checks:

1. Matched content ID, canonical storage flag and explicit non-publishing status.
2. SHA-256 and expected byte size of every archived source, JPEG, ZIP and QA file named in `DRIVE_ASSET_REGISTER.json`.
3. Exact unchanged official logo SHA-256 `3ce931c79be005ed0fcbb513a14c169364e67bfa17073e068483eebb28584647`.
4. JPEG dimensions 1080×1350 and 1080×1920, original background hash, manifest signatures and ZIP CRC/internal media hashes.
5. Natural-BM caption's doctrine and synthetic-scene disclosure, and a conservative guard against obsolete/unapproved claims.
6. A release-approval file if separately supplied, including editorial QA, 6/10 visual diversity vs recent posts, owner approval and acknowledgement that the target GitHub repository is public.

**Safety:** Even when optional approval evidence is valid, the script never transfers bytes, uploads files, creates a GitHub release or schedules anything in Buffer. Approval metadata is not cryptographically authenticated and is not a substitute for explicit owner authorization at the publication step.

## Run

```bash
python -m pip install Pillow
python content-intake/verify_archive.py --batch-dir '/path/to/BROS-IMG-2026-10-11-001'
python -m unittest discover -s content-intake -p 'test_verify_archive.py' -v
```

The test suite generates neutral media and a complete temporary fixture using the official logo **already in the repository**, rather than committing private user files. The optional environment variable `BROS_DRIVE_BATCH_DIR` enables a genuine Drive download/materialization integration test; `BROS_TEST_OFFICIAL_LOGO` can point at the exact approved logo for local tests outside a clone.

## Approval-aware handoff, not auto-publish

1. Generate image scene in ChatGPT Images (no generated logo/text); use Pillow to overlay verified official logo and vetted words.
2. Save every file in the permanent private Drive batch folder. Never delete archived original files, rejected drafts or revision evidence when a social post is scheduled.
3. Materialize the **Drive copy** and run the verifier; capture its JSON output in the Drive `System Tests` folder.
4. Check new campaign text and meaningful 6-of-10 differences compared with five recent published visuals, plus A/B test overlaps.
5. Only after independent editorial approval and owner authorization should approved public media be copied via the proven Drive Base64 → GitHub blob/tree/commit bridge. Confirm remote SHA-256, exact branch and URL before exposing media for use.
6. A separate, tested Buffer adapter would still be required to schedule these new assets. **Not implemented; no promise of unattended ChatGPT image generation.** Preserve existing publisher, four daily MYT slots and the separate Millennial/Gen Z A/B posts.

## Tests and boundaries

11 archived files were re-materialized from Google Drive, and the full archive check passed. Seven tests passed, including missing approval, false approval, tampered JPG, changed official logo and swapped content ID. No Codex, Work, image API purchase or new vendor. No changes to GitHub `main`, Buffer state, queue or customer access. The GitHub repository is public; Drive source stays private. Its owner-reported 5 TB capacity was **not** independently verified through the connector.
