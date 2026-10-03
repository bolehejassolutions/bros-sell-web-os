# Sales Case operating loop - Production release assessment

Updated 3 October 2026. Status: **READY WITH KNOWN LIMITATION**. PR #11 is merged and the reviewed release is live in Production.

This report supersedes the earlier Draft/Production-unchanged assessment. The owner explicitly authorised merge/deployment and accepts the previously completed real Account A/B, customer isolation and signed-download tests. Those tests were not repeated or presented as new agent-observed sessions.

## Merge integrity and release identity

| Item | Verified evidence |
| --- | --- |
| PR | [#11 - Make Sales Case the shared BROS SELL operating loop](https://github.com/bolehejassolutions/bros-sell-web-os/pull/11), closed/merged |
| Approved head before merge | `0772e8c3332adf3ed5162be17218c1f66236db0b` |
| Previous main / merge parent | `56f89fbc2d19406efd7f1ef075646446787555cb` |
| Merge convention / resulting main | Squash; `913ea4c668f4176da2cd03925dd6613eecd75164` |
| Exact reviewed/merged tree equality | `07eeea5a09e65f81d6c835ef63786e1729c9a15d` on both commits |
| Scope verification | All 11 expected commits; 50 changed files; no unexpected commits or diff changes |
| Pre-merge checks | verify and Vercel Preview Comments successful; Vercel commit status successful; main unprotected, no required contexts |
| Reviewed-head CI | [37095714352](https://github.com/bolehejassolutions/bros-sell-web-os/actions/runs/37095714352), success |
| Reviewed Preview | [bros-sell-web-lzf4ahmc2-bolehejassolutions-8492.vercel.app](https://bros-sell-web-lzf4ahmc2-bolehejassolutions-8492.vercel.app), `dpl_CeV4kkzamshS2RMLpnwcMAij4QcU`, READY, approved head |
| Final Preview HTTP smoke | Passed at 2026-10-03T06:26:58.512Z before merge |
| Original local/API P0 | `66fb6bc6dd4b9b177352d58a67c2c52ed17b5933` / `b4e79ce17ffc7b12673b47fe4153523f994aea1c`, original tree `a230eacc3c7acfc78f745c18989dcff986beabf5` |

## Production deployment

- Customer Web OS: **https://brossell.bolehejas.com**.
- Immutable deployment: https://bros-sell-web-mix005ndc-bolehejassolutions-8492.vercel.app.
- Deployment ID: `dpl_83SE7k2AUfB1XL3DAd9Qo5verDd4`; target Production; state **READY**; source main via the existing Git integration.
- Deployment SHA: `913ea4c668f4176da2cd03925dd6613eecd75164`.
- Created 2026-10-03T06:28:04.847Z; ready 2026-10-03T06:28:39.199Z.
- Published Supabase host: **cyryoirzxpvummckegyh.supabase.co**. The compiled Production client and real Google OAuth entry both identify the exact authorised Web OS project.
- Vercel reported no runtime errors in the post-deployment range, including after the browser smoke. This is a short smoke window, not a long-term reliability claim.

The build-log connector returned a provider tool-not-found error. The reviewed normal production build passed in CI and this Vercel deployment reached READY; individual Vercel build-log lines are not claimed as inspected.

## Production smoke and evidence boundaries

HTTP checked 2026-10-03T06:32:25.050Z. [Real Production Chromium run 37103682016](https://github.com/bolehejassolutions/bros-sell-web-os/actions/runs/37103682016) completed successfully 2026-10-03T06:38:33Z on Linux. These checks accessed the live Production domain, not a local fixture.

| Gate | Fresh Production observation |
| --- | --- |
| Public landing | bros.bolehejas.com returns 200 with BROS branding |
| Web OS root and /app | Anonymous access redirects 307 to /login, private/no-store |
| Login UI | 200; assets load; Google, Email + Password and Magic Link controls/forms render |
| Google OAuth entry | Clicking the live Google button receives 302 to accounts.google.com through the correct Supabase project; callback is Production /auth/callback |
| Operator Dashboard / Customer Hub | Anonymous /app/operator-dashboard and /app/resources redirect to login |
| Sales Case API protection | Anonymous GET/POST/PUT return 401; private/no-store |
| Protected Closing OS resource | Anonymous app API returns 401; direct anonymous Storage signing/public-path requests deny access |
| Recovery/support | /activate 200; brossell@bolehejas.com and approved mailto, purchase-email/reference guidance, no-password/OTP/card instruction, separate HitPay package and maintained-companion explanation |
| Refund guidance | Existing 30-calendar-day request window and approved support contact visible |
| Authenticated Sales Case create/read/update, refresh, dashboard contents | Prior accepted customer evidence and reviewed CI application checks carried forward; no new agent-observed authenticated Production session |
| Real account isolation and signed download | Previously completed tests accepted by owner; not repeated |
| Manual fulfilment/access recovery | Approved existing handoff retained and recovery instructions live; no new paid transaction, grant, recovery execution or mailbox send/receive test |

An OAuth entry check does not establish completed sign-in. An anonymous denial check does not establish entitled access or customer CRUD. Reviewed fixtures establish application/browser behaviour, not hosted Supabase Auth. This report keeps those evidence sources separate.

| Production viewport | Login/password/magic forms | Recovery/contact | Protected redirects / layout / console |
| --- | --- | --- | --- |
| 360px | Passed | Passed | Passed |
| 390px | Passed | Passed | Passed |
| 430px | Passed | Passed | Passed |
| 1280px | Passed | Passed | Passed |

No horizontal overflow, clipped visible controls, Next error overlays, unexpected page errors or console errors were detected on those public screens. Authenticated screens retain the reviewed four-width fixture coverage; they were not freshly browsed on Production.

[Production artifact](https://github.com/bolehejassolutions/bros-sell-web-os/actions/runs/37103682016/artifacts/11266954372) contains 16 screenshots and one result JSON, digest `sha256:ac5faacaf435529ff6f469801d6fc47d14a8e926e56238c9c108b87b6632b1e9`, 741258 bytes; expires 2026-10-10T06:38:28Z. Assertions and capture passed; separate human visual inspection is not claimed. Verification source is `65d39d8ea356801a8e41a8803425203e87f9b97c` on `verify/production-913ea4c`, outside main. This branch does not change the deployed application.

## Retained build, application and database verification

Reviewed-head CI passed npm ci, lint (0 errors / 4 existing warnings), TypeScript, 12 deterministic/migration SQL-RLS tests, grouped HTTP/API integration, normal Next production build and both Chromium suites. Node 24.19.0, npm 11.9.0 and Playwright 1.63.0 remain locked; dependencies were not updated.

Reviewed browser coverage includes the RM500 onboarding/case/Analyzer/evidence/WHAT-WHY-NEXT journey, native shared state, actions/outcomes, next-action recomputation, priorities, refresh, injected 503 save/retry/draft preservation and actual fixture API 409 conflict handling, plus reciprocal fixture isolation at 360/390/430/1280px.

Supabase project is `cyryoirzxpvummckegyh`. Applied migration `20261002074235_sales_case_operating_loop` remains in place with Sales Case RLS. The prior 19 SQL-role/claim and 3 Storage-role checks remain retained evidence, not newly created customer sessions. No schema, RLS, grant, Auth configuration or customer entitlement change was made for this deployment.

Historical pre-Production evidence remains in [sales-case-ci-verification-evidence.json](sales-case-ci-verification-evidence.json); its Draft/unmerged/Production-unchanged fields describe that earlier recorded stage. Current machine-readable state is [sales-case-production-release.json](sales-case-production-release.json).

## Existing manual fulfilment path

Follow [manual-fulfilment-access-recovery.md](manual-fulfilment-access-recovery.md): verify successful HitPay payment/reference and purchase/account email match; new manual grants use **BROS_SELL_CORE / core**, source manual. HitPay delivers the downloadable package separately. Web OS is the maintained online companion tied to the purchase email; no lifetime hosted-access promise.

Recovery/support and refund requests use **brossell@bolehejas.com** from the purchase email, with optional HitPay order/receipt reference. Never request passwords, OTPs or card information. After any actual grant/recovery, verify /app plus one protected resource privately. Refund requests remain allowed within 30 calendar days; a request does not mean automatic approval.

No automatic provisioning is claimed. No pricing, HitPay commercial configuration, entitlement/refund policy, customer entitlements or Supabase schema was changed. No paid transaction, spending or ads occurred.

## Known limitations

- Manual fulfilment remains allowed until automation is proven. Per-customer payment matching and post-grant checks remain operational duties.
- The fresh Production smoke is anonymous plus OAuth initiation. Accepted prior real customer tests close those release gates; no fresh authenticated Production CRUD/refresh/dashboard/download observation is claimed.
- Leaked-password protection remains disabled while password authentication is active on the previously verified Free organisation. Supabase documents the protection on Pro and above; no paid upgrade or Auth change occurred. https://supabase.com/docs/guides/auth/password-security .
- Pinned Next 16.3.5 retains GHSA-vcvr-r3jv-pc5j. The publisher scopes it to attacker-controlled SVG in Node next/og ImageResponse; no affected usage was found in the reviewed app. Current-path non-applicability remains a scope-based inference; no silent upgrade. https://github.com/vercel/next.js/security/advisories/GHSA-vcvr-r3jv-pc5j .

## Rollback and decision

No material regression was observed and **no rollback was used**. Previous application deployment `dpl_9CSGHQH3CuHymXK19ga8LnYt9XrN` at `56f89fbc2d19406efd7f1ef075646446787555cb` remains the rollback target. If a material application regression appears, restore that application deployment only; retain the Sales Case table, migration and customer data.

**READY WITH KNOWN LIMITATION**: the approved reviewed release is deployed, live public/browser smoke passed, previous customer testing is accepted, and manual operations/security limitations are recorded.

Feature expansion is stopped. Use [first-10-customer-validation.md](first-10-customer-validation.md) for organic acquisition and actual Sales Case behaviour. P1 priorities must follow observed customer friction and outcomes.
