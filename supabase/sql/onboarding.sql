-- Optional second release after payment-to-entitlement is proven.
-- Run as a reviewed migration at rollout; this script never enables a sender/cron.
alter table public.bros_sell_payment_orders add column if not exists activated_at timestamptz;

create table public.bros_sell_onboarding_manual_deliveries (
  provider_reference text not null,
  kind text not null check (kind in ('initial','reminder_24h','reminder_72h','access_confirmed')),
  sent_at timestamptz not null,
  primary key(provider_reference,kind)
);
create table public.bros_sell_onboarding_messages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.bros_sell_payment_orders(id),
  kind text not null check (kind in ('initial','reminder_24h','reminder_72h','access_confirmed')),
  due_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending','sending','sent','suppressed','uncertain','failed')),
  attempt_id uuid,
  attempted_at timestamptz,
  sent_at timestamptz,
  provider_message_id text,
  reason text,
  unique(order_id,kind)
);
alter table public.bros_sell_onboarding_manual_deliveries enable row level security;
alter table public.bros_sell_onboarding_messages enable row level security;
revoke all on public.bros_sell_onboarding_manual_deliveries, public.bros_sell_onboarding_messages from public,anon,authenticated;

create function public.sync_bros_sell_onboarding_messages()
returns void language plpgsql security definer set search_path = '' as $$
begin
  -- A process crash/timeout after SMTP/API acceptance cannot be safely retried.
  update public.bros_sell_onboarding_messages set status='uncertain',reason='send_receipt_missing'
  where status='sending' and attempted_at < now()-interval '10 minutes';

  insert into public.bros_sell_onboarding_messages(order_id,kind,due_at,status,sent_at,reason)
  select o.id,s.kind,o.paid_at+s.delay,
    case when m.provider_reference is not null then 'sent' else 'pending' end,
    m.sent_at,case when m.provider_reference is not null then 'manual_delivery_recorded' end
  from public.bros_sell_payment_orders o
  cross join (values ('initial',interval '5 minutes'),('reminder_24h',interval '24 hours'),('reminder_72h',interval '72 hours')) s(kind,delay)
  left join public.bros_sell_onboarding_manual_deliveries m on m.provider_reference=o.provider_reference and m.kind=s.kind
  where o.status='paid' and o.paid_at is not null and o.activated_at is null
  on conflict(order_id,kind) do nothing;

  insert into public.bros_sell_onboarding_messages(order_id,kind,due_at,status,sent_at,reason)
  select o.id,'access_confirmed',o.activated_at,
    case when m.provider_reference is not null then 'sent' else 'pending' end,
    m.sent_at,case when m.provider_reference is not null then 'manual_delivery_recorded' end
  from public.bros_sell_payment_orders o
  left join public.bros_sell_onboarding_manual_deliveries m on m.provider_reference=o.provider_reference and m.kind='access_confirmed'
  where o.status='paid' and o.activated_at is not null
  on conflict(order_id,kind) do nothing;

  update public.bros_sell_onboarding_messages m set status='sent',sent_at=d.sent_at,reason='manual_delivery_recorded'
  from public.bros_sell_payment_orders o, public.bros_sell_onboarding_manual_deliveries d
  where m.order_id=o.id and d.provider_reference=o.provider_reference and d.kind=m.kind and m.status='pending';

  update public.bros_sell_onboarding_messages m set status='suppressed',reason='condition_resolved_or_superseded'
  from public.bros_sell_payment_orders o
  where m.order_id=o.id and m.status='pending' and (
    o.status <> 'paid'
    or (m.kind <> 'access_confirmed' and o.activated_at is not null)
    or (m.kind='initial' and now() >= o.paid_at+interval '24 hours')
    or (m.kind='reminder_24h' and now() >= o.paid_at+interval '72 hours')
  );
end $$;
revoke all on function public.sync_bros_sell_onboarding_messages() from public,anon,authenticated;
grant execute on function public.sync_bros_sell_onboarding_messages() to service_role;

