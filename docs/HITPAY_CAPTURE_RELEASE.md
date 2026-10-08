# BROS SELL non-granting HitPay capture release

Status: **RELEASED / CAPTURE READY — 7 October 2026.**

The capture-only receiver is deployed to Production. The separate HitPay webhook is saved, subscribes only to `charge.created`, and its per-endpoint salt plus the expected merchant business ID are configured as Production server-only secrets. No authentic buyer event has yet been used to enable automatic entitlement provisioning.

## Current boundary

This release contains only the non-granting capture route and shared pure normalizer. It excludes PR #12's grant endpoint, entitlement claim changes, SQL migration, admin client and commercial offer mapping.

Canonical merchant receiver:

`https://bros-sell-web-os.vercel.app/api/webhooks/hitpay/capture`

HitPay rejected the custom hostname during endpoint setup and accepted the canonical Vercel Production URL above. Do not disable project-wide deployment protection or add a Vercel bypass secret to the merchant webhook URL.

## Current HitPay configuration

| Field | Current value |
| --- | --- |
| Merchant | BOLEHEJAS SOLUTIONS |
| Expected business ID | `a089a95e-7d0e-4f1b-8d85-425f3c82f460` |
| Endpoint name | `BROS SELL - Non-granting Capture` |
| URL | `https://bros-sell-web-os.vercel.app/api/webhooks/hitpay/capture` |
| Events | `charge.created` only |
| Signature | `Hitpay-Signature`: HMAC-SHA256 of the raw JSON using this endpoint's salt |
| Event headers | `Hitpay-Event-Object: charge`; `Hitpay-Event-Type: created` |
| BROS SELL product ID to inspect | `a2cfb307-366d-4ebc-9ff4-68b6c718e7d6` |

Preserve `BROS CONTENT OS - Payment Webhook` and all its subscriptions. The capture endpoint may receive `charge.created` events for other merchant products; product identity must be inspected before any event is treated as BROS SELL evidence.

## Server-only configuration

- `HITPAY_BUSINESS_ID`: configured for the expected merchant business ID.
- `HITPAY_CAPTURE_WEBHOOK_SALT`: configured in the Vercel Production secret store. Do not expose it in chat, source, PR notes, screenshots or logs.
- The Developers-page API salt is a different value and must not be substituted.
- No service-role/admin secret, grant-capable webhook salt, SQL migration or commercial offer mapping is required for capture-only operation.

The receiver fails closed:
- missing configuration → 503
- invalid signature → 401
- signed wrong merchant → 403
- malformed JSON → 400
- non-JSON request → 415
- unrelated event type → accepted and ignored

## Completed verification

1. Capture-only PR released to Production; seller smoke tests passed.
2. Dedicated HitPay endpoint created; existing BROS CONTENT webhook left unchanged.
3. Per-endpoint salt and expected business ID configured in Production without exposing the salt.
4. Same reviewed Production code redeployed after secret setup.
5. Unsigned JSON returns 401 rather than 503.
6. Malformed JSON returns 400.
7. Non-JSON returns 415.
8. Unrelated event types are ignored.
9. Production Supabase has no capture-payment-order or webhook-inbox tables from PR #12, and capture tests do not alter customer entitlements.

## Remaining evidence gate

Wait for the first authentic buyer purchase, unless a controlled purchase is separately authorized later.

When the authentic event arrives:

1. fulfil the customer's access through the approved manual path so the customer is not dependent on an unproven automation;
2. inspect private `BROS_SELL_HITPAY_CAPTURE` evidence and HitPay delivery success;
3. verify merchant, provider payment identity, order/reference identity, buyer identity, BROS SELL product identity, succeeded status, amount and currency;
4. never publish the raw customer payload or plaintext buyer email;
5. add a redacted authentic regression fixture;
6. only then resume PR #12's migration, exact offer mapping and automatic-entitlement release decision.

Synthetic fixtures prove receiver behavior, not authentic merchant mapping.

## Rollback

If capture delivery or privacy checks fail, disable only the new BROS SELL capture endpoint. If the application itself regresses, roll back the application deployment only. Do not change customer data or the existing BROS CONTENT webhook.

Official webhook contract: https://docs.hitpayapp.com/apis/guide/events
