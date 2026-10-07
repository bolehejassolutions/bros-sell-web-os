-- BROS SELL™ HitPay payment-to-entitlement automation foundation.
-- Additive only: no existing entitlement, customer data or access is removed.
-- Commercial offers are intentionally not seeded here; price/product mapping stays a runtime commercial decision.

create table if not exists public.bros_sell_offers (
  code text primary key,
  product_code text not null references public.products(code),
  access_level text not null default 'core',
  duration_days integer null check (duration_days is null or duration_days > 0),
  amount_myr numeric(12,2) null check (amount_myr is null or amount_myr > 0),
  currency text not null default 'MYR' check (char_length(currency) = 3),
  provider text not null default 'hitpay' check (provider = 'hitpay'),
  provider_product_id text null,
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not active or amount_myr is not null)
);

create unique index if not exists bros_sell_offers_provider_product_uidx
  on public.bros_sell_offers(provider, provider_product_id)
  where provider_product_id is not null;

alter table public.bros_sell_offers enable row level security;
revoke all on table public.bros_sell_offers from anon, authenticated;

create table if not exists public.bros_sell_payment_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users(id),
  offer_code text not null references public.bros_sell_offers(code),
  purchase_email text not null,
  amount numeric(12,2) not null check (amount > 0),
  currency text not null check (char_length(currency) = 3),
  provider text not null default 'hitpay' check (provider = 'hitpay'),
  provider_reference text not null,
  provider_payment_id text null,
  status text not null default 'pending'
    check (status in ('pending','paid','failed','expired','cancelled','refunded')),
  entitlement_id uuid null references public.entitlements(id),
  provider_payload jsonb not null default '{}'::jsonb,
  paid_at timestamptz null,
  processed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (purchase_email = lower(btrim(purchase_email)))
);

create unique index if not exists bros_sell_payment_orders_reference_uidx
  on public.bros_sell_payment_orders(provider, provider_reference);

create unique index if not exists bros_sell_payment_orders_payment_uidx
  on public.bros_sell_payment_orders(provider, provider_payment_id)
  where provider_payment_id is not null;

create index if not exists bros_sell_payment_orders_email_status_idx
  on public.bros_sell_payment_orders(purchase_email, status);

alter table public.bros_sell_payment_orders enable row level security;
revoke all on table public.bros_sell_payment_orders from anon, authenticated;
grant select on table public.bros_sell_payment_orders to authenticated;

