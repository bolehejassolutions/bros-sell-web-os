import { createAdminClient } from '@/lib/supabase/admin';
import { runOnboarding, type Delivery, type SendResult } from './delivery';
import { onboardingMayDispatch } from './gates';
import { createOnboardingSmtp, sendOnboardingSmtp, verifyOnboardingSmtp } from './smtp';

export async function dispatchOnboarding() {
  if (!onboardingMayDispatch(process.env)) return { disabled: true };
  const admin = createAdminClient();
  const transport = createOnboardingSmtp();
  try {
    return await runOnboarding({
      // Nodemailer checks DNS, TLS and credentials without sending a message.
      // This check must pass before the first outbox lease is claimed.
      verify() { return verifyOnboardingSmtp(transport); },
      async claim() {
        const { data, error } = await admin.rpc('claim_bros_sell_onboarding_messages');
        if (error) throw new Error('Onboarding queue is unavailable.');
        return ((data ?? []) as Delivery[])[0] ?? null;
      },
      async prepare(delivery: Delivery) {
        const { data, error } = await admin.rpc('prepare_bros_sell_onboarding_message', {
          p_id: delivery.id, p_attempt_id: delivery.attempt_id,
        });
        if (error) throw new Error('Onboarding delivery check failed.');
        return data === true;
      },
      send(mail) { return sendOnboardingSmtp(mail, transport); },
      async finish(delivery: Delivery, result: SendResult) {
        const { data, error } = await admin.rpc('finish_bros_sell_onboarding_message', {
          p_id: delivery.id, p_attempt_id: delivery.attempt_id, p_status: result.status,
          p_provider_message_id: result.status === 'sent' ? result.providerMessageId : null,
        });
        if (error || data !== true) throw new Error('Onboarding receipt could not be recorded.');
      },
    });
  } finally {
    transport.close();
  }
}

export async function dispatchOnboardingSafely() {
  try { await dispatchOnboarding(); }
  catch { console.error('BROS SELL onboarding dispatch requires review.'); }
}
