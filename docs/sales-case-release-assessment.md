# Sales Case operating loop - release assessment

Date: 2 October 2026. Release status: **NOT READY**.

The development branch implements the P0 operating loop. Production remains unchanged. A build is not proof of usable customer access, persistent data, successful payment provisioning or mobile usability.

## Verified starting state

| Evidence | Verified state |
| --- | --- |
| Repository | `bolehejassolutions/bros-sell-web-os`; inspected main `56f89fbc2d19406efd7f1ef075646446787555cb` |
| Vercel production | Project `prj_J1x1p6b3BnKzLr2boCRyvRwgSpsO`, deployment `dpl_9CSGHQH3CuHymXK19ga8LnYt9XrN`, READY on that same main commit |
| Tooling prerequisite | Open PR #10, `dcb9e5d45e7c10adfb509a22214b244952afdc72`; incorporated into this development branch, without merging either PR |
| Actual Supabase target | `cyryoirzxpvummckegyh`, identified in the repository; connected tools explicitly denied permission to inspect it |
| Other connected database | `iahbiwzmpckubjjmfvyk` is Commercial Intelligence, and was not substituted for the Web OS database |
| Existing access rule | Verified source checks `BROS_SELL_CORE/core`, then legacy `BROS_SELL_WEB_OS/core`, using `has_active_bros_sell_entitlement` |
| Customer package | Existing read-only audit records 18 matching manifest hashes, 104-page book, 13 XLSX tools, two guides and 12 visuals. Package files were not changed |
| Commercial evidence | Existing 2 October audit records stale RM99 Early Bird landing copy versus HitPay RM100 for 1-7 October; refund wording and payment-to-access completion remain unresolved evidence gaps |

These are source/deployment observations. Live database policies, actual signed-in customer storage downloads, staffed support and successful HitPay provisioning were not verified by this implementation task.

## Practical parity gaps

| Priority | Starting gap | Implemented or remaining action |
| --- | --- | --- |
| P0 | One unscoped localStorage case; no account persistence | Versioned, owner-scoped Sales Cases, authenticated API, additive SQL/RLS migration and optimistic revisions. Migration still needs authorized application to the correct database |
| P0 | Separate tool inputs disappear or contradict one another | Existing native tool state belongs to the selected case. Buyer/offer/value fields share facts. Lead State, Close Path decision and Follow-Up state read the same engine |
| P0 | Situation Analyzer promotes keyword guesses | Structured observations, six qualification dimensions and explicit evidence. Known, inferred, missing and recommended information are separate |
| P0 | Outputs end without an operating loop | Record actual action, record linked outcome, recompute next action, retain evidence snapshots and history, pause after repeated silence, respect No/Not Now |
| P0 | Dashboard is only manual KPIs | Prioritized actual cases, due dates, pending results, unresolved objections, incomplete qualification and stage counts. Training cases are excluded |
| P0 | No short standalone entry path | Four-step onboarding and labeled RM500 training case. Ten-stage guidance and native tools remain available without requiring the book |
| P0 | Non-entitled customer redirected to another purchase page | Account recovery explanation and login retry; optional `BROS_SUPPORT_EMAIL`. No invented support address or entitlement grant |
| P0 release | Real database, browser and customer journey evidence absent | Apply migration after inspection, validate two real account scopes, test browser/mobile, authorized customer download and fulfilment before production promotion |
| P1 | Legacy drafts cannot safely be attributed to an account | No automatic import from `bros_sell_current_case`; optional explicit reviewed import later |
| P1 | Long or growing case lists lack search/filter ergonomics | Account pagination exists; add search/filter only if actual first customers need it |
| P1 | Support/fulfilment and offer inconsistencies | Verify existing 1 October decisions, staffed recovery route and payment reconciliation before live release; no new public policy was created |
| P2 | Customer-result and implementation coaching depth | Existing native tools persist; improve prompts from customer feedback rather than add a second framework |
| Later | AI diagnosis, CRM, teams, webinars, membership, V2 domain | Excluded; first ten paying customers and the current operating loop take priority |

