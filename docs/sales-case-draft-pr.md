# Draft PR: Make Sales Case the shared BROS SELL operating loop

Target: `bolehejassolutions/bros-sell-web-os`, base `main`, head `feat/sales-case-operating-loop`.
Status: offline draft, not opened on GitHub. The connector rejected branch creation with “MCP tool call requires approval, but approval policy is never”. No remote branch, PR or preview for this change is claimed.

## Proposed description

A seller returning to a RM500 conversation currently has an unscoped browser case and separate tools that lose their inputs. This change gives the seller an account-owned Sales Case that carries buyer/offer/value context through the existing tools, records actual actions and linked outcomes, and recomputes a deterministic next action. Silence remains an observation; qualification needs explicit evidence in six dimensions; Yes remains distinct from a confirmed sale.

The Analyzer becomes the entry point with known/inferred/missing information and a labeled training case. The operating dashboard prioritizes due cases, pending results, objections and incomplete qualification while excluding training cases. API and SQL/RLS enforce ownership plus the existing canonical/legacy entitlement rule; revisions reject stale overwrites and the UI retains drafts on save failures/conflicts. Confirmed sales lead to customer-result records before referral/repeat. Account recovery has a login path and an optional configured support contact.

Includes the reproducible-tooling prerequisite from open PR #10, plus an additive `bros_sell_sales_cases` migration. Review that prerequisite with this PR. Pricing, entitlement product codes and customer fulfilment policy are not changed.

### Validation

- 12 deterministic/shared-data and actual SQL/RLS tests pass locally.
- Production-bundle HTTP fixture passes create/save/reload, ownership, 409 conflicts, 400 validation, 401/403 gates and protected-download denial.
- Standalone TypeScript check passes; ESLint has zero errors and four existing warnings.
- Bundle generation completed with a temporary restricted-runtime workaround and separate typecheck. The workaround was removed from production config. Default integrated builds and browser IPC were restricted by the local Windows runtime.
- A real browser scenario and verification runbook are included; browser/mobile checks are blocked, not passed.

### Release gate

**NOT READY.** The connector cannot inspect actual Supabase project `cyryoirzxpvummckegyh`, so the migration is staged, not applied. Verify live RLS/accounts, browser/mobile, customer PDF access, email recovery and existing HitPay provisioning before promoting. No production merge or deployment is included.

See `docs/sales-case-release-assessment.md` for P0/P1/P2/Later gaps and `docs/sales-case-test-runbook.md` for concrete verification and rollback guidance. Roll back the app if needed; retain customer case data.
