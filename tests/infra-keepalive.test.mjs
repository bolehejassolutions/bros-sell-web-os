import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GET } from '../app/api/cron/supabase-keepalive/route.ts';

const TARGET_URL = 'https://cyryoirzxpvummckegyh.supabase.co';

async function withFixture(fn) {
  const oldFetch = globalThis.fetch;
  const oldEnv = Object.fromEntries(
    ['CRON_SECRET', 'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY']
      .map(key => [key, process.env[key]])
  );
  try {
    process.env.CRON_SECRET = 'synthetic-cron-secret';
    process.env.NEXT_PUBLIC_SUPABASE_URL = TARGET_URL;
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'synthetic-publishable-key';
    await fn();
  } finally {
    globalThis.fetch = oldFetch;
    for (const [key, value] of Object.entries(oldEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

const authorized = () => new Request('https://example.test/api/cron/supabase-keepalive', {
  headers: { authorization: 'Bearer synthetic-cron-secret' },
});

test('cron fails closed without a valid Authorization header', async () => withFixture(async () => {
  let invoked = false;
  globalThis.fetch = async () => { invoked = true; throw new Error('fetch should not run'); };
  assert.equal((await GET(new Request('https://example.test/api/cron/supabase-keepalive'))).status, 401);
  assert.equal((await GET(new Request('https://example.test/api/cron/supabase-keepalive', {
    headers: { authorization: 'Bearer wrong-secret' },
  }))).status, 401);
  delete process.env.CRON_SECRET;
  assert.equal((await GET(authorized())).status, 401);
  assert.equal(invoked, false);
}));

test('cron fails closed on a mismatched project URL', async () => withFixture(async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://different.supabase.co';
  assert.equal((await GET(authorized())).status, 503);
}));

test('cron performs exactly three read-only, no-store requests', async () => withFixture(async () => {
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), options });
    return new Response('[]', { status: 200 });
  };
  const response = await GET(authorized());
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(calls.length, 3);
  for (const { url, options } of calls) {
    assert.equal(url, TARGET_URL + '/rest/v1/products?select=id&limit=1');
    assert.equal(options.method, 'GET');
    assert.equal(options.cache, 'no-store');
    assert.equal(options.headers.apikey, 'synthetic-publishable-key');
  }
}));

test('database API rejection fails health check and stops subsequent requests', async () => withFixture(async () => {
  let calls = 0;
  globalThis.fetch = async () => { calls++; return new Response('Forbidden', { status: 403 }); };
  assert.equal((await GET(authorized())).status, 503);
  assert.equal(calls, 1);
}));
