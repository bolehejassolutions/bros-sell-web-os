# BROS SELL™ HitPay entitlement automation

Status: BLOCKED at Production release gate. Implementation remains on a feature branch; no Production webhook, secret, offer mapping, pricing or database migration is changed by this document.

## Verified merchant evidence — 7 October 2026

- Merchant: BOLEHEJAS SOLUTIONS.
- HitPay business ID: `a089a95e-7d0e-4f1b-8d85-425f3c82f460`.
- Exact product: BROS SELL™ — Closing OS.
- HitPay product ID: `a2cfb307-366d-4ebc-9ff4-68b6c718e7d6`.
- Current catalogue selling price observed: MYR100.
- Existing webhook: `BROS CONTENT OS - Payment Webhook`, subscribed only to `payment_request.completed` and `payment_request.failed`. It is out of scope and must remain unchanged.
- HitPay Support confirmed on 7 October 2026 that `charge.created` was not sent for historical order #1006 because no endpoint was subscribed to that event at the time.
- HitPay Support also confirmed historical webhook events/bodies cannot be replayed or retrieved from their side.
- No authentic BROS SELL `charge.created` event has therefore been observed yet.

## Objective

Convert a verified HitPay payment into BROS SELL access without relying on a success-page redirect or manual database writes.

The implementation separates:

1. verified payment evidence
2. payment/order ledger
3. offer resolution
4. customer identity claim
5. entitlement grant

## Chosen webhook contract for the first release

Use HitPay's registered **event webhook** mechanism, not the older payment-request callback format.

Initial subscription: **`charge.created` only**.

Rationale: HitPay documents `charge.created` as occurring once a payment is successfully completed, and the documented charge object includes customer identity plus a nested order containing `line_items`. Keeping the first release to one event avoids cross-event duplicate-grant ambiguity.

The endpoint requires:

- `Hitpay-Signature`: HMAC-SHA256 of the raw JSON body using the **per-webhook endpoint salt**.
- `Hitpay-Event-Object: charge`.
- `Hitpay-Event-Type: created`.
- merchant `business_id` matching the configured Production business ID.
- charge status accepted by the payment processor.
- buyer email from `customer.email` or nested `order.customer.email`.
- product identity from `order.line_items[]` where `item_type=product`, using `related_id`.
- exact amount and currency match against one active BROS offer mapping.

The Developers-page API-key salt must not be used as the registered event endpoint salt.

## Safety rules

- Never grant access from a CTA click, redirect URL or unverified request body.
- Never accept an unsigned event.
- Reject merchant-ID mismatch.
- Require exact amount and currency match.
- Require exactly one configured provider product ID mapping.
- Keep unmatched but valid webhooks in the inbox for investigation; do not guess the product.
- Idempotency is enforced through webhook fingerprints, provider payment/reference uniqueness and existing entitlement purchase-reference uniqueness.
- A paid order without a matching Auth account remains paid but unclaimed. Signing in with the purchase email can claim it.
- Refund automation is not part of this release.
- No commercial offer is seeded by the migration. Pricing remains independent from code deployment.

## Runtime endpoint

`POST /api/webhooks/hitpay`

Server-only environment variables:

- `HITPAY_WEBHOOK_SALT` — the salt generated for this registered endpoint.
- `HITPAY_BUSINESS_ID` — expected merchant business ID.
- `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY`.

## Database objects

- `bros_sell_offers`: explicit commercial offer → product/access mapping.
- `bros_sell_payment_orders`: authoritative payment ledger.
- `hitpay_webhook_inbox`: verified event inbox and resolution evidence.
- `process_bros_sell_hitpay_event(...)`: service-role-only idempotent processor.
- `claim_bros_sell_paid_orders()`: authenticated purchase-email claim path.

Existing `entitlements`, `entitlement_events` and `has_active_bros_sell_entitlement` remain authoritative for access.

## Current compatibility status

The earlier PR baseline did not map HitPay's documented store event fields `customer.email` and `line_items[].related_id`. The branch now includes regression coverage for the documented `charge.created` shape and deliberately removes the legacy payload-HMAC fallback from the SELL endpoint.

This improves documented compatibility but **does not replace an authentic Production merchant event test**.

## Non-granting capture phase

A dedicated `POST /api/webhooks/hitpay/capture` endpoint exists solely to obtain authentic event evidence before entitlement automation is enabled.

It:
- validates `charge.created` headers and the per-endpoint HMAC,
- verifies the configured merchant business ID,
- performs the same documented payload normalization,
- writes **no** Supabase payment or entitlement data,
- logs a private evidence summary with event fingerprint, normalized payment/order fields, product IDs, hashed buyer email and payload key/type shape,
- never logs the raw webhook body or plaintext buyer email.

Use a separate HitPay endpoint named for BROS SELL capture and subscribe only to `charge.created`. Do not add this event to the existing BROS CONTENT OS endpoint.

The capture endpoint uses `HITPAY_CAPTURE_WEBHOOK_SALT`; the eventual grant endpoint uses `HITPAY_WEBHOOK_SALT`.

## Production release gates

Before enabling automatic grants:

1. Register the dedicated non-granting BROS SELL capture endpoint for `charge.created`.
2. Verify routing/signature handling with HitPay CLI if useful; classify CLI output as simulated evidence only.
3. Obtain one authentic BROS SELL `charge.created` via a controlled new transaction.
2. Verify the real payload contains deterministic buyer identity, product `related_id`, charge/order identity, amount, currency and merchant ID.
3. Review the final normalizer against that authentic event and add a redacted regression fixture.
4. Compare the authentic private evidence against the normalizer and add a redacted regression fixture.
5. Apply the reviewed migration to `cyryoirzxpvummckegyh`.
6. Configure server-only Supabase admin secret, `HITPAY_WEBHOOK_SALT` and `HITPAY_BUSINESS_ID`.
7. Insert exactly one active offer mapping for product `a2cfb307-366d-4ebc-9ff4-68b6c718e7d6` at the then-approved current amount.
8. Switch/register the grant-capable `/api/webhooks/hitpay` endpoint only after the authentic event maps deterministically.
9. Run controlled end-to-end verification: valid payment evidence, retry idempotency, wrong product, wrong amount/currency, mixed-product cart and purchase-before-account claim.
10. Verify one valid payment creates one payment order and at most one entitlement.
11. Only then consider merge/deploy readiness.

Do not change the public checkout or pricing merely to release the backend.
