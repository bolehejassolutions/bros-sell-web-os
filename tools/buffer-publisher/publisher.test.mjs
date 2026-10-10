import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { catalog, packageFor, validateCaption } from './content.mjs';
import { buildInput, deliveryKey, delivered, gate, matchIntent, selectSlots, slotsFrom } from './planner.mjs';
import { BufferClient, ApiError } from './buffer.mjs';
import { cycle } from './engine.mjs';
import { GitHubStore } from './store.mjs';

const base=JSON.parse(fs.readFileSync(new URL('./config.json',import.meta.url)));
const approved={...base,productionEnabled:true,sampleApproval:{approvedAt:'2026-10-10',contentHash:'reviewed'},initialDeliveryVerified:true};
const now=new Date('2026-10-10T10:30:00Z');
const empty=()=>({schemaVersion:1,packages:{},deliveries:{}});
const urls=Object.fromEntries(['portrait','vertical'].flatMap(s=>[1,2,3].map(i=>[`${s}-${i}.jpg`,`https://raw.githubusercontent.com/a/b/immutable/${s}-${i}.jpg`])));
function fixture(state=empty()) {
 const remote=[];const events=[];const store={save:async()=>{events.push('checkpoint');return 'immutable';},urls:()=>urls};
 const api={calls:0,snapshot:async()=>({account:{organizations:[{id:base.organizationId}]},channels:base.channels.map(c=>({...c,isDisconnected:false,isLocked:false,isQueuePaused:false,timezone:base.timezone,scopes:['pages_manage_posts','instagram_business_content_publish','video.publish']})),dailyPostingLimits:[]}),list:async(c,status)=>remote.filter(p=>status.includes(p.status)),create:async input=>{events.push('create');const p={id:`p${remote.length}`,status:input.saveToDraft?'draft':'scheduled',...input,channelService:base.channels.find(c=>c.id===input.channelId).service};remote.push(p);return p;},get:async id=>remote.find(p=>p.id===id),edit:async input=>{events.push('edit');const p=remote.find(p=>p.id===input.id);Object.assign(p,input,{status:'scheduled'});return p;}};
 return {config:approved,state,store,api,media:async()=>({folder:'media',names:Object.keys(urls),files:[],hashes:{}}),now,remote,events,mode:'production'};
}

