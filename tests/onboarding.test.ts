import test from 'node:test';
import assert from 'node:assert/strict';
import nodemailer from 'nodemailer';
import { runOnboarding, type Delivery } from '../lib/onboarding/delivery.ts';
import { onboardingKinds, onboardingMessage, onboardingMail, onboardingSender } from '../lib/onboarding/messages.ts';
import { onboardingMayDispatch, onboardingReleaseGates } from '../lib/onboarding/gates.ts';
import { onboardingSmtpOptions, sendOnboardingSmtp, verifyOnboardingSmtp, type SmtpTransport } from '../lib/onboarding/smtp.ts';

const delivery: Delivery = {
  id:'11111111-1111-4111-8111-111111111111',purchase_email:'buyer@example.com',kind:'initial',
  attempt_id:'22222222-2222-4222-8222-222222222222',
};
const verify = async () => {};
const mail = onboardingMail(delivery.purchase_email, delivery.id, delivery.kind);
const acceptedReceipt = {
  messageId: mail.messageId, accepted: [mail.to.address], rejected: [],
  envelope: mail.envelope, response: '250 2.0.0 Accepted private queue reference',
};
const transport = (outcome: unknown): SmtpTransport => ({
  verify: async () => true,
  sendMail: async () => outcome,
  close: () => {},
});

test('onboarding messages preserve HitPay package delivery and encode the required sender safely', async () => {
  for (const kind of onboardingKinds) {
    assert.ok(onboardingMessage(kind).text.includes('brossell@bolehejas.com'));
    assert.ok(onboardingMessage(kind).text.includes('Menjelaskan, bukan Memujuk.'));
    assert.ok(!/RM99|RM100|lifetime/i.test(onboardingMessage(kind).text));
  }
  const info = await nodemailer.createTransport({ streamTransport: true, buffer: true, newline: 'windows' }).sendMail(mail);
  const mime = info.message.toString();
  const headers = mime.split('\r\n\r\n')[0].replace(/\r\n[ \t]+/g, ' ');
  assert.match(headers, /^From: .*<brossell@bolehejas.com>$/m);
  assert.match(mime,/Reply-To: brossell@bolehejas.com/);
  assert.match(mime,/Content-Transfer-Encoding: base64/);
  assert.equal(info.envelope.from, onboardingSender);
  assert.deepEqual(info.envelope.to, [delivery.purchase_email]);
  assert.equal(info.messageId, mail.messageId);
  assert.equal(onboardingMail(delivery.purchase_email, delivery.id, delivery.kind).messageId, mail.messageId);
  assert.ok(!mime.includes('bolehejassolutions@gmail.com'));
  for (const recipient of ['buyer@example.com\r\nBcc: other@example.com', 'buyer@example.com,other@example.com', 'Buyer <buyer@example.com>', '..buyer@example.com']) {
    assert.throws(()=>onboardingMail(recipient,delivery.id,'initial'));
  }
  assert.throws(()=>onboardingMail(delivery.purchase_email,'-'.repeat(36),'initial'));
});

test('onboarding dispatch is disabled by default and every release gate fails closed', () => {
  assert.equal(onboardingMayDispatch({}), false);
  const env = Object.fromEntries(onboardingReleaseGates.map(gate => [gate,'true']));
  assert.equal(onboardingMayDispatch({ ...env, BROS_ONBOARDING_ENABLED: 'false' }), false);
  assert.equal(onboardingMayDispatch({ ...env, BROS_ONBOARDING_ENABLED: 'true' }), true);
  for (const gate of onboardingReleaseGates) {
    for (const value of [undefined,'false','TRUE']) {
      assert.throws(()=>onboardingMayDispatch({ ...env, BROS_ONBOARDING_ENABLED: 'true', [gate]: value }), /release gates/);
    }
  }
});

test('SMTP TLS settings pin host, authentication identity, certificate validation and private logging', () => {
  const options = onboardingSmtpOptions({ BROS_SMTP_PASSWORD: 'fixture-only' });
  assert.equal(options.host, 'mail.bolehejas.com');
  assert.equal(options.port, 465);
  assert.equal(options.secure, true);
  assert.equal(options.auth.user, onboardingSender);
  assert.deepEqual(options.tls, { servername: 'mail.bolehejas.com', rejectUnauthorized: true, minVersion: 'TLSv1.2' });
  assert.equal(options.logger, false);assert.equal(options.debug, false);assert.equal(options.transactionLog, false);
  assert.equal(options.disableFileAccess, true);assert.equal(options.disableUrlAccess, true);
  assert.equal(options.maxRecipients, 1);
  assert.throws(()=>onboardingSmtpOptions({}), /configuration/);
  for (const [key,value] of [['BROS_SMTP_HOST','other.example'],['BROS_SMTP_PORT','587'],['BROS_SMTP_USERNAME','other@example.com']]) {
    assert.throws(()=>onboardingSmtpOptions({ BROS_SMTP_PASSWORD: 'fixture-only', [key]: value }), /configuration/);
  }
});

test('SMTP authentication failure is sanitized and cannot claim a customer message', async () => {
  let claims=0;let sends=0;
  const smtp: SmtpTransport = {
    verify: async()=>{throw new Error('private password and server response');},
    sendMail: async()=>{sends++;return acceptedReceipt;},close:()=>{},
  };
  await assert.rejects(runOnboarding({
    verify:()=>verifyOnboardingSmtp(smtp),
    claim:async()=>{claims++;return delivery;},prepare:async()=>true,
    send:message=>sendOnboardingSmtp(message,smtp),finish:async()=>{},
  }), { message: 'Onboarding SMTP TLS or authentication verification failed.' });
  assert.equal(claims,0);assert.equal(sends,0);
  await assert.rejects(verifyOnboardingSmtp({ ...smtp, verify:async()=>false }), /SMTP TLS or authentication/);
});

