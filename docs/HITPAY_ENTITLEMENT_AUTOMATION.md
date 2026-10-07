# BROS SELL™ HitPay entitlement automation

Status: implementation proposal on a feature branch. No Production webhook, secret, offer mapping, pricing or database migration is changed by this document.

## Objective

Convert a verified HitPay payment into BROS SELL access without relying on a success-page redirect or manual database writes.

The implementation deliberately separates:

1. verified payment evidence
2. payment/order ledger
3. offer resolution
4. customer identity claim
5. entitlement grant

## Safety rules

- Never grant access from a CTA click, redirect URL or unverified request body.
- Require a valid HitPay HMAC signature.
- Require exact amount and currency match.
- For direct Online Store events, require exactly one configured provider product ID mapping.
- Keep unmatched but valid webhooks in the inbox for investigation; do not guess the product.
- Idempotency is enforced through webhook fingerprints, provider payment/reference uniqueness and existing entitlement purchase-reference uniqueness.
- A paid order without a matching Auth account remains paid but unclaimed. Signing in with the purchase email can claim it.
- Refund events are recorded but do not automatically revoke existing access in this release. Refund-to-revocation remains a separate release decision and test.
- No commercial offer is seeded by the migration. Pricing remains independent from code deployment.

## Runtime endpoint

`POST /api/webhooks/hitpay`

Server-only environment variables:

- `HITPAY_WEBHOOK_SALT` (or legacy `HITPAY_SALT`)
- `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY`

The route accepts the current registered-webhook raw-body signature style and the earlier payload-`hmac` format used by the existing BROS CONTENT OS implementation. Both require the merchant salt.

## Database objects

- `bros_sell_offers`: explicit commercial offer → product/access mapping.
- `bros_sell_payment_orders`: authoritative payment ledger.
- `hitpay_webhook_inbox`: verified event inbox and resolution evidence.
- `process_bros_sell_hitpay_event(...)`: service-role-only idempotent processor.
- `claim_bros_sell_paid_orders()`: authenticated purchase-email claim path.

Existing `entitlements`, `entitlement_events` and `has_active_bros_sell_entitlement` remain authoritative for access.

## Production release gates

Before registering the Production HitPay endpoint:

1. Apply the reviewed migration to the verified BROS SELL Supabase project.
2. Configure the server-only Supabase admin secret and HitPay webhook salt.
3. Inspect the exact BROS SELL HitPay product/order payload in the authenticated merchant account.
4. Create one exact active `bros_sell_offers` mapping using the real provider product ID, expected MYR amount and current approved offer.
5. Register `https://brossell.bolehejas.com/api/webhooks/hitpay` for the supported payment-completion event.
6. Run a controlled sandbox or approved low-risk transaction test.
7. Verify one valid payment produces one payment order and at most one entitlement.
8. Replay the same webhook and verify no duplicate entitlement/event grant.
9. Verify wrong amount/currency/product mapping does not grant access.
10. Verify a buyer who purchases before account creation receives access only after signing in with the purchase email.

Do not switch the public checkout or pricing merely to deploy this backend.
