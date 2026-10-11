# ChatGPT Images → BROS SELL™ Content Intake

**Status: READ-ONLY HANDOFF PROOF; NOT A PRODUCTION PIPELINE**  
**Batch:** BROS-IMG-2026-10-11-001  
**Creative standard:** [11 October standard](../tools/buffer-publisher/CONTENT_GENERATION_STANDARD.md) (the reference works once this branch is compared with main).

## What exists

A verified ChatGPT Images + Pillow image package has been staged in the user's **ChatGPT Library** at:

`/BROS SELL™ — Closing OS/Content Intake/BROS-IMG-2026-10-11-001/`

That folder holds a standalone ZIP, both JPGs (1080×1350 and 1080×1920), SHA-256 manifest, and an offline Python validator. Both JPEGs and package CRC were checked. The official logo source SHA-256 is locked. The initial failed AI-generated-logo visual was rejected.

The JSON entry in this branch is **metadata only**, not an image upload, remote CDN URL or a live publisher inventory entry. **GitHub Actions cannot read private ChatGPT Library paths.** The connector available to this chat does not accept direct binary file transfer to GitHub, so do not misrepresent Library staging as publisher ingestion.

## Low-overhead procedure for later batches

1. Generate background artwork **in ChatGPT Images** with no generated logos or writing.
2. Add the *exact official* logo and checked Malay overlay with Pillow. The logo must match SHA-256 `3ce931c79be005ed0fcbb513a14c169364e67bfa17073e068483eebb28584647`.
3. Package the two JPGs, caption, verification manifest and provenance. Run `bros_chatgpt_intake.py` offline; reject wrong dimensions, duplicated IDs, stale claims, incomplete provenance or corrupted media.
4. Save the verified package into this same persistent Library Content Intake folder family, keyed by a unique ID. Keep the exact ZIP and individual JPGs accessible for review.
5. **Separate release gate:** Do not copy to `content.mjs`, the `buffer-publisher-state` branch, or Buffer. If an image needs to reach GitHub, use a reviewed secure binary-upload method, then verify SHA-256 on GitHub before writing any delivery adapter. This remains an unimplemented bridge.
6. Compare against last five published creatives for 6/10 session diversity; review captions and claims; explicitly authorize/verify scheduling. The existing worker's static seed system is unaffected.

## Boundaries

- No OpenAI Image API billing or new paid vendor.
- No automatic ChatGPT chat-to-GitHub transfer (unavailable/untested).
- No GitHub Action or publishing workflow alterations.
- No Buffer API calls, new queued posts, schedule changes, A/B experiment edits, or changes to production `main`.
- No false publication claim: only Buffer `sent`, `sentAt`, and a native platform URL verifies a sent post.

The GitHub branch is a **catalog pointer**. The Library folder is the current persistent *staging bank*, not the live finite editorial seed catalog.
