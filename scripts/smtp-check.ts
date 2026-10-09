// Owner-controlled diagnostic: no database, webhook, entitlement or queue access.
import { randomUUID } from 'node:crypto';
import { onboardingMail, onboardingSender } from '../lib/onboarding/messages.ts';
import { createOnboardingSmtp, verifyOnboardingSmtp, sendOnboardingSmtp, type SmtpTransport } from '../lib/onboarding/smtp.ts';

async function main() {
  const argumentsList = process.argv.slice(2);
  if (argumentsList.some(value => value !== '--self-test') || argumentsList.length > 1) {
    console.log(JSON.stringify({ ok: false, failure: 'unsupported_argument' }));
    process.exitCode = 1; return;
  }
  const result: Record<string, string | boolean> = {
    observed_at: new Date().toISOString(), tls_auth_verified: false,
    self_test_requested: argumentsList.includes('--self-test'),
    smtp_accepted: false, inbox_arrival_verified: false,
    customer_email_sent: false, database_accessed: false,
  };
  let transport: SmtpTransport | undefined;
  try {
    transport = createOnboardingSmtp();
    await verifyOnboardingSmtp(transport);
    result.tls_auth_verified = true;
    if (result.self_test_requested) {
      const id = randomUUID();
      const mail = {
        ...onboardingMail(onboardingSender, id, 'initial'),
        subject: 'BROS SELL — Ujian SMTP dalaman',
        text: 'Ujian dalaman SMTP kepada mailbox brossell sendiri.\n\nEmel ini bukan onboarding pelanggan, resit, pengesahan pembayaran atau pemberian akses.\n\nFrom dan Reply-To: brossell@bolehejas.com.\nRujukan ujian: ' + id,
      };
      const receipt = await sendOnboardingSmtp(mail, transport);
      result.smtp_accepted = receipt.status === 'sent';
      result.send_status = receipt.status;
      result.message_id = mail.messageId;
      if (receipt.status !== 'sent') process.exitCode = 1;
    }
  } catch {
    result.failure = 'smtp_configuration_tls_or_auth_failed';
    process.exitCode = 1;
  } finally {
    transport?.close();
    // Do not print errors, credentials, protocol transcripts or SMTP responses.
    console.log(JSON.stringify(result));
  }
}
await main();