drop policy if exists bros_sell_payment_orders_select_own on public.bros_sell_payment_orders;
create policy bros_sell_payment_orders_select_own
  on public.bros_sell_payment_orders
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create table if not exists public.hitpay_webhook_inbox (
  event_key text primary key,
  provider_payment_id text null,
  provider_reference text null,
  payment_status text null,
  amount numeric(12,2) null,
  currency text null,
  purchase_email text null,
  product_ids text[] not null default '{}'::text[],
  payload jsonb not null default '{}'::jsonb,
  resolution_status text not null default 'received'
    check (resolution_status in ('received','processed','unmatched','ignored','rejected')),
  resolution_reason text null,
  order_id uuid null references public.bros_sell_payment_orders(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.hitpay_webhook_inbox enable row level security;
revoke all on table public.hitpay_webhook_inbox from anon, authenticated;

create or replace function public.grant_bros_sell_entitlement_for_order(p_order_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.bros_sell_payment_orders%rowtype;
  v_offer public.bros_sell_offers%rowtype;
  v_product_id uuid;
  v_user_id uuid;
  v_entitlement_id uuid;
  v_external_reference text;
  v_expires_at timestamptz;
  v_created boolean := false;
begin
  select * into v_order
  from public.bros_sell_payment_orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Payment order not found';
  end if;

  if v_order.status <> 'paid' then
    return null;
  end if;

  if v_order.entitlement_id is not null then
    return v_order.entitlement_id;
  end if;

  select * into v_offer
  from public.bros_sell_offers
  where code = v_order.offer_code;

  if not found then
    raise exception 'Offer not found';
  end if;

  select id into v_product_id
  from public.products
  where code = v_offer.product_code
    and active = true;

  if v_product_id is null then
    raise exception 'Product is not active';
  end if;

  v_user_id := v_order.user_id;
  if v_user_id is not null and not exists (
    select 1 from auth.users
    where id=v_user_id and lower(email)=v_order.purchase_email
  ) then
    raise exception 'Payment order user does not match purchase email';
  end if;

  if v_user_id is null then
    select id into v_user_id
    from auth.users
    where lower(email) = v_order.purchase_email
    order by created_at asc
    limit 1;
  end if;

  -- A paid order can safely remain unclaimed until the buyer signs in with the purchase email.
  if v_user_id is null then
    return null;
  end if;

  -- Reuse an existing non-expiring core entitlement instead of creating duplicate permanent access.
  if v_offer.duration_days is null then
    select id into v_entitlement_id
    from public.entitlements
    where user_id = v_user_id
      and product_id = v_product_id
      and access_level = v_offer.access_level
      and status = 'active'
      and expires_at is null
    order by granted_at asc
    limit 1;
  end if;

  v_external_reference := 'hitpay:' || coalesce(nullif(v_order.provider_payment_id,''), v_order.provider_reference);
  v_expires_at := case
    when v_offer.duration_days is null then null
    else coalesce(v_order.paid_at, now()) + make_interval(days => v_offer.duration_days)
  end;

  if v_entitlement_id is null then
    insert into public.entitlements (
      user_id, product_id, access_level, status, source,
      external_purchase_id, granted_at, expires_at
    ) values (
      v_user_id, v_product_id, v_offer.access_level, 'active', 'hitpay',
      v_external_reference, coalesce(v_order.paid_at, now()), v_expires_at
    )
    on conflict do nothing
    returning id into v_entitlement_id;

    if v_entitlement_id is null then
      select id into v_entitlement_id
      from public.entitlements
      where external_purchase_id = v_external_reference
      limit 1;
    else
      v_created := true;
    end if;
  end if;

  if v_entitlement_id is null then
    raise exception 'Unable to resolve entitlement';
  end if;

  insert into public.entitlement_events (
    entitlement_id, event_type, source, external_reference, metadata
  ) values (
    v_entitlement_id,
    case when v_created then 'granted' else 'updated' end,
    'hitpay',
    coalesce(v_order.provider_payment_id, v_order.provider_reference),
    jsonb_build_object(
      'payment_order_id', v_order.id,
      'offer_code', v_order.offer_code,
      'purchase_email_matched', true
    )
  );

  update public.bros_sell_payment_orders
  set user_id = v_user_id,
      entitlement_id = v_entitlement_id,
      processed_at = coalesce(processed_at, now()),
      updated_at = now()
  where id = v_order.id;

  return v_entitlement_id;
end;
$$;

revoke all on function public.grant_bros_sell_entitlement_for_order(uuid) from public, anon, authenticated;
grant execute on function public.grant_bros_sell_entitlement_for_order(uuid) to service_role;

create or replace function public.process_bros_sell_hitpay_event(
  p_event_key text,
  p_provider_payment_id text,
  p_provider_reference text,
  p_status text,
  p_amount numeric,
  p_currency text,
  p_purchase_email text,
  p_product_ids text[],
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text := lower(coalesce(p_status,''));
  v_currency text := upper(coalesce(p_currency,''));
  v_email text := lower(btrim(coalesce(p_purchase_email,'')));
  v_order public.bros_sell_payment_orders%rowtype;
  v_offer public.bros_sell_offers%rowtype;
  v_offer_count integer := 0;
  v_entitlement_id uuid;
  v_reference text;
begin
  if coalesce(p_event_key,'') = '' then
    raise exception 'event_key is required';
  end if;

  insert into public.hitpay_webhook_inbox (
    event_key, provider_payment_id, provider_reference, payment_status,
    amount, currency, purchase_email, product_ids, payload
  ) values (
    p_event_key, nullif(p_provider_payment_id,''), nullif(p_provider_reference,''),
    nullif(v_status,''), p_amount, nullif(v_currency,''), nullif(v_email,''),
    coalesce(p_product_ids,'{}'::text[]), coalesce(p_payload,'{}'::jsonb)
  )
  on conflict (event_key) do nothing;

  if not found then
    return jsonb_build_object('status','duplicate','event_key',p_event_key);
  end if;

  if v_status not in ('completed','paid','success','succeeded','failed','expired','cancelled','refunded') then
    update public.hitpay_webhook_inbox
    set resolution_status='ignored', resolution_reason='unsupported_status', updated_at=now()
    where event_key=p_event_key;
    return jsonb_build_object('status','ignored','reason','unsupported_status');
  end if;

  select * into v_order
  from public.bros_sell_payment_orders
  where provider='hitpay'
    and (
      (nullif(p_provider_payment_id,'') is not null and provider_payment_id = p_provider_payment_id)
      or
      (nullif(p_provider_reference,'') is not null and provider_reference = p_provider_reference)
    )
  order by created_at asc
  limit 1
  for update;

  if v_status in ('completed','paid','success','succeeded') and not found then
    select count(*), min(code)
      into v_offer_count, v_reference
    from public.bros_sell_offers
    where active = true
      and provider = 'hitpay'
      and provider_product_id is not null
      and provider_product_id = any(coalesce(p_product_ids,'{}'::text[]))
      and amount_myr = p_amount
      and upper(currency) = v_currency;

    if v_offer_count <> 1 then
      update public.hitpay_webhook_inbox
      set resolution_status='unmatched',
          resolution_reason=case when v_offer_count=0 then 'no_exact_offer_mapping' else 'ambiguous_offer_mapping' end,
          updated_at=now()
      where event_key=p_event_key;
      return jsonb_build_object(
        'status','unmatched',
        'reason',case when v_offer_count=0 then 'no_exact_offer_mapping' else 'ambiguous_offer_mapping' end
      );
    end if;

    select * into v_offer from public.bros_sell_offers where code=v_reference;

    if v_email = '' then
      update public.hitpay_webhook_inbox
      set resolution_status='unmatched', resolution_reason='missing_purchase_email', updated_at=now()
      where event_key=p_event_key;
      return jsonb_build_object('status','unmatched','reason','missing_purchase_email');
    end if;

    v_reference := coalesce(nullif(p_provider_reference,''), 'payment:' || nullif(p_provider_payment_id,''));
    if v_reference is null then
      update public.hitpay_webhook_inbox
      set resolution_status='unmatched', resolution_reason='missing_payment_identity', updated_at=now()
      where event_key=p_event_key;
      return jsonb_build_object('status','unmatched','reason','missing_payment_identity');
    end if;

    insert into public.bros_sell_payment_orders (
      offer_code, purchase_email, amount, currency, provider, provider_reference,
      provider_payment_id, status, provider_payload
    ) values (
      v_offer.code, v_email, p_amount, v_currency, 'hitpay', v_reference,
      nullif(p_provider_payment_id,''), 'pending', coalesce(p_payload,'{}'::jsonb)
    )
    on conflict do nothing;

    select * into v_order
    from public.bros_sell_payment_orders
    where provider='hitpay'
      and (
        provider_reference=v_reference
        or (nullif(p_provider_payment_id,'') is not null and provider_payment_id=p_provider_payment_id)
      )
    order by created_at asc
    limit 1
    for update;
  end if;

  if not found then
    update public.hitpay_webhook_inbox
    set resolution_status='unmatched', resolution_reason='payment_order_not_found', updated_at=now()
    where event_key=p_event_key;
    return jsonb_build_object('status','unmatched','reason','payment_order_not_found');
  end if;

  if p_amount is not null and v_order.amount <> p_amount then
    update public.hitpay_webhook_inbox
    set resolution_status='rejected', resolution_reason='amount_mismatch', order_id=v_order.id, updated_at=now()
    where event_key=p_event_key;
    return jsonb_build_object('status','rejected','reason','amount_mismatch');
  end if;

  if v_currency <> '' and upper(v_order.currency) <> v_currency then
    update public.hitpay_webhook_inbox
    set resolution_status='rejected', resolution_reason='currency_mismatch', order_id=v_order.id, updated_at=now()
    where event_key=p_event_key;
    return jsonb_build_object('status','rejected','reason','currency_mismatch');
  end if;

  if v_email <> '' and v_order.purchase_email <> v_email then
    update public.hitpay_webhook_inbox
    set resolution_status='rejected', resolution_reason='purchase_email_mismatch', order_id=v_order.id, updated_at=now()
    where event_key=p_event_key;
    return jsonb_build_object('status','rejected','reason','purchase_email_mismatch');
  end if;

  if v_status in ('completed','paid','success','succeeded') then
    if v_order.status = 'refunded' then
      update public.hitpay_webhook_inbox
      set resolution_status='ignored',
          resolution_reason='refund_is_terminal',
          order_id=v_order.id,
          updated_at=now()
      where event_key=p_event_key;
      return jsonb_build_object('status','ignored','reason','refund_is_terminal','order_id',v_order.id);
    end if;

    update public.bros_sell_payment_orders
    set status='paid',
        provider_payment_id=coalesce(nullif(p_provider_payment_id,''),provider_payment_id),
        provider_payload=coalesce(p_payload,'{}'::jsonb),
        paid_at=coalesce(paid_at,now()),
        updated_at=now()
    where id=v_order.id;

    v_entitlement_id := public.grant_bros_sell_entitlement_for_order(v_order.id);

    update public.hitpay_webhook_inbox
    set resolution_status='processed',
        resolution_reason=case when v_entitlement_id is null then 'paid_unclaimed' else 'entitlement_granted' end,
        order_id=v_order.id,
        updated_at=now()
    where event_key=p_event_key;

    return jsonb_build_object(
      'status','processed',
      'order_id',v_order.id,
      'entitlement_id',v_entitlement_id,
      'claimed',v_entitlement_id is not null
    );
  end if;

  update public.bros_sell_payment_orders
  set status=case
      when v_status='failed' then 'failed'
      when v_status='expired' then 'expired'
      when v_status='cancelled' then 'cancelled'
      when v_status='refunded' then 'refunded'
      else status
    end,
    provider_payment_id=coalesce(nullif(p_provider_payment_id,''),provider_payment_id),
    provider_payload=coalesce(p_payload,'{}'::jsonb),
    updated_at=now()
  where id=v_order.id
    and (v_status='refunded' or status='pending');

  update public.hitpay_webhook_inbox
  set resolution_status='processed',
      resolution_reason=case when v_status='refunded' then 'refund_recorded_manual_access_review_required' else 'non_paid_status_recorded' end,
      order_id=v_order.id,
      updated_at=now()
  where event_key=p_event_key;

  return jsonb_build_object('status','processed','order_id',v_order.id,'payment_status',v_status);
end;
$$;

revoke all on function public.process_bros_sell_hitpay_event(text,text,text,text,numeric,text,text,text[],jsonb)
  from public, anon, authenticated;
grant execute on function public.process_bros_sell_hitpay_event(text,text,text,text,numeric,text,text,text[],jsonb)
  to service_role;

create or replace function public.claim_bros_sell_paid_orders()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_order_id uuid;
  v_count integer := 0;
  v_entitlement_id uuid;
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  select lower(email) into v_email
  from auth.users
  where id=v_uid;

  if v_email is null then
    return 0;
  end if;

  for v_order_id in
    select id
    from public.bros_sell_payment_orders
    where status='paid'
      and entitlement_id is null
      and purchase_email=v_email
      and (user_id is null or user_id=v_uid)
    order by paid_at asc nulls last, created_at asc
    for update skip locked
  loop
    update public.bros_sell_payment_orders
    set user_id=v_uid, updated_at=now()
    where id=v_order_id and user_id is null;

    v_entitlement_id := public.grant_bros_sell_entitlement_for_order(v_order_id);
    if v_entitlement_id is not null then
      v_count := v_count + 1;
    end if;
  end loop;

  return v_count;
end;
$$;

revoke all on function public.claim_bros_sell_paid_orders() from public, anon;
grant execute on function public.claim_bros_sell_paid_orders() to authenticated;
