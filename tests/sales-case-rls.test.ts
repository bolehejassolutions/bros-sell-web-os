import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { exampleCase } from '../lib/bros-sell/sales-case.ts';

test('actual migration: owner RLS, canonical/legacy entitlements, revocation and revisions', async () => {
  const db = new PGlite();
  const a='11111111-1111-4111-8111-111111111111', b='22222222-2222-4222-8222-222222222222', c='33333333-3333-4333-8333-333333333333';
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth;
      create table auth.users(id uuid primary key);
      insert into auth.users values ('${a}'),('${b}'),('${c}');
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema auth to authenticated, anon;
      create table public.fixture_entitlements(owner_id uuid, product text, active boolean);
      insert into public.fixture_entitlements values ('${a}','BROS_SELL_CORE',true),('${b}','BROS_SELL_WEB_OS',true);
      create function public.has_active_bros_sell_entitlement(p_product_code text,p_access_level text) returns boolean
      language sql stable security definer set search_path='' as $$
      select exists(select 1 from public.fixture_entitlements where owner_id=auth.uid() and product=p_product_code and active and p_access_level='core') $$;`);
    await db.exec(readFileSync(new URL('../supabase/migrations/20261002055316_sales_case_operating_loop.sql',import.meta.url),'utf8'));
    const login = async (id: string) => { await db.exec('reset role; set role authenticated'); await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]); };
    const insert = async (id: string) => db.query<{id:string,revision:number}>(`insert into public.bros_sell_sales_cases(owner_id,document,status,stage,lead_state) values ($1,$2,'active','FOLLOW-UP','Engaged') returning id,revision`,[id,JSON.stringify(exampleCase())]);
    await login(a); const first=(await insert(a)).rows[0]; assert.equal(first.revision,1);
    await assert.rejects(insert(b),/row-level security/);
    await assert.rejects(db.query('update public.bros_sell_sales_cases set owner_id=$1 where id=$2',[b,first.id]),/permission denied/);
    await assert.rejects(db.query('delete from public.bros_sell_sales_cases where id=$1',[first.id]),/permission denied/);
    await login(b); const second=(await insert(b)).rows[0];
    assert.deepEqual((await db.query<{id:string}>('select id from public.bros_sell_sales_cases')).rows.map(r=>r.id),[second.id]);
    assert.equal((await db.query('update public.bros_sell_sales_cases set stage=$1 where id=$2 returning id',['CLOSE',first.id])).rows.length,0);
    await login(a);
    const update=await db.query<{revision:number}>('update public.bros_sell_sales_cases set stage=$1 where id=$2 and revision=$3 returning revision',['FOLLOW-UP',first.id,1]);
    assert.equal(update.rows[0].revision,2);
    assert.equal((await db.query('update public.bros_sell_sales_cases set stage=$1 where id=$2 and revision=$3 returning id',['CLOSE',first.id,1])).rows.length,0);
    await login(c); assert.equal((await db.query('select id from public.bros_sell_sales_cases')).rows.length,0); await assert.rejects(insert(c),/row-level security/);
    await db.exec('reset role; update public.fixture_entitlements set active=false'); await login(a);
    assert.equal((await db.query('select id from public.bros_sell_sales_cases')).rows.length,0);
    assert.equal((await db.query('update public.bros_sell_sales_cases set stage=$1 where id=$2 returning id',['CLOSE',first.id])).rows.length,0);
    await assert.rejects(insert(a),/row-level security/);
    await db.exec('reset role; set role anon'); await assert.rejects(db.query('select id from public.bros_sell_sales_cases'),/permission denied/);
  } finally { await db.close(); }
});
