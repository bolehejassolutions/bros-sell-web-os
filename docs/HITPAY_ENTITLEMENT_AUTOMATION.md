# BROS SELL™ HitPay entitlement automation

## CURRENT price decision — 9 October 2026 (MYT)

The owner explicitly approved **MYR100 (RM100), one-time**, as the current BROS SELL price in this conversation. This supersedes the earlier RM50 commercial release instructions below and agrees with the public HitPay product inspected at 16:59 MYT on 9 October. The catalogue/editor identifies `a2cfb307-366d-4ebc-9ff4-68b6c718e7d6`; the later inspected #1007 webhook line identifies `a2cfb307-df19-4a44-91ea-1a5ac1b64dc1`. A future reviewed mapping must use the current checkout's verified `line_items[].related_id`, `amount_myr=100` and `currency='MYR'`. Do not seed the catalogue/editor ID as the provider line ID. Current RM100 line-identity confirmation remains required.

The migration does not seed an offer; runtime matching reads the configured offer table. This decision updates release guidance, not Production data or checkout. Preserve historical Order #1007's MYR50 payment and existing customer rights; do not rewrite or reprice that purchase. Payment/event, SMTP and E2E gates remain closed until separately verified.

## Later merchant UI recovery — 9 October 2026 (MYT)

Normal Payments → Transactions navigation recovered #1007's stored webhook Request and Response. `HITPAY_MERCHANT_EVIDENCE.md` records the privacy-safe evidence and exact product-line/catalogue-ID distinction. The Request's actual related_id is `a2cfb307-df19-4a44-91ea-1a5ac1b64dc1`. The stored `received=true`, `captureOnly=true`, seven-field-mapped response is consistent with the deployed signature-accepted/merchant-matched path; this is endpoint-acceptance evidence, with the original signature/raw bytes still unavailable for offline revalidation. Developers → Webhook Endpoints separately shows the existing BROS SELL non-granting capture subscribed only to `charge.created`, alongside the unchanged CONTENT OS subscription.

Earlier statements below about an unavailable authentic body reflect the earlier inspections. The formatted merchant Request is now observed, but no authenticated Charge API response or current RM100 checkout provider-line confirmation has been obtained. No debugger or indirect API access was used. No migrations, offer seed, grant, customer email or release was applied. Hosted access and independent onboarding gates remain closed.

## HitPay Support follow-up — 9 October 2026, 12:03 MYT

Support confirms the inspected CLI trigger is a static fixture without Hitpay-Signature. There is no published CLI version that emits a genuinely signed, merchant-shaped event for the existing Order #1007 without a real payment.

For the existing payment, Support recommends authenticated GET https://api.hit-pay.com/v1/charges/{charge_id}, with X-BUSINESS-API-KEY, or the official CLI charge get command. This is a read-only verification method, not a replay and not an entitlement grant. Use the actual charge reference from the private Support thread; never commit it or an API key.

| Evidence | Current result |
| --- | --- |
| Live charge status, amount, currency and customer | Supported by the Charge API; actual authenticated response has not been retrieved |
| Exact order and product related_id / line items | Support refers to the original delivered webhook; not recovered or verified |
| Raw-body webhook HMAC and normalization for #1007 | Not verified; original capture logs expired |
| CLI-generated event | Synthetic and unsigned; insufficient for the merchant gate |

The published Charge API schema exposes charge/customer fields and references such as target_id, target_type and order_reference_number. Its example includes webhook_logs, but does not establish that a historical event body, signature, or product line_items can be recovered. Inspect the actual authorized response before deciding whether an order/product lookup is possible; do not infer product identity from amount, remark, or the charge ID.

A subsequent read-only check still found no buyer Auth account, one existing entitlement, no payment migration and no new granting/admin/API credentials in Vercel. No new successful-order email was found in that check. The merchant dashboard was accessible in a fresh browser tab, but raw API network inspection was denied by browser permission review. No alternate debugging or hidden API access was used.

The official hosted HitPay MCP server offers OAuth-based business data access, but no HitPay plugin was returned by the available directory search. HitPay's current documentation says web-based MCP clients other than claude.ai are not allowlisted. Do not assume that adding its URL to this ChatGPT session supplies a usable authenticated connection.

Next authorized evidence operation: read the existing charge through an approved API client or an explicitly permitted merchant debugging session, keep the response private, and assess all missing order/product/merchant/signature evidence. This operation alone does not approve Production release. A future genuine organic purchase can also supply a new signed capture; do not create a funded transaction without explicit approval.

