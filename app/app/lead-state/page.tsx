"use client";

import { useMemo, useState } from "react";

type State = "Aware" | "Engaged" | "Qualified" | "Active" | "Decision";

const states: {state:State; meaning:string; evidence:string; focus:string}[] = [
  {state:"Aware", meaning:"Knows / encounters the offer or problem", evidence:"Viewed, noticed, basic awareness", focus:"Create relevant engagement"},
  {state:"Engaged", meaning:"Has taken an observable interaction", evidence:"Replies, asks, interacts, opens conversation", focus:"Discover context"},
  {state:"Qualified", meaning:"Shows sufficient evidence of fit/need/readiness for opportunity", evidence:"Relevant need + fit/readiness evidence", focus:"Diagnose and determine opportunity"},
  {state:"Active", meaning:"Is actively progressing toward a potential decision", evidence:"Requests proposal, details, options, implementation information", focus:"Clarify value, barriers and next step"},
  {state:"Decision", meaning:"A decision state is explicitly emerging or has been reached", evidence:"Yes / No / Not Now / More Info or equivalent evidence", focus:"Confirm decision and appropriate next step"}
];

const evidenceFields = [
  ["need","Relevant need/problem mentioned?","Record what was actually stated or demonstrated."],
  ["engagement","Engagement evidence","Reply, question, content interaction, meeting, quotation request, etc."],
  ["qualification","Qualification evidence","Fit, need, readiness, authority or relevant decision information."],
  ["active","Active buying behaviour","Requested proposal, supplied details, selected option, asked implementation question, etc."],
  ["decision","Decision evidence","Clear yes, no, not now, request for more information, or another observable decision state."]
] as const;

function classify(v:Record<string,string>): {state:State; confidence:"High"|"Medium"|"Low"; reason:string} {
  const has=(k:string)=>Boolean(v[k]?.trim());
  if(has("decision")) return {state:"Decision",confidence:"High",reason:"Decision evidence is explicitly recorded."};
  if(has("active")) return {state:"Active",confidence:has("qualification")?"High":"Medium",reason:"Observable active buying behaviour is recorded."};
  if(has("qualification") && has("need")) return {state:"Qualified",confidence:"High",reason:"Relevant need plus qualification evidence is recorded."};
  if(has("engagement")) return {state:"Engaged",confidence:"High",reason:"Observable interaction is recorded."};
  return {state:"Aware",confidence:has("need")?"Medium":"Low",reason:has("need")?"Need/problem is known, but engagement evidence is not recorded.":"Evidence is insufficient to support a higher state."};
}

export default function LeadStateClassifier(){
 const [v,setV]=useState<Record<string,string>>({});
 const set=(k:string,x:string)=>setV(p=>({...p,[k]:x}));
 const result=useMemo(()=>classify(v),[v]);
 const current=states.find(x=>x.state===result.state)!;
 return <main className="container" style={{padding:"28px 0 60px"}}>
  <header className="app-header"><div><div className="brand" style={{fontSize:24}}>BROS SELL™</div><div className="muted">Lead State Classifier</div></div><div style={{display:"flex",gap:8}}><a className="btn secondary" href="/app">Analyzer</a><a className="btn secondary" href="/app/resources">Resources</a></div></header>
  <section className="hero"><p className="muted">LEAD → QUALIFY</p><h1>Lead State Classifier</h1><p className="muted hero-copy">Classification layer — not an additional sales stage. Classify from observable evidence, not assumption.</p></section>
  <section className="card resource-section">
   <div className="eyebrow">LEAD / CONVERSATION</div>
   <label className="field-label"><span>Lead / company / conversation reference</span><input className="input" value={v.reference||""} onChange={e=>set("reference",e.target.value)} /></label>
   <div className="resource-grid" style={{marginTop:18}}>
    {evidenceFields.map(([key,title,help])=><article className="resource-card" key={key}><div><small className="muted">{key.toUpperCase()}</small><h2>{title}</h2><p className="field-note">{help}</p></div><textarea className="input textarea compact" rows={4} value={v[key]||""} onChange={e=>set(key,e.target.value)} placeholder="Observable evidence only..." /></article>)}
   </div>
  </section>
  <section className="card resource-section">
   <div className="eyebrow">CLASSIFICATION OUTPUT</div>
   <div className="result-stage">{result.state}</div>
   <div className="resource-grid">
    <article className="resource-card"><small className="muted">MEANING</small><h2>{current.meaning}</h2><p className="field-note">Evidence to look for: {current.evidence}</p></article>
    <article className="resource-card"><small className="muted">CONFIDENCE</small><h2>{result.confidence}</h2><p className="field-note">{result.reason}</p></article>
    <article className="resource-card"><small className="muted">SELLER FOCUS</small><h2>{current.focus}</h2><p className="field-note">State tells you what to focus on; it does not force a script.</p></article>
   </div>
  </section>
  <section className="card resource-section">
   <div className="eyebrow">NEXT BEST MOVE</div>
   <h2>{result.state==="Aware"?"Create relevant engagement":result.state==="Engaged"?"Discover context":result.state==="Qualified"?"Diagnose and determine opportunity":result.state==="Active"?"Clarify value, barriers and next step":"Confirm decision and appropriate next step"}</h2>
   <p className="muted">Choose the next action based on the state and evidence. Do not force progression merely to move a lead down the funnel.</p>
  </section>
  <section className="card resource-section">
   <div className="eyebrow">EVIDENCE GUIDE</div>
   <div className="resource-grid">{states.map(s=><article className="resource-card" key={s.state}><small className="muted">{s.state}</small><h2>{s.meaning}</h2><p className="muted"><strong>Evidence:</strong> {s.evidence}</p><p className="field-note"><strong>Focus:</strong> {s.focus}</p></article>)}</div>
  </section>
  <section className="card resource-section">
   <div className="eyebrow">BROS GUARDRAILS</div>
   <div className="resource-grid">
    {["Lead State ialah classification layer, bukan stage tambahan.","Qualified ≠ Buyer.","Decision ≠ Sale.","Silence ≠ automatic rejection.","Classify from behaviour/evidence, not optimism.","If evidence is insufficient, keep the classification conservative."].map(x=><div className="resource-card" key={x}><p>☐ {x}</p></div>)}
   </div>
   <p className="muted" style={{marginTop:18}}>Lead State tidak menggantikan TARGET → BUYER → OFFER → LEAD → QUALIFY → VALUE → CLOSE → FOLLOW-UP → MULTIPLY → OPERATE. Ia berada di atas sequence tersebut sebagai classification layer. WhatsApp dan Phone pula ialah channel layer.</p>
   <p className="muted">Failure mode: jangan naikkan state hanya kerana lead membalas, anggap Qualified bermaksud pasti membeli, atau gunakan classification untuk memberi pressure. State mesti mengikuti evidence.</p>
  </section>
  <section className="card"><div className="eyebrow">HOW TO USE</div><ol><li>Observe — cari tindakan atau maklumat yang benar-benar berlaku.</li><li>Classify — gunakan state paling tinggi yang disokong oleh evidence semasa.</li><li>Record evidence — tulis sebab ringkas yang boleh diperiksa semula.</li><li>Choose next move — state memberitahu apa yang perlu difokuskan; ia tidak memaksa satu skrip.</li><li>Reclassify — state boleh berubah apabila behaviour atau decision context berubah.</li></ol></section>
 </main>
}
