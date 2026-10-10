import { catalog, packageFor, hash } from './content.mjs';

export function slotsFrom(now, count=8, hours=[5,11,17,23]) {
  const slots=[];
  const minimum = new Date(now).getTime()+30*60_000;
  const local = new Date(new Date(now).getTime()+8*3600_000);
  const firstDay = Date.UTC(local.getUTCFullYear(),local.getUTCMonth(),local.getUTCDate());
  for (let day=0;slots.length<count;day++) {
    for(const hour of hours) {
      const utc = firstDay+day*86400_000+(hour-8)*3600_000;
      if (utc >= minimum) slots.push(new Date(utc).toISOString());
      if(slots.length===count) break;
    }
  }
  return slots;
}

export function nextPackage(state, config) {
  const used = new Set(Object.values(state.packages??{}).map(x=>x.id));
  const candidates = catalog.filter(x=>!used.has(x.id));
  const last = Object.values(state.packages??{}).at(-1)?.stage;
  const seed = candidates.find(x=>x.stage!==last)??candidates[0];
  if(!seed) return null;
  return packageFor(seed, used.size, config);
}

export function selectSlots(config, now, remote, state) {
  const plan=[];
  const times=slotsFrom(now,12,config.hours);
  for(const channel of config.channels) {
    const posts=remote.filter(p=>p.channelId===channel.id);
    // Treat drafts/errors conservatively as capacity too; sending posts still reserve a slot.
    const occupied=posts.filter(p=>['draft','needs_approval','scheduled','sending','error'].includes(p.status)).length;
    const intents=Object.values(state.deliveries??{}).filter(d=>d.channelId===channel.id && ['submitting','uncertain','blocked'].includes(d.status) && !posts.some(p=>p.id===d.postId)).length;
    const capacity=Math.max(0,Math.min(config.queueTarget-occupied-intents,config.queueLimit-occupied-intents));
    const reservations = new Set([
      ...posts.filter(p=>['scheduled','sending'].includes(p.status)).map(p=>p.dueAt),
      ...Object.values(state.deliveries??{}).filter(d=>d.channelId===channel.id && !['sent','cancelled'].includes(d.status)).map(d=>d.dueAt)
    ]);
    plan.push({channel,occupied,capacity,slots:times.filter(t=>!reservations.has(t)).slice(0,capacity)});
  }
  return plan;
}

export function buildInput(pkg, channel, dueAt, urls, draft=false) {
  const shape=channel.service==='tiktok'?'vertical':'portrait';
  const paths=channel.service==='facebook'?[`${shape}-1.jpg`]:[1,2,3].map(i=>`${shape}-${i}.jpg`);
  const assets=paths.map(path=>({image:{url:urls[path],metadata:{altText:`Contoh pendidikan jualan: ${pkg.seed.hook}. ${pkg.seed.lesson}`}}}));
  if(assets.some(a=>!a.image.url?.startsWith('https://'))) throw new Error('Permanent HTTPS media required');
  const metadata=channel.service==='facebook'?{facebook:{type:'post'}}:channel.service==='instagram'?{instagram:{type:'post',shouldShareToFeed:true,isAiGenerated:true}}:{tiktok:{title:pkg.seed.hook.slice(0,90),isAiGenerated:true}};
  return {channelId:channel.id,text:pkg.captions[channel.service],assets,metadata,schedulingType:'automatic',mode:'customScheduled',dueAt,saveToDraft:draft,aiAssisted:true};
}

export function deliveryKey(channelId,dueAt,pkg) { return hash(`${channelId}|${dueAt}|${pkg.contentHash}`); }

export function matchIntent(intent, posts) {
  // Full content and scheduled time/immutable media identify an ambiguous create.
  return posts.filter(p=>p.channelId===intent.channelId && p.text===intent.input.text &&
    (p.dueAt===intent.dueAt || p.assets?.some(a=>a.source===intent.input.assets[0].image.url || a.url===intent.input.assets[0].image.url)));
}

export function delivered(post) {
  if(post.status!=='sent' || !post.sentAt || !post.externalLink) return false;
  const url=new URL(post.externalLink);
  const allowed={facebook:['facebook.com','www.facebook.com','m.facebook.com'],instagram:['instagram.com','www.instagram.com'],tiktok:['tiktok.com','www.tiktok.com']}[post.channelService]??[];
  return url.protocol==='https:' && allowed.includes(url.hostname) && Number.isFinite(Date.parse(post.sentAt));
}

export function gate(config) {
  return config.productionEnabled===true && Boolean(config.sampleApproval?.approvedAt) && Boolean(config.sampleApproval?.contentHash) && config.initialDeliveryVerified===true;
}
