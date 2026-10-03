// Read-only smoke checks against the real Production site. No customer session,
// payment, email submission, entitlement grant or Sales Case mutation is performed.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = 'https://brossell.bolehejas.com';
const report: Record<string, unknown> = {
  production: base,
  productionSha: '913ea4c668f4176da2cd03925dd6613eecd75164',
  checkedAt: new Date().toISOString(),
  evidence: 'Live anonymous Production browser; previous customer tests accepted separately',
  authenticatedProductionCRUD: 'Not newly observed; accepted prior user testing and unchanged reviewed application tree',
};
const viewports: { width: number; status: string }[] = [];
await mkdir('test-results', { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  for (const width of [360, 390, 430, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    async function layout(name: string) {
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, name + ' overflow');
      assert.equal(await page.locator('[data-nextjs-dialog], nextjs-portal').count(), 0);
      const clipped = await page.locator('a, button, input').evaluateAll(elements => elements.filter(el => el.checkVisibility()).filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && (r.left < -1 || r.right > window.innerWidth + 1); }).map(el => el.textContent?.trim() || el.tagName));
      assert.deepEqual(clipped, []);
      await page.screenshot({ path: 'test-results/production-' + name + '-' + width + '.png', fullPage: true });
    }
    try {
      await page.goto(base + '/');
      await page.getByRole('heading', { name: 'Masuk ke Web OS', exact: true }).waitFor();
      assert.equal(new URL(page.url()).pathname, '/login');
      await page.getByRole('button', { name: 'Continue with Google', exact: true }).waitFor();
      await layout('login');
      await page.getByRole('button', { name: 'Email + Password', exact: true }).click();
      await page.locator('input[type="email"]').waitFor();
      await page.locator('input[type="password"]').waitFor();
      await layout('password-form');
      await page.getByRole('button', { name: 'Magic Link', exact: true }).click();
      await page.locator('input[type="email"]').waitFor();
      assert.equal(await page.locator('input[type="password"]').count(), 0);
      await layout('magic-form');
      await page.goto(base + '/activate');
      const contact = page.getByRole('link', { name: 'brossell@bolehejas.com', exact: true });
      await contact.waitFor();
      assert.equal(await contact.getAttribute('href'), 'mailto:brossell%40bolehejas.com?subject=BROS%20SELL%20access%20recovery');
      const text = await page.locator('body').innerText();
      for (const expected of ['menggunakan email pembelian', 'rujukan pesanan atau resit HitPay', 'Jangan hantar password, OTP atau maklumat kad', '30 hari kalendar dari tarikh pembelian', 'HitPay menghantar pakej pelanggan', 'companion online yang diselenggara']) assert.ok(text.includes(expected), expected);
      await layout('recovery');
      for (const route of ['/app', '/app/operator-dashboard', '/app/resources']) {
        await page.goto(base + route);
        await page.getByRole('heading', { name: 'Masuk ke Web OS', exact: true }).waitFor();
        assert.equal(new URL(page.url()).pathname, '/login');
      }
      assert.deepEqual(errors, [], 'No unexpected Production page/console errors');
      viewports.push({ width, status: 'passed' });
      console.log('Live Production browser passed at ' + width + 'px (anonymous; no login/email submission).');
    } catch (error) {
      await page.screenshot({ path: 'test-results/production-failure-' + width + '.png', fullPage: true });
      throw error;
    } finally { await context.close(); }
  }
  // Exercise the real Google button and provider response without signing in.
  const oauthContext = await browser.newContext();
  const oauthPage = await oauthContext.newPage();
  try {
    await oauthPage.goto(base + '/login');
    const providerResponse = oauthPage.waitForResponse(r => r.url().startsWith('https://cyryoirzxpvummckegyh.supabase.co/auth/v1/authorize'), { timeout: 30000 });
    await oauthPage.getByRole('button', { name: 'Continue with Google', exact: true }).click({ noWaitAfter: true });
    const response = await providerResponse;
    const requestUrl = new URL(response.url());
    assert.equal(requestUrl.searchParams.get('provider'), 'google');
    assert.equal(requestUrl.searchParams.get('redirect_to'), base + '/auth/callback');
    assert.equal(response.status(), 302);
    const destination = new URL((await response.allHeaders()).location);
    assert.equal(destination.hostname, 'accounts.google.com');
    report.googleEntry = { status: 302, project: requestUrl.hostname, callback: base + '/auth/callback', provider: destination.hostname, loginCompleted: false };
    console.log('Live Production Google OAuth initiation passed; no account sign-in completed.');
  } finally { await oauthContext.close(); }
  report.result = 'passed';
} catch (error) {
  report.result = 'failed';
  report.error = error instanceof Error ? error.message : String(error);
  throw error;
} finally {
  report.viewports = viewports;
  await writeFile('test-results/production-browser-evidence.json', JSON.stringify(report, null, 2));
  await browser.close();
}
