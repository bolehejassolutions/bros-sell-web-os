// A signed fixture order enters the normal HTTP route before the buyer's
// confirmed fixture account exists. PostgreSQL enforces the real claim and RLS.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { fixtureCookie, fixtureUsers } from './fixtures/session.ts';

const app = 'http://127.0.0.1:3007';
const database = 'http://127.0.0.1:54329';
const buyer = fixtureUsers.paid.email;
const charge = {
  id: 'fixture-paid-charge', order_id: 'fixture-paid-order', status: 'succeeded',
  business_id: 'fixture-business', amount: 100, currency: 'MYR', customer: {email: buyer},
  order: {
    id: 'fixture-paid-order', business_id: 'fixture-business', customer: {email: buyer},
    line_items: [{item_type: 'product', related_id: 'fixture-product'}],
  },
};

async function submit(payload: unknown) {
  const body = JSON.stringify(payload);
  return fetch(`${app}/api/webhooks/hitpay`, {
    method: 'POST', body, headers: {
      'content-type': 'application/json', 'hitpay-event-object': 'charge', 'hitpay-event-type': 'created',
      'hitpay-signature': createHmac('sha256', 'local-fixture-grant-salt').update(body).digest('hex'),
    },
  });
}

function cookie(key: keyof typeof fixtureUsers) {
  const {name,value} = fixtureCookie(key);
  return {cookie:`${name}=${value}`};
}

async function readOrders(key: keyof typeof fixtureUsers) {
  const {value} = fixtureCookie(key);
  const { access_token } = JSON.parse(Buffer.from(value.slice('base64-'.length),'base64url').toString());
  const response = await fetch(`${database}/rest/v1/bros_sell_payment_orders?select=status,entitlement_id`, {
    headers: {authorization:`Bearer ${access_token}`},
  });
  assert.equal(response.status,200);
  return response.json();
}

test('per-order payment reaches confirmed buyer workspace and protected book after checkout and retry', async () => {
  assert.equal((await submit({...charge,order:{...charge.order,id:'unrelated-order'}})).status,400);
  assert.equal((await submit({...charge,order:{...charge.order,business_id:'other-business'}})).status,403);
  assert.equal((await submit({...charge,order:{...charge.order,customer:{email:'other@example.test'}}})).status,422);
  assert.equal((await submit({...charge,line_items:charge.order.line_items,order:{...charge.order,line_items:[]}})).status,422);
  const result = await submit(charge);
  assert.equal(result.status,200);
  assert.equal((await result.json()).result.claimed,false);
  assert.equal((await (await submit(charge)).json()).result.status,'duplicate');
  const wrong = await fetch(`${app}/api/customer/closing-os`,{headers:cookie('c'),redirect:'manual'});
  assert.equal(wrong.status,403);
  assert.deepEqual(await readOrders('c'),[]);

  const library = await fetch(`${app}/app/resources`,{headers:cookie('paid'),redirect:'manual'});
  assert.equal(library.status,200);
  const html = await library.text();
  assert.match(html,/Buka buku PDF/);
  // A streamed redirect can also start as HTTP 200.
  assert.doesNotMatch(html,/NEXT_REDIRECT|http-equiv="refresh"/i);
  const protectedBook = await fetch(`${app}/api/customer/closing-os`,{headers:cookie('paid'),redirect:'manual'});
  assert.equal(protectedBook.status,307);
  assert.match(protectedBook.headers.get('location') ?? '', /BROS_SELL_02_Closing_OS_v2\.5\.pdf\?token=/);
  const orders = await readOrders('paid');
  assert.equal(orders.length,1);
  assert.equal(orders[0].status,'paid');
  assert.match(orders[0].entitlement_id,/^[a-f0-9-]{36}$/);
  assert.equal((await fetch(`${app}/app`,{headers:cookie('paid'),redirect:'manual'})).status,200);
  assert.deepEqual(await readOrders('paid'),orders);
  assert.deepEqual(await readOrders('c'),[]);
});

test('an unusable sign-in link returns to a working purchase-email recovery page',async () => {
  const response = await fetch(`${app}/auth/confirm?type=magiclink&token_hash=expired-fixture`);
  assert.equal(new URL(response.url).pathname,'/login');
  assert.equal(new URL(response.url).searchParams.get('error'),'auth_confirm_failed');
  const html = await response.text();
  assert.match(html,/Minta pautan baharu dengan emel pembelian anda/);
  assert.match(html,/Hantar Magic Link/);
  assert.match(html,/href="\/activate"/);
});
