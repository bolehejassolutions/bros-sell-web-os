// Start the two fixture servers before running. These tests exercise real Next routes.
import test from 'node:test';
import assert from 'node:assert/strict';
import { fixtureCookie } from './fixtures/session.ts';
import { exampleCase, recordAction, recordOutcome } from '../lib/bros-sell/sales-case.ts';
const base='http://127.0.0.1:3007';
function headers(user:'a'|'b'|'c') { const c=fixtureCookie(user); return {'Content-Type':'application/json',Cookie:`${c.name}=${c.value}`}; }

test('HTTP account persistence, ownership, concurrency, input validation and entitlement gates', async () => {
  const anonymous=await fetch(`${base}/api/sales-cases`); assert.equal(anonymous.status,401); assert.equal(anonymous.headers.get('cache-control'),'private, no-store');
  const denied=await fetch(`${base}/api/sales-cases`,{headers:headers('c')}); assert.equal(denied.status,403);
  const create=await fetch(`${base}/api/sales-cases`,{method:'POST',headers:headers('a'),body:JSON.stringify({document:exampleCase()})});
  assert.equal(create.status,201,await create.clone().text()); const row=(await create.json()).case;
  assert.equal(row.revision,1); assert.equal(row.owner_id,undefined);
  const cross=await fetch(`${base}/api/sales-cases/${row.id}`,{method:'PUT',headers:headers('b'),body:JSON.stringify({revision:1,document:row.document})}); assert.equal(cross.status,404,await cross.clone().text());
  const listB=await fetch(`${base}/api/sales-cases`,{headers:headers('b')}); assert.equal((await listB.json()).cases.some((r:{id:string})=>r.id===row.id),false);
  const changed=recordOutcome(recordAction(row.document,'Sent clarification','follow-up'),'price_objection','Buyer said mahal; meaning unknown',null);
  const saved=await fetch(`${base}/api/sales-cases/${row.id}`,{method:'PUT',headers:headers('a'),body:JSON.stringify({revision:1,document:changed})});
  assert.equal(saved.status,200,await saved.clone().text()); const version=(await saved.json()).case; assert.equal(version.revision,2);
  const stale=await fetch(`${base}/api/sales-cases/${row.id}`,{method:'PUT',headers:headers('a'),body:JSON.stringify({revision:1,document:row.document})}); assert.equal(stale.status,409);
  const refresh=await fetch(`${base}/api/sales-cases`,{headers:headers('a')}); const loaded=(await refresh.json()).cases.find((r:{id:string})=>r.id===row.id);
  assert.equal(loaded.document.history.length,2); assert.equal(loaded.document.observation,'price_objection');
  for (const body of [null,{},[],{document:{...exampleCase(),tools:{'follow-up':{draft:{invalid:true}}}}}]) {
    const invalid=await fetch(`${base}/api/sales-cases`,{method:'POST',headers:headers('a'),body:JSON.stringify(body)}); assert.equal(invalid.status,400);
  }
  assert.equal((await fetch(`${base}/api/sales-cases?page=-1`,{headers:headers('a')})).status,400);
  assert.equal((await fetch(`${base}/api/customer/closing-os`)).status,401);
  assert.equal((await fetch(`${base}/api/customer/closing-os`,{headers:headers('c')})).status,403);
  const app=await fetch(`${base}/app`,{headers:headers('a')}); assert.equal(app.status,200); assert.match(await app.text(),/Mulakan dengan satu situasi sebenar/);
  const unavailable=await fetch(`${base}/app`,{headers:headers('c'),redirect:'manual'}); assert.equal(unavailable.status,307); assert.equal(new URL(unavailable.headers.get('location')!,base).pathname,'/activate');
  const recovery=await fetch(`${base}/activate`); assert.equal(recovery.status,200);
  const recoveryHtml=await recovery.text();
  assert.match(recoveryHtml,/Akses akaun perlu disemak/);
  assert.match(recoveryHtml,/mailto:brossell%40bolehejas\.com\?subject=BROS%20SELL%20access%20recovery/);
  assert.match(recoveryHtml,/menggunakan email pembelian/);
  assert.match(recoveryHtml,/rujukan pesanan atau resit HitPay/);
  assert.match(recoveryHtml,/Jangan hantar password, OTP atau maklumat kad/);
  assert.match(recoveryHtml,/30 hari kalendar dari tarikh pembelian/);
  assert.match(recoveryHtml,/HitPay menghantar pakej pelanggan/);
});
