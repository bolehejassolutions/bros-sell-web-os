A seller's RM500 conversation now has an account-owned Sales Case carrying buyer/offer/evidence through the existing native tools, linked actions/outcomes and deterministic next-action recomputation. WHAT/WHY/NEXT and known/inferred/missing diagnosis guide decisions; the dashboard prioritises due cases and pending outcomes. API/RLS enforce ownership and entitlement, and stale revision handling preserves drafts.

Includes the existing tooling prerequisite, additive Sales Case migration and approved manual fulfilment/recovery guidance. The implementation was not rebuilt or redesigned.

### Merged and deployed - 3 October 2026

- Owner explicitly approved merge and Production deployment.
- Approved head verified as `0772e8c3332adf3ed5162be17218c1f66236db0b`; all 11 expected commits and 50 changed files matched; successful reviewed CI/Vercel checks and matching READY Preview were reconfirmed before merge.
- Normal repository squash merge: **`913ea4c668f4176da2cd03925dd6613eecd75164`**. The reviewed and merged trees are identical: `07eeea5a09e65f81d6c835ef63786e1729c9a15d`.
- Production **READY**: **https://brossell.bolehejas.com**.
- Immutable deployment: https://bros-sell-web-mix005ndc-bolehejassolutions-8492.vercel.app; ID `dpl_83SE7k2AUfB1XL3DAd9Qo5verDd4`; SHA `913ea4c668f4176da2cd03925dd6613eecd75164`.
- Exact Supabase project **cyryoirzxpvummckegyh** confirmed in Production client and real Google OAuth entry. Existing migration `20261002074235_sales_case_operating_loop` retained; no reapplication or database/customer-entitlement changes.

### Verification

- [Reviewed-head CI 37095714352](https://github.com/bolehejassolutions/bros-sell-web-os/actions/runs/37095714352) passed: locked npm ci, lint, TypeScript, deterministic/SQL-RLS, HTTP/API, normal production build and both browser suites.
- Reviewed full RM500 application journey at 360/390/430/1280px includes native shared state, actions/outcomes, recomputation, dashboard, refresh, injected 503 retry/draft preservation, actual fixture API 409 and reciprocal fixture isolation. Fixtures are application/browser evidence, not hosted Auth evidence.
- Fresh Production HTTP smoke at 2026-10-03T06:32:25.050Z: marketing landing 200; login/recovery/assets load; protected root/app/dashboard/resources redirect; anonymous Sales Case GET/POST/PUT and Closing OS deny access; approved support/recovery copy and correct Supabase project.
- [Live Production Chromium run 37103682016](https://github.com/bolehejassolutions/bros-sell-web-os/actions/runs/37103682016) passed at 360/390/430/1280px: Google/password/magic-link UI, recovery/contact, protected redirects, no document overflow/clipped controls/Next overlays/unexpected page or console errors. Real Google button opens correct OAuth provider/callback; sign-in not completed.
- [16 screenshots and result JSON](https://github.com/bolehejassolutions/bros-sell-web-os/actions/runs/37103682016/artifacts/11266954372), digest `sha256:ac5faacaf435529ff6f469801d6fc47d14a8e926e56238c9c108b87b6632b1e9`, expire 2026-10-10T06:38:28Z.
- **Prior real Account A/B, customer isolation and signed-download testing accepted by the owner; not repeated.** No newly completed authenticated Production session, CRUD/refresh/dashboard-content or signed-download observation by the agent is claimed.
- No runtime errors reported in the deployment smoke range. No material regression; rollback not used. Previous app deployment `dpl_9CSGHQH3CuHymXK19ga8LnYt9XrN` retained for application-only rollback; preserve Sales Case table/customer data.

### Operating handoff and release status

**READY WITH KNOWN LIMITATION.** Manual fulfilment remains permitted until automation is proven: verify HitPay payment/reference and purchase/account email match; new grants use BROS_SELL_CORE/core, source manual. Separate HitPay customer package and maintained online companion; no lifetime hosted-access promise.

Recovery/support: brossell@bolehejas.com from purchase email, optional HitPay reference; never passwords/OTPs/card information. After actual grant/recovery, verify /app plus one protected resource. Refund requests remain allowed within 30 calendar days; no automatic approval promise.

Known limitations: manual provisioning, scope of fresh anonymous Production smoke, disabled leaked-password protection on previously verified Free tier, retained Next advisory with no affected next/og usage found (scope-based inference). No pricing, HitPay configuration, entitlement/refund policy, customer-entitlement/schema, payment or spending changes.

Final release evidence and first-10-customer handoff are on [verify/production-913ea4c](https://github.com/bolehejassolutions/bros-sell-web-os/tree/verify/production-913ea4c/docs). Main/Production retain the reviewed merge SHA. Feature expansion stops; acquire the first 10 paying customers organically and use actual Sales Case behaviour to determine P1 priorities.
