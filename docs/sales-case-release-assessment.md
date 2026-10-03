# Sales Case operating loop - release assessment

Updated: 3 October 2026. PR #11 P0 release status: **READY WITH KNOWN LIMITATION**.

The approved manual fulfilment/access-recovery handoff is closed. Account A/B, customer isolation and signed-download testing are **accepted by the user as previously tested**. They were not repeated or represented as newly observed by the agent. Linux application/build/browser checks and the current live Preview recovery/anonymous checks passed.

Manual fulfilment remains required until automation is proven. This classification does not authorize merge or Production deployment. PR #11 stays Draft, open and unmerged.

## Source, branch and scope

| Item | Evidence |
| --- | --- |
| Repository / PR | [Draft PR #11](https://github.com/bolehejassolutions/bros-sell-web-os/pull/11), bolehejassolutions/bros-sell-web-os |
| Development branch | feat/sales-case-operating-loop |
| Validated application/handoff source | `3eb2747cef49f74d653f8648320017678a673189` |
| Base / unchanged main | `56f89fbc2d19406efd7f1ef075646446787555cb` |
| Original local P0 | `66fb6bc6dd4b9b177352d58a67c2c52ed17b5933` |
| Original API-equivalent P0 | `b4e79ce17ffc7b12673b47fe4153523f994aea1c` |
| Original tree equality | `a230eacc3c7acfc78f745c18989dcff986beabf5`; 66 paths, blobs and modes verified |
| Handoff follow-up | Recovery/support copy/default contact, targeted API/browser assertions and operating documentation |
| Preserved implementation | Sales Case operating logic, entitlement RPC, RLS, migration, dependencies, architecture and native tools unchanged |
| Original review archive | review/sales-case-review.zip preserved; SHA256 EB6EDC2615FB98C066DAD62CD9DA0AC9437DA9AD744D99C8BEC6266D892659DC |

A documentation-only follow-up publishes this assessment, evidence record, prepared description and current verification runbook. It retains the validated application/test files byte-for-byte. The recorded source and CI run refer to the tested application commit, avoiding a self-referential documentation SHA.

## Gates and evidence sources

| Required gate | Result / evidence type |
| --- | --- |
| Normal production build, npm ci, lint, TypeScript | Passed in Linux CI |
| Deterministic/migration SQL-RLS and HTTP/API | 12 tests and 1 grouped API integration test passed |
| RM500 journey, shared state, persistence, failure/retry, actual API 409 | Passed through production bundle with isolated fixtures |
| Account isolation / switching in CI | Passed with synthetic fixture sessions |
| Real Account A/B, customer isolation, signed Closing OS download | Accepted user-confirmed previous testing; closed, no repeat requested |
| Canonical product and schema compatibility | Read-only live check: BROS_SELL_CORE active; manual/active supported by existing entitlement constraints |
| Sales Case RLS | Enabled on exact verified project; existing migration retained |
| Live anonymous API/resource denial and protected redirects | Passed |
| Support/recovery contact and instructions | Passed live Preview HTTP and browser checks at all four widths |
| Manual fulfilment, recovery and refund handoff | Owner-approved decisions documented; operational checklist complete |

Fixtures remain application/browser evidence, not proof of hosted Auth sessions. User acceptance is recorded separately from agent-observed evidence.

## Linux CI and browser results

[Successful run 37095334967](https://github.com/bolehejassolutions/bros-sell-web-os/actions/runs/37095334967), job 111123986789, application source `3eb2747cef49f74d653f8648320017678a673189`.

Workflow: .github/workflows/sales-case-p0.yml. Ubuntu 24.04, Node 24.19.0, locked npm 11.9.0, locked Playwright 1.63.0 / Chromium. npm ci leaves dependencies/lockfile unchanged. Normal Next 16.3.5 build ran its standard TypeScript workers and route generation with no bypass.

Lint: zero errors, four existing warnings. TypeScript passed. 12 deterministic/SQL-RLS tests and the HTTP/API grouped test passed. Both browser suites passed.

| Width | RM500 journey / responsive checks | Recovery contact / layout |
| --- | --- | --- |
| 360px | Passed | Passed |
| 390px | Passed | Passed |
| 430px | Passed | Passed |
| 1280px | Passed | Passed |

Coverage includes onboarding, case creation/selection, Situation Analyzer evidence, WHAT/WHY/NEXT and known/inferred/missing diagnosis, Follow-Up/objection/buyer shared state, action/outcome recording, recomputation, due/pending dashboard priority, refresh persistence and reciprocal fixture-account isolation. Visible navigation/controls/forms, document overflow, internal KPI scrolling, page errors and unexpected console/Next overlays passed.

Failure handling retains the draft during injected 503, retries successfully, receives an actual application API 409 after another writer, preserves/exports the conflicting draft and reloads the current version. Deliberately exercised 503/409 resource errors are distinguished from unexpected console errors. Original browser assertions remain intact.

[Artifact](https://github.com/bolehejassolutions/bros-sell-web-os/actions/runs/37095334967/artifacts/11264241167) includes screenshot evidence, coverage JSON, logs, conflict draft and dependency audit. Size 11790289 bytes; expires 2026-10-10T04:07:06Z; digest `sha256:7a7c33f8f1a8f13a217b9e43bc453d73c008ff1dc9e7c0ba21c77676b482c216`. Screenshot capture and automated DOM assertions are recorded; no separate human visual inspection is claimed.

## Live project / Preview / Production

Exact Supabase project: **BROS SELL Web OS**, `cyryoirzxpvummckegyh`, ACTIVE_HEALTHY. Canonical BROS_SELL_CORE is active. Entitlement constraints accept manual source and active status. The existing helper checks CORE/core first, retaining legacy WEB_OS/core compatibility.

Migration `20261002074235_sales_case_operating_loop` was already applied and was not reapplied. No database, customer entitlement or Auth configuration was changed.

Retained live policy evidence: 19 PostgreSQL-role/transaction-auth-claim assertions for owner CRUD, cross-owner/anonymous/non-entitled denial, revocation and stale revision; 3 Storage-role metadata checks. Probe data was rolled back previously. These were not rerun as new customer sessions.

[Validated Preview](https://bros-sell-web-ifpwy3nj9-bolehejassolutions-8492.vercel.app), deployment `dpl_4TLBGJ3FL7aKWGQCZY4KwyTs5Jdt`, READY on the validated source. Live HTTP checked 2026-10-03T04:06:19.010Z:
- /activate 200 with brossell@bolehejas.com and the approved mailto target, purchase-email guidance, optional HitPay reference, no-password/OTP/card instruction, 30-calendar-day refund-request window and separate HitPay/maintained-companion explanation.
- Anonymous Sales Case and Closing OS APIs return 401; /app and /app/resources redirect 307 to /login.
- Direct anonymous table/RPC/PDF access is denied.
- Published client configuration references only cyryoirzxpvummckegyh.supabase.co.

Main and Production remain at `56f89fbc2d19406efd7f1ef075646446787555cb`; existing Production deployment `dpl_9CSGHQH3CuHymXK19ga8LnYt9XrN`, alias brossell.bolehejas.com. Documentation follow-up Preview can be checked through the PR deployment; it preserves the validated app files.

## Approved manual fulfilment and recovery

Operational handoff: [manual-fulfilment-access-recovery.md](manual-fulfilment-access-recovery.md).

Owner decisions are authoritative:
1. Verify successful HitPay payment/reference and match purchase email to customer account email.
2. HitPay delivers the downloadable customer package separately. Web OS is the maintained online companion tied to that email; do not promise lifetime hosted access.
3. New manual grants use **BROS_SELL_CORE / core**, source manual, with the verified purchase reference. Preserve working legacy access.
4. Recovery/support uses **brossell@bolehejas.com**, from the purchase email; a HitPay order/receipt reference may be included. Never request passwords, OTPs or card information.
5. After each actual grant/recovery, verify /app and one protected resource and privately record the result.
6. Refund requests are allowed within **30 calendar days of purchase**, using the purchase email via brossell@bolehejas.com. A request is not an automatically approved refund.

The operator handoff contains fulfilment/recovery steps, canonical field mapping, duplicate-grant and identity-mismatch handling, customer messages and private execution-record requirements.

The handoff gate is closed using these approved decisions and accepted prior customer testing. No new paid transaction, automatic provisioning, mailbox send/receive test, customer grant/recovery or refund is claimed. Per-customer payment matching and post-grant checks remain required during normal manual operation.

## Known limitations and security

- **Manual operation:** no proven automatic payment-to-entitlement provisioning. This is explicitly allowed until automation is proven. No instant access/delivery SLA was invented.
- **Password hardening:** leaked-password protection remains disabled with password authentication active. The previously verified organization is Free; Supabase documents protection as Pro-and-above. No paid upgrade or Auth change was made. It is a recorded hardening limitation, not an automatic release blocker. https://supabase.com/docs/guides/auth/password-security .
- **Dependency finding:** current Linux audit retains critical GHSA-vcvr-r3jv-pc5j in pinned Next 16.3.5. The publisher scopes it to attacker-controlled SVG in Node next/og ImageResponse. No such API/generated-image route usage was found in this app; current-path non-applicability is an inference from that scope. The finding is retained, with no silent upgrade. https://github.com/vercel/next.js/security/advisories/GHSA-vcvr-r3jv-pc5j .

## Release decision and next action

**READY WITH KNOWN LIMITATION** for the PR #11 P0 release, based on successful CI/live anonymous/recovery evidence, user-accepted prior customer checks and the approved manual operating handoff.

No required Account A/B, isolation or signed-download retest remains open. No new unresolved fulfilment/refund business decision remains in this handoff.

PR stays Draft and unmerged. Main/Production, prices, HitPay commercial configuration and customer data are unchanged. No spending, real payment, ads, P1/P2 features or architecture redesign occurred.

Next action: obtain explicit authorization for the reviewed release transition, merge and Production deployment as applicable. Until then, preserve the branch Preview and manual handoff. After an authorized release, prioritize the first 10 paying customers organically and learn from their Sales Case/action/outcome usage.

Machine-readable evidence: docs/sales-case-ci-verification-evidence.json. The original publication/SQL evidence and original review ZIP remain retained.
