import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const buyer = '11111111-1111-4111-8111-111111111111';
const otherBuyer = '22222222-2222-4222-8222-222222222222';
const entitlement = '33333333-3333-4333-8333-333333333333';
type Claimed = { id: string; purchase_email: string; kind: string; attempt_id: string };

async function isolatedOutbox(check: (db: PGlite) => Promise<void>) {
  const db = new PGlite();
  try {
    // Synthetic, in-memory fixtures only. No payment processor, SMTP, customer
    // records or granting routines are installed or contacted by these tests.
    await db.exec(`
      create role anon; create role authenticated; create role service_role;
      create schema auth;
      create table auth.users(id uuid primary key, email text, email_confirmed_at timestamptz);
      create function auth.uid() returns uuid language sql stable as $$
        select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
      $$;
      grant usage on schema auth to anon, authenticated, service_role;
      create table public.entitlements(
        id uuid primary key, user_id uuid not null, status text not null, expires_at timestamptz
      );
      create table public.bros_sell_payment_orders(
        id uuid primary key default gen_random_uuid(), user_id uuid,
        purchase_email text not null, provider_reference text unique not null,
        status text not null, entitlement_id uuid, paid_at timestamptz,
        updated_at timestamptz not null default now()
      );
      insert into auth.users values
        ('${buyer}','buyer@example.com',now()),
        ('${otherBuyer}','other@example.com',now());
      insert into public.entitlements values ('${entitlement}','${buyer}','active',null);
    `);
    await db.exec(readFileSync(new URL('../supabase/sql/onboarding.sql', import.meta.url), 'utf8'));
    await check(db);
  } finally {
    await db.close();
  }
}

async function addOrder(db: PGlite, reference: string, age: string, status = 'paid') {
  const result = await db.query<{ id: string }>(`
    insert into public.bros_sell_payment_orders(user_id,purchase_email,provider_reference,status,entitlement_id,paid_at)
    values ($1,'buyer@example.com',$2,$3,$4,now()-$5::interval) returning id
  `, [buyer, reference, status, entitlement, age]);
  return result.rows[0].id;
}

async function claim(db: PGlite) {
  await db.exec('set role service_role');
  try {
    return (await db.query<Claimed>('select * from public.claim_bros_sell_onboarding_messages()')).rows;
  } finally {
    await db.exec('reset role');
  }
}

async function prepare(db: PGlite, delivery: Claimed) {
  await db.exec('set role service_role');
  try {
    return (await db.query<{ ready: boolean }>(
      'select public.prepare_bros_sell_onboarding_message($1,$2) as ready',
      [delivery.id, delivery.attempt_id],
    )).rows[0].ready;
  } finally {
    await db.exec('reset role');
  }
}

test('outbox only schedules paid orders, deduplicates manual sends and denies customer queue access', async () => {
  await isolatedOutbox(async db => {
    const orderId = await addOrder(db, 'fixture-paid', '1 hour');
    await addOrder(db, 'fixture-pending', '1 hour', 'pending');
    await addOrder(db, 'fixture-refunded', '1 hour', 'refunded');
    await db.query(`insert into public.bros_sell_onboarding_manual_deliveries values ($1,'initial',now())`, ['fixture-paid']);
    assert.deepEqual(await claim(db), []);
    assert.deepEqual(await claim(db), []);
    const rows = (await db.query<{ order_id: string; kind: string; status: string }>(
      'select order_id,kind,status from public.bros_sell_onboarding_messages order by kind',
    )).rows;
    assert.equal(rows.length, 3);
    assert.ok(rows.every(row => row.order_id === orderId));
    assert.equal(rows.find(row => row.kind === 'initial')?.status, 'sent');
    await assert.rejects(db.query(`insert into public.bros_sell_onboarding_messages(order_id,kind,due_at) values ($1,'initial',now())`, [orderId]), /duplicate key/);
    for (const role of ['anon', 'authenticated']) {
      await db.exec(`set role ${role}`);
      await assert.rejects(db.query('select * from public.bros_sell_onboarding_messages'), /permission denied/);
      await assert.rejects(db.query('select * from public.bros_sell_onboarding_manual_deliveries'), /permission denied/);
      await assert.rejects(db.query('select * from public.claim_bros_sell_onboarding_messages()'), /permission denied/);
      await db.exec('reset role');
    }
    assert.equal((await db.query('select * from public.entitlements')).rows.length, 1);
  });
});

