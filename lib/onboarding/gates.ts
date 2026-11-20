export type OnboardingEnvironment = Record<string, string | undefined>;

export const onboardingReleaseGates = [
  'BROS_ONBOARDING_PAYMENT_EVENT_VERIFIED',
  'BROS_ONBOARDING_SMTP_VERIFIED',
  'BROS_ONBOARDING_E2E_VERIFIED',
  'BROS_ONBOARDING_MANUAL_DELIVERIES_RECONCILED',
] as const;

// These owner-set flags attest to reviewed evidence, not a substitute for it.
// The SQL outbox separately requires paid orders and rechecks before each send.
export function onboardingMayDispatch(env: OnboardingEnvironment) {
  if (env.BROS_ONBOARDING_ENABLED !== 'true') return false;
  if (onboardingReleaseGates.some(gate => env[gate] !== 'true')) {
    throw new Error('Onboarding release gates have not passed.');
  }
  return true;
}
