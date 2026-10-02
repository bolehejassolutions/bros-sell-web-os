// Additional release assertions. The original browser test stays unchanged.
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

async function saved(page: Page) {
  await page.getByText('Disimpan dalam akaun', { exact: true }).waitFor();
}
async function persist(page: Page, change: () => Promise<unknown>) {
  const response = page.waitForResponse(r => r.request().method() === 'PUT' && r.url().includes('/api/sales-cases/'));
  await change();
  assert.equal((await response).status(), 200, 'Actual application save must return 200');
  await saved(page);
}
async function layout(page: Page, width: number, name: string) {
  const issues = await page.evaluate(() => {
    const problems: string[] = [];
    if (document.documentElement.scrollWidth > window.innerWidth) problems.push('horizontal overflow');
    for (const el of document.querySelectorAll<HTMLElement>('a, button, input, select, textarea')) {
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height || getComputedStyle(el).visibility === 'hidden') continue;
      if (rect.left < -1 || rect.right > window.innerWidth + 1) problems.push(`clipped control: ${el.textContent?.trim() || el.getAttribute('aria-label') || el.tagName}`);
      if (rect.width < 16 || rect.height < 16) problems.push(`unusable control: ${el.tagName}`);
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
    const title = `RM500 customer journey ${width}`;
    try {
      await page.goto(`${base}/app`);
      await page.getByRole('button', { name: 'Bina case & analisis', exact: true }).waitFor();
      assert.equal(await page.locator('.case-onboarding li').count(), 4, 'First-use operating instructions');
      await layout(page, width, 'onboarding');
      await page.getByLabel('Tajuk case', { exact: true }).fill(title);
      await page.getByLabel('Pembeli / nama rujukan', { exact: true }).fill('Buyer RM500');
      await page.getByLabel('Tawaran / servis', { exact: true }).first().fill('Servis RM500');
      await page.getByLabel('Harga / investment', { exact: true }).first().fill('RM500');
      await page.getByLabel('Situasi jualan', { exact: true }).fill('Prospek WhatsApp tanya harga servis. Saya jawab RM500; mesej dibaca tanpa balasan.');
      await page.getByLabel('Bukti: kata-kata atau tindakan sebenar pembeli', { exact: true }).fill('Buyer bertanya harga, membaca jawapan RM500 dan belum memberi sebab penolakan.');
      await page.getByRole('combobox', { name: /^Pemerhatian terakhir/ }).selectOption('no_reply');
      const created = page.waitForResponse(r => r.request().method() === 'POST' && r.url().endsWith('/api/sales-cases'));
      await page.getByRole('button', { name: 'Bina case & analisis', exact: true }).click();
      const createdResponse = await created;
      assert.equal(createdResponse.status(), 201);
      const initial: SalesCase = (await createdResponse.json()).case;
      const id = initial.id;
      await page.getByLabel('Tajuk case semasa', { exact: true }).waitFor();
      await saved(page);
      assert.equal(await page.getByRole('combobox', { name: /^Sales Case semasa/ }).inputValue(), id);
      assert.equal(initial.document.example, false, 'A user-created case participates in actual operating priorities');
      const diagnosis = await page.locator('.case-diagnosis').innerText();
      for (const label of ['WHAT', 'WHY', 'NEXT', 'FOLLOW-UP', 'Tiada balasan']) assert.ok(diagnosis.includes(label), label);
      await page.getByText('Diketahui / andaian / belum diketahui', { exact: true }).click();
      for (const text of ['Diketahui', 'Andaian sistem', 'Belum diketahui / belum disahkan']) assert.ok((await page.locator('.case-diagnosis').innerText()).includes(text));
      await layout(page, width, 'diagnosis');
      await page.getByRole('link', { name: 'Buka follow up', exact: true }).click();
      assert.equal(new URL(page.url()).searchParams.get('case'), id);
      assert.match(await page.getByLabel('Lead / Context', { exact: true }).inputValue(), /RM500/);
      await persist(page, () => page.getByLabel('Adapted message', { exact: true }).fill('Adakah servis RM500 masih relevan, atau skop perlu dijelaskan?'));
      await page.reload();
      assert.equal(await page.getByLabel('Adapted message', { exact: true }).inputValue(), 'Adakah servis RM500 masih relevan, atau skop perlu dijelaskan?');
      await layout(page, width, 'follow-up');
      await page.getByLabel('Tindakan yang telah dilakukan', { exact: true }).fill('Sent one contextual clarification on WhatsApp.');
      await persist(page, () => page.getByRole('button', { name: 'Rekod tindakan dilakukan', exact: true }).click());
      await page.getByRole('link', { name: 'Operasi', exact: true }).click();
      await page.locator('.case-operating-row').filter({ hasText: title }).waitFor();
      assert.match(await page.locator('.case-operating-row').filter({ hasText: title }).innerText(), /Hasil tindakan belum direkod/);
      await page.locator('.case-operating-row').filter({ hasText: title }).getByRole('link', { name: 'Teruskan case', exact: true }).click();
      await page.getByRole('combobox', { name: /^Hasil tindakan/ }).selectOption('price_objection');
      await page.getByLabel('Bukti hasil / respons sebenar', { exact: true }).fill('Buyer berkata mahal, tetapi belum menjelaskan maksud atau halangan.');
      await persist(page, () => page.getByRole('button', { name: 'Rekod hasil & tentukan next action', exact: true }).click());
      assert.match(await page.locator('.case-diagnosis').innerText(), /VALUE/);
      await page.getByRole('link', { name: 'Buka objection playbook', exact: true }).click();
      assert.match(await page.getByLabel('Exact buyer statement', { exact: true }).inputValue(), /Buyer berkata mahal/);
      await layout(page, width, 'objection');
      await page.goto(`${base}/app/buyer-intelligence?case=${id}`);
      const who = page.locator('.resource-card').filter({ has: page.getByText('WHO', { exact: true }) }).locator('textarea');
      assert.equal(await who.inputValue(), 'Buyer RM500');
      await persist(page, () => who.fill(`Shared buyer ${width}`));
      await layout(page, width, 'buyer-intelligence');
      await page.getByRole('link', { name: 'Analyzer', exact: true }).first().click();
      assert.equal(await page.getByLabel('Pembeli', { exact: true }).inputValue(), `Shared buyer ${width}`);
      await page.reload();
      assert.equal(await page.getByLabel('Tajuk case semasa', { exact: true }).inputValue(), title);
      assert.equal(await page.getByLabel('Pembeli', { exact: true }).inputValue(), `Shared buyer ${width}`);
      await persist(page, () => page.getByLabel('Tarikh susulan yang dipersetujui / dirancang', { exact: true }).fill('2026-01-01T09:00'));
      await page.getByRole('link', { name: 'Operasi', exact: true }).click();
      await page.locator('.case-operating-row').filter({ hasText: title }).waitFor();
      assert.match(await page.locator('.case-operating-row').filter({ hasText: title }).innerText(), /Susulan perlu disemak/);
      assert.match(await page.locator('.case-operating-row').first().innerText(), /Susulan perlu disemak/);
      await layout(page, width, 'dashboard');
      await page.locator('.case-operating-row').filter({ hasText: title }).getByRole('link', { name: 'Teruskan case', exact: true }).click();

      if (width === 1280) {
        await page.route('**/api/sales-cases/*', async route => {
          if (route.request().method() === 'PUT') await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Injected fixture storage failure' }) });
          else await route.continue();
        });
        await page.getByLabel('Tajuk case semasa', { exact: true }).fill('Unsaved customer draft');
        await page.getByText('Belum disimpan', { exact: true }).waitFor();
        assert.equal(await page.getByLabel('Tajuk case semasa', { exact: true }).inputValue(), 'Unsaved customer draft');
        await page.unroute('**/api/sales-cases/*');
        await persist(page, () => page.getByRole('button', { name: 'Simpan', exact: true }).click());
        const row: SalesCase = (await (await context.request.get(`${base}/api/sales-cases`)).json()).cases.find((r: SalesCase) => r.id === id);
        const writer = await context.request.put(`${base}/api/sales-cases/${id}`, { data: { revision: row.revision, document: { ...row.document, title: 'Other verified writer' } } });
        assert.equal(writer.status(), 200);
        const conflict = page.waitForResponse(r => r.request().method() === 'PUT' && r.url().endsWith(`/api/sales-cases/${id}`));
        await page.getByLabel('Tajuk case semasa', { exact: true }).fill('Preserved conflicting customer draft');
        assert.equal((await conflict).status(), 409, 'The application must receive an actual 409 from its API');
        await page.getByText('Versi telah berubah', { exact: true }).waitFor();
        assert.equal(await page.getByLabel('Tajuk case semasa', { exact: true }).inputValue(), 'Preserved conflicting customer draft');
        assert.equal(await page.getByRole('button', { name: 'Simpan', exact: true }).isDisabled(), true);
        const download = page.waitForEvent('download');
        await page.getByRole('button', { name: 'Muat turun draft', exact: true }).click();
        await (await download).saveAs('test-results/conflicting-fixture-draft.json');
        await layout(page, width, 'conflict');
        page.once('dialog', dialog => dialog.accept());
        await page.getByRole('button', { name: 'Muat semula versi akaun', exact: true }).click();
        await saved(page);
        assert.equal(await page.getByLabel('Tajuk case semasa', { exact: true }).inputValue(), 'Other verified writer');
      }

      const aRow: SalesCase = (await (await context.request.get(`${base}/api/sales-cases`)).json()).cases.find((r: SalesCase) => r.id === id);
      await context.clearCookies();
      await context.addCookies([{ ...fixtureCookie('b'), url: base, sameSite: 'Lax' }]);
      await page.goto(`${base}/app?case=${id}`);
      await page.getByRole('button', { name: 'Bina case & analisis', exact: true }).waitFor();
      assert.equal(await page.getByLabel('Tajuk case semasa', { exact: true }).count(), 0, 'Previous account case must disappear');
      const bList = await (await context.request.get(`${base}/api/sales-cases`)).json();
      assert.equal(bList.cases.some((r: SalesCase) => r.id === id), false);
      assert.equal((await context.request.put(`${base}/api/sales-cases/${id}`, { data: { revision: aRow.revision, document: aRow.document } })).status(), 404);
      await page.getByLabel('Tajuk case', { exact: true }).fill(`Account B private ${width}`);
      await page.getByLabel('Situasi jualan', { exact: true }).fill('Account B authorized fixture case.');
      const bCreated = page.waitForResponse(r => r.request().method() === 'POST' && r.url().endsWith('/api/sales-cases'));
      await page.getByRole('button', { name: 'Bina case & analisis', exact: true }).click();
      const bResponse = await bCreated;
      assert.equal(bResponse.status(), 201);
      const bRow: SalesCase = (await bResponse.json()).case;
      await saved(page);
      await layout(page, width, 'account-b');
      await context.clearCookies();
      await context.addCookies([{ ...fixtureCookie('a'), url: base, sameSite: 'Lax' }]);
      await page.goto(`${base}/app?case=${id}`);
      await page.getByLabel('Tajuk case semasa', { exact: true }).waitFor();
      assert.equal(await page.getByRole('option', { name: `Account B private ${width}`, exact: true }).count(), 0);
      assert.equal((await context.request.put(`${base}/api/sales-cases/${bRow.id}`, { data: { revision: bRow.revision, document: bRow.document } })).status(), 404);
      assert.deepEqual(pageErrors, []);
      // Only deliberately exercised save-failure/conflict network errors are expected.
      const unexpectedConsole = consoleErrors.filter(e => !(width === 1280 && e.url.includes(`/api/sales-cases/${id}`) && /^Failed to load resource: the server responded with a status of (503|409)\b/.test(e.text)));
      assert.deepEqual(unexpectedConsole, [], 'No unexpected browser console errors');
      results.push({ width, passed: ['onboarding', 'user-created RM500 case', 'evidence and WHAT/WHY/NEXT', 'native-tool shared state', 'action/outcome and recomputation', 'dashboard priorities', 'refresh persistence', 'reciprocal fixture-account isolation', 'controls/navigation/forms/overflow', ...(width === 1280 ? ['save failure/retry and preserved draft', 'actual HTTP 409 and draft export'] : [])] });
      console.log(`Release browser coverage passed at ${width}px (synthetic fixture sessions).`);
    } catch (error) {
      await page.screenshot({ path: `test-results/failure-${width}.png`, fullPage: true });
      await writeFile(`test-results/errors-${width}.json`, JSON.stringify({ url: page.url(), body: await page.locator('body').innerText(), pageErrors, consoleErrors }, null, 2));
      failures.push({ width, error: error instanceof Error ? error.message : String(error) });
      console.error(`Release browser coverage failed at ${width}px: ${failures.at(-1)!.error}`);
    } finally {
      await context.close();
    }
  }
  assert.deepEqual(failures, [], 'Every required viewport must pass');
} finally {
  await writeFile('test-results/browser-coverage.json', JSON.stringify({ authEvidence: 'Synthetic fixture sessions only; not hosted Supabase Auth', results, failures }, null, 2));
  await browser.close();
}
