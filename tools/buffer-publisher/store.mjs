import { ApiError } from './buffer.mjs';

export class GitHubStore {
  constructor(repository,branch,token,fetcher=fetch){this.repo=repository;this.branch=branch;this.token=token;this.fetch=fetcher;this.head=null;this.tree=null;}
  async api(path,method='GET',body) {
    const r=await this.fetch(`https://api.github.com/repos/${this.repo}/${path}`,{method,headers:{Authorization:`Bearer ${this.token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(25_000)});
    if(!r.ok) throw new ApiError('state',`Durable store HTTP ${r.status}; publishing stopped`);
    return r.json();
  }
  async load() {
    const ref=await this.api(`git/ref/heads/${this.branch}`);
    this.head=ref.object.sha;
    const commit=await this.api(`git/commits/${this.head}`);this.tree=commit.tree.sha;
    const file=await this.api(`contents/state.json?ref=${this.head}`);
    const state=JSON.parse(Buffer.from(file.content,'base64').toString('utf8'));
    if(state.schemaVersion!==1 || !state.packages || !state.deliveries) throw new ApiError('state','Invalid state; refusing to reset publication history');
    return state;
  }
  async save(state,extra=[]) {
    const entries=[{path:'state.json',mode:'100644',type:'blob',content:JSON.stringify(state,null,2)},...extra];
    for(const item of entries) if(item.bytes) {const blob=await this.api('git/blobs','POST',{content:item.bytes.toString('base64'),encoding:'base64'});item.sha=blob.sha;delete item.bytes;}
    const tree=await this.api('git/trees','POST',{base_tree:this.tree,tree:entries});
    const commit=await this.api('git/commits','POST',{message:'chore: checkpoint Buffer publishing state',tree:tree.sha,parents:[this.head]});
    // A stale concurrent writer cannot advance this ref: force=false requires fast-forward.
    await this.api(`git/refs/heads/${this.branch}`,'PATCH',{sha:commit.sha,force:false});
    this.head=commit.sha;this.tree=tree.sha;
    return commit.sha;
  }
  urls(commit,folder,files) {return Object.fromEntries(files.map(name=>[name,`https://raw.githubusercontent.com/${this.repo}/${commit}/${folder}/${name}`]));}
}
