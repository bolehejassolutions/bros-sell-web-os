# Draft PR: Make Sales Case the shared BROS SELL operating loop

Updated: 3 October 2026. [PR #11](https://github.com/bolehejassolutions/bros-sell-web-os/pull/11).
Base: main at `56f89fbc2d19406efd7f1ef075646446787555cb`.
Branch: feat/sales-case-operating-loop. Validated application/handoff source: `3eb2747cef49f74d653f8648320017678a673189`.
State: Draft, open, unmerged. Release: READY WITH KNOWN LIMITATION.

## Published description

A seller's RM500 conversation now has an account-owned Sales Case that carries buyer/offer/evidence through existing native tools, records linked actions/outcomes and recomputes a deterministic next action. The Analyzer presents WHAT/WHY/NEXT and known/inferred/missing information; the dashboard prioritizes due cases and pending outcomes. API/RLS enforce ownership plus entitlement and reject stale revisions while preserving drafts.

Includes the existing PR #10 tooling prerequisite and additive Sales Case migration. The approved follow-up closes manual fulfilment/recovery: /activate now exposes brossell@bolehejas.com by default, purchase-email/optional HitPay-reference guidance, separate HitPay-package/maintained-online-companion information, no password/OTP/card requests and the approved 30-calendar-day refund-request window. No pricing, HitPay commercial configuration, database grant or architecture change is made.

### Validation

- [Linux CI 37095334967](https://github.com/bolehejassolutions/bros-sell-web-os/actions/runs/37095334967) passed on application/handoff source `3eb2747cef49f74d653f8648320017678a673189`: locked npm ci, lint (0 errors/4 existing warnings), TypeScript, 12 deterministic/SQL-RLS tests, HTTP/API suite and normal production build.
- Both Chromium browser suites passed at 360/390/430/1280px: full RM500 journey, native shared state, action/outcome recomputation, priorities, refresh, save/retry, actual fixture API HTTP 409, reciprocal fixture isolation, layout/control/console checks, plus recovery contact/layout at every width. [Screenshots/logs](https://github.com/bolehejassolutions/bros-sell-web-os/actions/runs/37095334967/artifacts/11264241167) expire 2026-10-10T04:07:06Z.
- Fixture sessions are application/browser evidence, not real hosted Auth evidence.
- **Real Account A/B, customer isolation and signed-download testing are accepted by the user as previously completed.** No repeat requested and no new agent-observed customer session claimed.
- Exact Supabase project cyryoirzxpvummckegyh is ACTIVE_HEALTHY. Canonical BROS_SELL_CORE is active; existing constraints support manual/active entitlement records. RLS remains enabled; migration 20261002074235_sales_case_operating_loop was not reapplied. Retained 19 live SQL-role and 3 Storage policy checks passed previously.
- [Validated Preview](https://bros-sell-web-ifpwy3nj9-bolehejassolutions-8492.vercel.app) is READY. Live /activate guidance/contact matches the approved decisions; anonymous API/PDF access is denied, protected routes redirect to login and the published Supabase host is correct.
- Documentation-only release follow-up preserves the validated application/test files. Main and Production remain at `56f89fbc2d19406efd7f1ef075646446787555cb`.

### Manual operating handoff

See docs/manual-fulfilment-access-recovery.md. Verify successful HitPay payment/reference and purchase/account email match; new grants use **BROS_SELL_CORE / core** with source manual. HitPay delivers the downloadable package separately. Web OS is the maintained online companion; no lifetime hosted-access promise.

Support/recovery: **brossell@bolehejas.com**, purchase email, optional HitPay order/receipt reference; never passwords, OTPs or card information. After an actual grant/recovery, verify /app and one protected resource. Refund requests are allowed within **30 calendar days of purchase** through that email using the purchase email; no automatic approval promise.

These are owner-approved operating decisions. No new real payment, automatic provisioning, mailbox-delivery test, customer grant/recovery or refund is claimed.

### Release decision

**READY WITH KNOWN LIMITATION.** Manual fulfilment is permitted until automation is proven. Existing password-hardening and Next dependency findings remain documented in docs/sales-case-release-assessment.md; current app has no affected next/og ImageResponse path. No dependency upgrade or paid-tier change occurred.

PR remains **Draft and unmerged**. Merge/Production require explicit authorization. No Production deployment, live commercial change, spending or P1/P2 expansion is performed.

Original local P0 `66fb6bc` and API-equivalent `b4e79ce` retain original tree equality `a230eacc3c7acfc78f745c18989dcff986beabf5`. The Sales Case implementation was not rebuilt or redesigned.
