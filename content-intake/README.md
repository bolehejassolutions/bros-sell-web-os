# ChatGPT Images → BROS SELL™ Content Intake

**Status: Google Drive permanent archive verified; Drive → GitHub neutral-binary test PASS; NOT a production creative publisher**  
**Batch:** BROS-IMG-2026-10-11-001  
**Creative standard:** [11 October standard](../tools/buffer-publisher/CONTENT_GENERATION_STANDARD.md) (the reference works once this branch is compared with main).

## What exists

A verified ChatGPT Images + Pillow image package is now archived permanently in the owner's **private Google Drive** at:

[BOLEHEJAS/BROS/SELL/Creative Content Bank](https://drive.google.com/drive/folders/1wb3vx_8_h6Oo9m9ou0_9rpDDBCn0u0QE) / `BROS-IMG-2026-10-11-001`.

The Drive batch includes `Source/` (original background, byte-exact official logo, rejected first pass, scripts), `Approved Staging/` (two JPGs, caption, ZIP), `QA/` (manifest and notes), and `DRIVE_ASSET_REGISTER.json`. Copies of the two JPGs and ZIP were **downloaded back from Drive** and their SHA-256 hashes matched the originals. Original logo SHA-256 is locked. "Approved Staging" means **technical QA**, not editorial approval. The older ChatGPT Library remains a non-canonical backup; do not delete Drive files after posting.

The JSON entry in this branch is **metadata only for the actual BROS marketing artwork**; those two images have **NOT** been imported into the public repo or live Buffer worker. **Verified transport:** authenticated Google Drive `fetch(download_raw_file=true, include_base64=true)` → GitHub `create_blob(encoding=base64)` → `create_tree` → `create_commit` → `update_ref` on this isolated branch. The exact Base64 of a neutral 1080×1350 JPEG fixture round-tripped from private Drive to `content-intake/bridge-tests/BROS_SELL_DRIVE_GITHUB_BRIDGE_TEST_1080x1350.jpg`, **byte-for-byte equal**, on commit `38056fbbb59ffff83065a60fa75cac7d7af3a6b6`. The repo is PUBLIC; do not upload unapproved marketing imagery or source material. No automated GitHub Actions media ingestion exists yet.

## Low-overhead procedure for later batches

1. Generate background artwork **in ChatGPT Images** with no generated logos or writing.
2. Add the *exact official* logo and checked Malay overlay with Pillow. The logo must match SHA-256 `3ce931c79be005ed0fcbb513a14c169364e67bfa17073e068483eebb28584647`.
3. Package the two JPGs, caption, verification manifest and provenance. Run `bros_chatgpt_intake.py` offline; reject wrong dimensions, duplicated IDs, stale claims, incomplete provenance or corrupted media.
4. Save ALL source files, exact official logo snapshot, rejected QA attempts, script, verified images, ZIP, caption and hashes in the private Google Drive `BOLEHEJAS/BROS/SELL/Creative Content Bank/<unique batch id>/`. Preserve permanently, including after publication; ChatGPT Library is an optional backup, not canonical.
5. **Separate release gate:** The binary bridge is VERIFIED for neutral test media, but a real media import requires editorial/visual QA and explicit release gating because GitHub is public. Fetch approved bytes from Drive and use GitHub base64 blob + isolated branch commit; verify exact media hashes, then separately design/test any publisher adapter. Do not copy to `content.mjs`, `buffer-publisher-state`, or Buffer as a side effect of storage.
6. Compare against last five published creatives for 6/10 session diversity; review captions and claims; explicitly authorize/verify scheduling. The existing worker's static seed system is unaffected.

## Boundaries

- No OpenAI Image API billing or new paid vendor.
- No unattended ChatGPT Images generation or automatic GitHub Action integration; the in-chat Drive→GitHub transfer is available as a controlled, verified manual connector workflow.
- No GitHub Action or publishing workflow alterations.
- No Buffer API calls, new queued posts, schedule changes, A/B experiment edits, or changes to production `main`.
- No false publication claim: only Buffer `sent`, `sentAt`, and a native platform URL verifies a sent post.

**Google Drive is the long-term canonical creative bank**, with immutable per-batch evidence; this GitHub branch is only a catalog pointer plus neutral binary transport test. The current production worker's finite seed bank remains independent.
