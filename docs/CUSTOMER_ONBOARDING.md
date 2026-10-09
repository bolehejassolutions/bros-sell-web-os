# BROS SELL™ customer email automation

Status: implemented on draft PR #12, disabled by default, NOT LIVE. Payment/access and email releases remain separate. Manual fulfilment and customer rights do not depend on the sender.

## Sender and transport

Use Next.js/Vercel, the private Supabase outbox and cPanel SMTP. Every onboarding message has From, Reply-To and envelope sender `brossell@bolehejas.com`. Host `mail.bolehejas.com`, port `465`, implicit SSL/TLS, username `brossell@bolehejas.com`. Nodemailer is pinned in the lockfile; Gmail OAuth is no longer used.

TLS validates the hostname/certificate and requires at least TLS 1.2. Do not disable validation or substitute another host. Runtime SMTP verification runs before any queue claim. Passwords are server-only secrets; protocol logging, debugging, attachments and file/remote content loading are disabled. Errors/logs contain static messages/counts only.

The four Malay messages retain public login/app/support URLs and no password, OTP, token, purchase-specific URL, price or performance claim. HitPay receipts and digital-package delivery remain separate.

## Evidence — 9 October 2026 MYT

- Production: `ee99f22a2ad7ecb0bf02cace47cf58a21dd3ea29` at `brossell.bolehejas.com`. Payment/outbox tables and runtime sender credentials are not deployed.
- cPanel: DKIM, SPF, DMARC and PTR Valid; alternate HELO `node29.netkl.org`. DNS unchanged. Configuration checks do not prove external inbox delivery.
- Live unauthenticated TLS/EHLO probe to port 465: TLS 1.3, valid wildcard certificate and AUTH advertised. No credential or email used.
- Webmail SSO opened the intended mailbox. One labelled internal test sent to the same mailbox arrived at 16:52 MYT. This does not establish application SMTP authentication or external deliverability.
- Supabase Auth custom SMTP is already enabled at the same host/port, sender name BROS SELL™, minimum interval 60 seconds. Exact sender email/username are redacted in the accessible UI; their identities and stored credential are UNVERIFIED. Auth settings unchanged.
- CURRENT price decision: the owner approved MYR100 (RM100), one-time, on 9 October 2026, matching the public HitPay product inspected that day. Earlier RM50 release guidance is superseded. The future active offer mapping must use `amount_myr=100`, `currency='MYR'`; no offer is seeded or applied by this branch. Historical RM50 purchases remain intact.
- Authentic merchant/payment/product/event and hosted payment-to-access E2E remain open gates. Synthetic fixtures do not establish payment truth.

## Timing and idempotency

Initial is due five minutes after verified `paid_at`; reminders at 24/72 hours while activation remains incomplete. Confirmation requires a confirmed purchase-email account owning the paid ledger and linked active entitlement, then passing the /app gate.

One row exists per purchase/message kind. Row locking and the unique constraint reserve one message at a time, at most five sequential messages per worker. The next is reserved only after recording the current result. Immediately before send, SQL rechecks paid state, activation, manual suppression, confirmation entitlement, ten-minute lease expiry and reminder supersession. A delayed worker cannot promote an expired reservation or an old initial/reminder. Late startup sends the latest eligible reminder.

State: pending → reserved → sending → sent / failed / uncertain. Expired unsent reservations recover with new attempt IDs; stale IDs cannot send/finish. A promoted send, timeout, disconnect, missing receipt or crash becomes uncertain and is never automatically retried. Definite SMTP rejection is failed; neither failed nor uncertain is automatically reclaimed. Receipt failure stops the worker before claiming another message.

`sent` requires final DATA 250 acceptance, exact sole recipient/envelope and deterministic Message-ID. It means SMTP acceptance, not inbox arrival/read. SMTP cannot guarantee exactly-once delivery after a lost acceptance response; ambiguous attempts require private reconciliation.

SMTP does not automatically append mail to Webmail Sent. Use cPanel Track Delivery/hosting logs and recipient headers with the Message-ID. Absence from Sent does not establish that an application message was not sent. Never blindly resend an uncertain message.

## Safe credential entry and controlled tests

The owner confirmed the application credential is not stored yet. Never paste it into chat, GitHub, command arguments, logs or .env.example.