test('the SMTP transport recipient limit rejects an additional envelope recipient before delivery', async () => {
  const smtp = nodemailer.createTransport({
    ...onboardingSmtpOptions({ BROS_SMTP_PASSWORD: 'fixture-only' }),
    streamTransport: true, buffer: true,
  });
  await assert.rejects(smtp.sendMail({
    ...mail, envelope: { from: onboardingSender, to: [mail.to.address,'other@example.com'] },
  }), { code: 'EMAXRECIPIENTS' });
});

test('successful SMTP authentication runs before the first queue claim', async () => {
  const sequence: string[]=[];
  await runOnboarding({
    verify:async()=>{sequence.push('verified');},claim:async()=>{sequence.push('claimed');return null;},
    prepare:async()=>true,send:async()=>({status:'uncertain'}),finish:async()=>{},
  });
  assert.deepEqual(sequence,['verified','claimed']);
});
test('activation after reservation suppresses an unsent reminder', async () => {
  let sends=0;let claimed=false;
  const totals=await runOnboarding({verify,claim:async()=>{if(claimed)return null;claimed=true;return delivery;},prepare:async()=>false,
    send:async()=>{sends++;return {status:'sent',providerMessageId:'message-1'};},finish:async()=>{throw new Error('must not finish');}});
  assert.equal(sends,0);assert.equal(totals.suppressed,1);
});
test('ambiguous sends are recorded without automatic retry', async () => {
  let sends=0; let state='pending';
  const deps={verify,claim:async()=>{if(state!=='pending')return null;state='sending';return delivery;},prepare:async()=>true,
    send:async()=>{sends++;throw new Error('timeout after acceptance');},
    finish:async(_d:Delivery,r:{status:string})=>{state=r.status;}};
  assert.equal((await runOnboarding(deps)).uncertain,1);
  await runOnboarding(deps);assert.equal(sends,1);assert.equal(state,'uncertain');
});
test('receipt failure leaves reservation intact instead of re-sending', async () => {
  let reserved=false;let sends=0;
  const deps={verify,claim:async()=>{if(reserved)return null;reserved=true;return delivery;},prepare:async()=>true,
    send:async()=>{sends++;return {status:'sent' as const,providerMessageId:'message-1'};},
    finish:async()=>{throw new Error('database unavailable');}};
  await assert.rejects(runOnboarding(deps));await runOnboarding(deps);assert.equal(sends,1);
});
test('SMTP receipt requires DATA acceptance and does not expose the server response', async () => {
  assert.deepEqual(await sendOnboardingSmtp(mail,transport(acceptedReceipt)),{status:'sent',providerMessageId:mail.messageId});
  for (const receipt of [
    { ...acceptedReceipt, response: '' },
    { ...acceptedReceipt, response: '354 Continue' },
    { ...acceptedReceipt, accepted: [] },
    { ...acceptedReceipt, accepted: [mail.to.address,'other@example.com'] },
    { ...acceptedReceipt, rejected: [mail.to.address] },
    { ...acceptedReceipt, messageId: 'different-generated-id' },
    { ...acceptedReceipt, envelope: { from: 'other@example.com', to: [mail.to.address] } },
    { ...acceptedReceipt, envelope: { from: onboardingSender, to: ['other@example.com'] } },
    { messageId: mail.messageId },null,
  ]) {
    assert.deepEqual(await sendOnboardingSmtp(mail,transport(receipt)),{status:'uncertain'});
  }
});

test('SMTP explicit rejection is failed while timeout or disconnected acceptance is uncertain', async () => {
  for (const error of [
    { code:'EAUTH',command:'AUTH PLAIN',responseCode:535 },
    { code:'EENVELOPE',command:'RCPT TO',responseCode:550 },
    { code:'EENVELOPE',command:'DATA',responseCode:554 },
    { code:'EMESSAGE',command:'DATA',responseCode:554 },
  ]) {
    const smtp = { ...transport(null),sendMail:async()=>{throw { ...error,message:'private server response' };} };
    assert.deepEqual(await sendOnboardingSmtp(mail,smtp),{status:'failed'});
  }
  for (const error of [
    { code:'ETIMEDOUT',command:'DATA',message:'private response' },
    { code:'ECONNECTION',command:'DATA' },
    { code:'EMESSAGE',command:'DATA' },new Error('connection lost after server acceptance'),
  ]) {
    const smtp = { ...transport(null),sendMail:async()=>{throw error;} };
    assert.deepEqual(await sendOnboardingSmtp(mail,smtp),{status:'uncertain'});
  }
});

test('an early receipt failure leaves later messages available to the next worker', async () => {
  const pending=[delivery,{...delivery,id:'33333333-3333-4333-8333-333333333333'}];
  const reserved:string[]=[];const sent:string[]=[];let failReceipt=true;
  const deps={
    verify,
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
    verify,
    claim:async()=>{claims++;return pending.shift()??null;},
    prepare:async()=>{throw new Error('preparation unavailable');},
    send:async()=>{sends++;return {status:'sent',providerMessageId:'fixture-id'};},
    finish:async()=>{throw new Error('must not finish');},
  }));
  assert.equal(claims,1);assert.equal(sends,0);assert.equal(pending.length,1);
});
