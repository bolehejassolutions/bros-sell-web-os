import test from 'node:test';
import assert from 'node:assert/strict';
import { safeNextPath } from '../lib/auth/redirect.ts';

const callback = 'https://brossell.bolehejas.com/auth/callback';
const callbackOrigin = new URL(callback).origin;

test('auth callbacks preserve root-relative app paths, query parameters and fragments', () => {
  for (const next of ['/', '/app', '/app/resources?kind=zip#download', '/activate?source=login']) {
    assert.equal(safeNextPath(next, callbackOrigin), next);
    assert.equal(new URL(safeNextPath(next, callbackOrigin), callback).origin, callbackOrigin);
  }
});

test('auth callbacks fall back to home for absolute, protocol-relative and non-path destinations', () => {
  for (const next of [null, '', 'app', '?next=/app', '#app', 'https://outside.example/app',
    '//outside.example', '///outside.example', 'javascript:alert(1)', 'data:text/plain,example']) {
    assert.equal(safeNextPath(next, callbackOrigin), '/', String(next));
  }
});

test('auth callbacks reject backslash and stripped-control separator bypasses', () => {
  for (const next of ['/\\outside.example', '/\n/outside.example', '/\r/outside.example',
    '/\t/outside.example', '/\\brossell.bolehejas.com@outside.example']) {
    // These are accepted by the former slash-prefix check but resolve off-site.
    assert.ok(next.startsWith('/') && !next.startsWith('//'));
    assert.notEqual(new URL(next, callback).origin, new URL(callback).origin);
    assert.equal(safeNextPath(next, callbackOrigin), '/', JSON.stringify(next));
  }
});

test('encoded next parameters are validated after the callback decodes them', () => {
  for (const encoded of ['%2F%5Coutside.example', '%2F%0A%2Foutside.example',
    '%2F%0D%2Foutside.example', '%2F%09%2Foutside.example', '%2F%2Foutside.example']) {
    const requestUrl = new URL(`${callback}?next=${encoded}`);
    const destination = new URL(safeNextPath(requestUrl.searchParams.get('next'), requestUrl.origin), requestUrl);
    assert.equal(destination.origin, requestUrl.origin, encoded);
    assert.equal(destination.pathname, '/', encoded);
  }
});

test('valid paths are not converted to protocol-relative paths during normalization', () => {
  const next = '/app/..//outside.example';
  assert.equal(new URL(next, callback).pathname, '//outside.example');
  assert.equal(safeNextPath(next, callbackOrigin), next);
  assert.equal(new URL(safeNextPath(next, callbackOrigin), callback).origin, callbackOrigin);
});

test('origin validation uses the actual Production, Preview or local callback origin', () => {
  for (const origin of [callbackOrigin, 'https://preview.example', 'http://127.0.0.1:3007']) {
    assert.equal(safeNextPath('/app', origin), '/app');
    for (const host of ['outside.example', 'auth-redirect.invalid']) {
      assert.equal(safeNextPath(`/\\${host}`, origin), '/');
    }
    // A URL that introduces userinfo is not an app path, even on our host.
    const host = new URL(origin).host;
    assert.equal(safeNextPath(`/\\outside.example@${host}`, origin), '/');
  }
});