test('prepare rejects an expired lease before any sync or reclaim, then issues a fresh attempt', async () => {
  await isolatedOutbox(async db => {
    await addOrder(db, 'fixture-lease', '1 hour');
    const first = (await claim(db))[0];
    assert.equal(first.kind, 'initial');
    await db.query(`update public.bros_sell_onboarding_messages set attempted_at=now()-interval '11 minutes' where id=$1`, [first.id]);
    assert.equal(await prepare(db, first), false);
    const expired = (await db.query<{ status: string; attempt_id: string | null }>(
      'select status,attempt_id from public.bros_sell_onboarding_messages where id=$1', [first.id],
    )).rows[0];
    assert.deepEqual(expired, { status: 'pending', attempt_id: null });
    const next = (await claim(db))[0];
    assert.equal(next.id, first.id);
    assert.notEqual(next.attempt_id, first.attempt_id);
    assert.equal(await prepare(db, first), false);
    assert.equal(await prepare(db, next), true);
  });
});

test('prepare suppresses an initial or first reminder whose time window closed after reservation', async () => {
  for (const fixture of [
    { kind: 'initial', age: '24 hours 1 minute', delay: '5 minutes', nextKind: 'reminder_24h' },
    { kind: 'reminder_24h', age: '72 hours 1 minute', delay: '24 hours', nextKind: 'reminder_72h' },
  ]) {
    await isolatedOutbox(async db => {
      const orderId = await addOrder(db, `fixture-${fixture.kind}`, fixture.age);
      // This reservation was acquired two minutes ago, just before the window
      // closed. The lease remains valid, so only the time guard can suppress it.
      const reserved = (await db.query<Claimed>(`
        insert into public.bros_sell_onboarding_messages(order_id,kind,due_at,status,attempt_id,attempted_at)
        select id,$2,paid_at+$3::interval,'reserved',gen_random_uuid(),now()-interval '2 minutes'
        from public.bros_sell_payment_orders where id=$1
        returning id,'buyer@example.com'::text as purchase_email,kind,attempt_id
      `, [orderId, fixture.kind, fixture.delay])).rows[0];
      assert.equal(await prepare(db, reserved), false, fixture.kind);
      assert.equal((await db.query<{ status: string }>(
        'select status from public.bros_sell_onboarding_messages where id=$1', [reserved.id],
      )).rows[0].status, 'suppressed');
      const latest = await claim(db);
      assert.equal(latest.length, 1);
      assert.equal(latest[0].kind, fixture.nextKind);
      assert.equal(await prepare(db, latest[0]), true);
    });
  }
});

test('refund and a newly recorded manual delivery suppress already reserved messages', async () => {
  for (const condition of ['refund', 'manual']) {
    await isolatedOutbox(async db => {
      const orderId = await addOrder(db, `fixture-${condition}`, '1 hour');
      const reserved = (await claim(db))[0];
      if (condition === 'refund') {
        await db.query(`update public.bros_sell_payment_orders set status='refunded' where id=$1`, [orderId]);
      } else {
        await db.query(`insert into public.bros_sell_onboarding_manual_deliveries values ($1,'initial',now())`, [`fixture-${condition}`]);
      }
      assert.equal(await prepare(db, reserved), false);
      assert.equal((await db.query<{ status: string }>(
        'select status from public.bros_sell_onboarding_messages where id=$1', [reserved.id],
      )).rows[0].status, 'suppressed');
    });
  }
});