References: https://docs.hitpayapp.com/apis/charges/get-charge-detail ; https://docs.hitpayapp.com/apis/guide/events ; https://docs.hitpayapp.com/apis/guide/mcp-server

## Latest inspection — 9 October 2026 (MYT)

The original baseline head `139a9423a7de47bc3e057084151edc58f0583903` passed CI #52 / run `37876724483`. Its Vercel Preview was READY. Production remains on `ee99f22a2ad7ecb0bf02cace47cf58a21dd3ea29`; the feature branch was 32 commits ahead / 0 behind before this continuation.

Read-only Production inspection confirmed: foundation/RLS/sales-case migrations only; no payment ledger, offer table, webhook inbox or automation RPC; one existing entitlement; no Auth account matching Order #1007's buyer. Production env names include capture salt and merchant ID but no granting salt, Supabase admin key or onboarding sender/worker credentials. No secret values were retrieved.

HitPay Support's reply at 10:57 MYT confirms `charge.created` for Order #1007 reached the capture endpoint around 07:53 MYT and returned HTTP 200. The authenticated merchant UI shows Order #1007 Paid / Completed–Delivered, BROS SELL x1, MYR50. No per-delivery metadata page is available according to Support. Vercel rejected retrieval of the original window because Hobby retains one hour of runtime logs; a current-window search returned no matching logs. These facts do not prove the original event's normalized body or exact HMAC verification path.

### CLI alternative investigated, not accepted as merchant proof

Support suggested `hitpay listen` / `hitpay trigger charge.created`. Documentation describes simulated events. The official CLI source inspected at `hit-pay/cli@621bff7a630c5e26f1d60ce0203de74338231a76` is more restrictive: `src/commands/trigger.ts` posts static fixtures with `Hitpay-Event-Type: charge.created`, `Hitpay-Event-Object: event`, and no `Hitpay-Signature`; `src/trigger/fixtures.ts` contains test identities, SGD75 and `hmac: test_signature`. This cannot satisfy the real merchant-event gate and must not be relabelled authentic or used to grant production access. No trigger or funded purchase was executed.

The CLI `charge get` implementation uses authenticated `GET /v1/charges/{id}`. A verified merchant API response may support a provider-approved alternative, but no deployable HitPay API authentication or actual response was available to this continuation. Do not reconstruct a historical webhook from order UI/email data or simulate its signature with a merchant salt.

References: https://docs.hitpayapp.com/apis/guide/cli ; https://docs.hitpayapp.com/apis/guide/events ; https://github.com/hit-pay/cli/blob/621bff7a630c5e26f1d60ce0203de74338231a76/src/commands/trigger.ts

### Release remains gated

Automatic entitlement and onboarding are NOT LIVE. No migration, offer seed, granting webhook registration, secret configuration, customer mail or Production release was performed by this continuation. Manual fulfilment, capture configuration, existing entitlements, commercial surfaces, tracking and BROS CONTENT OS are preserved.

Current code requires confirmed Auth email, one product identifier and complete successful-payment evidence. Retries must match both payment and order identities, amount/currency/email and the persisted offer's product. Grants serialize per buyer/product to avoid concurrent duplicate permanent access. Optional onboarding is separately deployed as described in `docs/CUSTOMER_ONBOARDING.md`.

Next evidence step: obtain a fresh authentic merchant event and its redacted normalization output inside the available capture-log retention window, or a HitPay-approved authenticated verification method with actual payment/order/product/email/amount/currency evidence. An hourly watch is best-effort and cannot guarantee retaining a log with a one-hour retention period. Keep the gate closed until actual evidence can be retained and reviewed.

Status: BLOCKED at Production release gate. Implementation remains on a feature branch; no Production webhook, secret, offer mapping, pricing or database migration is changed by this document.

## Verified merchant evidence — 7 October 2026