create function public.activate_bros_sell_onboarding()
returns integer language plpgsql security definer set search_path = '' as $$
declare v_count integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  update public.bros_sell_payment_orders o set activated_at=now(),updated_at=now()
  where o.user_id=auth.uid() and o.status='paid' and o.activated_at is null
    and exists (select 1 from auth.users u where u.id=auth.uid() and u.email_confirmed_at is not null and lower(u.email)=o.purchase_email)
    and exists (select 1 from public.entitlements e where e.id=o.entitlement_id and e.user_id=auth.uid()
      and e.status='active' and (e.expires_at is null or e.expires_at>now()));
  get diagnostics v_count = row_count;
  if v_count > 0 then perform public.sync_bros_sell_onboarding_messages(); end if;
  return v_count;
end $$;
revoke all on function public.activate_bros_sell_onboarding() from public,anon;
grant execute on function public.activate_bros_sell_onboarding() to authenticated;

create function public.claim_bros_sell_onboarding_messages(p_limit integer default 5)
returns table(id uuid,purchase_email text,kind text,attempt_id uuid)
language plpgsql security definer set search_path = '' as $$
begin
  perform public.sync_bros_sell_onboarding_messages();
  return query
  with due as (
    select m.id from public.bros_sell_onboarding_messages m
    join public.bros_sell_payment_orders o on o.id=m.order_id
    where m.status='pending' and m.due_at<=now() and o.status='paid'
    order by m.due_at,m.id limit greatest(1,least(coalesce(p_limit,5),5))
    for update of m skip locked
  ), reserved as (
    update public.bros_sell_onboarding_messages m set status='sending',attempt_id=gen_random_uuid(),attempted_at=now()
    from due where m.id=due.id returning m.*
  )
  select r.id,o.purchase_email,r.kind,r.attempt_id from reserved r join public.bros_sell_payment_orders o on o.id=r.order_id;
end $$;
revoke all on function public.claim_bros_sell_onboarding_messages(integer) from public,anon,authenticated;
grant execute on function public.claim_bros_sell_onboarding_messages(integer) to service_role;

create function public.prepare_bros_sell_onboarding_message(p_id uuid,p_attempt_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare m public.bros_sell_onboarding_messages%rowtype; o public.bros_sell_payment_orders%rowtype;
begin
  select * into m from public.bros_sell_onboarding_messages where id=p_id for update;
  if not found or m.status<>'sending' or m.attempt_id is distinct from p_attempt_id then return false; end if;
  select * into o from public.bros_sell_payment_orders where id=m.order_id;
  if o.status<>'paid'
    or (m.kind<>'access_confirmed' and o.activated_at is not null)
    or (m.kind='access_confirmed' and (o.activated_at is null or not exists (
      select 1 from public.entitlements e where e.id=o.entitlement_id and e.user_id=o.user_id
        and e.status='active' and (e.expires_at is null or e.expires_at>now())
    )))
    or exists (select 1 from public.bros_sell_onboarding_manual_deliveries d where d.provider_reference=o.provider_reference and d.kind=m.kind) then
    update public.bros_sell_onboarding_messages set status='suppressed',reason='condition_resolved_before_send' where id=p_id;
    return false;
  end if;
  return true;
end $$;
revoke all on function public.prepare_bros_sell_onboarding_message(uuid,uuid) from public,anon,authenticated;
grant execute on function public.prepare_bros_sell_onboarding_message(uuid,uuid) to service_role;

create function public.finish_bros_sell_onboarding_message(p_id uuid,p_attempt_id uuid,p_status text,p_provider_message_id text default null)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if p_status not in ('sent','uncertain','failed') or (p_status='sent' and nullif(p_provider_message_id,'') is null) then
    raise exception 'Invalid receipt';
  end if;
  update public.bros_sell_onboarding_messages set status=p_status,provider_message_id=p_provider_message_id,
    sent_at=case when p_status='sent' then now() end,
    reason=case when p_status='uncertain' then 'provider_acceptance_unknown' when p_status='failed' then 'provider_rejected' end
  where id=p_id and status='sending' and attempt_id=p_attempt_id;
  return found;
end $$;
revoke all on function public.finish_bros_sell_onboarding_message(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.finish_bros_sell_onboarding_message(uuid,uuid,text,text) to service_role;

-- Record #1007's already-sent initial email in manual_deliveries by its actual
-- provider_reference through a PRIVATE owner operation before enabling sender.
-- No real buyer references, emails, or credentials belong in this source.
