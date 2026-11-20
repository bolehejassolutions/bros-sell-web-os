// Isolated loopback fixture. Does not connect to, provision, or bypass live Supabase.
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

import { fixtureUsers } from './session.ts';

const db = new PGlite();
const fixtureAdminKey = 'local-fixture-payment-admin';
await db.exec(readFileSync(new URL('./payment-schema.sql', import.meta.url), 'utf8'));
await db.exec(readFileSync(new URL('../../supabase/migrations/20261007103000_hitpay_entitlement_automation.sql', import.meta.url), 'utf8'));
await db.exec(readFileSync(new URL('../../supabase/sql/onboarding.sql', import.meta.url), 'utf8'));
for (const [key, user] of Object.entries(fixtureUsers)) {
  // The paid buyer creates their confirmed fixture account after checkout.
  if (key !== 'paid') await db.query('insert into auth.users(id,email) values($1,$2)', [user.id, user.email]);
}
await db.exec(`
  insert into public.products(code,name) values ('BROS_SELL_WEB_OS','Legacy');
  insert into public.entitlements(user_id,product_id)
    select '${fixtureUsers.a.id}', id from public.products where code='BROS_SELL_CORE';
  insert into public.entitlements(user_id,product_id)
    select '${fixtureUsers.b.id}', id from public.products where code='BROS_SELL_WEB_OS';
  insert into public.bros_sell_offers(code,product_code,amount_myr,provider_product_id,active)
    values ('FIXTURE','BROS_SELL_CORE',100,'fixture-product',true);
  create function public.has_active_bros_sell_entitlement(p_product_code text,p_access_level text) returns boolean
  language sql stable security definer set search_path='' as $$
    select exists(select 1 from public.entitlements e join public.products p on p.id=e.product_id
      where e.user_id=auth.uid() and p.code=p_product_code and e.access_level=p_access_level
      and p.active and e.status='active' and (e.expires_at is null or e.expires_at>now()))
  $$;`);
await db.exec(readFileSync(new URL('../../supabase/migrations/20261002055316_sales_case_operating_loop.sql',import.meta.url),'utf8'));

