import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectCharge } from '../scripts/inspect-hitpay-charge.mjs';

function fixture() {
  return { id: 'fixture-charge', business_id: 'a089a95e-7d0e-4f1b-8d85-425f3c82f460', status: 'succeeded',
    amount: 50, currency: 'myr', customer: { email: 'private-buyer@example.com' }, order_id: 'fixture-order',
    order: { id: 'fixture-order', line_items: [{ item_type: 'product', related_id: 'a2cfb307-366d-4ebc-9ff4-68b6c718e7d6' }] } };
}
const inspect = value => inspectCharge(JSON.stringify(value), 'fixture-charge');

test('complete API field evidence never opens the webhook or hosted customer release gate', () => {
  const report = inspect(fixture());
  assert.equal(report.completeChargeEvidence, true);
  assert.equal(report.evidenceSource, 'charge_response_analysis_only');
  assert.equal(report.transportEvidence, 'NOT_ASSERTED_BY_ANALYZER');
  assert.equal(report.webhookSignatureEvidence, 'NOT_OBSERVED_BY_CHARGE_API');
  assert.match(report.releaseGate, /^CLOSED_/);
  const output = JSON.stringify(report);
  for (const value of ['private-buyer@example.com', 'fixture-charge', 'fixture-order']) assert.ok(!output.includes(value));
});

test('charge-only API response cannot infer product or order from remark, amount or target_id', () => {
  const value = fixture(); delete value.order; delete value.order_id; delete value.business_id;
  value.remark = 'BROS SELL RM50'; value.target_id = 'fixture-order'; value.target_type = 'order';
  const report = inspect(value);
  assert.equal(report.completeChargeEvidence, false);
  assert.equal(report.checks.exactProductLineItems, false);
  assert.equal(report.checks.orderIdentityPresentAndConsistent, false);
  assert.equal(report.checks.merchantPresentAndMatches, false);
});

test('conflicting identities and incorrect commercial fields fail independently', () => {
  for (const [mutate, check] of [
    [x => { x.id = 'other-charge'; }, 'requestedChargeMatches'],
    [x => { x.status = 'pending'; }, 'statusSucceeded'],
    [x => { x.amount = 100; }, 'historicalOrder1007AmountMyr50'],
    [x => { x.currency = 'SGD'; }, 'currencyMyr'],
    [x => { x.order.business_id = 'other-merchant'; }, 'merchantPresentAndMatches'],
    [x => { x.order.id = 'other-order'; }, 'orderIdentityPresentAndConsistent'],
    [x => { x.order.customer = { email: 'other@example.com' }; }, 'purchaserEmailPresentAndConsistent'],
    [x => { x.order.line_items.push({ item_type: 'product', related_id: 'another-product' }); }, 'exactProductLineItems'],
    [x => { x.order.line_items.push({ item_type: 'product' }); }, 'exactProductLineItems'],
  ]) {
    const value = fixture(); mutate(value);
    assert.equal(inspect(value).checks[check], false, check);
    assert.equal(inspect(value).completeChargeEvidence, false, check);
  }
});

test('malformed email and non-scalar values are rejected without leaking them', () => {
  const value = fixture(); value.customer.email = { private: 'secret' }; value.amount = [50];
  const report = inspect(value);
  assert.equal(report.checks.purchaserEmailPresentAndConsistent, false);
  assert.equal(report.checks.historicalOrder1007AmountMyr50, false);
  assert.ok(!JSON.stringify(report).includes('secret'));
});

