import test from 'node:test';
import assert from 'node:assert/strict';
import { runOnboarding, sendGmail, type Delivery } from '../lib/onboarding/delivery.ts';
import { onboardingKinds, onboardingMessage, onboardingMime } from '../lib/onboarding/messages.ts';

const delivery: Delivery = {
  id:'11111111-1111-4111-8111-111111111111',purchase_email:'buyer@example.com',kind:'initial',
  attempt_id:'22222222-2222-4222-8222-222222222222',
};
test('onboarding messages distinguish HitPay package delivery and Web OS, with safe MIME', () => {
  for (const kind of onboardingKinds) {
    assert.ok(onboardingMessage(kind).text.includes('brossell@bolehejas.com'));
    assert.ok(onboardingMessage(kind).text.includes('Menjelaskan, bukan Memujuk.'));
    assert.ok(!/RM99|RM100|lifetime/i.test(onboardingMessage(kind).text));
  }
  const mime = Buffer.from(onboardingMime('buyer@example.com',delivery.id,'initial'),'base64url').toString();
  assert.match(mime,/Reply-To: brossell@bolehejas.com/);
  assert.match(mime,/Content-Transfer-Encoding: base64/);
  assert.throws(()=>onboardingMime('buyer@example.com\r\nBcc: other@example.com',delivery.id,'initial'));
});
test('activation after reservation suppresses an unsent reminder', async () => {
  let sends=0;let claimed=false;
  const totals=await runOnboarding({claim:async()=>{if(claimed)return null;claimed=true;return delivery;},prepare:async()=>false,
    send:async()=>{sends++;return {status:'sent',providerMessageId:'message-1'};},finish:async()=>{throw new Error('must not finish');}});
  assert.equal(sends,0);assert.equal(totals.suppressed,1);
});
test('ambiguous sends are recorded without automatic retry', async () => {
  let sends=0; let state='pending';
  const deps={claim:async()=>{if(state!=='pending')return null;state='sending';return delivery;},prepare:async()=>true,
    send:async()=>{sends++;throw new Error('timeout after acceptance');},
    finish:async(_d:Delivery,r:{status:string})=>{state=r.status;}};
  assert.equal((await runOnboarding(deps)).uncertain,1);
  await runOnboarding(deps);assert.equal(sends,1);assert.equal(state,'uncertain');
});
test('receipt failure leaves reservation intact instead of re-sending', async () => {
  let reserved=false;let sends=0;
  const deps={claim:async()=>{if(reserved)return null;reserved=true;return delivery;},prepare:async()=>true,
    send:async()=>{sends++;return {status:'sent' as const,providerMessageId:'message-1'};},
    finish:async()=>{throw new Error('database unavailable');}};
  await assert.rejects(runOnboarding(deps));await runOnboarding(deps);assert.equal(sends,1);
});
test('Gmail outcomes do not expose response bodies or retry uncertain acceptance', async () => {
  const mock=(response:Response)=>async()=>response;
  assert.deepEqual(await sendGmail('fixture','fixture-token',mock(new Response('{"id":"message-1"}',{status:200})) as typeof fetch),{status:'sent',providerMessageId:'message-1'});
  assert.deepEqual(await sendGmail('fixture','fixture-token',mock(new Response('private rejection',{status:403})) as typeof fetch),{status:'failed'});
  assert.deepEqual(await sendGmail('fixture','fixture-token',mock(new Response('private upstream error',{status:503})) as typeof fetch),{status:'uncertain'});
});

test('an early receipt failure leaves later messages available to the next worker', async () => {
  const pending=[delivery,{...delivery,id:'33333333-3333-4333-8333-333333333333'}];
  const reserved:string[]=[];const sent:string[]=[];let failReceipt=true;
  const deps={
    claim:async()=>{const next=pending.shift()??null;if(next)reserved.push(next.id);return next;},
    prepare:async()=>true,
    send:async()=>{sent.push(reserved.at(-1)!);return {status:'sent' as const,providerMessageId:'fixture-id'};},
    finish:async()=>{if(failReceipt)throw new Error('receipt unavailable');},
  };
  await assert.rejects(runOnboarding(deps));
  assert.equal(reserved.length,1);assert.equal(pending.length,1);
  failReceipt=false;
  assert.equal((await runOnboarding(deps)).sent,1);
  assert.deepEqual(sent,[delivery.id,'33333333-3333-4333-8333-333333333333']);
});
test('a preparation failure never reserves the following message', async () => {
  const pending=[delivery,{...delivery,id:'33333333-3333-4333-8333-333333333333'}];
  let claims=0;let sends=0;
  await assert.rejects(runOnboarding({
    claim:async()=>{claims++;return pending.shift()??null;},
    prepare:async()=>{throw new Error('preparation unavailable');},
    send:async()=>{sends++;return {status:'sent',providerMessageId:'fixture-id'};},
    finish:async()=>{throw new Error('must not finish');},
  }));
  assert.equal(claims,1);assert.equal(sends,0);assert.equal(pending.length,1);
});
