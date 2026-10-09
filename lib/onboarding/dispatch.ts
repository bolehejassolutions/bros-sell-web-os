import { createAdminClient } from '@/lib/supabase/admin';
import { runOnboarding, sendGmail, type Delivery, type SendResult } from './delivery';

async function gmailAccessToken() {
  const clientId = process.env.BROS_GMAIL_CLIENT_ID;
  const clientSecret = process.env.BROS_GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.BROS_GMAIL_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) throw new Error('Onboarding sender is not configured.');
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: 'refresh_token' }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error('Onboarding sender authorization failed.');
  const body = await response.json();
  if (typeof body.access_token !== 'string') throw new Error('Onboarding sender authorization failed.');
  return body.access_token as string;
}

export async function dispatchOnboarding() {
  if (process.env.BROS_ONBOARDING_ENABLED !== 'true') return { disabled: true };
  if (process.env.BROS_ONBOARDING_MANUAL_DELIVERIES_RECONCILED !== 'true') {
    throw new Error('Manual onboarding delivery reconciliation is required.');
  }
  const admin = createAdminClient();
  // Check sender authorization before reserving messages.
  const token = await gmailAccessToken();
  return runOnboarding({
    async claim() {
      const { data, error } = await admin.rpc('claim_bros_sell_onboarding_messages', { p_limit: 5 });
      if (error) throw new Error('Onboarding queue is unavailable.');
      return (data ?? []) as Delivery[];
    },
    async prepare(delivery: Delivery) {
      const { data, error } = await admin.rpc('prepare_bros_sell_onboarding_message', {
        p_id: delivery.id, p_attempt_id: delivery.attempt_id,
      });
      if (error) throw new Error('Onboarding delivery check failed.');
      return data === true;
    },
    send(raw: string) { return sendGmail(raw, token); },
    async finish(delivery: Delivery, result: SendResult) {
      const { data, error } = await admin.rpc('finish_bros_sell_onboarding_message', {
        p_id: delivery.id, p_attempt_id: delivery.attempt_id, p_status: result.status,
        p_provider_message_id: result.status === 'sent' ? result.providerMessageId : null,
      });
      if (error || data !== true) throw new Error('Onboarding receipt could not be recorded.');
    },
  });
}

export async function dispatchOnboardingSafely() {
  try { await dispatchOnboarding(); }
  catch { console.error('BROS SELL onboarding dispatch requires review.'); }
}
