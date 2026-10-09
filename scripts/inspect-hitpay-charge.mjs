import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

// Historical Order #1007 paid MYR50; this does not set the current offer.
const businessId = 'a089a95e-7d0e-4f1b-8d85-425f3c82f460';
// Exact product line identity observed in #1007's authenticated merchant
// webhook Request view. The catalogue editor ID is a different identifier.
const productId = 'a2cfb307-df19-4a44-91ea-1a5ac1b64dc1';
const object = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const text = value => typeof value === 'string' && value.trim() ? value.trim() : null;
const email = value => {
  const result = text(value)?.toLowerCase();
  return result && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result) ? result : null;
};

// An authenticated API response is a separate evidence source, never a webhook.
// This function returns only an allowlisted report, never raw identities/values.
export function inspectCharge(rawBody, expectedChargeId) {
  const charge = object(JSON.parse(rawBody));
  const order = object(charge.order);
  const chargeOrderId = text(charge.order_id);
  const nestedOrderId = text(order.id);
  const chargeBusiness = text(charge.business_id);
  const orderBusiness = text(order.business_id);
  const chargeEmail = email(object(charge.customer).email);
  const orderEmail = email(object(order.customer).email);
  const lineItems = Array.isArray(order.line_items) ? order.line_items : null;
  const productIds = new Set((lineItems ?? []).map(object)
    .filter(item => text(item.item_type)?.toLowerCase() === 'product')
    .map(item => text(item.related_id)));
  const amount = typeof charge.amount === 'number' ? charge.amount
    : typeof charge.amount === 'string' && /^\d+(\.\d+)?$/.test(charge.amount) ? Number(charge.amount) : null;
  const checks = {
    requestedChargeMatches: text(charge.id) === text(expectedChargeId) && !!text(expectedChargeId),
    statusSucceeded: text(charge.status)?.toLowerCase() === 'succeeded',
    historicalOrder1007AmountMyr50: amount === 50,
    currencyMyr: text(charge.currency)?.toUpperCase() === 'MYR',
    merchantPresentAndMatches: !!(chargeBusiness ?? orderBusiness)
      && (chargeBusiness === null || chargeBusiness === businessId)
      && (orderBusiness === null || orderBusiness === businessId),
    orderIdentityPresentAndConsistent: !!(chargeOrderId ?? nestedOrderId)
      && !(chargeOrderId && nestedOrderId && chargeOrderId !== nestedOrderId),
    purchaserEmailPresentAndConsistent: !!(chargeEmail ?? orderEmail)
      && !(chargeEmail && orderEmail && chargeEmail !== orderEmail)
      && !(object(charge.customer).email != null && chargeEmail === null)
      && !(object(order.customer).email != null && orderEmail === null),
    exactProductLineItems: lineItems !== null && productIds.size === 1 && productIds.has(productId),
  };
  return {
    purpose: 'historical_order_1007_read_only_verification',
    evidenceSource: 'charge_response_analysis_only',
    transportEvidence: 'NOT_ASSERTED_BY_ANALYZER',
    endpoint: 'GET https://api.hit-pay.com/v1/charges/{redacted}',
    responseSha256: createHash('sha256').update(rawBody).digest('hex'),
    checks,
    completeChargeEvidence: Object.values(checks).every(Boolean),
    webhookSignatureEvidence: 'NOT_OBSERVED_BY_CHARGE_API',
    releaseGate: 'CLOSED_REQUIRES_GENUINE_WEBHOOK_AND_HOSTED_ACCESS_VERIFICATION',
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    let input = '';
    for await (const chunk of process.stdin) {
      input += chunk;
      if (input.length > 2_000_000) throw new Error('Oversized input');
    }
    const request = JSON.parse(input);
    process.stdout.write(JSON.stringify(inspectCharge(request.rawBody, request.chargeId), null, 2) + '\n');
  } catch {
    process.stderr.write('Charge evidence could not be inspected. No response data was printed.\n');
    process.exitCode = 1;
  }
}