function tokenUser(token: string) {
  try { const key=JSON.parse(Buffer.from(token.split('.')[1],'base64url').toString()).fixture; return fixtureUsers[key as keyof typeof fixtureUsers]; } catch { return undefined; }
}
const columns='id,revision,created_at,updated_at,document';
const server = createServer(async (req,res) => {
  res.setHeader('Content-Type','application/json'); res.setHeader('Cache-Control','no-store');
  const send=(status:number,data:unknown) => {res.statusCode=status;res.end(JSON.stringify(data));};
  try {
    const user=tokenUser((req.headers.authorization??'').replace(/^Bearer /,''));
    const url=new URL(req.url??'/', 'http://127.0.0.1:54329');
    if(url.pathname==='/health') return send(200,{fixture:true});
    let raw=''; for await(const chunk of req) raw+=chunk;
    const body=raw?JSON.parse(raw):{};
    if(req.method === 'POST' && url.pathname === '/rest/v1/rpc/process_bros_sell_hitpay_event'
      && req.headers.authorization === `Bearer ${fixtureAdminKey}`) {
      const result = await db.transaction(async tx => {
        await tx.exec('set local role service_role');
        return tx.query<{result:unknown}>('select public.process_bros_sell_hitpay_event($1,$2,$3,$4,$5,$6,$7,$8,$9) as result',
          [body.p_event_key,body.p_provider_payment_id,body.p_provider_reference,body.p_status,body.p_amount,
            body.p_currency,body.p_purchase_email,body.p_product_ids,JSON.stringify(body.p_payload)]);
      });
      return send(200, result.rows[0].result);
    }
    if(!user) return send(401,{code:'bad_jwt',message:'Fixture auth rejected token'});
    if(url.pathname==='/auth/v1/user') {
      if (user.id === fixtureUsers.paid.id) {
        await db.query('insert into auth.users(id,email) values($1,$2) on conflict do nothing', [user.id,user.email]);
      }
      return send(200,{...user,aud:'authenticated',role:'authenticated',app_metadata:{provider:'email'},user_metadata:{},created_at:'2026-10-01T00:00:00Z'});
    }
    if(url.pathname==='/auth/v1/logout') {res.statusCode=204;res.end();return;}
    const result=await db.transaction(async tx => {
      await tx.exec('set local role authenticated'); await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[user.id]);
      if (url.pathname === '/rest/v1/bros_sell_payment_orders' && req.method === 'GET') {
        const orders = await tx.query('select status, entitlement_id from public.bros_sell_payment_orders');
        return {status:200,data:orders.rows};
      }
      if (url.pathname === '/rest/v1/rpc/claim_bros_sell_paid_orders') {
        const claim = await tx.query<{count:number}>('select public.claim_bros_sell_paid_orders() as count');
        return {status:200,data:claim.rows[0].count};
      }
      if (url.pathname === '/rest/v1/rpc/activate_bros_sell_onboarding') {
        const activation = await tx.query<{count:number}>('select public.activate_bros_sell_onboarding() as count');
        return {status:200,data:activation.rows[0].count};
      }
      if(url.pathname.endsWith('/rpc/has_active_bros_sell_entitlement')) {
        const value=await tx.query<{active:boolean}>('select public.has_active_bros_sell_entitlement($1,$2) as active',[body.p_product_code,body.p_access_level]);
        return {status:200,data:value.rows[0].active};
      }
      if(req.method==='POST' && url.pathname==='/storage/v1/object/sign/bros-sell-customer-files/closing-os/BROS_SELL_02_Closing_OS_v2.5.pdf') {
        const access=await tx.query<{active:boolean}>("select public.has_active_bros_sell_entitlement('BROS_SELL_CORE','core') or public.has_active_bros_sell_entitlement('BROS_SELL_WEB_OS','core') as active");
        if(!access.rows[0].active) return {status:403,data:{message:'Fixture storage access denied'}};
        if(body.expiresIn!==600) return {status:400,data:{message:'Expected ten-minute protected download'}};
        return {status:200,data:{signedURL:'/object/sign/bros-sell-customer-files/closing-os/BROS_SELL_02_Closing_OS_v2.5.pdf?token=fixture-download'}};
      }
      if(url.pathname!=='/rest/v1/bros_sell_sales_cases') return {status:404,data:{message:'Fixture endpoint not implemented'}};
      if(req.method==='POST') {
        const r=await tx.query(`insert into public.bros_sell_sales_cases(owner_id,document,status,stage,lead_state,next_action_at) values ($1,$2,$3,$4,$5,$6) returning ${columns}`,[body.owner_id,JSON.stringify(body.document),body.status,body.stage,body.lead_state,body.next_action_at]);
        return {status:201,data:r.rows[0]};
      }
      const owner=url.searchParams.get('owner_id')?.replace(/^eq\./,'');
      const id=url.searchParams.get('id')?.replace(/^eq\./,'');
      if(req.method==='PATCH') {
        const revision=Number(url.searchParams.get('revision')?.replace(/^eq\./,''));
        const r=await tx.query(`update public.bros_sell_sales_cases set document=$1,status=$2,stage=$3,lead_state=$4,next_action_at=$5 where owner_id=$6 and id=$7 and revision=$8 returning ${columns}`,[JSON.stringify(body.document),body.status,body.stage,body.lead_state,body.next_action_at,owner,id,revision]);
        return {status:200,data:r.rows[0]??null};
      }
      if(id) { const r=await tx.query('select revision from public.bros_sell_sales_cases where owner_id=$1 and id=$2',[owner,id]); return {status:200,data:r.rows[0]??null}; }
      const offset=Number(url.searchParams.get('offset')??0), limit=Number(url.searchParams.get('limit')??100);
      const r=await tx.query(`select ${columns} from public.bros_sell_sales_cases where owner_id=$1 order by created_at desc,id desc limit $2 offset $3`,[owner,limit,offset]);
      const count=await tx.query<{count:number}>('select count(*)::integer as count from public.bros_sell_sales_cases where owner_id=$1',[owner]);
      return {status:200,data:r.rows,count:count.rows[0].count,offset};
    });
    if(typeof result.count === 'number' && typeof result.offset === 'number') res.setHeader('Content-Range',`${result.offset}-${Math.max(result.offset,result.offset+(Array.isArray(result.data)?result.data.length:0)-1)}/${result.count}`);
    send(result.status,result.data);
  } catch(error) {send(400,{code:'FIXTURE_DB_ERROR',message:error instanceof Error?error.message:'Fixture failure'});}
});
server.listen(54329,'127.0.0.1',()=>console.log('Isolated Supabase fixture ready: 127.0.0.1:54329'));
process.on('SIGINT',()=>{server.close();void db.close();});
