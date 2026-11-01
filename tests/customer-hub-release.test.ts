import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CUSTOMER_RELEASE } from "../lib/bros-sell/customer-release.ts";

test("Customer Hub release distinguishes package from book", () => {
  assert.equal(CUSTOMER_RELEASE.packageVersion, "v2.6.1");
  assert.equal(CUSTOMER_RELEASE.bookVersion, "v2.5");
  assert.equal(CUSTOMER_RELEASE.bookChapters, 36);
  assert.equal(CUSTOMER_RELEASE.mapCount, 12);
  assert.equal(CUSTOMER_RELEASE.workbookCount, 13);
  assert.equal(CUSTOMER_RELEASE.quickStartVersion, "v2.6.1");
  assert.equal(CUSTOMER_RELEASE.playbookVersion, "v1.2.1");
  assert.equal(CUSTOMER_RELEASE.checksumSha256.length, 64);
});

test("Customer Hub does not falsely promise a hosted ZIP download", () => {
  const hub = readFileSync("app/app/hub/page.tsx", "utf8");
  assert.match(hub, /hasWebOSAccess\(supabase\)/);
  assert.match(hub, /api\/customer\/closing-os/);
  assert.match(hub, /ZIP lengkap tidak disimpan dalam Web OS/);
  assert.doesNotMatch(hub, /drive\.google\.com\/file\/d\//);
});

test("Access recovery does not advertise the superseded 30-day refund guarantee", () => {
  const activate = readFileSync("app/activate/page.tsx", "utf8");
  assert.doesNotMatch(activate, /refund boleh dibuat dalam 30 hari/);
  assert.match(activate, /terma pembelian/);
});
