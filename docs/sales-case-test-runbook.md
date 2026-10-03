# Sales Case verification and release runbook

Updated 3 October 2026. Account A/B, customer isolation and signed-download checks are accepted by the user as previously tested. Do not request their repetition as a release gate.

## Automated verification

PR #11 uses .github/workflows/sales-case-p0.yml on Ubuntu 24.04 with Node 24.19.0, locked npm 11.9.0 and locked Playwright 1.63.0. CI runs npm ci, lint, TypeScript, deterministic/migration SQL-RLS tests, normal production build, HTTP/API and both browser suites.

The build retains Next TypeScript checks. Use CI rather than the Windows browser runtime that failed with spawn EPERM. Do not retry local browser installation or use a type-check bypass.

Production-bundle route/browser checks use loopback fixture services and synthetic sessions. They do not establish hosted Supabase Auth evidence. Fixtures never contact the live project. Browser screenshots, logs and audit evidence are retained in the GitHub artifact for seven days.

The original browser assertions remain. Supplementary coverage checks real application fixture responses, user-created RM500 cases, reciprocal fixture isolation, all four viewport layouts and recovery contact. The stale-writer check asserts actual HTTP 409; injected save failure is 503 and preserves the draft.

## Live project safeguards

Exact project: cyryoirzxpvummckegyh, BROS SELL Web OS. Migration 20261002074235_sales_case_operating_loop is already applied; **do not reapply it**. Keep RLS, grants, entitlement RPC, dependencies and customer data intact.

Read-only project/contract and live anonymous/Preview recovery checks are recorded in docs/sales-case-release-assessment.md and docs/sales-case-ci-verification-evidence.json. Prior 19 SQL-role/claim and 3 Storage-role checks remain separate from real customer-session evidence.

## Accepted customer evidence

The owner explicitly accepts previous real Account A/B, customer isolation and signed-download testing. This is recorded as user-confirmed prior testing, not a new agent-observed Auth session. No repeated login, password, OTP, session-token or card-information request is required.

Per-customer /app and one protected-resource verification after an actual grant/recovery remains an operational step for new purchases/recovery, not a request to reopen these completed release tests.

## Manual fulfilment and recovery

Follow docs/manual-fulfilment-access-recovery.md:
- Verify successful HitPay payment/reference and match purchase email to the account.
- New grants use BROS_SELL_CORE / core, source manual, through existing secure admin access.
- HitPay sends the downloadable package separately. Web OS is the maintained online companion; do not promise lifetime hosted access.
- Recovery/support and 30-calendar-day refund requests use brossell@bolehejas.com from the purchase email; optional HitPay reference; never passwords, OTPs or card information.
- Record real per-customer actions and post-grant /app/resource checks privately. Do not publish customer evidence or privileged keys in GitHub.

Do not perform a new payment, automatic provisioning simulation, refund or entitlement change merely to manufacture release evidence.

## Release transition

Read the current assessment. READY WITH KNOWN LIMITATION records accepted customer checks, passing application/live checks and permitted manual fulfilment; it is not authorization to merge or deploy Production.

Keep PR #11 Draft and unmerged until separately instructed. A merge, Ready-for-Review transition or Production deployment is a separate action. Preserve pricing, HitPay commercial configuration and the approved refund-request decisions.

If an eventual authorized application release needs rollback, restore the previous app deployment and preserve Sales Case data. No migration rollback or destructive customer-data operation is part of this handoff.
