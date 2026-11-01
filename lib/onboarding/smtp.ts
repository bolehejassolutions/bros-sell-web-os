import nodemailer from 'nodemailer';
import { onboardingSender, type OnboardingMail } from './messages.ts';
import type { OnboardingEnvironment } from './gates.ts';
import type { SendResult } from './delivery.ts';

const smtpHost = 'mail.bolehejas.com';
export type SmtpTransport = {
  verify: () => Promise<unknown>;
  sendMail: (mail: OnboardingMail) => Promise<unknown>;
  close: () => void;
};

export function onboardingSmtpOptions(env: OnboardingEnvironment) {
  // Do not permit an environment typo to redirect credentials or sender identity.
  if ((env.BROS_SMTP_HOST && env.BROS_SMTP_HOST !== smtpHost)
    || (env.BROS_SMTP_PORT && env.BROS_SMTP_PORT !== '465')
    || (env.BROS_SMTP_USERNAME && env.BROS_SMTP_USERNAME !== onboardingSender)
    || !env.BROS_SMTP_PASSWORD) {
    throw new Error('Onboarding SMTP configuration is incomplete or invalid.');
  }
  return {
    host: smtpHost, port: 465, secure: true,
    auth: { user: onboardingSender, pass: env.BROS_SMTP_PASSWORD },
    tls: { servername: smtpHost, rejectUnauthorized: true, minVersion: 'TLSv1.2' as const },
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
    pool: false, logger: false, debug: false, transactionLog: false,
    disableFileAccess: true, disableUrlAccess: true, maxRecipients: 1,
  };
}

export function createOnboardingSmtp(env: OnboardingEnvironment = process.env): SmtpTransport {
  return nodemailer.createTransport(onboardingSmtpOptions(env));
}

export async function verifyOnboardingSmtp(transport: SmtpTransport) {
  try {
    if (await transport.verify() !== true) throw new Error('Verification failed.');
  } catch {
    // SMTP errors may contain credentials, recipients or server responses.
    throw new Error('Onboarding SMTP TLS or authentication verification failed.');
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}
function soleRecipient(value: unknown, expected: string) {
  return Array.isArray(value) && value.length === 1
    && typeof value[0] === 'string' && value[0].toLowerCase() === expected.toLowerCase();
}

export async function sendOnboardingSmtp(mail: OnboardingMail, transport: SmtpTransport): Promise<SendResult> {
  try {
    const info = await transport.sendMail(mail);
    // A generated Message-ID alone is not evidence. Require final SMTP DATA
    // acceptance, one exact recipient, no rejection and the expected envelope.
    // 'sent' means accepted by this server; inbox arrival remains an E2E gate.
    if (isRecord(info) && info.messageId === mail.messageId
      && typeof info.response === 'string' && /^250(?:[ -]|$)/.test(info.response)
      && soleRecipient(info.accepted, mail.to.address)
      && Array.isArray(info.rejected) && info.rejected.length === 0
      && isRecord(info.envelope) && info.envelope.from === onboardingSender
      && soleRecipient(info.envelope.to, mail.to.address)) {
      // The existing receipt column stores the RFC822 correlation ID. No raw
      // SMTP response, customer address or provider queue text is persisted.
      return { status: 'sent', providerMessageId: mail.messageId };
    }
    return { status: 'uncertain' };
  } catch (error: unknown) {
    // Only a definite SMTP rejection is classified as failed. Every timeout,
    // disconnect or incomplete/partial receipt is uncertain and never retried.
    if (isRecord(error) && typeof error.responseCode === 'number'
      && error.responseCode >= 400 && error.responseCode <= 599
      && ((error.code === 'EAUTH' && typeof error.command === 'string' && error.command.startsWith('AUTH'))
        || (error.code === 'EENVELOPE' && (error.command === 'MAIL FROM' || error.command === 'RCPT TO' || error.command === 'DATA'))
        || (error.code === 'EMESSAGE' && error.command === 'DATA'))) {
      return { status: 'failed' };
    }
    return { status: 'uncertain' };
  }
}
