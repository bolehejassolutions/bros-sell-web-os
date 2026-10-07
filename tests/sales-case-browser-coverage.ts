// Release assertions for the simplified Web OS experience.
// Synthetic sessions and loopback PGlite verify application behavior, not hosted Auth.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium, type Page } from 'playwright';
import { fixtureCookie } from './fixtures/session.ts';
import type { SalesCase } from '../lib/bros-sell/sales-case.ts';

const base = 'http://127.0.0.1:3007';
await mkdir('test-results', { recursive: true });
const browser = await chromium.launch({ headless: true });
const results: { width: number; passed: string[] }[] = [];
const failures: { width: number; error: string }[] = [];

function field(page: Page, name: string) {
  return page.locator('label').filter({ has: page.getByText(name, { exact: true }) }).locator('input, textarea, select');
}
async function saved(page: Page) {
  await page.getByText('Disimpan dalam akaun', { exact: true }).waitFor();
}
async function persist(page: Page, change: () => Promise<unknown>) {
  const response = page.waitForResponse(r => r.request().method() === 'PUT' && r.url().includes('/api/sales-cases/'));
  await change();
  assert.equal((await response).status(), 200, 'Actual application save must return 200');
  await saved(page);
}
async function openAdvanced(page: Page) {
  const details = page.locator('details.advanced-panel');
  await details.waitFor({ state: 'visible' });
  if (!(await details.evaluate(el => (el as HTMLDetailsElement).open))) {
    await details.locator(':scope > summary').click();
  }
}

async function waitForObservation(page: Page, id: string, observation: string) {
  for (let attempt = 0; attempt < 40; attempt++) {
    const payload = await (await page.request.get(`${base}/api/sales-cases`)).json();
    const row = payload.cases.find((value: SalesCase) => value.id === id);
    if (row?.document.observation === observation) return;
    await page.waitForTimeout(250);
  }
  throw new Error(`Case ${id} did not persist observation ${observation}`);
}
async function layout(page: Page, width: number, name: string) {
  const issues = await page.evaluate(() => {
    const problems: string[] = [];
    if (document.documentElement.scrollWidth > window.innerWidth) problems.push('horizontal overflow');
    for (const el of document.querySelectorAll<HTMLElement>('a, button, input, select, textarea')) {
      if (!el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true, contentVisibilityAuto: true })) continue;
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height || getComputedStyle(el).visibility === 'hidden') continue;
      if (rect.left < -1 || rect.right > window.innerWidth + 1) problems.push(`clipped control: ${el.textContent?.trim() || el.getAttribute('aria-label') || el.tagName}`);
      const target = el instanceof HTMLInputElement && ['checkbox', 'radio'].includes(el.type) ? el.closest('label') ?? el : el;
      const hitArea = target.getBoundingClientRect();
      if (hitArea.width < 16 || hitArea.height < 16) problems.push(`unusable control: ${el.tagName}`);
    }
    if (document.querySelector('[data-nextjs-dialog], nextjs-portal')) problems.push('Next.js error overlay');
    return problems;
  });
  await page.screenshot({ path: `test-results/${name}-${width}.png`, fullPage: true });
  assert.deepEqual(issues, [], `${name} layout at ${width}px`);
}

