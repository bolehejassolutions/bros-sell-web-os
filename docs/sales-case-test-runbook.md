# Sales Case verification and release runbook

Updated 3 October 2026. PR #11 has been merged and deployed under owner approval. Current assessment: [sales-case-release-assessment.md](sales-case-release-assessment.md); current Production evidence: [sales-case-production-release.json](sales-case-production-release.json).

## Released identity

Production https://brossell.bolehejas.com uses `913ea4c668f4176da2cd03925dd6613eecd75164`, deployment `dpl_83SE7k2AUfB1XL3DAd9Qo5verDd4`. Reviewed head `0772e8c3332adf3ed5162be17218c1f66236db0b` and merged commit have the same tree `07eeea5a09e65f81d6c835ef63786e1729c9a15d`.

The existing .github/workflows/sales-case-p0.yml verified the reviewed PR on Ubuntu 24.04 with Node 24.19.0, locked npm 11.9.0 / Playwright 1.63.0: npm ci, lint, TypeScript, deterministic/migration SQL-RLS, normal production build, HTTP/API and both browser suites. No dependency update or Next type-check bypass.

## Production public browser smoke

Read-only script tests/production-public-smoke.ts and workflow .github/workflows/production-smoke.yml live on `verify/production-913ea4c`, outside main. [Run 37103682016](https://github.com/bolehejassolutions/bros-sell-web-os/actions/runs/37103682016) passed real Production Chromium at 360/390/430/1280px and captured 16 screenshots plus JSON. It verifies anonymous routing, login forms, approved recovery contact/copy, layout and real Google OAuth initiation.

Do not use the blocked Windows browser runtime or retry its installation. Production public smoke submits no credentials/emails, completes no customer sign-in and writes no Sales Cases. It must not be described as freshly authenticated customer CRUD evidence.

## Accepted customer and application evidence

The owner accepts previous real Account A/B, customer isolation and signed-download testing. Do not request their repetition as a release gate or ask for passwords, OTPs or session tokens.

The reviewed fixture browser suites establish RM500 application behaviour, shared state, action/outcome recomputation, priorities, refresh, save/retry/draft preservation, actual application API 409 and reciprocal fixture isolation. Fixtures never establish hosted Supabase Auth sessions.

Per-customer /app plus protected-resource checks after an actual grant/recovery remain a normal operational step for new purchases/recovery.

## Database and manual operations

Exact project: cyryoirzxpvummckegyh, BROS SELL Web OS. Migration 20261002074235_sales_case_operating_loop is already applied. Do not reapply it or change RLS, grants, RPC, Auth configuration or customer data as part of this release.

Follow [manual-fulfilment-access-recovery.md](manual-fulfilment-access-recovery.md): verified HitPay payment/reference, purchase/account email match, BROS_SELL_CORE/core new manual grants, separate HitPay package and maintained online companion. Support/recovery/refund-request contact is brossell@bolehejas.com from purchase email, optional reference, no passwords/OTPs/card information. Refund-request window remains 30 calendar days.

Do not manufacture evidence with new paid transactions, entitlement writes or refunds. Record actual operational actions privately.

## Rollback and validation

No material regression was observed; no rollback was used. Application-only rollback target is `dpl_9CSGHQH3CuHymXK19ga8LnYt9XrN` at `56f89fbc2d19406efd7f1ef075646446787555cb`. A material application regression may require restoring that app deployment; never drop the Sales Case table or customer data.

Feature expansion is stopped. Follow [first-10-customer-validation.md](first-10-customer-validation.md). Use actual customer selling behaviour and outcomes for P1 decisions.
