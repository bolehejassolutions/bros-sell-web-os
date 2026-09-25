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