## Implementation behavior

1. Create a case only after the account API acknowledges it. Every case has a title, situation, evidence, buyer/offer context, qualification signals, tool inputs, decision/status, optional due date and history.
2. The deterministic engine uses recorded observations and confirmed dimensions. A price question is interaction; silence is not rejection; Yes is not a confirmed sale; qualification needs six notes. Manual stage selection needs a reason.
3. Tools share context and retain case input across navigation and refresh. Action/outcome records are manual records of what actually happened; no message or reminder is sent automatically.
4. Confirmed sales route to customer results before referral/repeat. Post-sale records retain the sale status. A new selling opportunity should be a new case.
5. Saves use an owner filter and revision match. A stale version returns 409. Failure/conflict retains the in-memory draft, shows a warning, allows retry/export and asks before discarding drafts on reload. A browser close can still lose unsaved drafts after its warning is overridden.
6. Entitlement and ownership are checked by both the application and RLS. No service-role key, anonymous table access, account reassignment or delete API was added.

## Test evidence and limits

| Check | Result |
| --- | --- |
| Deterministic cases and shared data | 11 Node tests passed: RM500 silence, text keywords, six signals, price objection, action/outcome order, fifth follow-up, explicit decisions, confirmed sale/post-sale, shared inputs, malformed data and priorities |
| SQL/RLS | Actual migration passed in local PGlite/Postgres: canonical and legacy owners, cross-owner read/write denial, owner reassignment and delete denial, entitlement revocation, non-entitled/anonymous denial, revision and stale-write behavior |
| HTTP routes | Next production-bundle fixture test passed: account create/list/update/refresh, cross-owner 404, stale 409, malformed 400, 401/403 gates, protected-download denial, authenticated Hub and account recovery |
| TypeScript | Standalone `tsc --noEmit` passed; rerun on the final branch before release |
| ESLint | Zero errors, four existing warnings: logo image, two login navigation warnings, unused import in legacy `server.ts` |
| Local build | Bundle compilation and static page generation completed with temporary local worker-thread configuration and separate TypeScript verification. Default integrated build was blocked by Windows child-process `EPERM`. The temporary type-skip configuration was removed, and production config retains TypeScript checking |
| Real browser/mobile | Blocked, not passed: agent-browser IPC and Edge processes were denied by the runtime. A Playwright scenario is committed for the RM500 journey, refresh, failed save/retry, conflict, account switch and 360/390/430/1280 widths; no screenshot or browser pass is claimed |
| Live Supabase | Not tested/applied: connected project permission denied |
| Real paid customer, email recovery, PDF storage and HitPay provisioning | Not tested; local fixture responses are not live service evidence |

## Release gate and rollback

Remain **NOT READY** until all P0 release evidence exists. Review and apply the additive migration only to the verified Web OS project, verify the existing RPC contract and grants first, and run the checks in the runbook. Promote the reviewed branch only after database and customer checks pass.

If a subsequent app release must be rolled back, restore the previous Vercel deployment and retain the new table/data. Do not drop customer cases as rollback. A release failure never implies changing customer price, refund policy or granting all authenticated users access.

## Action required

The GitHub connector rejected branch creation with “MCP tool call requires approval, but approval policy is never”. The development branch and proposed PR are local/offline; no published branch, PR or preview for these changes is claimed. `docs/sales-case-draft-pr.md` contains the reviewable PR description.

Restore authorized GitHub write capability and connect/authorize actual Web OS Supabase project `cyryoirzxpvummckegyh`. These enable publication, live schema/RLS inspection, the staged migration and real account/storage verification. No secret key needs to be pasted into chat.

Next best step: apply and verify this P0 branch in the existing stack, complete browser/customer checks, then use the first ten paying customers' case outcomes to decide P1 work.
