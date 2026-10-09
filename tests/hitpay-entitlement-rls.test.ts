import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

test('HitPay migration grants once, rejects amount mismatch and supports post-purchase account claim', async () => {
  const db = new PGlite();
  const userA='11111111-1111-4111-8111-111111111111';
  const userB='22222222-2222-4222-8222-222222222222';
  try {
    await db.exec(`
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
      insert into auth.users(id,email) values ('${userA}','a@example.com');
    `);
    await db.exec(readFileSync(new URL('../supabase/migrations/20261007103000_hitpay_entitlement_automation.sql',import.meta.url),'utf8'));
    await db.exec(`
      insert into public.bros_sell_offers(code,product_code,access_level,amount_myr,currency,provider_product_id,active)
      values ('CORE_TEST','BROS_SELL_CORE','core',197,'MYR','prod_core',true);
    `);

    await db.exec('set role service_role');
    const completed = await db.query<{result:Record<string,unknown>}>(`
      select public.process_bros_sell_hitpay_event(
        'evt-1','pay-1','ref-1','completed',197,'MYR','a@example.com',
        array['prod_core'], '{"id":"pay-1"}'::jsonb
      ) as result
    `);
    assert.equal(completed.rows[0].result.status,'processed');
    await db.exec('reset role');
    assert.equal((await db.query('select id from public.entitlements')).rows.length,1);
    assert.equal((await db.query('select id from public.entitlement_events')).rows.length,1);

    await db.exec('set role service_role');
    for (const [key,payment,reference,amount,currency,email,products,reason] of [
      ['wrong-charge','other-pay','ref-1',197,'MYR','a@example.com',['prod_core'],'payment_identity_mismatch'],
      ['wrong-order','pay-1','other-ref',197,'MYR','a@example.com',['prod_core'],'payment_identity_mismatch'],
      ['wrong-product','pay-1','ref-1',197,'MYR','a@example.com',['other_product'],'product_mismatch'],
      ['missing-amount','pay-1','ref-1',null,'MYR','a@example.com',['prod_core'],'incomplete_payment_evidence'],
      ['missing-currency','pay-1','ref-1',197,null,'a@example.com',['prod_core'],'incomplete_payment_evidence'],
      ['wrong-email','pay-1','ref-1',197,'MYR','wrong@example.com',['prod_core'],'purchase_email_mismatch'],
      ['multiple-products','pay-1','ref-1',197,'MYR','a@example.com',['prod_core','other_product'],'incomplete_payment_evidence'],
      ['invalid-email','pay-1','ref-1',197,'MYR','not-an-email',['prod_core'],'incomplete_payment_evidence'],
    ] as const) {
      const result = await db.query<{result:Record<string,unknown>}>(
        `select public.process_bros_sell_hitpay_event($1,$2,$3,'succeeded',$4,$5,$6,$7,'{}') as result`,
        [key,payment,reference,amount,currency,email,[...products]],
      );
      assert.equal(result.rows[0].result.status,'rejected',key);
      assert.equal(result.rows[0].result.reason,reason,key);
    }
    await db.exec('reset role');
    assert.equal((await db.query('select id from public.entitlements')).rows.length,1);

    await db.exec('set role service_role');
    await db.query(`select public.process_bros_sell_hitpay_event(
      'evt-1','pay-1','ref-1','completed',197,'MYR','a@example.com',array['prod_core'],'{"id":"pay-1"}'::jsonb
    )`);
    await db.exec('reset role');
    assert.equal((await db.query('select id from public.entitlements')).rows.length,1);
    assert.equal((await db.query('select id from public.entitlement_events')).rows.length,1);

    await db.exec('set role service_role');
    const rejected = await db.query<{result:Record<string,unknown>}>(`
      select public.process_bros_sell_hitpay_event(
        'evt-bad','pay-bad','ref-bad','completed',5,'MYR','a@example.com',
        array['prod_core'],'{"id":"pay-bad"}'::jsonb
      ) as result
    `);
    await db.exec('reset role');
    assert.equal(rejected.rows[0].result.status,'unmatched');

    await db.exec('set role service_role');
    const pending = await db.query<{result:Record<string,unknown>}>(`
      select public.process_bros_sell_hitpay_event(
        'evt-2','pay-2','ref-2','completed',197,'MYR','b@example.com',
        array['prod_core'],'{"id":"pay-2"}'::jsonb
      ) as result
    `);
    await db.exec('reset role');
    assert.equal(pending.rows[0].result.claimed,false);
    assert.equal((await db.query("select id from public.entitlements")).rows.length,1);

    await db.exec(`insert into auth.users(id,email,email_confirmed_at) values ('${userB}','b@example.com',null)`);
    await db.exec('set role authenticated');
    await db.query("select set_config('request.jwt.claim.sub',$1,false)",[userB]);
    assert.equal((await db.query<{claim_bros_sell_paid_orders:number}>('select public.claim_bros_sell_paid_orders()')).rows[0].claim_bros_sell_paid_orders,0);
    await db.exec('reset role');
    await db.exec(`update auth.users set email_confirmed_at=now() where id='${userB}'`);
    await db.exec('set role authenticated');
    const claimed = await db.query<{claim_bros_sell_paid_orders:number}>('select public.claim_bros_sell_paid_orders()');
    assert.equal(claimed.rows[0].claim_bros_sell_paid_orders,1);
    await db.exec('reset role');
    assert.equal((await db.query('select id from public.entitlements')).rows.length,2);

    await db.exec('set role service_role');
    await db.query(`select public.process_bros_sell_hitpay_event(
      'evt-refund','pay-2','ref-2','refunded',197,'MYR','b@example.com',array['prod_core'],'{"id":"pay-2","status":"refunded"}'::jsonb
    )`);
    const terminal = await db.query<{result:Record<string,unknown>}>(`
      select public.process_bros_sell_hitpay_event(
        'evt-3','pay-2','ref-2','completed',197,'MYR','b@example.com',array['prod_core'],'{"id":"pay-2","status":"completed"}'::jsonb
      ) as result
    `);
    const duplicate = await db.query<{result:Record<string,unknown>}>(`
      select public.process_bros_sell_hitpay_event(
        'evt-3','pay-2','ref-2','completed',197,'MYR','b@example.com',array['prod_core'],'{"id":"pay-2","status":"completed"}'::jsonb
      ) as result
    `);
    await db.exec('reset role');

    assert.equal(terminal.rows[0].result.status,'ignored');
    assert.equal(terminal.rows[0].result.reason,'refund_is_terminal');
    assert.equal(duplicate.rows[0].result.status,'duplicate');
    const refunded = await db.query<{status:string}>("select status from public.bros_sell_payment_orders where provider_reference='ref-2'");
    assert.equal(refunded.rows[0].status,'refunded');

    // Optional onboarding is independently deployable after the payment gate.
    await db.exec(readFileSync(new URL('../supabase/sql/onboarding.sql',import.meta.url),'utf8'));
    await db.exec(`update public.bros_sell_payment_orders set paid_at=now()-interval '25 hours' where provider_reference='ref-1';
      insert into public.bros_sell_onboarding_manual_deliveries(provider_reference,kind,sent_at)
      values ('ref-1','initial',now()-interval '24 hours');`);
    await db.exec('set role service_role');
    const due = await db.query<{id:string;kind:string;attempt_id:string}>('select * from public.claim_bros_sell_onboarding_messages(5)');
    assert.equal(due.rows.length,1);assert.equal(due.rows[0].kind,'reminder_24h');
    assert.equal((await db.query('select * from public.claim_bros_sell_onboarding_messages(5)')).rows.length,0);
    await db.exec('reset role');
    const manual = await db.query<{status:string;reason:string}>("select status,reason from public.bros_sell_onboarding_messages where kind='initial'");
    assert.equal(manual.rows[0].status,'sent');assert.equal(manual.rows[0].reason,'manual_delivery_recorded');

    await db.exec('set role authenticated');
    await db.query("select set_config('request.jwt.claim.sub',$1,false)",[userB]);
    assert.equal((await db.query<{activate_bros_sell_onboarding:number}>('select public.activate_bros_sell_onboarding()')).rows[0].activate_bros_sell_onboarding,0);
    await db.query("select set_config('request.jwt.claim.sub',$1,false)",[userA]);
    assert.equal((await db.query<{activate_bros_sell_onboarding:number}>('select public.activate_bros_sell_onboarding()')).rows[0].activate_bros_sell_onboarding,1);
    assert.equal((await db.query<{activate_bros_sell_onboarding:number}>('select public.activate_bros_sell_onboarding()')).rows[0].activate_bros_sell_onboarding,0);
    await assert.rejects(db.query('select * from public.bros_sell_onboarding_messages'),/permission denied/);
    await assert.rejects(db.query('select * from public.claim_bros_sell_onboarding_messages(5)'),/permission denied/);
    await db.exec('reset role');await db.exec('set role service_role');
    const canceled = await db.query<{ok:boolean}>('select public.prepare_bros_sell_onboarding_message($1,$2) as ok',[due.rows[0].id,due.rows[0].attempt_id]);
    assert.equal(canceled.rows[0].ok,false);
    const access = await db.query<{id:string;kind:string;attempt_id:string}>('select * from public.claim_bros_sell_onboarding_messages(5)');
    assert.equal(access.rows.length,1);assert.equal(access.rows[0].kind,'access_confirmed');
    assert.equal((await db.query<{ok:boolean}>('select public.prepare_bros_sell_onboarding_message($1,$2) as ok',[access.rows[0].id,access.rows[0].attempt_id])).rows[0].ok,true);
    assert.equal((await db.query<{ok:boolean}>("select public.finish_bros_sell_onboarding_message($1,$2,'sent','fixture-gmail-id') as ok",[access.rows[0].id,access.rows[0].attempt_id])).rows[0].ok,true);
    assert.equal((await db.query('select * from public.claim_bros_sell_onboarding_messages(5)')).rows.length,0);

    await db.query(`select public.process_bros_sell_hitpay_event('evt-4','pay-4','ref-4','succeeded',197,'MYR','unclaimed@example.com',array['prod_core'],'{}')`);
    await db.exec('reset role');
    await db.exec("update public.bros_sell_payment_orders set paid_at=now()-interval '73 hours' where provider_reference='ref-4'");
    await db.exec('set role service_role');
    const finalReminder = await db.query<{id:string;kind:string;attempt_id:string}>('select * from public.claim_bros_sell_onboarding_messages(5)');
    assert.equal(finalReminder.rows.length,1);assert.equal(finalReminder.rows[0].kind,'reminder_72h');
    await db.query("select public.finish_bros_sell_onboarding_message($1,$2,'uncertain',null)",[finalReminder.rows[0].id,finalReminder.rows[0].attempt_id]);
    assert.equal((await db.query('select * from public.claim_bros_sell_onboarding_messages(5)')).rows.length,0);
    await db.exec('reset role');
  } finally {
    await db.close();
  }
});

