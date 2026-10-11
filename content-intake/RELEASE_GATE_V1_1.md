# BROS SELL™ — Drive Creative Release Gate v1.1

Replaces v1.0 for new batches. Google Drive `BOLEHEJAS/BROS/SELL/Creative Content Bank` is the private permanent archive, and the GitHub branch `content-intake/chatgpt-images-20261011` is a staging-only implementation. **No automatic release or paid image API.**

## Verifications

- `verify_archive.py`: Validates all archived source/JPG/ZIP/caption/manifest content, official logo hash, image sizes, ZIP CRC, required flags, and pricing guard. This command never mutates or publishes anything.
- `--live-inventory inventory.json`: Optional for staging QA, mandatory if checking a written release approval; inventory has to have `source=github-buffer-publisher-state`, an `observedAt` timestamp not older than six hours and a `packages[]` array with IDs and hooks from the live publisher state. It conservatively flags 2+ matching non-stopword terms at >=0.75 overlap relative to the shorter idea. This is a **heuristic**: a clean result never substitutes for human editorial QA and the A/B calendar check.
- `--release-approval approval.json`: Requires current live inventory, no flagged duplicates, matching archive SHA-256, documented editorial/visual QA, 6/10 diversity evidence, owner approval and public-repository disclosure approval. An approval file is not cryptographically authenticated and is not standalone authorization to publish. Even when valid, no GitHub upload or Buffer post occurs automatically.

## Local usage

```sh
python -m pip install Pillow
python content-intake/verify_archive.py --batch-dir '/path/to/BROS-IMG-2026-10-11-001' --live-inventory ./publisher-inventory.json
python -m unittest discover -s content-intake -p 'test_verify_archive.py' -v
```

The test suite has seven fully offline synthetic tests, plus one additional direct duplicate test and one optional genuine-Drive integration test (9 passed in the originating session with `BROS_TEST_OFFICIAL_LOGO` and `BROS_DRIVE_BATCH_DIR`). On a repository checkout with no private Google Drive mounted, 8 local tests run and the private Drive integration is skipped. The official logo fixture comes from the exact existing repository asset and is SHA-256 checked. Do not commit private Drive files to the public repository.

## 11 October 2026 finding

`BROS-IMG-2026-10-11-001` has a **real editorial collision** with published/queued catalog seed `nak-fikir` scheduled 12 Oct 2026 11:00 MYT. Record: `EDITORIAL_DUPLICATE_HOLD_2026-10-11.md`. Keep the Drive files as permanent technical test evidence. **Do not schedule this creative.**

## Boundaries and future integration

The separate Google Drive → GitHub Base64 binary transport is already verified using one NEUTRAL image on a dedicated branch; the public repository has no right to unpublished private artwork by default. The existing GitHub Actions worker still runs `content.mjs`/`render.py` with a finite seed bank. A future adapter, true visual diversity QA, and real content release remain separate work. Do not change `main`, Buffer, four daily delivery slots or the 13–24 October A/B calendar here.