try {
  for (const width of [360, 390, 430, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    const pageErrors: string[] = [];
    const consoleErrors: { text: string; url: string }[] = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error') consoleErrors.push({ text: message.text(), url: message.location().url });
    });
    await context.addCookies([{ ...fixtureCookie('a'), url: base, sameSite: 'Lax' }]);
    const title = `Buyer RM500 ${width}`;

    try {
      await page.goto(`${base}/activate`);
      await page.getByRole('heading', { name: 'Akses akaun perlu disemak.', exact: true }).waitFor();
      await layout(page, width, 'recovery');

      await page.goto(`${base}/app`);
      await page.getByRole('heading', { name: 'Apa yang sedang berlaku dalam jualan anda sekarang?', exact: true }).waitFor();
      await page.getByRole('button', { name: 'Tentukan next move', exact: true }).waitFor();
      assert.equal(await page.locator('.quick-start-card input').count(), 1, 'First step exposes only optional reference plus the situation');
      await layout(page, width, 'simple-home');

      await field(page, 'Customer / deal (optional)').fill(title);
      await field(page, 'Apa yang sedang berlaku?').fill('Prospek WhatsApp tanya harga servis. Saya jawab RM500; mesej dibaca tanpa balasan.');
      const created = page.waitForResponse(r => r.request().method() === 'POST' && r.url().endsWith('/api/sales-cases'));
      await page.getByRole('button', { name: 'Tentukan next move', exact: true }).click();
      const createdResponse = await created;
      assert.equal(createdResponse.status(), 201);
      const initial: SalesCase = (await createdResponse.json()).case;
      const id = initial.id;
      await field(page, 'Situasi semasa').waitFor();
      await saved(page);
      assert.equal(await page.getByRole('combobox', { name: /^Sambung case/ }).inputValue(), id);
      assert.equal(initial.document.example, false);

      // Progressive disclosure: record buyer evidence only after a case exists.
      await persist(page, () => field(page, 'Apa yang customer cakap atau buat terakhir?').fill('Buyer bertanya harga, membaca jawapan RM500 dan belum memberi sebab penolakan.'));
      await persist(page, () => field(page, 'Status terakhir yang anda nampak').selectOption('no_reply'));

      const diagnosis = await page.locator('.simple-diagnosis').innerText();
      for (const text of ['APA YANG BERLAKU', 'APA YANG BELUM PASTI', 'BUAT SEKARANG', 'Tiada balasan', 'Bina follow-up']) assert.ok(diagnosis.includes(text), text);
      await page.getByText('Lihat diagnosis penuh', { exact: true }).click();
      assert.match(await page.locator('.diagnosis-full').innerText(), /FOLLOW-UP/);
      assert.match(await page.locator('.diagnosis-full').innerText(), /Engaged/);
      await layout(page, width, 'simple-diagnosis');

      await page.getByRole('link', { name: 'Bina follow-up', exact: true }).click();
      assert.equal(new URL(page.url()).searchParams.get('case'), id);
      assert.match(await field(page, 'Lead / Context').inputValue(), /RM500/);
      await persist(page, () => field(page, 'Adapted message').fill('Adakah servis RM500 masih relevan, atau skop perlu dijelaskan?'));
      await page.reload();
      assert.equal(await field(page, 'Adapted message').inputValue(), 'Adakah servis RM500 masih relevan, atau skop perlu dijelaskan?');
      await layout(page, width, 'follow-up');

      await field(page, 'Apa yang anda lakukan?').fill('Sent one contextual clarification on WhatsApp.');
      await persist(page, () => page.getByRole('button', { name: 'Rekod tindakan', exact: true }).click());

      await page.getByRole('link', { name: 'Cases', exact: true }).click();
      await page.locator('.case-operating-row').filter({ hasText: title }).waitFor();
      assert.match(await page.locator('.case-operating-row').filter({ hasText: title }).innerText(), /Hasil tindakan belum direkod/);
      await page.locator('.case-operating-row').filter({ hasText: title }).getByRole('link', { name: 'Teruskan case', exact: true }).click();

      await field(page, 'Apa yang berlaku?').selectOption('price_objection');
      await field(page, 'Respons / bukti sebenar').fill('Buyer berkata mahal, tetapi belum menjelaskan maksud atau halangan.');
      await page.getByRole('button', { name: 'Rekod & tentukan next move', exact: true }).click();
      await page.locator('.simple-diagnosis').filter({ hasText: 'Bantahan dicatat' }).waitFor();
      await waitForObservation(page, id, 'price_objection');
      await saved(page);
      assert.match(await page.locator('.simple-diagnosis').innerText(), /Bantahan dicatat/);
      await page.getByRole('link', { name: 'Fahami bantahan', exact: true }).click();
      assert.match(await field(page, 'Exact buyer statement').inputValue(), /Buyer berkata mahal/);
      await layout(page, width, 'objection');

      await page.goto(`${base}/app/buyer-intelligence?case=${id}`);
      const who = page.locator('.resource-card').filter({ has: page.getByText('WHO', { exact: true }) }).locator('textarea');
      assert.equal(await who.inputValue(), title);
      await persist(page, () => who.fill(`Shared buyer ${width}`));

      await page.getByRole('link', { name: 'Home', exact: true }).click();
      await openAdvanced(page);
      assert.equal(await field(page, 'Pembeli').inputValue(), `Shared buyer ${width}`);
      await persist(page, () => field(page, 'Tarikh susulan yang dipersetujui / dirancang').fill('2026-01-01T09:00'));

      await page.getByRole('link', { name: 'Cases', exact: true }).click();
      await page.locator('.case-operating-row').filter({ hasText: title }).waitFor();
      assert.match(await page.locator('.case-operating-row').filter({ hasText: title }).innerText(), /Susulan perlu disemak/);
      await layout(page, width, 'cases');

      // Library hides the full tool grid until explicitly requested.
      await page.getByRole('link', { name: 'Library', exact: true }).click();
      await page.getByRole('heading', { name: 'Cari apa yang anda perlukan.', exact: true }).waitFor();
      assert.equal(await page.locator('.tool-card:visible').count(), 0);
      await page.getByText('Lihat semua tools', { exact: true }).click();
      assert.ok(await page.locator('.tool-card').count() >= 10);
      await layout(page, width, 'library');

      // Insights exists but manual KPI table is advanced rather than primary navigation.
      await page.goto(`${base}/app/operator-dashboard?case=${id}`);
      const metricSummary = page.locator('summary').filter({ hasText: 'Advanced metrics' });
      assert.ok((await metricSummary.innerText()).endsWith(title));
      await metricSummary.click();
      const metricInputs = page.locator('input[type="number"]');
      assert.equal(await metricInputs.count(), 26);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
      await metricSummary.click();

      if (width === 1280) {
        await page.getByRole('link', { name: 'Home', exact: true }).click();
        await openAdvanced(page);
        await page.route('**/api/sales-cases/*', async route => {
          if (route.request().method() === 'PUT') await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Injected fixture storage failure' }) });
          else await route.continue();
        });
        await field(page, 'Tajuk case semasa').fill('Unsaved customer draft');
        await page.getByText('Belum disimpan', { exact: true }).waitFor();
        assert.equal(await field(page, 'Tajuk case semasa').inputValue(), 'Unsaved customer draft');
        await page.unroute('**/api/sales-cases/*');
        await persist(page, () => page.getByRole('button', { name: 'Simpan', exact: true }).click());

        const row: SalesCase = (await (await context.request.get(`${base}/api/sales-cases`)).json()).cases.find((r: SalesCase) => r.id === id);
        const writer = await context.request.put(`${base}/api/sales-cases/${id}`, { data: { revision: row.revision, document: { ...row.document, title: 'Other verified writer' } } });
        assert.equal(writer.status(), 200);
        const conflict = page.waitForResponse(r => r.request().method() === 'PUT' && r.url().endsWith(`/api/sales-cases/${id}`));
        await field(page, 'Tajuk case semasa').fill('Preserved conflicting customer draft');
        assert.equal((await conflict).status(), 409);
        await page.getByText('Versi telah berubah', { exact: true }).waitFor();
        assert.equal(await page.getByRole('button', { name: 'Simpan', exact: true }).isDisabled(), true);
        const download = page.waitForEvent('download');
        await page.getByRole('button', { name: 'Muat turun draft', exact: true }).click();
        await (await download).saveAs('test-results/conflicting-fixture-draft.json');
        page.once('dialog', dialog => dialog.accept());
        await page.getByRole('button', { name: 'Muat semula versi akaun', exact: true }).click();
        await saved(page);
      }

      const aRow: SalesCase = (await (await context.request.get(`${base}/api/sales-cases`)).json()).cases.find((r: SalesCase) => r.id === id);
      await context.clearCookies();
      await context.addCookies([{ ...fixtureCookie('b'), url: base, sameSite: 'Lax' }]);
      await page.goto(`${base}/app?case=${id}`);
      await page.getByRole('button', { name: 'Tentukan next move', exact: true }).waitFor();
      assert.equal(await field(page, 'Situasi semasa').count(), 0, 'Previous account case must disappear');
      const bList = await (await context.request.get(`${base}/api/sales-cases`)).json();
      assert.equal(bList.cases.some((r: SalesCase) => r.id === id), false);
      assert.equal((await context.request.put(`${base}/api/sales-cases/${id}`, { data: { revision: aRow.revision, document: aRow.document } })).status(), 404);

      await field(page, 'Customer / deal (optional)').fill(`Account B private ${width}`);
      await field(page, 'Apa yang sedang berlaku?').fill('Account B authorized fixture case.');
      const bCreated = page.waitForResponse(r => r.request().method() === 'POST' && r.url().endsWith('/api/sales-cases'));
      await page.getByRole('button', { name: 'Tentukan next move', exact: true }).click();
      const bResponse = await bCreated;
      assert.equal(bResponse.status(), 201);
      const bRow: SalesCase = (await bResponse.json()).case;
      await saved(page);

      await context.clearCookies();
      await context.addCookies([{ ...fixtureCookie('a'), url: base, sameSite: 'Lax' }]);
      await page.goto(`${base}/app?case=${id}`);
      await field(page, 'Situasi semasa').waitFor();
      assert.equal(await page.getByRole('option', { name: `Account B private ${width}`, exact: true }).count(), 0);
      assert.equal((await context.request.put(`${base}/api/sales-cases/${bRow.id}`, { data: { revision: bRow.revision, document: bRow.document } })).status(), 404);
      assert.deepEqual(pageErrors, []);

      const unexpectedConsole = consoleErrors.filter(e => !(width === 1280 && e.url.includes(`/api/sales-cases/${id}`) && /^Failed to load resource: the server responded with a status of (503|409)\b/.test(e.text)));
      assert.deepEqual(unexpectedConsole, [], 'No unexpected browser console errors');

      results.push({
        width,
        passed: [
          'minimal first step',
          'progressive evidence',
          'simple diagnosis and next move',
          'shared tool state',
          'action/outcome recomputation',
          'case priorities',
          'intent-first library',
          'advanced metrics hidden',
          'account isolation',
          'mobile overflow and controls',
          ...(width === 1280 ? ['save failure/retry and preserved conflict draft'] : []),
        ],
      });
      console.log(`Simplified UX coverage passed at ${width}px (synthetic fixture sessions).`);
    } catch (error) {
      await page.screenshot({ path: `test-results/failure-${width}.png`, fullPage: true });
      await writeFile(`test-results/errors-${width}.json`, JSON.stringify({ url: page.url(), body: await page.locator('body').innerText(), pageErrors, consoleErrors }, null, 2));
      failures.push({ width, error: error instanceof Error ? error.message : String(error) });
      console.error(`Simplified UX coverage failed at ${width}px: ${failures.at(-1)!.error}`);
    } finally {
      await context.close();
    }
  }
  assert.deepEqual(failures, [], 'Every required viewport must pass');
} finally {
  await writeFile('test-results/browser-coverage.json', JSON.stringify({ authEvidence: 'Synthetic fixture sessions only; not hosted Supabase Auth', results, failures }, null, 2));
  await browser.close();
}
