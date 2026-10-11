# BROS SELL™ — Format compatibility HOLD

**Source checked:** GitHub public repository `bolehejassolutions/bros-sell-web-os`, `tools/buffer-publisher/planner.mjs` on `main`, 11 October 2026.

- Production `buildInput` maps Facebook to **one** `portrait-1.jpg` image.
- It maps Instagram to **three** `portrait-1.jpg` / `portrait-2.jpg` / `portrait-3.jpg` images.
- It maps TikTok to **three** `vertical-1.jpg` / `vertical-2.jpg` / `vertical-3.jpg` images.
- The archived ChatGPT Images sample has only **one** 1080x1350 final JPEG and **one** 1080x1920 final JPEG; it cannot be used by the existing production carousel builder without a separately tested format adapter or extra companion slides.

**Recommended minimal compatible future batch:** 1 original illustrative scene per format + 2 informative companion slides rendered with Pillow for each format (six filenames total), or a separately reviewed single-image media adapter after validating all three platform requirements. Preserve the official logo byte-exact and topical freshness. Do **not** create companion slides for the current `BROS-IMG-2026-10-11-001` batch because it also collides with the already-scheduled `nak-fikir` seed (12 Oct 11 AM MYT). It remains a technical test artifact only.

This document is a **hold**, not a request to change Buffer settings or the main publishing code. The Google Drive archive must remain intact permanently.
