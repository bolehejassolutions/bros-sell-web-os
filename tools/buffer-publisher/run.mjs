import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { BufferClient } from './buffer.mjs';
import { GitHubStore } from './store.mjs';
import { cycle } from './engine.mjs';
import { catalog, packageFor } from './content.mjs';
import { gate } from './planner.mjs';

const root=path.dirname(fileURLToPath(import.meta.url));
const config=JSON.parse(await fs.readFile(path.join(root,'config.json'),'utf8'));
const mode=process.argv.find(x=>x.startsWith('--mode='))?.split('=')[1]??'audit';
const output=path.join(root,'output');await fs.mkdir(output,{recursive:true});
const python=process.env.PUBLISHER_PYTHON??'python3';

export async function media(pkg) {
  const folder=`media/${pkg.id}-${pkg.contentHash.slice(0,12)}`;
  const dir=path.join(output,pkg.id);await fs.mkdir(dir,{recursive:true});
  const input=path.join(dir,'package.json');await fs.writeFile(input,JSON.stringify(pkg,null,2));
  execFileSync(python,[path.join(root,'render.py'),input,dir],{stdio:'pipe'});
  const manifest=JSON.parse(await fs.readFile(path.join(dir,'manifest.json'),'utf8'));
  return {folder,names:manifest.map(m=>m.file),hashes:Object.fromEntries(manifest.map(m=>[m.file,m.sha256])),files:await Promise.all(manifest.map(async m=>({path:`${folder}/${m.file}`,mode:'100644',type:'blob',bytes:await fs.readFile(path.join(dir,m.file))})))};
}

function summary(report) {
  const lines=[`BROS SELL — ${report.status}`,`Cycle: ${report.at} (${report.timezone})`];
  for(const p of report.published??[]) lines.push(`Published: ${p.platform} — ${p.content} — ${p.url} — ${p.sentAt}`);
  for(const p of report.scheduled??[]) lines.push(`${p.status}: ${p.platform} — ${p.content} — ${p.dueAt??'unscheduled draft'}`);
  for(const r of report.retries??[]) lines.push(`Retry: ${r.platform??'recovery'} — ${r.outcome}`);
  for(const e of report.failures??[]) lines.push(`Attention: ${e.platform??'system'} — ${e.reason}`);
  for(const q of report.capacity??[]) lines.push(`Queue: ${q.platform} — ${q.occupied}/10 occupied; ${q.free} free`);
  lines.push(`Unique topics remaining: ${report.contentRemaining??60}`);
  return lines.join('\n');
}

let report,store,state;
try {
  if(mode==='sample') {
    const pkg=packageFor(catalog[0],0,config);await media(pkg);
    report={at:new Date().toISOString(),timezone:config.timezone,status:'sample_rendered',published:[],contentRemaining:60};
  } else if(mode==='production'&&!gate(config)) {
    report={at:new Date().toISOString(),timezone:config.timezone,status:'awaiting_approval',published:[],failures:[{reason:'Publication is disabled pending sample approval and actual delivery verification'}]};
  } else {
    const token=process.env.BUFFER_API_KEY;
    if(!token) throw new Error('BUFFER_API_KEY is missing from secure repository secrets');
    if(!process.env.GITHUB_TOKEN) throw new Error('Workflow-scoped GitHub credential missing');
    if(process.env.GITHUB_REPOSITORY!==config.repository || process.env.GITHUB_REF!=='refs/heads/main') throw new Error('Secret-bearing worker requires the configured repository default branch');
    store=new GitHubStore(config.repository,config.stateBranch,process.env.GITHUB_TOKEN);
    state=await store.load();
    const api=new BufferClient(token);
    report=await cycle({config,state,store,api,media,mode});
    report.apiCalls=api.calls;
    report.contentRemaining=catalog.length-Object.keys(state.packages).length;
    state.lastCycle=report.at;
    await store.save(state,[{path:`reports/${report.at.replace(/[:.]/g,'-')}.json`,mode:'100644',type:'blob',content:JSON.stringify(report,null,2)}]);
  }
} catch(error) {
  // Do not serialize API bodies, headers, credentials, stderr or arbitrary exception strings.
  report={at:new Date().toISOString(),timezone:config.timezone,status:'blocked',published:[],failures:[{reason:error.message.startsWith('BUFFER_API_KEY')?error.message:`Worker stopped safely (${error.kind??'runtime'}); inspect configuration and state before retrying`} ]};
  process.exitCode=1;
}
await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2));
const text=summary(report);
console.log(text);
if(process.env.GITHUB_STEP_SUMMARY) await fs.appendFile(process.env.GITHUB_STEP_SUMMARY,text+'\n');

// Optional explicitly configured reporting endpoint. No messages to unconfigured destinations.
// Persisted reports remain authoritative; a notification failure never replays a social post.
if(process.env.REPORT_WEBHOOK_URL && ['cycle_complete','attention','blocked'].includes(report.status)) {
  try {
    const target=new URL(process.env.REPORT_WEBHOOK_URL);
    if(target.protocol!=='https:') throw new Error('HTTPS required');
    const response=await fetch(target,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,report}),signal:AbortSignal.timeout(15_000)});
    if(!response.ok) throw new Error('Report delivery rejected');
  } catch {console.log('Report notification failed; the stored cycle report is retained.');process.exitCode=1;}
}
