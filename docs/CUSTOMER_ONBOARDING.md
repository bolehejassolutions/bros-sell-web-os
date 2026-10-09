# BROS SELL™ customer onboarding — optional second release

Status: implemented on PR #12, disabled by default, NOT LIVE. Payment-to-entitlement is the first release. The payment migration and manual access do not depend on this optional workflow.

## Existing infrastructure

Use the existing Next.js/Vercel application, Supabase transactional outbox and native Supabase Cron, and the existing business Gmail mailbox. No new automation platform or npm dependency is introduced. Gmail connector authorization is not a deployable application credential; an owner-authorized Gmail API credential is required separately.

The sender is BOLEHEJAS SOLUTIONS / `bolehejassolutions@gmail.com`, matching the inspected business mailbox; replies go to `brossell@bolehejas.com`. Using that support address as the From alias requires separate verified send-as evidence and is not assumed. All four messages are Malay-first and contain only public login/app/support URLs. HitPay package delivery stays separate. No passwords, OTPs, access tokens, purchase-specific URLs, lifetime hosting promises or outcome guarantees appear.

## Timing and condition

- Initial: due five minutes after the verified ledger's `paid_at`.
- Reminder: due 24 hours if activation remains incomplete.
- Final reminder: due 72 hours if activation remains incomplete.
- Confirmation: queued at the first verified account visit to `/app` with the paid order's active entitlement; dispatch is attempted after that request. Cron provides recovery on its next one-minute tick.

Activation means the purchase-email account is confirmed, owns the ledger/entitlement and successfully passes the app access gate. An automatic entitlement grant alone does not count as completing onboarding. Existing/manual access remains valid if the optional migration or sender is unavailable.

The queue has one row per purchase and message kind. Row locks and a unique constraint reserve one message at a time. Each worker processes at most five sequential messages, and reserves the next only after the current result is recorded. Immediately before sending, the worker checks the payment state, activation state, entitlement for confirmations and manual-delivery suppression. Pending reminders stop after activation. An already in-flight network send cannot be recalled; the pre-send check minimizes that race. Late startup sends only the latest due reminder, avoiding a burst of old messages.

Delivery state: pending → reserved → sending → sent / failed / uncertain. The pre-send check promotes a reservation to sending. A reserved lease that expires before that check returns to pending after ten minutes; its old attempt ID cannot send. Network timeout, 5xx, missing successful receipt or a worker crash after promotion to sending are uncertain and NEVER automatically resent. Reconcile privately against Gmail Sent using the deterministic Message-ID before any manual recovery. A stored Gmail acceptance receipt is not a guarantee the destination inbox received/read the message.

## Release sequence

1. Pass genuine merchant evidence, migration review, exact current RM50 offer, payment duplicate/rejection/claim checks and hosted customer access gates first. Onboarding must not delay that release.
2. Generate a migration using the installed Supabase CLI (`supabase migration new customer_onboarding`) and place the reviewed `supabase/sql/onboarding.sql` inside it. The current file is a rollout SQL source, not a claim of applied migration history. Test it and apply through the normal migration path. It changes no access rights.
3. BEFORE enabling any sender, reconcile previously sent manual messages. Record Order #1007's actual provider order reference and initial-email send time in `bros_sell_onboarding_manual_deliveries` through a private authenticated database operation. Do not put customer data or references in GitHub. Confirm the outbox initial row is sent/manual_delivery_recorded when that ledger exists. No initial email may be resent for #1007. Reconcile any later manual sends too.
4. In Vercel Production secure environment settings, configure `BROS_GMAIL_CLIENT_ID`, `BROS_GMAIL_CLIENT_SECRET`, `BROS_GMAIL_REFRESH_TOKEN` for the existing business mailbox with the minimum `gmail.send` scope. Owner completes OAuth consent; never request credential values in chat. Use Production OAuth app settings suitable for durable authorization, not a short-lived testing consent token. Configure `BROS_ONBOARDING_WORKER_SECRET` securely.
5. Set `BROS_ONBOARDING_MANUAL_DELIVERIES_RECONCILED=true` only after step 3. Keep `BROS_ONBOARDING_ENABLED` absent/false until a controlled test mailbox verifies sending, recorded receipts, replay suppression and access/reminder conditions. All synthetic messages stay in an isolated test database; do not seed synthetic payments in Production.
6. Enable Supabase `pg_cron` / `pg_net` after review. Store the worker secret in Supabase Vault using authenticated UI; do not embed it in a URL, public SQL source, logs or a cron literal. Add exactly one job for this workflow that POSTs to `https://brossell.bolehejas.com/api/internal/onboarding` every minute with the Vault-provided Bearer secret. Cron calls only the existing SELL application; do not change CONTENT OS.
7. Set `BROS_ONBOARDING_ENABLED=true` in Production and redeploy the reviewed release. Verify the first real eligible message and receipt privately. To stop sending, set it false and redeploy, then pause the one cron job. Preserve ledger, queue and customer rights.

Queue/activation/sender APIs are service-role-only except the authenticated self-activation RPC. Anonymous and other customer accounts cannot reserve or read delivery records. Keep server admin/Gmail/worker credentials separate from NEXT_PUBLIC variables. Application logs contain static errors/counts only.

## Operational checks

- Payment access: no dependency on Gmail or queue success.
- Manual #1007: private suppression receipt exists before enablement.
- Scheduler replay / overlapping workers: one reservation and one provider attempt per message.
- Early preparation/receipt failure: later messages remain pending; an expired pre-send reservation recovers, while an attempted send remains uncertain.
- Activation after reservation: unsent reminder suppressed by pre-send check.
- Refund/revocation before send: no new inappropriate confirmation/reminder; manual refund-access policy remains unchanged.
- Unknown Gmail acceptance: reconcile Sent, do not blindly retry.
- `/app` and protected customer resource: verify with a real controlled confirmed account after payment release, independently from isolated CI fixtures.

Official references: https://supabase.com/docs/guides/functions/schedule-functions ; https://supabase.com/docs/guides/cron/quickstart ; https://developers.google.com/workspace/gmail/api/guides/sending ; https://developers.google.com/identity/protocols/oauth2/web-server