1. Open PowerShell in this checkout and run `./scripts/smtp-check.ps1`. Its masked prompt holds the password only in process memory, passes it via the child environment and removes/restores it in finally. The default diagnostic verifies TLS/auth without sending and accesses no database, webhook, queue or entitlement API. Output is allowlisted status only.
2. After auth succeeds, `./scripts/smtp-check.ps1 -SelfTest` sends one labelled test only to `brossell@bolehejas.com` with the required From/Reply-To. Read its received headers/Message-ID. SMTP acceptance alone does not pass inbox E2E.
3. Use a separately approved controlled external mailbox to verify Inbox/Spam, replies, SPF/DKIM/DMARC alignment and private delivery tracking. Do not use a customer address or change already-valid DNS.
4. For hosted tests, the owner enters `BROS_SMTP_PASSWORD` directly in authenticated Vercel secure settings as Sensitive, initially scoped to Preview and this branch only. Keep release flags false. Preview and Supabase Auth credentials are separately configured. Do not pull/decrypt secrets into files/build artifacts. Production configuration belongs to the reviewed release.

Fixed transport defaults are in .env.example. Password/worker secret must never use NEXT_PUBLIC prefixes. Do not reset the mailbox password merely to complete this workflow.

## Supabase Auth — separate configuration

Auth confirmation/recovery/security messages use their own configuration. Preserve confirmation, redirects, rate limits and security settings. After controlled SMTP verification, inspect the current sender and configure intended From/username `brossell@bolehejas.com`, host `mail.bolehejas.com`, port 465 and sender name BROS SELL™ through the authenticated settings.

Hosted native Auth SMTP documents From but no explicit Reply-To setting. Verify a received controlled Auth message; From alone does not prove Reply-To. If native configuration cannot satisfy explicit Reply-To, evaluate a reviewed Send Email Hook separately. It replaces Auth SMTP and handles sensitive payloads; this branch does not install/enable one.

Controlled Auth E2E covers registration/confirmation, redirect, login, recovery, no premature entitlement and protected-resource access. Preserve existing customer accounts. Auth delivery must pass independently before the global email E2E flag is true.

## Release gates

All five exact server flags must be true: `BROS_ONBOARDING_ENABLED`, `BROS_ONBOARDING_PAYMENT_EVENT_VERIFIED`, `BROS_ONBOARDING_SMTP_VERIFIED`, `BROS_ONBOARDING_E2E_VERIFIED`, `BROS_ONBOARDING_MANUAL_DELIVERIES_RECONCILED`. Flags attest to reviewed evidence, not a substitute for it; SQL independently rechecks each paid order.

1. Resolve authentic merchant/payment/order/product/email/amount/currency evidence, verify the owner-approved RM100/MYR mapping against live checkout, and pass hosted duplicate/rejection/confirmed-email claim/protected-resource gates in HITPAY_ENTITLEMENT_AUTOMATION.md. This email change activates no grants.
2. Review optional supabase/sql/onboarding.sql separately. Generate its migration with `supabase migration new customer_onboarding`, run isolated SQL/RLS tests and normal migration review before applying. This SQL source is not applied migration history; no Production migration occurred.
3. Privately reconcile manual deliveries, including the initial email for Order #1007, using its exact provider reference and send time in bros_sell_onboarding_manual_deliveries. Keep buyer details/references out of GitHub. Verify suppression before enabling the sender.
4. Pass controlled SMTP/Auth E2E, private receipt/replay/suppression tests with isolated data. Never seed synthetic payments into Production or send customer onboarding during verification.
5. After review, configure Production worker/sender secrets and only set each flag when its evidence passes.
6. Add one reviewed Supabase Cron job POSTing to the SELL worker using its Bearer secret from Vault. Do not put secrets in URLs/public SQL/cron literals. No cron/Vault/pg_net setup is applied here; CONTENT OS unchanged.
7. Activate only the reviewed release after all gates. Monitor the first eligible receipt privately. To stop, disable onboarding and pause its one job, preserving ledger/queue/customer rights.

Queue RPCs are service-role-only. Self-activation requires the confirmed owner and linked active entitlement. The SMTP worker contains no entitlement-grant call.

Official references: [SMTP](https://nodemailer.com/smtp), [message options](https://nodemailer.com/message), [Supabase Auth SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [Send Email Hook](https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook), [Cron](https://supabase.com/docs/guides/cron/quickstart).
