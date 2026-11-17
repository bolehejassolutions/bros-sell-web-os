# BROS SELL Web OS — Offline Sales Case V1 (development candidate)

Status: **Offline Sales Case V1 implementation accepted in isolated CI on 17 Nov 2026** (GitHub Actions [44064804476](https://github.com/bolehejassolutions/bros-sell-web-os/actions/runs/44064804476): unit, API, browser offline/online/sync, typecheck, lint, build and security audit PASS). Production availability must still be confirmed against the active deployment. This is an optional **offline Sales Case editor**, not an offline copy of the full Web OS.

## Approved scope

- Existing BROS SELL customer package ZIP/PDF/worksheets has always been downloadable for independent offline use. Do **not** change package version, pricing, ownership or customer access duration.
- The live Web OS remains Supabase-authenticated and entitlement-gated. A valid account must first open `/app` **online** before using the optional offline feature.
- Customer opts in on Web OS Home, sets a **local passphrase of at least 10 characters**, and downloads an encrypted per-account snapshot of existing Sales Cases into IndexedDB. The passphrase is not saved; its verification uses PBKDF2-SHA256 with 230,000 iterations and AES-256-GCM.
- After first online setup, `/offline.html` can be loaded and used without internet. A tightly scoped service worker redirects failed offline navigation to `/app` to the static editor but **never caches** authenticated /app SSR pages, API responses, sessions, credentials, paid PDF/ZIP resources, /login or /activate.
- The offline editor can **edit existing Sales Cases only**: title, situation, evidence, channel, buyer and offer. Other CaseDocument fields remain intact. Creating cases, running complex tools, downloading the paid Library, initial login, resetting the passphrase and entitlement verification require internet.
- Edits persist encrypted in the browser vault. The user must re-enter their local passphrase after a page reload; offline drafts survive reload. Browser sync requires the **fresh server-side** `/api/offline/identity` entitlement check, then updates via the existing row-owner-gated, revision-checked `/api/sales-cases/:id` PUT API.
- HTTP 409/404 conflicts are **retained locally** and never silently overwritten. The editor offers a JSON draft download (unencrypted — label prominently). The user must inspect/reconcile conflicting changes manually. Duplicate retries do not create new Cases because only updates are supported, and row revision protects concurrent writes.
- Browser online events can initiate sync **only while the vault is unlocked in that tab**; after a restart, the customer must unlock and sync. Unmatched sessions/user IDs are rejected. Failures leave the draft locally pending and should never be labelled synced.
- Deleting offline data is explicit and account-scoped. Logging out does **not** auto-delete encrypted drafts; this avoids silent loss of pending changes. Advise deleting offline data before handing over or disposing of a device.
- Offline data remains accessible to someone knowing the local passphrase even if online entitlement later expires or is revoked. Revocations are enforced at **online synchronization**, not during disconnected local reading. This limitation must be communicated without calling the full Web OS offline-entitled.

## Data protection and release constraints

- The browser is a customer-controlled device: avoid public/shared computers. Device compromise, malicious extensions, lost passphrase, browser storage eviction or corruption can cause confidentiality or data-loss risks; not a formal E2E audited encryption guarantee.
- No plaintext local customer details are written to persistent storage; vault entries contain encrypted payloads and only account UUID/case UUID/flags in plaintext. The local password is held in memory only while the tab is unlocked.
- Never auto-seed a new entitlement, store authentication tokens in the offline vault, cache authenticated HTML/protected files, modify Supabase RLS or extend access promises.
- Roll out behind verified CI and isolated browser tests, then a Preview/manual acceptance pass. Production rollout and customer-facing claims require separate readiness check.
- Customer complete ZIP remains delivered independently via HitPay; this feature does not modify merchant, payment, email or BROS SELL pricing.

## Verification plan

1. Run `npm test`, `npm run lint`, `npm run typecheck`, `npm run build` on the exact candidate branch.
2. On an isolated PGlite/Supabase fixture, browser-test first authenticated opt-in; online vault encrypted snapshot; offline editor, reload and /app fallback; offline edits; online replay through existing versioned PUT; 409 conflict with separately updated server revision; session/account mismatch; explicit per-account local deletion; mobile viewport.
3. Inspect service-worker cache keys: only `/offline.html`, `/offline-store.js`, `/offline-app.js`. Assert no session, /app HTML, API, PDF or ZIP cache.
4. Confirm existing /app and Library authentication, entitlement, account isolation, server revision and customer package protections still pass.
5. Conduct hosted Preview browser acceptance on custom-domain-equivalent origin before release. Record source commit, tests, actual verified behavior, and any remaining blockers.

This feature is additive and should not be merged with draft HitPay payment automation PRs #12/#23.