test('uncertain and stale sending records never replay and a stale attempt cannot record acceptance', async () => {
  await isolatedOutbox(async db => {
    await addOrder(db, 'fixture-uncertain', '1 hour');
    const reserved = (await claim(db))[0];
    assert.equal(await prepare(db, reserved), true);
    await db.exec('set role service_role');
    assert.equal((await db.query<{ recorded: boolean }>(
      "select public.finish_bros_sell_onboarding_message($1,$2,'sent','fixture-smtp-receipt') as recorded",
      [reserved.id, '44444444-4444-4444-8444-444444444444'],
    )).rows[0].recorded, false);
    await assert.rejects(db.query(
      "select public.finish_bros_sell_onboarding_message($1,$2,'sent',null)",
      [reserved.id, reserved.attempt_id],
    ), /Invalid receipt/);
    assert.equal((await db.query<{ recorded: boolean }>(
      "select public.finish_bros_sell_onboarding_message($1,$2,'uncertain',null) as recorded",
      [reserved.id, reserved.attempt_id],
    )).rows[0].recorded, true);
    await db.exec('reset role');
    assert.deepEqual(await claim(db), []);
    assert.deepEqual(await claim(db), []);
    await addOrder(db, 'fixture-crashed', '1 hour');
    const crashed = (await claim(db))[0];
    assert.equal(await prepare(db, crashed), true);
    await db.query(`update public.bros_sell_onboarding_messages set attempted_at=now()-interval '11 minutes' where id=$1`, [crashed.id]);
    assert.deepEqual(await claim(db), []);
    assert.equal((await db.query<{ status: string }>(
      'select status from public.bros_sell_onboarding_messages where id=$1', [crashed.id],
    )).rows[0].status, 'uncertain');
  });
});

test('self activation requires confirmed purchase identity and an active existing linked entitlement', async () => {
  await isolatedOutbox(async db => {
    const orderId = await addOrder(db, 'fixture-activation', '1 hour');
    const reminder = (await claim(db))[0];
    await db.exec('set role authenticated');
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [otherBuyer]);
    assert.equal((await db.query<{ count: number }>('select public.activate_bros_sell_onboarding() as count')).rows[0].count, 0);
    await db.exec('reset role');
    await db.query('update auth.users set email_confirmed_at=null where id=$1', [buyer]);
    await db.exec('set role authenticated');
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [buyer]);
    assert.equal((await db.query<{ count: number }>('select public.activate_bros_sell_onboarding() as count')).rows[0].count, 0);
    await db.exec('reset role');
    await db.query('update auth.users set email_confirmed_at=now() where id=$1', [buyer]);
    await db.query("update public.entitlements set status='revoked' where id=$1", [entitlement]);
    await db.exec('set role authenticated');
    assert.equal((await db.query<{ count: number }>('select public.activate_bros_sell_onboarding() as count')).rows[0].count, 0);
    await db.exec('reset role');
    await db.query("update public.entitlements set status='active' where id=$1", [entitlement]);
    await db.exec('set role authenticated');
    assert.equal((await db.query<{ count: number }>('select public.activate_bros_sell_onboarding() as count')).rows[0].count, 1);
    assert.equal((await db.query<{ count: number }>('select public.activate_bros_sell_onboarding() as count')).rows[0].count, 0);
    await db.exec('reset role');
    assert.equal(await prepare(db, reminder), false);
    const confirmation = (await claim(db))[0];
    assert.equal(confirmation.kind, 'access_confirmed');
    await db.query("update public.entitlements set status='revoked' where id=$1", [entitlement]);
    assert.equal(await prepare(db, confirmation), false);
    assert.equal((await db.query('select * from public.entitlements')).rows.length, 1);
    assert.equal((await db.query<{ id: string }>(
      'select id from public.bros_sell_payment_orders where id=$1 and activated_at is not null', [orderId],
    )).rows.length, 1);
  });
});