test('timezone slots handle local midnight and exact four requested times',()=>{
 const slots=slotsFrom('2026-10-10T15:50:00Z',8);
 assert.equal(slots[0],'2026-10-10T21:00:00.000Z');
 assert.deepEqual(slots.slice(0,4),['2026-10-10T21:00:00.000Z','2026-10-11T03:00:00.000Z','2026-10-11T09:00:00.000Z','2026-10-11T15:00:00.000Z']);
});
test('each editorial topic and adapted caption is unique and within platform limits',()=>{
 assert.equal(catalog.length,60);assert.equal(new Set(catalog.map(c=>c.id)).size,60);
 const pkgs=catalog.map((s,i)=>packageFor(s,i,base));assert.equal(new Set(pkgs.map(p=>p.contentHash)).size,60);
 for(const p of pkgs)for(const [s,t]of Object.entries(p.captions))validateCaption(t,s);
 assert.equal(pkgs.filter(p=>p.promotional).length,12);
});
test('obsolete price and unsupported promise are rejected',()=>{assert.throws(()=>validateCaption('RM99. Menjelaskan, bukan Memujuk.','instagram'));assert.throws(()=>validateCaption('Pasti berjaya. Menjelaskan, bukan Memujuk.','facebook'));});
test('asset adaptation produces a Facebook image and three native carousel images',()=>{
 const pkg=packageFor(catalog[0],0,base);
 assert.equal(buildInput(pkg,base.channels[0],'2030-01-01T00:00:00Z',urls).assets.length,1);
 assert.equal(buildInput(pkg,base.channels[1],'2030-01-01T00:00:00Z',urls).assets.length,3);
 assert.ok(buildInput(pkg,base.channels[2],'2030-01-01T00:00:00Z',urls).assets.every(a=>a.image.url.includes('vertical')));
});
test('queue occupancy includes unmanaged posts, drafts, errors and uncertain writes',()=>{
 const c=base.channels[0];const remote=Array.from({length:9},(_,i)=>({id:String(i),channelId:c.id,status:i?'scheduled':'draft',dueAt:'2030-01-01T00:00:00Z'}));
 const state=empty();state.deliveries.x={channelId:c.id,status:'uncertain',dueAt:'2030-01-02T00:00:00Z'};
 assert.equal(selectSlots(base,now,remote,state)[0].capacity,0);
});
test('production is disabled until both approval and real delivery are recorded',()=>{assert.equal(gate(base),false);assert.equal(gate({...approved,initialDeliveryVerified:false}),false);assert.equal(gate(approved),true);});
test('disabled mode makes zero external calls',async()=>{const f=fixture();f.config=base;f.api.snapshot=()=>{throw Error('Must not call');};assert.equal((await cycle(f)).status,'awaiting_approval');});
test('creation checkpoints its intent before the external mutation',async()=>{const f=fixture();await cycle(f);assert.equal(f.remote.length,12);for(let i=0;i<f.events.length;i++)if(f.events[i]==='create')assert.equal(f.events[i-1],'checkpoint');});
test('restart replenishes remaining capacity, then repeating a cycle adds nothing',async()=>{const f=fixture();await cycle(f);await cycle(f);assert.equal(f.remote.length,24);await cycle(f);assert.equal(f.remote.length,24);for(const c of base.channels)assert.equal(f.remote.filter(p=>p.channelId===c.id).length,8);});
test('saved content is scheduled, never reported as delivered',async()=>{const f=fixture();const r=await cycle(f);assert.equal(r.published.length,0);assert.ok(r.scheduled.every(p=>p.status==='scheduled'));});
test('draft test creates only one package and all three remain drafts',async()=>{const f=fixture();f.mode='drafts';const r=await cycle(f);assert.equal(f.remote.length,3);assert.ok(r.scheduled.every(p=>p.status==='draft'));});
test('lost create acknowledgement recovers the existing remote post',async()=>{
 const f=fixture();const original=f.api.create;let once=true;f.api.create=async input=>{const p=await original(input);if(once){once=false;throw new ApiError('uncertain','lost');}return p;};
 await cycle(f);const count=f.remote.length;const r=await cycle(f);assert.ok(r.retries.some(x=>x.outcome.includes('Recovered')));assert.equal(f.remote.filter(p=>p.text===f.remote[0].text&&p.channelId===f.remote[0].channelId).length,1);assert.ok(f.remote.length>=count);
});
test('uncertain create without a matching post is held, not blindly replayed',async()=>{const f=fixture();f.api.create=async()=>{throw new ApiError('uncertain','lost');};await cycle(f);const keys=Object.keys(f.state.deliveries);const r=await cycle(f);assert.ok(keys.every(k=>f.state.deliveries[k].status==='uncertain'));assert.ok(r.failures.some(x=>x.reason.includes('no replay')));});
test('no state checkpoint means no external mutation',async()=>{const f=fixture();f.store.save=async()=>{throw Error('Unavailable');};await assert.rejects(cycle(f));assert.equal(f.remote.length,0);});
test('sent needs platform URL and timestamp, while scheduled is not proof',()=>{assert.equal(delivered({status:'scheduled'}),false);assert.equal(delivered({status:'sent',sentAt:now.toISOString(),externalLink:'https://example.com/x',channelService:'facebook'}),false);assert.equal(delivered({status:'sent',sentAt:now.toISOString(),externalLink:'https://www.facebook.com/123/posts/456',channelService:'facebook'}),true);});
test('publication confirmation is reported once with URL and timestamp',async()=>{const f=fixture();await cycle(f);Object.assign(f.remote[0],{status:'sent',sentAt:now.toISOString(),externalLink:'https://www.facebook.com/123/posts/456'});const r=await cycle(f);assert.equal(r.published.length,1);assert.equal((await cycle(f)).published.length,0);});
test('bank exhaustion stops generation instead of recycling',async()=>{const f=fixture();f.state.packages=Object.fromEntries(catalog.map((s,i)=>[s.id,{...packageFor(s,i,base),dueAt:'2020-01-01T00:00:00Z'}]));const r=await cycle(f);assert.equal(f.remote.length,0);assert.ok(r.failures.some(e=>e.reason.includes('exhausted')));});
test('disconnected channel is excluded from new writes',async()=>{const f=fixture();const orig=f.api.snapshot;f.api.snapshot=async()=>{const s=await orig();s.channels[2].isDisconnected=true;return s;};await cycle(f);assert.ok(f.remote.every(p=>p.channelId!==base.channels[2].id));});
test('read failures retry, ambiguous create failures do not',async()=>{
 let calls=0;const fetcher=async()=>{calls++;throw Error('Network');};const api=new BufferClient('private-fixture',{fetcher,sleep:async()=>{}});
 await assert.rejects(api.call('query {}'),e=>e.kind==='transport');assert.equal(calls,3);
 calls=0;await assert.rejects(api.call('mutation {}',{},true),e=>e.kind==='uncertain');assert.equal(calls,1);
});
test('explicit rate rejection obeys retry-after without leaking tokens',async()=>{
 let calls=0;const delays=[];const api=new BufferClient('private-fixture',{fetcher:async()=>++calls===1?new Response('{}',{status:429,headers:{'retry-after':'2'}}):new Response(JSON.stringify({data:{ok:true}})),sleep:async n=>delays.push(n)});
 assert.deepEqual(await api.call('query {}'),{ok:true});assert.deepEqual(delays,[2000]);
});
test('daily posting limit excludes a channel',async()=>{const f=fixture();const orig=f.api.snapshot;f.api.snapshot=async()=>({...await orig(),dailyPostingLimits:[{channelId:base.channels[1].id,isAtLimit:true}]});await cycle(f);assert.ok(f.remote.every(p=>p.channelId!==base.channels[1].id));});
test('immutable-media reconciliation works when a post has moved time',()=>{const pkg=packageFor(catalog[0],0,base);const input=buildInput(pkg,base.channels[0],'2030-01-01T00:00:00Z',urls);assert.equal(matchIntent({channelId:input.channelId,dueAt:input.dueAt,input},[{id:'existing',channelId:input.channelId,text:input.text,dueAt:null,assets:[{source:input.assets[0].image.url}]}]).length,1);});
test('GitHub conflict fails closed instead of overwriting publication history',async()=>{let mutations=0;const store=new GitHubStore(base.repository,'state','fixture',async(url,options)=>{mutations++;if(options.method==='PATCH')return new Response('{}',{status:422});return new Response(JSON.stringify({sha:'new'}));});store.head='old';store.tree='old-tree';await assert.rejects(store.save(empty()),e=>e.kind==='state');assert.equal(store.head,'old');assert.equal(mutations,3);});
