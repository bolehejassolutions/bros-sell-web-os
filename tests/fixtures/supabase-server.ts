// Isolated loopback fixture. Does not connect to, provision, or bypass live Supabase.
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

export const FIXTURE_USERS = {
  a: {id:'11111111-1111-4111-8111-111111111111',email:'a@example.test'},
  b: {id:'22222222-2222-4222-8222-222222222222',email:'b@example.test'},
  c: {id:'33333333-3333-4333-8333-333333333333',email:'c@example.test'},
};
const db = new PGlite();
await db.exec(`create role authenticated; create role anon; create schema auth; create table auth.users(id uuid primary key);
  insert into auth.users values ${Object.values(FIXTURE_USERS).map(u=>`('${u.id}')`).join(',')};
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
  grant usage on schema auth to authenticated,anon;
  create table public.fixture_entitlements(owner_id uuid, product text, active boolean);
  insert into public.fixture_entitlements values ('${FIXTURE_USERS.a.id}','BROS_SELL_CORE',true),('${FIXTURE_USERS.b.id}','BROS_SELL_WEB_OS',true);
  create function public.has_active_bros_sell_entitlement(p_product_code text,p_access_level text) returns boolean
  language sql stable security definer set search_path='' as $$ select exists(select 1 from public.fixture_entitlements where owner_id=auth.uid() and product=p_product_code and active and p_access_level='core') $$;`);
await db.exec(readFileSync(new URL('../../supabase/migrations/20261002055316_sales_case_operating_loop.sql',import.meta.url),'utf8'));

function tokenUser(token: string) {
  try { const key=JSON.parse(Buffer.from(token.split('.')[1],'base64url').toString()).fixture; return FIXTURE_USERS[key as keyof typeof FIXTURE_USERS]; } catch { return undefined; }
}
const columns='id,revision,created_at,updated_at,document';
const server = createServer(async (req,res) => {
  res.setHeader('Content-Type','application/json'); res.setHeader('Cache-Control','no-store');
  const send=(status:number,data:unknown) => {res.statusCode=status;res.end(JSON.stringify(data));};
  try {
    const user=tokenUser((req.headers.authorization??'').replace(/^Bearer /,''));
    const url=new URL(req.url??'/', 'http://127.0.0.1:54329');
    if(url.pathname==='/health') return send(200,{fixture:true});
    if(!user) return send(401,{code:'bad_jwt',message:'Fixture auth rejected token'});
    if(url.pathname==='/auth/v1/user') return send(200,{...user,aud:'authenticated',role:'authenticated',app_metadata:{provider:'email'},user_metadata:{},created_at:'2026-10-01T00:00:00Z'});
    if(url.pathname==='/auth/v1/logout') {res.statusCode=204;res.end();return;}
    let raw=''; for await(const chunk of req) raw+=chunk;
    const body=raw?JSON.parse(raw):{};
    const result=await db.transaction(async tx => {
      await tx.exec('set local role authenticated'); await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[user.id]);
      if(url.pathname.endsWith('/rpc/has_active_bros_sell_entitlement')) {
        const value=await tx.query<{active:boolean}>('select public.has_active_bros_sell_entitlement($1,$2) as active',[body.p_product_code,body.p_access_level]);
        return {status:200,data:value.rows[0].active};
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
