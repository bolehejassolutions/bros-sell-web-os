import { buildInput, deliveryKey, delivered, gate, matchIntent, nextPackage, selectSlots, slotsFrom } from './planner.mjs';
import { ApiError } from './buffer.mjs';

export async function cycle({config,state,store,api,media,now=new Date(),mode='audit'}) {
  const report={at:now.toISOString(),timezone:config.timezone,mode,status:'checking',published:[],failures:[],retries:[],scheduled:[],capacity:[],contentRemaining:60-Object.keys(state.packages).length};
  if(mode==='production'&&!gate(config)){report.status='awaiting_approval';return report;}
  if(!['audit','drafts','production'].includes(mode)) throw new Error('Invalid mode');
  const snapshot=await api.snapshot(config);
  if(!snapshot.account.organizations.some(o=>o.id===config.organizationId)) throw new ApiError('access','Wrong Buffer organization');
  const channels=snapshot.channels;
  const requiredScopes={facebook:['pages_manage_posts'],instagram:['instagram_content_publish','instagram_business_content_publish'],tiktok:['video.publish']};
  const active=config.channels.filter(c=>channels.some(x=>x.id===c.id&&x.service===c.service&&!x.isDisconnected&&!x.isLocked&&!x.isQueuePaused&&x.timezone===config.timezone&&requiredScopes[c.service].some(s=>x.scopes?.includes(s))));
  for(const c of config.channels.filter(c=>!active.includes(c))) report.failures.push({platform:c.service,reason:'Channel disconnected, paused, locked or mismatched; needs attention'});
  const pending=await api.list(config,['draft','needs_approval','scheduled','sending','error']);
  const recent=await api.list(config,['sent'],new Date(now.getTime()-7*86400_000).toISOString());
  const posts=[...pending,...recent];
  for(const [key,intent] of Object.entries(state.deliveries)) {
    let post=intent.postId?posts.find(p=>p.id===intent.postId):undefined;
    if(!post && intent.postId && !['sent','draft','cancelled'].includes(intent.status)) post=await api.get(intent.postId);
    if(!post && ['submitting','uncertain'].includes(intent.status)) {
      const matched=matchIntent(intent,posts);
      if(matched.length===1){post=matched[0];intent.postId=post.id;report.retries.push({key,outcome:'Recovered existing post; no duplicate create'});}
      else {intent.status='uncertain';report.failures.push({platform:intent.service,reason:'Uncertain write requires reconciliation; no replay'});continue;}
    }
    if(post) {
      intent.bufferStatus=post.status;
      if(delivered(post)) {
        intent.status='sent';intent.url=post.externalLink;intent.sentAt=post.sentAt;
        if(!intent.reported){report.published.push({content:state.packages[intent.packageId]?.seed.hook,platform:intent.service,url:post.externalLink,sentAt:post.sentAt,verification:'Buffer sent status + platform URL + timestamp'});intent.reported=true;}
      } else if(post.status==='sent') {
        intent.status='delivery_unverified';report.failures.push({platform:intent.service,postId:post.id,reason:'Sent status lacks valid platform URL or timestamp'});
      } else if(post.status==='error') {
        intent.status='publishing_error';report.failures.push({platform:intent.service,postId:post.id,reason:'Buffer publication error; retained original post for safe retry'});
        // Only explicitly temporary failures with no sent evidence may be retried on the same post ID.
        const transient=/temporar|rate limit|try again|service unavailable/i.test(post.error?.message??'');
        if(mode==='production'&&transient&&!post.sentAt&&!post.externalLink&&(intent.retryCount??0)<2&&now.getTime()-Date.parse(intent.lastAttempt??intent.createdAt)>6*3600_000) {
          const c=config.channels.find(c=>c.id===intent.channelId);
          const reserved=new Set(pending.filter(p=>p.channelId===c.id&&p.id!==post.id).map(p=>p.dueAt));
          const retrySlot=active.includes(c)?slotsFrom(now,16,config.hours).find(t=>!reserved.has(t)):null;
          if(retrySlot) {
            intent.status='retrying';intent.lastAttempt=now.toISOString();intent.retryCount=(intent.retryCount??0)+1;
            await store.save(state);
            try {
              const {channelId,...payload}=intent.input;
              const updated=await api.edit({...payload,id:post.id,dueAt:retrySlot,saveToDraft:false});
              intent.input.dueAt=retrySlot;intent.dueAt=retrySlot;intent.status=updated.status;
              report.retries.push({platform:intent.service,postId:post.id,dueAt:retrySlot,outcome:'Same-post retry scheduled; delivery pending'});
            } catch(e){intent.status=e.kind==='uncertain'?'uncertain':'publishing_error';report.failures.push({platform:intent.service,reason:'Retry was not confirmed; no duplicate post'});}
            await store.save(state);
          }
        }
      } else {intent.status=post.status;if(post.dueAt)intent.dueAt=post.dueAt;}
    }
  }
  if(mode==='audit') {report.status=report.failures.length?'attention':'audit_pass';report.capacity=selectSlots(config,now,pending,state).map(p=>({platform:p.channel.service,occupied:p.occupied,free:Math.max(0,config.queueLimit-p.occupied)}));return report;}
  // Persist all reconciled evidence before making any new external mutation.
  await store.save(state);
  const available=config.channels.filter(c=>active.includes(c)&&!snapshot.dailyPostingLimits.find(x=>x.channelId===c.id)?.isAtLimit);
  let writes=0;
  const plans=selectSlots({...config,channels:available},now,pending,state);
  const times=[...new Set(plans.flatMap(x=>x.slots))].sort();
  for(const dueAt of times) {
    if(writes>=12 || (api.calls??0)>=17) break;
    let pkg=Object.values(state.packages).find(p=>p.dueAt===dueAt && !p.test);
    if(!pkg) {
      pkg=nextPackage(state,config);
      if(!pkg){report.failures.push({reason:'Unique editorial bank exhausted; queue not filled with recycled content'});break;}
      pkg.dueAt=dueAt;pkg.test=mode==='drafts';
      const generated=await media(pkg);
      const commit=await store.save(state,generated.files);
      pkg.urls=store.urls(commit,generated.folder,generated.names);
      pkg.assetHashes=generated.hashes;
      state.packages[pkg.id]=pkg;
      await store.save(state);
    }
    for(const plan of plans.filter(p=>p.slots.includes(dueAt))) {
      if(writes>=12 || (api.calls??0)>=17) break;
      const key=deliveryKey(plan.channel.id,dueAt,pkg);
      if(state.deliveries[key]) continue;
      const input=buildInput(pkg,plan.channel,dueAt,pkg.urls,mode==='drafts');
      const intent={packageId:pkg.id,channelId:plan.channel.id,service:plan.channel.service,dueAt,input,createdAt:now.toISOString(),status:'submitting'};
      state.deliveries[key]=intent;
      await store.save(state); // Write-ahead intent is mandatory, even if Buffer times out.
      writes++;
      try {
        const saved=await api.create(input);
        intent.postId=saved.id;intent.status=saved.status;
        if(mode==='production' && (saved.status!=='scheduled'||saved.dueAt!==dueAt||saved.schedulingType!=='automatic')) {
          intent.status='schedule_mismatch';report.failures.push({platform:plan.channel.service,postId:saved.id,reason:'Scheduling mismatch; review original post'});
        } else report.scheduled.push({platform:plan.channel.service,postId:saved.id,status:saved.status,dueAt:saved.dueAt,content:pkg.seed.hook});
        pending.push(saved);
      } catch(e) {
        intent.status=e.kind==='uncertain'?'uncertain':'blocked';
        report.failures.push({platform:plan.channel.service,reason:e.kind==='uncertain'?'Create outcome uncertain; no automatic replay':`Post deferred (${e.kind??'unknown'})`});
      }
      await store.save(state);
    }
    if(mode==='drafts') break; // Exactly one test package across the available channels.
  }
  report.capacity=selectSlots(config,now,pending,state).map(p=>({platform:p.channel.service,occupied:p.occupied,free:Math.max(0,config.queueLimit-p.occupied)}));
  report.contentRemaining=60-Object.keys(state.packages).length;
  report.status=report.failures.length?'attention':'cycle_complete';
  return report;
}
