create role anon; create role authenticated; create role service_role;
create schema auth;
create table auth.users(id uuid primary key, email text, email_confirmed_at timestamptz default now(), created_at timestamptz default now());
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
grant usage on schema auth to authenticated, anon, service_role;
create table public.products(
  id uuid primary key default gen_random_uuid(), code text unique not null, name text not null,
  description text, active boolean not null default true, created_at timestamptz not null default now()
);
create table public.entitlements(
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id),
  product_id uuid not null references public.products(id), access_level text not null default 'core',
  status text not null default 'active', source text not null default 'manual',
  external_purchase_id text, granted_at timestamptz not null default now(), expires_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index entitlements_external_purchase_uidx on public.entitlements(external_purchase_id) where external_purchase_id is not null;
create table public.entitlement_events(
  id uuid primary key default gen_random_uuid(), entitlement_id uuid not null references public.entitlements(id),
  event_type text not null check(event_type in ('granted','activated','revoked','expired','restored','updated')),
  source text not null default 'system', external_reference text, metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
insert into public.products(code,name) values ('BROS_SELL_CORE','BROS SELL Core');
