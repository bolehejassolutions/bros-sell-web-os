// Real browser test against the isolated fixture; never use live customer accounts here.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { fixtureCookie } from './fixtures/session.ts';
const base='http://127.0.0.1:3007';
const browser=process.env.BROS_TEST_CDP ? await chromium.connectOverCDP(process.env.BROS_TEST_CDP) : await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1280,height:900}});
const page=await context.newPage(); const errors:string[]=[];
page.on('pageerror',error=>errors.push(error.message));
const cookie=fixtureCookie('a'); await context.addCookies([{...cookie,url:base,sameSite:'Lax'}]);
await mkdir('test-results',{recursive:true});
// Match the visible label span; textarea default text must not change the locator.
function field(name:string) {return page.locator('label').filter({has:page.getByText(name,{exact:true})}).locator('input, textarea, select');}
async function saved() {await page.getByText('Disimpan dalam akaun',{exact:true}).waitFor();}
try {
  await page.goto(`${base}/app`);
  await page.getByText('Nak lihat contoh dahulu?',{exact:true}).click();
  await page.getByRole('button',{name:'Jalankan contoh RM500'}).click();
  await page.locator('.case-diagnosis').waitFor();
  await page.getByText('Lihat diagnosis penuh',{exact:true}).click();
  assert.match(await page.locator('.case-diagnosis').innerText(),/FOLLOW-UP/);
  assert.match(await page.locator('.case-diagnosis').innerText(),/Engaged/); const caseUrl=page.url();
  await page.getByRole('link',{name:'Bina follow-up',exact:true}).click();
  await field('Adapted message').fill('Adakah servis RM500 masih relevan atau skop perlu dijelaskan?'); await saved();
  await page.reload(); assert.equal(await field('Adapted message').inputValue(),'Adakah servis RM500 masih relevan atau skop perlu dijelaskan?');
  await field('Tindakan yang telah dilakukan').fill('Sent one contextual clarification on WhatsApp');
  await page.getByRole('button',{name:'Rekod tindakan dilakukan',exact:true}).click();
  await field('Hasil tindakan').selectOption('price_objection');
  await field('Bukti hasil / respons sebenar').fill('Buyer said mahal, but did not explain why.');
  await page.getByRole('button',{name:'Rekod hasil & tentukan next action',exact:true}).click(); await saved();
  await page.getByText('Lihat diagnosis penuh',{exact:true}).click();
  assert.match(await page.locator('.case-diagnosis').innerText(),/VALUE/);
  await page.getByRole('link',{name:'Fahami objection',exact:true}).click();
  assert.match(await field('Exact buyer statement').inputValue(),/mahal/);
  await page.getByRole('link',{name:'Home',exact:true}).first().click();
  assert.equal(new URL(page.url()).searchParams.get('case'),new URL(caseUrl).searchParams.get('case'));
  await page.getByText('Tambah konteks jika cadangan belum tepat',{exact:true}).click();
  await field('Tajuk case semasa').fill('Browser verified training case'); await saved();
  // Failed save retains the draft and a retry persists it.
  await page.route('**/api/sales-cases/*',async route=>{if(route.request().method()==='PUT') await route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Fixture storage failure'})});else await route.continue();});
  await field('Tajuk case semasa').fill('Unsaved retained draft'); await page.getByText('Belum disimpan',{exact:true}).waitFor();
  assert.equal(await field('Tajuk case semasa').inputValue(),'Unsaved retained draft');
  await page.unroute('**/api/sales-cases/*'); await page.getByRole('button',{name:'Simpan',exact:true}).click(); await saved();
  // A second writer forces a revision conflict, with no silent overwrite.
  const row=(await (await context.request.get(`${base}/api/sales-cases`)).json()).cases.find((r:{id:string})=>r.id===new URL(page.url()).searchParams.get('case'));
  await context.request.put(`${base}/api/sales-cases/${row.id}`,{data:{revision:row.revision,document:{...row.document,title:'Other writer'}}});
  await field('Tajuk case semasa').fill('My conflicting draft'); await page.getByText('Versi telah berubah',{exact:true}).waitFor();
  assert.equal(await field('Tajuk case semasa').inputValue(),'My conflicting draft');
  const draftDownload=page.waitForEvent('download'); await page.getByRole('button',{name:'Muat turun draft',exact:true}).click(); await draftDownload;
  page.once('dialog',dialog=>dialog.accept()); await page.getByRole('button',{name:'Muat semula versi akaun'}).click(); await saved();
  assert.equal(await field('Tajuk case semasa').inputValue(),'Other writer');
  for (const width of [360,390,430,1280]) {
    await page.setViewportSize({width,height:900});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true,`Analyzer overflow at ${width}`);
    await page.screenshot({path:`test-results/analyzer-${width}.png`,fullPage:true});
  }
  await page.getByRole('link',{name:'Cases',exact:true}).click();
  await page.getByRole('heading',{name:'Cases yang perlukan perhatian',exact:true}).waitFor();
  assert.match(await page.locator('body').innerText(),/case memerlukan perhatian|Tiada case sebenar/);
  // Switching identity must never expose the previous account's cases.
  await context.clearCookies(); await context.addCookies([{...fixtureCookie('b'),url:base,sameSite:'Lax'}]);
  await page.goto(`${base}/app`); await page.getByText('Nak lihat contoh dahulu?',{exact:true}).click(); await page.getByRole('button',{name:'Jalankan contoh RM500'}).waitFor();
  assert.equal(await page.getByRole('option',{name:'Other writer'}).count(),0);
  assert.equal(await page.locator('[data-nextjs-dialog]').count(),0); assert.deepEqual(errors,[]);
  console.log('Browser pass: RM500 loop, refresh, save failure/retry, conflict, account switch and four viewport widths.');
} finally {await context.close();await browser.close();}
