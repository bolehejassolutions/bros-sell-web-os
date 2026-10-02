# Sales Case verification runbook

Requires Node >=22.9, npm 11.9.0. All fixture accounts use `example.test`. Fixtures bind loopback and never contact the real Supabase project.

## Repeatable checks

```sh
npm ci
npm run typecheck
npm run lint
npm test
npm run build
```

Default builds must retain Next's TypeScript verification. In the restricted Windows runtime used for this task, child-process creation was denied. The bundle was separately built using a temporary worker-thread configuration, with independent `tsc` checking; that local workaround is not committed as a production type-check bypass.

## Route and browser fixtures

In separate terminals:

```sh
node --experimental-strip-types tests/fixtures/supabase-server.ts
node tests/fixtures/app-server.mjs
```

Then:

```sh
npm run test:api
npx playwright install chromium
npm run test:browser
```

`BROS_FIXTURE_PRODUCTION=1` selects a previously compiled production bundle in the fixture app server. Build that fixture bundle with `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54329` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=local-fixture-publishable-key`; those are local test values, not deployment settings. `BROS_TEST_CDP` optionally connects Playwright to an isolated existing test browser. Browser screenshots go to ignored `test-results/`.

Tests cover real application routes and actual migration SQL, behind a minimal local auth/PostgREST fixture. This does not test Supabase's hosted authentication, email, PostgREST deployment or storage service. Do not use fixture tokens or accounts against production.

## Live gate after project access is restored

1. Confirm `cyryoirzxpvummckegyh`, its current schema/migration history, existing `has_active_bros_sell_entitlement` RPC signature, RLS and canonical/legacy account examples. Check that Vercel preview variables target the intended project. Do not substitute Commercial Intelligence.
2. Review and apply `supabase/migrations/20261002055316_sales_case_operating_loop.sql`. It creates one table, indexes, revision trigger and owner/entitlement policies. Inspect grants and policies after applying.
3. With authorized existing customer accounts, verify create/save/reload, second-tab conflict, non-entitled denial, account-switch isolation and direct table RLS. Never grant access solely because someone logged in.
4. Run the real browser journey on desktop and mobile: create the RM500 sample, inspect known/inferred/missing, use Follow-Up, record action and outcome, inspect revised diagnosis, use objection/buyer/value tools, defer or close appropriately, and inspect operations.
5. Verify failed saves visibly retain drafts, retry/export work, fifth follow-up can record its outcome before pausing, explicit No stops, agreed Not Now pauses, and confirmed sales keep their status during customer-result records.
6. Verify the current authorized customer can fetch the protected Closing OS PDF. Check existing email login/recovery and HitPay-to-entitlement/fulfilment records. A generic HTTP 200, a Vercel READY build or a test fixture is insufficient.
7. Inspect final preview build checks. Record READY / READY WITH KNOWN LIMITATION / NOT READY with actual evidence. Promote only after P0 checks pass and the reviewed release is authorized.

Keep pricing, deadline, refunds and fulfilment policy consistent with the existing approved decisions. Unresolved commercial evidence remains a gate for a customer-facing production release, rather than a reason to invent policy during development.
