// Full offline journey with isolated synthetic sessions and database only.
// No real customer data, private HitPay account, or live Supabase secrets.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { fixtureCookie } from './fixtures/session.ts';
import { exampleCase, type SalesCase } from '../lib/bros-sell/sales-case.ts';

const base = 'http://127.0.0.1:3007';
const password = 'Safe-offline-test-phrase-2026';
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'allow' });
const a = fixtureCookie('a');
const b = fixtureCookie('b');
const cookie = async (value: typeof a) =>
  context.addCookies([{ ...value, url: base, sameSite: 'Lax' }]);
const page = await context.newPage();
const errors: string[] = [];
page.on('pageerror', failure => errors.push(failure.message));
async function remoteCreate() {
  const response = await context.request.post(base + '/api/sales-cases', { data: { document: exampleCase() } });
  assert.equal(response.status(), 201, await response.text());
  return ((await response.json()) as { case: SalesCase }).case;
}
async function remoteRead(id: string) {
  const response = await context.request.get(base + '/api/sales-cases');
  assert.equal(response.status(), 200);
  const body = await response.json() as { cases: SalesCase[] };
  return body.cases.find(row => row.id === id);
}
async function waitUntil(condition: () => Promise<boolean>, label: string) {
  for (let i = 0; i < 60; i++) {
    if (await condition()) return;
    await new Promise(resolve => setTimeout(resolve, 180));
  }
  throw new Error('Timed out: ' + label);
}
async function openVault() {
  await page.goto(base + '/offline.html');
  await page.locator('#account').selectOption({ index: 1 });
  await page.locator('#password').fill(password);
  await page.locator('#unlockButton').click();
  await page.locator('#workspace').waitFor({ state: 'visible' });
}
try {
  await cookie(a);
  const original = await remoteCreate();
  assert.equal(original.revision, 1);
  await page.goto(base + '/app');
  const form = page.locator('.offline-controls');
  await form.locator('#offline-phrase').fill(password);
  await form.locator('#offline-confirm').fill(password);
  await form.getByRole('button', { name: 'Sediakan offline' }).click();
  await form.getByRole('status').getByText(/case tersedia pada peranti/).waitFor();
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await openVault();
  await page.locator('#cases').selectOption(original.id);
  assert.equal(await page.locator('#title').inputValue(), original.document.title);
  await context.setOffline(true);
  const offlineTitle = 'Draf offline yang tersimpan';
  await page.locator('#title').fill(offlineTitle);
  await page.getByText('Draft telah disulitkan dan disimpan', { exact: false }).waitFor();
  await page.reload();
  await page.locator('#account').selectOption({ index: 1 });
  await page.locator('#password').fill(password);
  await page.locator('#unlockButton').click();
  await page.locator('#workspace').waitFor({ state: 'visible' });
  await page.locator('#cases').selectOption(original.id);
  assert.equal(await page.locator('#title').inputValue(), offlineTitle,
    'Offline edit survives reload without authenticated server response');

  // The service worker must serve ONLY the static editor on failed /app navigation,
  // and must not cache authenticated pages, APIs, tokens, protected PDF or ZIP.
  await page.goto(base + '/app');
  await page.getByRole('heading', { name: 'Sales Case — Mod Offline' }).waitFor();
  const cachedPaths = await page.evaluate(async () => {
    const cache = await caches.open('bros-sell-offline-editor-v1');
    return (await cache.keys()).map(request => new URL(request.url).pathname).sort();
  });
  assert.deepEqual(cachedPaths, ['/offline-app.js', '/offline-store.js', '/offline.html']);

  // Restore actual authenticated connectivity and synchronize the queued edit.
  await context.setOffline(false);
  await page.locator('#account').selectOption({ index: 1 });
  await page.locator('#password').fill(password);
  await page.locator('#unlockButton').click();
  await page.locator('#workspace').waitFor({ state: 'visible' });
  await waitUntil(async () => (await remoteRead(original.id))?.document.title === offlineTitle, 'offline draft sync');

  // A concurrent remote revision must block stale offline overwrite.
  await context.setOffline(true);
  await page.locator('#title').fill('Local edit must not overwrite remote revision');
  await page.getByText('Draft telah disulitkan dan disimpan', { exact: false }).waitFor();
  const second = await browser.newContext();
  try {
    await second.addCookies([{ ...a, url: base, sameSite: 'Lax' }]);
    const remote = await second.request.get(base + '/api/sales-cases');
    const latest = ((await remote.json()) as { cases: SalesCase[] }).cases.find(row => row.id === original.id)!;
    const different = { ...latest.document, title: 'Concurrent server update wins' };
    const response = await second.request.put(base + '/api/sales-cases/' + original.id, {
      data: { revision: latest.revision, document: different }
    });
    assert.equal(response.status(), 200);
  } finally { await second.close(); }
  await context.setOffline(false);
  await page.getByRole('button', { name: 'Segerakkan perubahan (online)' }).click();
  await waitUntil(async () => (await page.locator('#caseMeta').textContent() || '').includes('KONFLIK'), 'conflict banner');
  assert.equal((await remoteRead(original.id))?.document.title, 'Concurrent server update wins');

  // Another account cannot synchronize this user's encrypted draft.
  await cookie(b);
  await page.getByRole('button', { name: 'Segerakkan perubahan (online)' }).click();
  await page.getByText('Akaun berbeza. Sync disekat', { exact: false }).waitFor();
  assert.equal((await remoteRead(original.id))?.id, undefined,
    'Cross-account Sales Case request must not reveal another tenant');

  // Explicit local deletion removes the per-account encrypted vault.
  page.once('dialog', dialog => void dialog.accept());
  await page.getByRole('button', { name: 'Padam semua data offline akaun ini' }).click();
  await page.getByText('Simpanan offline akaun telah dipadam', { exact: false }).waitFor();
  await page.reload();
  await waitUntil(async () => (await page.locator('#account option').first().textContent())?.includes('Tiada simpanan offline') ?? false,
    'deleted vault must not appear in account selector');
  assert.equal(await page.locator('#unlockButton').isDisabled(), true);
  assert.deepEqual(errors, []);
  console.log('Offline browser PASS: enrollment, encrypted local save, offline refresh/fallback, sync, revision conflict, account isolation, explicit deletion');
} finally {
  await context.setOffline(false);
  await context.close();
  await browser.close();
}