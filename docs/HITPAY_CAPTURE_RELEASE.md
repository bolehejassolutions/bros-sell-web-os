# BROS SELL non-granting HitPay capture release

Status: PREPARED FOR REVIEW. No Production deployment, webhook registration, secrets or transaction has been performed by this preparation.

## Exact proposed change

Deploy only the capture route and shared pure normalizer on top of released UX main `f7f61f9db895b6b06124123f1ca0f254469bcfca`. This branch excludes PR #12's grant endpoint, entitlement claim changes, SQL migration, admin client and offer mapping. No dependency versions change.

Proposed receiver: `https://brossell.bolehejas.com/api/webhooks/hitpay/capture`.

Use the custom Production domain because the existing Vercel project enables deployment protection on non-custom domains. Do not disable project-wide protection or put a Vercel bypass secret in the HitPay URL. Verify an external unsigned POST reaches the receiver and returns 401 after configuration, before registering a payment test.

## Proposed HitPay configuration

| Field | Exact proposed value |
| --- | --- |
| Merchant | BOLEHEJAS SOLUTIONS |
| Expected business ID | `a089a95e-7d0e-4f1b-8d85-425f3c82f460` |
| Endpoint name | `BROS SELL - Non-granting Capture` |
| URL | `https://brossell.bolehejas.com/api/webhooks/hitpay/capture` |
| Events | `charge.created` only |
| Signature | `Hitpay-Signature`: HMAC-SHA256 of raw JSON using this endpoint's salt |
| Event headers | `Hitpay-Event-Object: charge`; `Hitpay-Event-Type: created` |
| Product to inspect in authentic event | `a2cfb307-366d-4ebc-9ff4-68b6c718e7d6` |

Business/product identity comes from PR #12's dated merchant evidence; recheck in the authenticated merchant dashboard before saving. Preserve `BROS CONTENT OS - Payment Webhook` and all its subscriptions. Capture can receive the merchant's other charge events too: inspect the product IDs to identify BROS SELL evidence. It never grants or resolves an offer.

## Server-only configuration

- `HITPAY_BUSINESS_ID`: exact expected business ID above.
- `HITPAY_CAPTURE_WEBHOOK_SALT`: salt generated for the new capture endpoint, entered directly into the project's Production secret store by the owner. Do not paste it into chat, source, PR notes, screenshots or logs. The Developers-page API salt is a different value and must not be used.
- No service-role/admin secret, `HITPAY_WEBHOOK_SALT`, SQL migration or commercial offer mapping is needed for capture.

Missing capture configuration returns 503. Signed wrong-merchant events return 403, invalid signatures return 401, malformed bodies return 400 and non-JSON requests return 415. Other event types are ignored without logging payment evidence.

## Execution after scoped approval

1. Recheck capture-only PR head, CI and diff; release it using the repository's normal convention. Confirm Production deploy READY and seller smoke tests. PR #12 stays draft.
2. In authenticated HitPay, stage the separate endpoint above and obtain its generated per-endpoint salt. Configure that salt in Vercel's server-only Production secret store and set the business ID. No secret is handled in conversation.
3. Deploy the same reviewed capture-only main with those values, verify unsigned HTTP 401 and signed synthetic tests. Classify synthetic evidence separately from merchant payment proof.
4. Activate only the new endpoint's `charge.created` subscription. Verify its URL, enabled state and event selection; leave the existing endpoint intact.
5. Obtain a separately authorized controlled new purchase, using the then-approved price and purchase-email identity. No price reduction, payment or refund is authorized by this runbook.
6. Inspect private Vercel `BROS_SELL_HITPAY_CAPTURE` evidence and HitPay delivery success. Verify product ID, payment/order IDs, succeeded status, amount/currency and hashed buyer identity. Never publish raw customer payloads or plaintext buyer email.
7. Add a redacted regression fixture. Only then resume PR #12's separate Production automation decision.

The salt is created by HitPay during endpoint setup, so the endpoint may initially return 503 until its secret is configured and the reviewed deployment is rebuilt. Do not initiate the controlled transaction during that window.

## What capture proves

The code verifies signatures and merchant identity, then logs normalized fields, a retry fingerprint, buyer-email hash and key/type structure. It writes no database data. Missing field mappings are recorded rather than treated as successful purchase proof. Private logs have provider retention limits; inspect promptly and retain a redacted evidence record. This is not a raw payload archive or proof that any entitlement was granted.

## Rollback

Disable only the new capture endpoint if delivery or privacy checks fail. Roll back the application deployment to the preceding UX release if there is a material app regression. Do not change customer data or schema. Remove the capture-only environment values only as a separately reviewed cleanup action.

## Evidence boundary

Current CI uses loopback fixtures and synthetic salts. Preview build readiness is not authentic HitPay delivery. Production application, merchant configuration and payment actions require scoped approval after this exact change is reviewable.

Official webhook contract: https://docs.hitpayapp.com/apis/guide/events
