# BROS SELL™ — Closing OS Web OS

Customer-facing application for the BROS SELL™ Closing OS.

## Architecture

- Next.js App Router
- Supabase Auth
- Supabase SSR with cookie-based sessions
- PKCE-compatible `/auth/callback` flow
- Token-hash-compatible `/auth/confirm` flow
- Server-side entitlement gate
- Dedicated Supabase project: `cyryoirzxpvummckegyh`
- Deployment target: Vercel

## Auth email templates

For the current Supabase SSR/PKCE flow, configure both **Confirm signup** and **Magic link** templates to use a token hash:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Sign in</a>
```

The `/auth/confirm` route verifies the token hash and establishes the session in SSR cookies.

The legacy `/auth/callback` route remains for code-based redirects.

## Access model

Authentication does not grant product access. The application checks the existing canonical `BROS_SELL_CORE/core` entitlement and then legacy `BROS_SELL_WEB_OS/core` entitlement before entering `/app`, resources or the Sales Case API. Logging in alone does not grant product access.

## Environment

Copy `.env.example` to `.env.local` and provide the Supabase publishable key.

## Development tooling

Use Node.js 22.9.0 or newer and npm 11.9.0 (`packageManager`). Supabase's locked
client requires Node.js >=22.0.0; npm 11 requires >=22.9.0. Application dependencies are pinned to the
previously committed lockfile versions. TypeScript uses 5.9.3 because the
Next.js ESLint parser does not support the previously locked TypeScript 7.
ESLint 9 is required by the React/import/accessibility plugins' peer ranges;
its npm end-of-support warning remains until those plugins support ESLint 10.

```sh
npm ci
npm run lint
npm run build
npm run dev
```

Commit `package.json` and the npm-generated `package-lock.json` together when
changing dependencies. Use `npm ci` for verification and deployment; use
`npm install` only to intentionally update the dependency state.

Lint uses the ESLint CLI with Next.js Core Web Vitals and TypeScript flat
configs. Existing warnings remain visible. Production builds retain TypeScript
checking. The account-scoped Analyzer replaces the former unscoped localStorage
Analyzer; it does not silently import old browser data into an account.

## Sales Case operating loop

Situation -> evidence -> diagnosis -> action -> outcome -> next action.
Existing native tools use the selected account-owned case. Buyer, offer and value
inputs share facts. Qualification requires explicit evidence in six dimensions.
Tools do not send messages automatically.

Apply the reviewed additive migration in `supabase/migrations/` to the verified
Web OS database before releasing this branch. It depends on the existing
`has_active_bros_sell_entitlement` RPC and never provisions customer access.
There is no anonymous/delete grant or service-role client. Revision checks prevent
silent overwrites; failed saves retain visible in-memory drafts with retry/export.

Optional server variable `BROS_SUPPORT_EMAIL` adds a recovery contact only when an
actual staffed address has been configured. Otherwise customers are directed to
the support channel in their purchase confirmation; no address is invented.

See [release assessment](docs/sales-case-release-assessment.md) and
[verification runbook](docs/sales-case-test-runbook.md).

## Current Production state — 7 October 2026

The guided Web OS customer loop is released to Production on the verified BROS SELL
Supabase project. Hosted authentication, entitlement isolation, Sales Case
persistence/recovery, Cases, Library and the protected Closing OS download have
passed the current release gate.

Manual fulfilment remains the approved customer-access path. The separate
non-granting HitPay capture receiver is live for authentic event evidence only;
automatic entitlement provisioning remains deliberately disabled until a real
`charge.created` event proves the provider mapping.
