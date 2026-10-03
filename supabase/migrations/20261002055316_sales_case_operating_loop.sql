-- Additive only. Requires the existing entitlement RPC; no entitlement or price changes.
create table public.bros_sell_sales_cases (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  revision integer not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  document jsonb not null check (
    jsonb_typeof(document) = 'object' and document ->> 'version' = '1'
    and length(document::text) <= 240000
  ),
  status text not null check (status in ('active','deferred','closed','lost','resolved') and status = document ->> 'status'),
  stage text not null check (stage in ('TARGET','BUYER','OFFER','LEAD','QUALIFY','VALUE','CLOSE','FOLLOW-UP','MULTIPLY','OPERATE')),
  lead_state text not null check (lead_state in ('Unknown','Aware','Engaged','Qualified','Active','Decision')),
  next_action_at timestamptz
);

create index bros_sell_cases_owner_created on public.bros_sell_sales_cases (owner_id, created_at desc, id desc);
create index bros_sell_cases_owner_due on public.bros_sell_sales_cases (owner_id, next_action_at) where next_action_at is not null;

create function public.bros_sell_case_revision() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.id <> old.id or new.owner_id <> old.owner_id or new.created_at <> old.created_at then
    raise exception 'Sales Case identity cannot be changed';
  end if;
  new.revision := old.revision + 1;
  new.updated_at := clock_timestamp();
  return new;
end;
$$;
revoke all on function public.bros_sell_case_revision() from public, anon, authenticated;
create trigger bros_sell_case_revision before update on public.bros_sell_sales_cases
for each row execute function public.bros_sell_case_revision();

alter table public.bros_sell_sales_cases enable row level security;
revoke all on public.bros_sell_sales_cases from public, anon, authenticated;
grant select on public.bros_sell_sales_cases to authenticated;
grant insert (owner_id, document, status, stage, lead_state, next_action_at) on public.bros_sell_sales_cases to authenticated;
grant update (document, status, stage, lead_state, next_action_at) on public.bros_sell_sales_cases to authenticated;

create policy bros_sell_cases_read on public.bros_sell_sales_cases for select to authenticated
using (owner_id = (select auth.uid()) and (select
  coalesce(public.has_active_bros_sell_entitlement('BROS_SELL_CORE','core'), false)
  or coalesce(public.has_active_bros_sell_entitlement('BROS_SELL_WEB_OS','core'), false)));
create policy bros_sell_cases_create on public.bros_sell_sales_cases for insert to authenticated
with check (owner_id = (select auth.uid()) and (select
  coalesce(public.has_active_bros_sell_entitlement('BROS_SELL_CORE','core'), false)
  or coalesce(public.has_active_bros_sell_entitlement('BROS_SELL_WEB_OS','core'), false)));
create policy bros_sell_cases_update on public.bros_sell_sales_cases for update to authenticated
using (owner_id = (select auth.uid()) and (select
  coalesce(public.has_active_bros_sell_entitlement('BROS_SELL_CORE','core'), false)
  or coalesce(public.has_active_bros_sell_entitlement('BROS_SELL_WEB_OS','core'), false)))
with check (owner_id = (select auth.uid()) and (select
  coalesce(public.has_active_bros_sell_entitlement('BROS_SELL_CORE','core'), false)
  or coalesce(public.has_active_bros_sell_entitlement('BROS_SELL_WEB_OS','core'), false)));

comment on table public.bros_sell_sales_cases is 'Account-owned BROS SELL operating cases. Browser drafts are not authoritative storage. No delete grant.';
