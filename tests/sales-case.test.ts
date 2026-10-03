import test from 'node:test';
import assert from 'node:assert/strict';
import { DIMENSIONS, diagnoseCase, exampleCase, newCase, recordAction, recordOutcome, reopenCase, isCaseDocument, pendingAction, casePriority, type SalesCase } from '../lib/bros-sell/sales-case.ts';
import { readToolValue, writeToolValue } from '../lib/bros-sell/case-tool-data.ts';

test('RM500 silence preserves unknown intent and five missing qualification dimensions', () => {
  const doc = exampleCase(); const d = diagnoseCase(doc);
  assert.equal(d.stage, 'FOLLOW-UP'); assert.equal(d.leadState, 'Engaged');
  assert.equal(d.missing.length, 5); assert.match(d.why, /tidak membuktikan/);
  assert.equal(isCaseDocument(doc), true);
});
test('keywords in free text never confirm readiness, access or qualification', () => {
  const doc = newCase('Buyer', 'Budget ready, boss said yes, buy now');
  doc.evidence = 'I think buyer is ready'; doc.observation = 'price_asked';
  const d = diagnoseCase(doc); assert.equal(d.stage, 'OFFER'); assert.equal(d.leadState, 'Engaged'); assert.equal(d.missing.length, 6);
});
test('six distinct confirmed dimensions with notes are required; negative fit stops', () => {
  const doc = exampleCase(); doc.observation = 'replied';
  for (const key of DIMENSIONS) doc.signals[key] = { status: 'confirmed', note: `Observed ${key}` };
  assert.equal(diagnoseCase(doc).leadState, 'Qualified');
  doc.signals.Access.note = ''; assert.notEqual(diagnoseCase(doc).leadState, 'Qualified'); assert.equal(isCaseDocument(doc), false);
  doc.signals.Access = {status:'unknown',note:''}; doc.signals.Fit = {status:'no',note:'Does not solve buyer problem'};
  assert.equal(diagnoseCase(doc).stop, true); assert.throws(() => recordAction(doc, 'Pressure again', 'follow-up'));
});
test('price objection is a diagnosis question, never an automatic budget conclusion', () => {
  const doc = exampleCase(); doc.observation = 'price_objection'; const d = diagnoseCase(doc);
  assert.equal(d.tool, 'objection-playbook'); assert.equal(d.stage, 'VALUE'); assert.match(d.why, /punca sebenar/);
});
test('action must precede outcome, only one pending action, and evidence history is preserved', () => {
  let doc = exampleCase(); const original = doc.evidence;
  assert.throws(() => recordOutcome(doc, 'replied', 'Buyer replied', null));
  doc = recordAction(doc, 'Sent one context clarification', 'follow-up');
  assert.throws(() => recordAction(doc, 'Sent duplicate', 'follow-up'));
  doc = recordOutcome(doc, 'replied', 'Buyer asked what is included', null);
  assert.equal(pendingAction(doc), undefined); assert.equal(doc.history[0].evidenceSnapshot, original);
  assert.equal(doc.history[1].actionId, doc.history[0].id); assert.equal(isCaseDocument(doc), true);
  const duplicate = {...doc, history:[...doc.history, {...doc.history[1],id:crypto.randomUUID()}]};
  assert.equal(isCaseDocument(duplicate), false);
});
test('five actual follow-ups permit the fifth outcome then pause; relevant re-entry resets', () => {
  let doc = exampleCase();
  for (let i=0;i<5;i++) { doc = recordAction(doc, `Context follow-up ${i+1}`, 'follow-up'); doc = recordOutcome(doc, 'no_reply', 'No reply observed', null); }
  assert.equal(diagnoseCase(doc).paused, true); assert.throws(() => recordAction(doc, 'Sixth blind follow-up', 'follow-up'));
  assert.throws(() => reopenCase(doc, '')); doc = reopenCase(doc, 'Buyer requested a callback after new requirement');
  assert.equal(diagnoseCase(doc).paused, false); assert.equal(diagnoseCase(doc).followUpLevel, 'REMIND');
});
test('explicit Yes is a decision, and only confirmed sale moves to MULTIPLY', () => {
  let doc = recordAction(exampleCase(), 'Asked buyer to confirm next step', 'close-path');
  doc = recordOutcome(doc, 'yes', 'Buyer said yes; payment pending', null);
  assert.equal(doc.status, 'active'); assert.equal(diagnoseCase(doc).leadState, 'Decision'); assert.equal(diagnoseCase(doc).stage, 'CLOSE');
  doc = recordAction(doc, 'Confirmed payment', 'close-path'); doc = recordOutcome(doc, 'closed', 'Payment confirmed, order accepted', null);
  assert.equal(diagnoseCase(doc).stage, 'MULTIPLY'); assert.equal(doc.status, 'closed');
  doc = recordAction(doc, 'Checked delivery and customer result', 'customer-multiplication'); doc = recordOutcome(doc, 'resolved', 'Delivery accepted; result verified', null);
  assert.equal(doc.status, 'closed'); assert.equal(isCaseDocument(doc), true); assert.throws(() => reopenCase(doc,'Sell again'));
});
test('No stops; Not Now defers; date is explicit and does not send anything', () => {
  for (const [outcome,status] of [['no','lost'],['not_now','deferred']] as const) {
    const doc = recordOutcome(recordAction(exampleCase(),'Asked relevance','follow-up'),outcome,'Buyer explicitly stated decision','2026-10-09T01:00:00Z');
    assert.equal(doc.status,status); assert.equal(outcome==='no'?diagnoseCase(doc).stop:diagnoseCase(doc).paused,true);
    assert.throws(() => recordAction(doc,'Continue pressure','follow-up'));
  }
});
test('shared facts carry between buyer, offer, value and Analyzer without duplicating stale copies', () => {
  let doc = exampleCase();
  const previous = readToolValue(doc,'buyer-intelligence','answers',{});
  doc = writeToolValue(doc,'buyer-intelligence','answers',{...previous,PROBLEM:'Susah explain skop',IMPACT:'Buyer delays decision'},previous);
  const offer = readToolValue<Record<string,string>>(doc,'offer-stack','values',{});
  assert.equal(offer.PROBLEM,'Susah explain skop');
  doc = writeToolValue(doc,'offer-stack','values',{...offer,INVESTMENT:'RM700'},offer);
  assert.equal(readToolValue<Record<string,string>>(doc,'value-bridge','v',{}).INVESTMENT,'RM700');
  assert.equal(doc.facts.impact,'Buyer delays decision'); assert.equal(isCaseDocument(doc),true);
  assert.equal(readToolValue<Record<string,string>>(exampleCase(),'offer-stack','values',{}).PROBLEM,'');
});
test('malformed documents, typed tool payloads, overrides and bad history are rejected', () => {
  const doc = exampleCase();
  assert.equal(isCaseDocument(null),false); assert.equal(isCaseDocument({...doc,title:''}),false);
  assert.equal(isCaseDocument({...doc,tools:{'follow-up':{draft:{unexpected:true}}}}),false);
  assert.equal(isCaseDocument({...doc,tools:{'whatsapp-scripts':{selected:999}}}),false);
  assert.equal(isCaseDocument({...doc,stageOverride:'CLOSE',stageReason:''}),false);
  const override = {...doc,stageOverride:'BUYER' as const,stageReason:'Need more context'};
  assert.equal(isCaseDocument(override),true); assert.equal(diagnoseCase(override).stage,'BUYER');
});
test('operating priorities put overdue context first and pending results ahead of qualification', () => {
  const row = (doc=exampleCase()): SalesCase => ({id:crypto.randomUUID(),revision:1,created_at:'2026-10-01T00:00:00Z',updated_at:'2026-10-01T00:00:00Z',document:doc});
  const overdue=row(); overdue.document.dueAt='2026-10-01T00:00:00Z';
  assert.equal(casePriority(overdue,Date.parse('2026-10-02T00:00:00Z')).rank,0);
  assert.equal(casePriority(row(recordAction(exampleCase(),'Sent clarification','follow-up'))).rank,1);
});
