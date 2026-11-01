import { onboardingMail, type OnboardingKind, type OnboardingMail } from './messages.ts';

export type Delivery = { id: string; purchase_email: string; kind: OnboardingKind; attempt_id: string };
export type SendResult = { status: 'sent'; providerMessageId: string } | { status: 'failed' | 'uncertain' };
export type OnboardingDependencies = {
  verify: () => Promise<void>;
  claim: () => Promise<Delivery | null>;
  prepare: (delivery: Delivery) => Promise<boolean>;
  send: (mail: OnboardingMail) => Promise<SendResult>;
  finish: (delivery: Delivery, result: SendResult) => Promise<void>;
};

// The database reserves each delivery before SMTP is called. Ambiguous sends
// stay uncertain and are never retried automatically; Message-ID supports
// private cPanel/server delivery reconciliation without recipient data in logs.
// SMTP does not create a mailbox Sent copy; 'sent' records server acceptance.
export async function runOnboarding(deps: OnboardingDependencies) {
  // TLS and authentication must succeed before any message is reserved.
  await deps.verify();
  const totals = { sent: 0, failed: 0, uncertain: 0, suppressed: 0 };
  for (let attempt = 0; attempt < 5; attempt++) {
    const delivery = await deps.claim();
    if (!delivery) break;
    if (!(await deps.prepare(delivery))) { totals.suppressed++; continue; }
    let result: SendResult;
    try {
      result = await deps.send(onboardingMail(delivery.purchase_email, delivery.id, delivery.kind));
    } catch {
      result = { status: 'uncertain' };
    }
    // A finish failure stops this worker before another message is reserved.
    // The current send remains sending and
    // becomes uncertain after ten minutes instead of being sent twice.
    await deps.finish(delivery, result);
    totals[result.status]++;
  }
  return totals;
}
