# BROS SELL merchant evidence — 9 October 2026 MYT

Source: authenticated HitPay merchant UI, Payments → Transactions → Order reference #1007, stored webhook Request and Response. Inspected through normal visible UI navigation; no network interception or secret extraction. Customer names, email, phone, charge/order UUIDs, checkout links and provider references are excluded from this record.

## Request evidence

- Successful charge, MYR50, merchant business ID and matching charge/order pair: observed.
- Purchaser identity present and consistent between charge and order: observed; values remain private.
- One `item_type=product` line, quantity 1, BROS SELL™ — Closing OS: observed.
- Exact `order.line_items[].related_id`: `a2cfb307-df19-4a44-91ea-1a5ac1b64dc1`.
- Catalogue/editor URL identifies `a2cfb307-366d-4ebc-9ff4-68b6c718e7d6`. It is not the observed webhook line identity. The current product list shows MYR100; #1007 remains a historical MYR50 purchase.

Do not infer the internal relationship between these two IDs from their shared product name. The historical analyzer checks the actual observed line ID. The current RM100 mapping still requires current checkout/provider-line confirmation.

## Stored capture response

```json
{
  "received": true,
  "captureOnly": true,
  "fingerprint": "7a72c0dea8e45acbb13a4e076325a4bc58653b4c0f5b28f20897e759d471db86",
  "mapped": {
    "paymentIdentity": true,
    "orderIdentity": true,
    "buyerIdentity": true,
    "productIdentity": true,
    "merchantIdentity": true,
    "amount": true,
    "currency": true
  }
}
```

Verified Production commit at inspection: `ee99f22a2ad7ecb0bf02cace47cf58a21dd3ea29`. Its capture handler returns this success structure only after the raw-body HMAC check and configured merchant check. The authenticated stored response therefore supplies evidence of endpoint acceptance through that path. This inference is stronger than an HTTP 200 alone, which can also mean an unrelated event was ignored.

The original signature header, original raw request bytes and explicit per-delivery destination URL were not visible in this view. Do not claim an independent cryptographic replay or recoverability of those values. The displayed, formatted JSON is not relabelled as the original wire body. Test identities are replacements in the derived regression and no original signature is fabricated.

## Remaining release dependencies

Actual Charge API response, current RM100 provider-line mapping confirmation, reviewed server-secret configuration and hosted duplicate/rejection/confirmed-original-email claim/protected-resource tests remain open. The original buyer still has no matching Auth account in the fresh read-only check. No migration, offer seed, entitlement grant, customer email or Production release was performed by this evidence update.

Application SMTP separately passed TLS/auth and internal inbox delivery at 17:51:20 MYT with matching From/Reply-To/Return-Path/Message-ID. Controlled external deliverability/reply routing, Vercel runtime sender configuration, Auth E2E and manual onboarding suppression remain independent gates. Automatic entitlement and onboarding are NOT LIVE.
