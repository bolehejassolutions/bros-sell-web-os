# Historical Order #1007 — private Charge API verification

Status: verifier implemented; real authenticated response NOT obtained. This is evidence tooling in PR #12, not another payment/grant implementation.

## Later merchant UI evidence — 9 October 2026 (MYT)

Normal merchant UI navigation to Payments → Transactions → Order reference #1007 exposed the provider's stored webhook Request and Response. This did not use debugger/network interception, browser tokens or an indirect API call. The Request has consistent succeeded/MYR50, merchant, charge/order pair and purchaser fields. Its exact product `line_items[].related_id` is **`a2cfb307-df19-4a44-91ea-1a5ac1b64dc1`**, which differs from catalogue/editor ID `a2cfb307-366d-4ebc-9ff4-68b6c718e7d6`. The historical analyzer now checks the observed line item identity. Names/prices do not substitute for either identifier.

The stored Response is `received=true`, `captureOnly=true`, all seven mapping booleans true, fingerprint `7a72c0dea8e45acbb13a4e076325a4bc58653b4c0f5b28f20897e759d471db86`. That response is consistent with the exact deployed capture handler's signature-accepted/merchant-matched path. This is server-acceptance evidence inferred from the provider's authenticated stored response; original raw request bytes and signature header were not observed and cannot be independently revalidated offline. See `HITPAY_MERCHANT_EVIDENCE.md` for boundaries.

This recovered UI evidence is not an authenticated Charge API response. No new API report has yet been obtained. Confirm the current RM100 checkout's provider line identity before inserting its offer mapping; do not seed the catalogue/editor ID merely because it appears in the product URL. Production remains unchanged.

## Inspection on 9 October 2026 (MYT)

At task start, PR #12 was draft/open/mergeable at 47730695124b14c135a2cfd22bb58c0ab0ae4b67, 36 commits ahead of main and zero behind. CI #56 passed its recorded steps and Preview was READY. Production remained ee99f22a2ad7ecb0bf02cace47cf58a21dd3ea29. All six existing public tables had RLS; there was one active entitlement, no matching #1007 buyer Auth account, and no payment/onboarding objects. Env names lacked granting/admin/sender credentials. Latest Support reply remained 12:03 MYT; no additional successful-order notification was found.

The branch subsequently advanced to bf8b08a5518f9e2b55aca2fce5e3b98385915402 with SMTP onboarding and a runbook recording owner-approved RM100. These concurrent changes are preserved. The owner explicitly confirmed RM100 as the current offer in this continuation; the supplied RM50 release-price instruction is superseded. Future reviewed mapping uses MYR100, while historical #1007 remains MYR50. This verifier changes no offer mapping or commercial surface.

Browser approval review again denied Network.enable on dashboard.hit-pay.com under saved permissions. No browser authentication state was extracted or indirect browser/API workaround used. The owner operation below uses an existing explicit business API key at HitPay's official supported endpoint.

## Owner operation

From a reviewed Windows checkout with Node.js available:

```powershell
./scripts/Read-HitPayCharge.ps1
```

Enter the existing HitPay business API key and #1007's actual charge UUID from the private Support thread at the hidden prompts. Do not paste either into chat, shell arguments or repository files. This performs one authenticated GET to https://api.hit-pay.com/v1/charges/{charge_id}; redirects are disabled. It creates no credentials, payments, webhooks, grants, database writes or emails, and does not use cookies/session tokens.

The actual response is retained as current-Windows-user DPAPI ciphertext at a unique temporary directory outside the repository. A separate report.json contains only allowlisted field-check booleans, SHA256, HTTPS transport provenance and retrieval time. The API key is not saved. Keep response.dpapi private. Temporary storage is a checkpoint, not a durable archive; review it promptly in the same Windows account and move only through an approved private evidence workflow. -Check checks local prerequisites without credentials/network.

The analyzer checks requested charge ID, succeeded status, the historical MYR50 payment, merchant, consistent order/email fields, and exact order.line_items[].related_id. It does not infer product/order from price, remark or target_id. Missing API fields remain failed checks. The pure analyzer does not claim authenticated provenance; the wrapper adds it only after the real HTTPS 200.

Even a complete Charge API report leaves the release gate CLOSED. It cannot verify the historical raw-body HMAC, recover an expired webhook, prove confirmed-email hosted access or demonstrate real email delivery. No fabricated signature or reconstructed webhook is emitted.

## Validation and remaining gates

The baseline implementation passed 26 isolated deterministic/SQL/RLS tests locally, including both payment and optional onboarding SQL. Four new analyzer regressions cover redaction, missing evidence, conflicting identities, invalid fields and mixed products. A local PowerShell test mocked the only GET and confirmed hidden prompts, the fixed endpoint/no redirects, report redaction, a closed release gate and exact DPAPI roundtrip. That test made no live request. The integrated head retains the newer SMTP test suite; final CI must pass before interpreting its application readiness.

No Production migration, offer seed, secret configuration, customer email, genuine regression fixture, merchant/customer hosted E2E or real sender-delivery test was performed here. Initial #1007 email remains manual and must be reconciled privately before sender enablement.

Next: obtain the actual API response with this operation, review available payment/order/product/merchant/customer fields and genuine signature evidence, then continue the existing release runbook. Apply the reviewed migration and a single owner-approved current MYR100 mapping only after evidence gates pass. Hosted confirmed-original-email claim, duplicate/rejection/protected-resource checks remain mandatory. Onboarding follows independently with manual suppression and controlled real delivery.

Official API: https://docs.hitpayapp.com/apis/charges/get-charge-detail
Release runbooks: HITPAY_ENTITLEMENT_AUTOMATION.md and CUSTOMER_ONBOARDING.md.
