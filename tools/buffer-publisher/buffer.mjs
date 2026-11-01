import { setTimeout as wait } from 'node:timers/promises';

export const POST_FIELDS = 'id status text channelId channelService dueAt sentAt externalLink schedulingType isCustomScheduled error { message } assets { source mimeType type ... on ImageAsset { image { width height altText } } }';
export class ApiError extends Error {
  constructor(kind,message){super(message);this.kind=kind;}
}

export class BufferClient {
  constructor(token,{fetcher=fetch,sleep=wait,maxCalls=20}={}) {
    if(!token) throw new ApiError('access','BUFFER_API_KEY is not configured');
    this.token=token; this.fetch=fetcher; this.sleep=sleep;this.calls=0;this.maxCalls=maxCalls;
  }
  async call(query,variables={},mutation=false) {
    for(let attempt=0;attempt<3;attempt++) {
      if(++this.calls>this.maxCalls) throw new ApiError('budget','Cycle API budget reached');
      let response;
      try {
        response=await this.fetch('https://api.buffer.com',{method:'POST',headers:{Authorization:`Bearer ${this.token}`,'Content-Type':'application/json'},body:JSON.stringify({query,variables}),signal:AbortSignal.timeout(25_000)});
      } catch {
        if(mutation) throw new ApiError('uncertain','Mutation response missing; reconcile before another attempt');
        if(attempt===2) throw new ApiError('transport','Buffer read failed');
        await this.sleep(1000*2**attempt);continue;
      }
      if(response.status===401 || response.status===403) throw new ApiError('access','Buffer authorization needs attention');
      if(response.status===429) {
        // An explicitly rejected request is safe to retry. Never replay an ambiguous mutation.
        const delay=Number(response.headers.get('retry-after')??5);
        if(!Number.isFinite(delay) || delay>45 || attempt===2) throw new ApiError('rate','Buffer rate limit; defer to next cycle');
        await this.sleep(Math.max(1,delay)*1000);continue;
      }
      if(response.status>=500) {
        if(mutation) throw new ApiError('uncertain','Buffer server response ambiguous; do not repeat mutation');
        if(attempt===2) throw new ApiError('transport','Buffer read unavailable');
        await this.sleep(1000*2**attempt);continue;
      }
      if(!response.ok) throw new ApiError('rejected',`Buffer HTTP ${response.status}`);
      let body;
      try {body=await response.json();} catch {throw new ApiError(mutation?'uncertain':'transport','Unreadable Buffer response');}
      if(body.errors?.length) throw new ApiError(mutation?'uncertain':'rejected','GraphQL request did not complete');
      return body.data;
    }
  }
  async snapshot(config) {
    return this.call('query Snapshot($org: ChannelsInput!, $limits: DailyPostingLimitsInput!) { account { id organizations { id } } channels(input:$org) { id service isDisconnected isLocked isQueuePaused timezone scopes } dailyPostingLimits(input:$limits) { channelId isAtLimit limit scheduled sent } }',{org:{organizationId:config.organizationId},limits:{channelIds:config.channels.map(c=>c.id)}});
  }
  async list(config,status,createdAfter) {
    const posts=[];let after;
    for(let page=0;page<4;page++) {
      const filter={channelIds:config.channels.map(c=>c.id),status};
      if(createdAfter) filter.createdAt={start:createdAfter};
      const data=await this.call(`query Posts($input: PostsInput!, $after: String) { posts(first:100,after:$after,input:$input) { edges { node { ${POST_FIELDS} } } pageInfo { endCursor hasNextPage } } }`,{input:{organizationId:config.organizationId,filter},after});
      posts.push(...data.posts.edges.map(e=>e.node));
      if(!data.posts.pageInfo.hasNextPage) return posts;
      after=data.posts.pageInfo.endCursor;
    }
    throw new ApiError('capacity','Too many posts to reconcile safely in one cycle');
  }
  async create(input) {
    const data=await this.call(`mutation Create($input:CreatePostInput!) { createPost(input:$input) { __typename ... on PostActionSuccess { post { ${POST_FIELDS} } } ... on MutationError { message } } }`,{input},true);
    const result=data.createPost;
    if(result.__typename!=='PostActionSuccess') throw new ApiError(result.__typename==='UnexpectedError'?'uncertain':'rejected',`Buffer rejected post (${result.__typename})`);
    return result.post;
  }
  async edit(input) {
    const data=await this.call(`mutation Edit($input:EditPostInput!) { editPost(input:$input) { __typename ... on PostActionSuccess { post { ${POST_FIELDS} } } ... on MutationError { message } } }`,{input},true);
    if(data.editPost.__typename!=='PostActionSuccess') throw new ApiError(data.editPost.__typename==='UnexpectedError'?'uncertain':'rejected','Buffer edit was not confirmed');
    return data.editPost.post;
  }
  async get(id) {
    const data=await this.call(`query Post($input:PostInput!) { post(input:$input) { ${POST_FIELDS} } }`,{input:{id}});
    return data.post;
  }
}
