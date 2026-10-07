// Synthetic HTTP requests to the loopback production bundle, never HitPay or live Supabase.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';

const base = 'http://127.0.0.1:3007';
const salt = 'isolated-capture-test-salt';
const payload = {
  id: 'fixture-charge', business_id: 'fixture-business', status: 'succeeded',
  amount: 100, currency: 'MYR', customer: { email: 'capture@example.test' },
  order: { id: 'fixture-order', line_items: [{ item_type: 'product', related_id: 'fixture-product' }] },
};
function post(raw: string, overrides: Record<string, string> = {}, signingSalt = salt) {
  return fetch(`${base}/api/webhooks/hitpay/capture`, {
    method: 'POST', body: raw,
    headers: {
      'content-type': 'application/json', 'hitpay-event-object': 'charge', 'hitpay-event-type': 'created',
      'hitpay-signature': createHmac('sha256', signingSalt).update(raw).digest('hex'), ...overrides,
    },
  });
}

test('capture validates signatures and merchant identity without exposing buyer data or enabling grants', async () => {
  const raw = JSON.stringify(payload);
  const accepted = await post(raw);
  assert.equal(accepted.status, 200);
  const result = await accepted.json();
  assert.equal(result.captureOnly, true);
  assert.equal(result.received, true);
  assert.deepEqual(result.mapped, {
    paymentIdentity: true, orderIdentity: true, buyerIdentity: true, productIdentity: true,
    merchantIdentity: true, amount: true, currency: true,
  });
  assert.match(result.fingerprint, /^[a-f0-9]{64}$/);
  assert.equal(JSON.stringify(result).includes(payload.customer.email), false);
  assert.equal(result.entitlement_id, undefined);
  assert.equal((await (await post(raw)).json()).fingerprint, result.fingerprint);
  assert.equal((await post(raw, { 'hitpay-signature': '' })).status, 401);
  assert.equal((await post(raw, { 'hitpay-signature': 'invalid' })).status, 401);
  assert.equal((await post(raw, {}, 'wrong-endpoint-salt')).status, 401);
  const originalSignature = createHmac('sha256', salt).update(raw).digest('hex');
  assert.equal((await post(raw + ' ', { 'hitpay-signature': originalSignature })).status, 401);
  assert.equal((await post(JSON.stringify({ ...payload, business_id: 'other-merchant' }))).status, 403);
  assert.equal((await post(raw, { 'content-type': 'text/plain' })).status, 415);
  for (const invalid of ['{', 'null', '[]']) assert.equal((await post(invalid)).status, 400);
  const ignored = await (await post(raw, { 'hitpay-event-type': 'updated' })).json();
  assert.deepEqual(ignored, { received: true, ignored: true });
  const incomplete = await (await post(JSON.stringify({ business_id: 'fixture-business' }))).json();
  assert.equal(incomplete.captureOnly, true);
  assert.equal(incomplete.mapped.buyerIdentity, false);
  assert.equal(incomplete.mapped.productIdentity, false);
  // Capture-only release must not accidentally include the grant-capable route.
  const grant = await fetch(`${base}/api/webhooks/hitpay`, { method: 'POST', body: raw });
  assert.equal(grant.status, 404);
});
