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

Authentication does not grant product access. The application checks the active `BROS_SELL_WEB_OS` entitlement before entering `/app` and `/app/resources`.

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
configs. Existing unescaped copy and localStorage state restoration findings
are scoped to warnings in `eslint.config.mjs`; application code is unchanged.
Other existing warnings remain visible. Treat these as follow-up work, not a
clean application audit. Production builds still run TypeScript checking.
