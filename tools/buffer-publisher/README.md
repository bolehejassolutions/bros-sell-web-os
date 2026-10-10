# BROS SELL Buffer publishing worker

Status: production enabled after owner approval on 10 Oct 2026. The encrypted server-side credential passed a hosted API audit. The first sample was published and its native Facebook, Instagram and TikTok content, URLs and timestamps were verified.

This isolated worker lives in the existing SELL repository. It does not call the Web OS database, alter customer entitlements, change the public landing page, revive CONTENT Supabase, or modify other products.

## Operation

- Four Buffer delivery slots daily: 05:00, 11:00, 17:00, 23:00 Asia/Kuala_Lumpur. UTC: 21:00, 03:00, 09:00, 15:00.
- GitHub Actions checks after each cycle, at minute 17. GitHub cron is best-effort; Buffer receives exact future timestamps and maintains a target of eight occupied posts per channel, leaving two slots below the Free cap. Drafts/errors/unmanaged posts are conservatively counted.
- Content planning uses 60 distinct editorial seeds across all ten sales stages. It composes Malay captions and renders six JPGs per package: three 1080×1350 cards for Instagram/Facebook, three 1080×1920 cards for TikTok. Facebook uses the first card and a complete educational caption. Instagram/TikTok use three cards. No external generation service, music or paid model is required.
- Product introduction is limited to every fifth package; other posts focus on useful guidance. Synthetic scenarios are labeled. No price/checkout/refund claims are in these posts. Current owner price is RM100 once; final merchant checkout total remains separately unverified in the authoritative source.
- Each seed is used once. At four packages/day the initial bank covers about 15 days, less any test packages. Exhaustion raises an exception and stops new content instead of recycling or fabricating. Continuing novel generation requires replenishing the governed catalog or an owner-approved generation provider; no paid provider is silently enabled.

## Durable state and safety

The dedicated `buffer-publisher-state` branch holds `state.json`, permanent immutable media and structured reports. It contains only automation-owned editorial content and operational evidence. Keep customer data, credentials and raw platform error bodies out of it. The default branch remains the operational code source; the state branch must never be merged into main.

Every mutation has a durable write-ahead intent. A single workflow concurrency group serializes workers. GitHub state updates require a fast-forward, so concurrent/stale writes fail rather than replacing history. Full caption, channel, time and immutable asset identify an uncertain create; uncertain outcomes are held for reconciliation, never blindly replayed. Missing or invalid state blocks publishing and never resets history automatically.

Read requests retry temporary failures and honor short `Retry-After` values. Explicitly rejected rate-limited requests can be retried. Ambiguous writes are reconciled first. Known temporary publication errors can be rescheduled twice on the original Buffer post ID, with six-hour backoff; authorization/validation/uncertain failures require intervention. Each cycle has a 20-call Buffer budget and a 12-create cap.

`sent` plus a valid platform URL and timestamp is recorded as **Buffer-confirmed delivery**. Scheduling acceptance never counts as publication. This is provider evidence, not proof a native public page was independently viewed. The first sample must additionally be inspected on the platform before enabling unattended production.

## Credential and approval gate

Place the existing Buffer API key directly into GitHub Actions repository secret `BUFFER_API_KEY`. It is consumed only by the default-branch worker step; never put it into code, artifacts, chat, frontend variables or reports. This is a single-account API-key integration because no registered reusable Buffer OAuth client was found. Creating a new OAuth client would require a separate authorization setup. OAuth connector authentication is not an exportable background credential.

The workflow uses its short-lived built-in GitHub token to write only the dedicated operational branch. No stored GitHub personal token is needed. Secret-bearing execution refuses other repositories or refs. PR/push verification has no Buffer credential and cannot publish.

`config.json` must retain `productionEnabled:false`, `sampleApproval:null` and `initialDeliveryVerified:false` until the user approves the exact sample and actual publication succeeds. Approval should record the sample content hash and timestamp. Only then record delivery URLs/timestamps and enable production. Manual `audit` is read-only; `drafts` creates one draft test package with a future custom time, which cannot publish while its status remains draft. Manual `production` also obeys the gate.

Live draft validation confirmed that Buffer rejects `isAiGenerated` on TikTok photo posts. TikTok inputs therefore omit that unsupported field; these assets contain educational typography and the unchanged approved logo, without realistic synthetic people or scenes. Instagram retains its supported AI disclosure flag. The generic `aiAssisted` API provenance flag remains enabled.

Disabling `productionEnabled` stops replenishment. It does not cancel posts already scheduled in Buffer; pausing/cancelling those requires an explicit operational action.

## Reporting

Cycle summaries are available in GitHub Actions; persistent JSON reports are on the state branch. They contain published content, successful platforms, URLs/timestamps, failures, retries and capacity. Set an explicitly approved HTTPS `REPORT_WEBHOOK_URL` secret only if push delivery to a reporting destination is wanted. No push-report destination is configured by default.

## Verification and sources

Run `node --test-isolation=none --test publisher.test.mjs`. The workflow also validates all 60 topics across both media formats with pinned Pillow 12.3.0. The renderer checks the exact supplied logo SHA-256 and fails on any text overflow.

- Current product/offer authority: `BROS_SELL_CURRENT_SOURCE.md`, 10 Oct 2026, project mirror version 2.
- Communication authority: `BROS_SELL_COMMUNICATION_STANDARD.md`, owner-approved 10 Oct 2026, version 1.
- Logo bytes: embedded supplied artwork in approved `BROS_SELL_LANDING_RM100_BERJIWA_BLENDED_2026-10-10.html`; SHA-256 `3ce931c79be005ed0fcbb513a14c169364e67bfa17073e068483eebb28584647`. Preserve the exact artwork; only proportional scaling is used.
- Buffer schema and live organization/channel/permission/limit inspection: 10 Oct 2026. [API authentication](https://developers.buffer.com/guides/authentication.html), [media hosting](https://developers.buffer.com/guides/hosting-media.html), [TikTok media](https://support.buffer.com/en-us/articles/using-tiktok-with-buffer-oGEroY9Of2).
- [GitHub cron limits](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows): cron can be delayed; immutable future Buffer scheduling provides the delivery buffer. A prolonged outage can exhaust that buffer and requires intervention.

Initial public verification: [Facebook](https://facebook.com/108099141072511_967888076391911), [Instagram](https://www.instagram.com/p/DeT_eYLkVF1/), [TikTok](https://tiktok.com/@bros.sell/video/7695001694526000392). Persistent evidence: `reports/initial-public-sample.json` on `buffer-publisher-state`. Future queue acceptance is reported separately from published delivery.