- Merchant: BOLEHEJAS SOLUTIONS.
- HitPay business ID: `a089a95e-7d0e-4f1b-8d85-425f3c82f460`.
- Exact product: BROS SELL™ — Closing OS.
- HitPay product ID: `a2cfb307-366d-4ebc-9ff4-68b6c718e7d6`.
- Catalogue selling price observed on **7 October 2026**: MYR100 (historical; superseded by dated update below).
- Existing webhook: `BROS CONTENT OS - Payment Webhook`, subscribed only to `payment_request.completed` and `payment_request.failed`. It is out of scope and must remain unchanged.
- HitPay Support confirmed on 7 October 2026 that `charge.created` was not sent for historical order #1006 because no endpoint was subscribed to that event at the time.
- HitPay Support also confirmed historical webhook events/bodies cannot be replayed or retrieved from their side.
- No authentic BROS SELL `charge.created` event has therefore been observed yet.


## HISTORICAL / SUPERSEDED commercial update — 9 October 2026 (Malaysia, RM50)

At this earlier inspection, the then-current offer was recorded as **MYR50, one-time**, against the landing page, HitPay product and campaign. Its pricing authority is superseded by the CURRENT owner-approved RM100 decision above. Retain the purchase and operational observations here as dated evidence; the technical verification gates still apply.

- The merchant's successful-order notification for BROS SELL **Order #1007** shows **MYR50** at **2026-10-09 07:53 MYT**. The purchaser's personal data and customer-access link are intentionally excluded from this repository.
- The buyer has been sent manual onboarding instructions. At the time of inspection there was **no matching Supabase Auth account or entitlement grant**. This is not permission to create an unverified account or pre-grant access.
- A merchant order email is evidence of a purchase notification, **not** authenticated, signed `charge.created` webhook evidence. The capture endpoint's original event logs for that order were not available in the Hobby log-retention window, and a genuine matching event body/headers have not been inspected.
- HitPay Support confirmed on 7 October that historic webhook event bodies cannot be retrieved or replayed. Do not pretend a reconstructed JSON body or synthetic fixture is an authentic event.
- The capture-only webhook remains enabled; an hourly, read-only capture watch is configured to surface future matching events without changing grants or merchant settings. This watch does **not** recover expired logs.
- The feature branch had been reconciled with Production Next.js 16.4.0; PR #12 remained DRAFT. CI verified implementation safety, not the live merchant mapping. The identity/status/product/amount/currency, server-only secret and controlled E2E gates remain required; use the CURRENT RM100 offer decision above for subsequent release mapping.
- Maintain the approved manual fulfilment path in the meantime. Record buyer email and payment references only in authorized private operational systems. Avoid duplicate onboarding for Order #1007.
- On a later authorised offer change, use the **then-approved** amount instead of assuming RM50 forever; do not modify checkout to fit backend release.

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

1. Preserve the dedicated non-granting BROS SELL capture subscription for charge.created.
2. Classify CLI fixtures as simulated evidence only; do not use them as an authentic merchant/signature test.
3. Obtain a future genuine organic purchase event, an approved non-funded provider test, or an authenticated provider-approved payment/order/product verification method. Any new funded transaction requires explicit owner approval.
4. Verify actual merchant identity, successful status, payment/order pair, buyer email, exact product related_id, amount and currency; verify the live webhook HMAC/normalization contract and retain a redacted regression fixture with accurate provenance.
5. Apply the reviewed payment migration to cyryoirzxpvummckegyh only after that evidence gate passes.
6. Configure server-only Supabase admin credentials, HITPAY_WEBHOOK_SALT and HITPAY_BUSINESS_ID through secure authenticated settings.
7. Insert exactly one current active mapping using the verified current checkout's provider `line_items[].related_id`, at the owner-approved RM100 offer (`amount_myr=100`, `currency='MYR'`). The observed historical #1007 line ID is a2cfb307-df19-4a44-91ea-1a5ac1b64dc1; a2cfb307-366d-4ebc-9ff4-68b6c718e7d6 is the catalogue/editor ID and must not be substituted. Confirm current provider-line identity before applying; do not change checkout to fit a mapping.
8. Register/enable the dedicated granting endpoint only after deterministic authentic mapping is verified; preserve CONTENT OS and manual fulfilment.
9. Verify valid processing, retries, conflicting payment/order identities, wrong product/amount/currency/merchant, invalid signatures and mixed products.
10. Verify purchase-before-registration and claim by the original confirmed purchase email; one successful purchase creates at most one valid entitlement.
11. Verify authenticated /app access and one protected resource on the hosted release, independently of isolated CI fixtures.
12. Merge/release PR #12 only when all gates pass. Deploy optional onboarding separately after private manual-delivery reconciliation and real sender verification.

Do not change the public checkout or pricing merely to release the backend.
