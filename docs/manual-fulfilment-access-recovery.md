# BROS SELL manual fulfilment and access-recovery handoff

Approved operating decisions supplied by the owner on 3 October 2026. Applies to BROS SELL Web OS project `cyryoirzxpvummckegyh` and PR #11. This is the existing manual operating path, not a claim that automatic HitPay provisioning exists.

## Responsibilities and customer surfaces

The existing authorized BROS SELL operator verifies payment, matches the customer's identity and performs manual entitlement grants/recovery. Requests use **brossell@bolehejas.com**.

HitPay delivers the downloadable customer package separately. Web OS access is tied to the **purchase email**. Web OS is the maintained online companion. Do not promise lifetime hosted access, instant automatic provisioning, a new access duration, a new price or a new refund guarantee.

Manual fulfilment remains permitted until automation is proven. No webhook, platform migration, new customer tier or public admin route is required for this handoff.

## Purchase fulfilment

1. In the existing authorized HitPay account, verify the successful payment and its payment/order/receipt reference. Match the BROS SELL purchase and purchaser email. A reference supplied by the requester alone is not payment verification.
2. Confirm the customer's Web OS account uses the same purchase email. Let the customer sign in/create their own account through the trusted login flow. If the emails differ, resolve the mismatch through the verified purchase email before changing access.
3. Inspect existing entitlement records for the verified account and purchase reference to avoid duplicate grants. Preserve valid legacy access; it does not need recoding to pass this handoff.
4. If a new manual grant is required, use the existing authorized administrative path and the canonical mapping below. No customer grant is performed by this verification task.
5. After a grant/recovery, verify **/app access and one protected resource** through the customer's real account. Record the result in the existing private fulfilment record. The previous Account A/B, isolation and signed-download release tests are accepted by the user and are not a request to repeat them.
6. Confirm Web OS access to the purchase email. Keep the HitPay downloadable-package delivery separate; investigate a missing package in the existing HitPay delivery flow instead of granting access based on a download claim.

| Entitlement field | Approved mapping |
| --- | --- |
| user_id | Verified Auth account whose email matches the purchase email |
| product_id | Existing active product with code BROS_SELL_CORE |
| access_level | core |
| status | active after successful payment verification and authorized grant |
| source | manual for this manual grant |
| external_purchase_id | Verified HitPay payment/order/receipt reference |
| granted_at | Actual grant time |
| expires_at | Existing approved access terms; do not invent a new duration or a lifetime hosting promise |

The live schema accepts manual source and active status; BROS_SELL_CORE is active. The access helper checks canonical CORE/core first and retains legacy WEB_OS/core compatibility. Do not change product codes, RLS, grants or the applied Sales Case migration.

Privileged operations stay in the existing secure admin environment. Never put service-role/secret keys in a browser, customer email, chat or public repository.

## Access recovery

1. Ask the customer to email **brossell@bolehejas.com from the purchase email**. They may include the HitPay order/receipt reference.
2. Verify the payment/reference and match the purchase email to the existing account. Use existing authorised records; do not ask for a password, OTP or card information.
3. Check the entitlement's product, access level, status and any existing expiry. If revoked/expired, understand the existing reason and approved terms before restoring access; do not override a deliberate restriction merely because a request was received.
4. Correct/recover an eligible entitlement through the existing secure admin process. New grants use BROS_SELL_CORE/core. Preserve existing customer Sales Cases.
5. Verify /app and one protected resource after recovery. Confirm resolution to the purchase email. Record the verified reference, account, action, time and verification result privately.
6. If payment/identity cannot be matched, keep the request open for manual resolution through the purchase email. Do not require a second purchase to fix an access problem.

Recovery contact is visible on /activate even if BROS_SUPPORT_EMAIL is not configured: the approved default is brossell@bolehejas.com. The page asks for the purchase email, permits an optional HitPay reference and explicitly excludes passwords, OTPs and card information.

## Refund requests

Customers may request a refund **within 30 calendar days of purchase**, via **brossell@bolehejas.com**, using the purchase email. Verify the purchase date/reference and retain the request in the existing private support record.

This is the approved request window and contact. Do not represent a request as an automatically approved refund, invent additional eligibility conditions or perform a refund/payment/configuration change during release verification. Process any approved refund through the existing authorized process.

## Customer message for manual access confirmation

> Akses BROS SELL Web OS untuk email pembelian anda telah disemak. Log masuk menggunakan email pembelian yang sama dan buka /app. Web OS ialah companion online yang diselenggara. Pakej pelanggan yang boleh dimuat turun dihantar secara berasingan oleh HitPay. Jika akses bermasalah, email brossell@bolehejas.com menggunakan email pembelian; anda boleh sertakan rujukan pesanan atau resit HitPay. Jangan hantar password, OTP atau maklumat kad.

Send this only after verifying the customer's grant/recovery result. Use the current approved customer Web OS login link; do not send an internal Preview link as the commercial destination.

## Customer message for recovery/refund requests

> Untuk pemulihan akses, email brossell@bolehejas.com menggunakan email pembelian. Anda boleh sertakan rujukan pesanan atau resit HitPay. Permohonan refund boleh dibuat dalam 30 hari kalendar dari tarikh pembelian melalui email yang sama. Jangan hantar password, OTP atau maklumat kad.

## Execution record and evidence boundary

Use the existing private operator record for: verified purchase reference, purchase/account email match, entitlement action and canonical mapping, operator/time, /app result, protected-resource result and customer confirmation/recovery outcome. Do not publish customer emails, receipts, account IDs or tokens in GitHub CI artifacts.

Release evidence consists of:
- User acceptance of prior Account A/B, real isolation and signed-download testing.
- Existing live SQL/RLS and anonymous access evidence.
- Linux application/browser verification, including recovery-page contact and responsive layout.
- This owner-approved manual fulfilment/recovery/refund handoff.

No new paid transaction, automated provisioning run, mailbox-delivery test, entitlement grant/recovery or refund is claimed in this release verification. Per-customer payment matching and post-grant checks are required operational steps. Manual operation and unproven automation are known limitations, permitted by the owner.

Main, Production, HitPay commercial configuration and existing customer data remain unchanged until separately authorized.
