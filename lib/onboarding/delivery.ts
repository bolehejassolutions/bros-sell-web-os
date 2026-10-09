import { onboardingMime, type OnboardingKind } from './messages.ts';

export type Delivery = { id: string; purchase_email: string; kind: OnboardingKind; attempt_id: string };
export type SendResult = { status: 'sent'; providerMessageId: string } | { status: 'failed' | 'uncertain' };
export type OnboardingDependencies = {
  claim: () => Promise<Delivery[]>;
  prepare: (delivery: Delivery) => Promise<boolean>;
  send: (raw: string) => Promise<SendResult>;
  finish: (delivery: Delivery, result: SendResult) => Promise<void>;
};

// The database reserves each delivery before Gmail is called. Ambiguous sends
// stay uncertain and are never retried automatically; Message-ID supports
// private Sent-mail reconciliation without putting recipient data in logs.
export async function runOnboarding(deps: OnboardingDependencies) {
  const totals = { sent: 0, failed: 0, uncertain: 0, suppressed: 0 };
  for (const delivery of await deps.claim()) {
    if (!(await deps.prepare(delivery))) { totals.suppressed++; continue; }
    let result: SendResult;
    try {
      result = await deps.send(onboardingMime(delivery.purchase_email, delivery.id, delivery.kind));
    } catch {
      result = { status: 'uncertain' };
    }
    // A finish failure aborts the batch. The reservation remains sending and
    // becomes uncertain after ten minutes instead of being sent twice.
    await deps.finish(delivery, result);
    totals[result.status]++;
  }
  return totals;
}

export async function sendGmail(raw: string, accessToken: string, fetcher: typeof fetch = fetch): Promise<SendResult> {
  try {
    const response = await fetcher('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw }), signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return { status: response.status >= 400 && response.status < 500 ? 'failed' : 'uncertain' };
    const body: unknown = await response.json();
    const id = body && typeof body === 'object' && 'id' in body ? body.id : null;
    return typeof id === 'string' && id ? { status: 'sent', providerMessageId: id } : { status: 'uncertain' };
  } catch {
    return { status: 'uncertain' };
  }
}
