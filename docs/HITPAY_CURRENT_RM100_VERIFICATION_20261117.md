# HitPay current MYR100 order — read-only evidence checkpoint (17 Nov 2026 MYT)

## Observed from connected provider records
- HitPay online-store order **#1008** created 2026-11-17 14:41 MYT: MYR100, paid/completed, fulfilment marked completed.
- The matching day's successful charge list contains one MYR100 charge. The unique provider charge and order UUIDs are intentionally excluded from this document.
- HitPay's daily aggregate Top Products reports **one** BROS SELL item sold on 17 Nov, with catalogue product ID `a2cfb307-366d-4ebc-9ff4-68b6c718e7d6` and reported variation ID `a2cfb307-df19-4a44-91ea-1a5ac1b64dc1`.
- The variation ID also appeared in historical order #1007's authenticated merchant webhook request, but the aggregate alone does **not** prove that #1008's individual signed charge included that exact `order.line_items[].related_id`.
- Supabase Production BROS SELL `cyryoirzxpvummckegyh`: one active entitlement, last entitlement created 24 Sep 2026; zero entitlement events on 17 Nov; the proposed `bros_sell_offers`, `bros_sell_payment_orders`, and `hitpay_webhook_inbox` objects remain absent.
- The Vercel Hobby runtime log query for the #1008 delivery window was rejected due to expired log retention; this is **unknown**, not evidence that no webhook arrived.
- The available HitPay connector lists orders and charges but not the original signed webhook body/header or a per-order original product-line event. Browser session access was unavailable in this chat context.

## Implementation in isolated integration branch

The existing charge verifier now supports optional `current_rm100` analysis while preserving its historical #1007 profile:
- `./scripts/Read-HitPayCharge.ps1 -CurrentRm100` uses hidden prompts for the existing business API credential and private charge/order UUIDs; it performs one read-only official Charge API GET and retains response DPAPI-encrypted on Windows.
- Analyzer checks expected charge and order identities, succeeded status, MYR100, currency, expected merchant, valid/consistent purchaser email, and **actual nested product line ID**. Missing fields fail closed. It never exposes customer identity or provider UUIDs in its report.
- The analyzer does not assert HTTP authentication without the wrapper, recover a webhook signature, issue a grant, or enable customer onboarding. A complete report does not lift the production release gate.
- Current-order fixture tests check correct and adverse cases; historical tests remain required. Test/CI outcomes must be independently read back before claiming pass.

## Still required for actual release
1. Retrieve current order's authentic charge/request evidence with correct private provider fields, ideally the original signed webhook through authorized merchant records; never reconstruct a signature from a simulated payload.
2. Confirm merchant and exact per-order provider line ID before seeding one approved MYR100 offer. Daily aggregates alone are not adequate.
3. Use an isolated non-production database and pass actual provider-to-webhook/replay, confirmed-purchase-email, tenant/RLS and hosted access tests.
4. Obtain specific scoped approval for Production database migrations, secret/role installation, granting webhook activation, and final release. Preserve manual fulfilment throughout.
5. Keep optional SMTP/onboarding off until separately accepted. Never charge again to obtain a test.

This record describes developer evidence, not a new commercial or pricing decision. The Primary Drive commercial source governs any pricing changes.

## 20 November 2026 DEV acceptance

The authenticated merchant readback still shows order #1008 completed and its matching RM100 charge succeeded. The returned fields omit the individual product line and original webhook signature. Continue the approved purchase-email manual fulfilment procedure.

The integration branch combines main `cbd3b12`, payment draft #12 `81568f3` and evidence draft #23 `7d27f5e`. The production-bundle test `node --experimental-strip-types --test tests/paid-access-api.test.ts` passes against the loopback SQL fixture with `BROS_FIXTURE_PAYMENT=1`. It sends a locally signed charge, reads back a single paid order and entitlement through the buyer's database role, verifies another account sees no orders, then follows the buyer's first library visit to a signed book redirect. Repeated delivery, conflicting order, merchant and buyer fields, missing nested product line and expired sign-in recovery are covered. A real hosted account, original HitPay event, production book bytes and outbound delivery each need their own evidence.

Rollback before release is to retain the current production deployment and manual fulfilment path. Discarding this DEV branch needs no database rollback. Hosted payment fixtures require a separately isolated non-production database.
