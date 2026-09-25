"use client";

import { useMemo, useState } from "react";
import { BROS_LEAD_STATES } from "@/lib/bros-sell/system-registry";

const steps = [
 {id:1,key:"FIT",question:"Adakah solution sesuai dengan situasi buyer?",evidence:"Need + fit + reasonable expectation",clear:"Proceed",unclear:"Clarify / exit",move:"Confirm fit",buyer:"Confirm fit"},
 {id:2,key:"PROBLEM CLARITY",question:"Adakah problem cukup jelas?",evidence:"Specific problem stated and understood",clear:"Proceed",unclear:"Diagnose",move:"Ask / clarify",buyer:"Ask / clarify"},
 {id:3,key:"OUTCOME CLARITY",question:"Adakah outcome yang dikehendaki jelas?",evidence:"Desired result is explicit",clear:"Proceed",unclear:"Clarify",move:"Define outcome",buyer:"Define outcome"},
 {id:4,key:"SOLUTION FIT",question:"Adakah buyer nampak kaitan solution → outcome?",evidence:"Relevant mechanism understood",clear:"Proceed",unclear:"Explain / clarify",move:"Bridge value",buyer:"Bridge value"},
 {id:5,key:"DECISION BARRIER",question:"Apa yang masih menghalang decision?",evidence:"Budget, timing, comparison, authority, trust, fit, uncertainty",clear:"Address",unclear:"Diagnose",move:"Name the barrier",buyer:"Name the barrier"},
 {id:6,key:"CLARIFY",question:"Adakah barrier / uncertainty sudah cukup jelas?",evidence:"Specific unresolved issue",clear:"Move to choice",unclear:"Ask one focused question",move:"Clarify",buyer:"Clarify"},
 {id:7,key:"CHOOSE",question:"Adakah buyer bersedia memilih?",evidence:"Yes / No / Not Now / More Info",clear:"Confirm",unclear:"Do not force",move:"Use appropriate close",buyer:"Choose"},
 {id:8,key:"NEXT STEP",question:"Apakah next step yang dipersetujui?",evidence:"Concrete action / date / responsibility",clear:"Record",unclear:"Clarify",move:"Confirm next step",buyer:"Confirm next step"}
] as const;

const closes = [
 ["DIRECT CLOSE","Use when readiness and decision context are clear.","Adakah anda mahu kita teruskan?"],
 ["CHOICE CLOSE","Use when buyer is ready and there are legitimate options.","Anda lebih sesuai dengan Option A atau B?"],
 ["CONDITIONAL CLOSE","Use when a specific condition must be resolved first.","Jika [condition] sudah jelas, adakah anda selesa untuk teruskan?"]
] as const;

type Decision = "" | "Yes" | "No" | "Not Now" | "More Info";
type State = typeof BROS_LEAD_STATES[number];

export default function ClosePathPage(){
 const [answers,setAnswers]=useState<Record<number,"Clear"|"Unclear">>({});
 const [leadState,setLeadState]=useState<State>("Aware");
 const [decision,setDecision]=useState<Decision>("");
 const [barrier,setBarrier]=useState("");
 const [nextStep,setNextStep]=useState("");
 const [closeType,setCloseType]=useState("");
 const set=(n:number,v:"Clear"|"Unclear")=>setAnswers(p=>({...p,[n]:v}));
 const firstUnclear=useMemo(()=>steps.find(s=>answers[s.id]==="Unclear"),[answers]);
 const allClear=steps.every(s=>answers[s.id]==="Clear");
 const recommended=decision==="Yes" && allClear ? "DIRECT CLOSE" : decision==="More Info" ? "CONDITIONAL CLOSE" : allClear ? "CHOICE CLOSE" : "CLARIFY FIRST";
 return <main className="container" style={{padding:"28px 0 60px"}}>
  <header className="app-header"><div><div className="brand" style={{fontSize:24}}>BROS SELL™</div><div className="muted">Close Path Decision Tree</div></div><div style={{display:"flex",gap:8}}><a className="btn secondary" href="/app">Analyzer</a><a className="btn secondary" href="/app/resources">Resources</a></div></header>
  <section className="hero"><p className="muted">CLOSE → DECISION</p><h1>Close Path Decision Tree</h1><p className="muted hero-copy">Create clarity and choose the appropriate next step — not to force a sale.</p></section>
  <section className="card resource-section"><div className="eyebrow">BROS CLOSE PATH</div><div className="decision-flow">{steps.map((s,i)=><span key={s.id}><b>{s.id}. {s.key}</b>{i<steps.length-1&&<b> → </b>}</span>)}</div></section>
  <section className="card resource-section"><div className="eyebrow">DECISION CHECK</div><div className="resource-grid">
   {steps.map(s=><article className="resource-card" key={s.id}>
    <small className="muted">STEP {s.id} · {s.key}</small><h2>{s.question}</h2><p className="field-note"><strong>Evidence / Signal:</strong> {s.evidence}</p>
    <div className="form-grid"><button type="button" className={answers[s.id]==="Clear"?"btn":"btn secondary"} onClick={()=>set(s.id,"Clear")}>Clear → {s.clear}</button><button type="button" className={answers[s.id]==="Unclear"?"btn":"btn secondary"} onClick={()=>set(s.id,"Unclear")}>Unclear → {s.unclear}</button></div>
    <p className="field-note"><strong>Seller Move:</strong> {s.move} · <strong>Buyer Decision:</strong> {s.buyer}</p>
   </article>)}
  </div></section>
  <section className="card resource-section"><div className="eyebrow">ROUTING</div><h2>{firstUnclear ? `Clarify Step ${firstUnclear.id}: ${firstUnclear.key}` : allClear ? "Path is clear — move to decision." : "Complete the decision checks."}</h2><p className="muted">{firstUnclear ? firstUnclear.question+" "+firstUnclear.unclear+" before selecting a close." : allClear ? "Fit, problem, outcome, solution fit and barrier are sufficiently clear to move toward choice." : "Use the evidence/signal column to classify each step rather than relying on seller assumption."}</p></section>
  <section className="card resource-section"><div className="eyebrow">CLOSE SELECTION</div><div className="form-grid"><label><span>Current Lead State</span><select className="input" value={leadState} onChange={e=>setLeadState(e.target.value as State)}>{BROS_LEAD_STATES.map(s=><option key={s}>{s}</option>)}</select></label><label><span>Decision</span><select className="input" value={decision} onChange={e=>setDecision(e.target.value as Decision)}><option value="">Select...</option><option>Yes</option><option>No</option><option>Not Now</option><option>More Info</option></select></label></div>
   <div className="resource-grid" style={{marginTop:18}}>{closes.map(([name,use,script])=><article className={recommended===name?"resource-card refined":"resource-card"} key={name}><small className="muted">{name}</small><h2>{use}</h2><p>“{script}”</p></article>)}</div>
   <div className="result-block" style={{marginTop:18}}><small className="muted">CURRENT RECOMMENDATION</small><div className="result-stage">{recommended}</div><p className="field-note">Recommendation follows readiness and decision context, not seller preference.</p></div>
  </section>
  <section className="card resource-section"><div className="eyebrow">DECISION RECORD</div><div className="resource-grid">
   <label className="field-label"><span>Current Lead State</span><input className="input" value={leadState} readOnly /></label>
   <label className="field-label"><span>Decision</span><input className="input" value={decision||"Not recorded"} readOnly /></label>
   <label className="field-label"><span>Barrier Remaining</span><textarea className="input textarea compact" rows={3} value={barrier} onChange={e=>setBarrier(e.target.value)} placeholder="Write the actual unresolved barrier, if any." /></label>
   <label className="field-label"><span>Next Step</span><textarea className="input textarea compact" rows={3} value={nextStep} onChange={e=>setNextStep(e.target.value)} placeholder="Concrete next action + owner + timing where applicable." /></label>
  </div></section>
  <section className="card resource-section"><div className="eyebrow">BROS CLOSE GUARDRAILS</div><div className="resource-grid">{["Close ialah proses membantu decision, bukan pressure tactic.","Objection bukan enemy; diagnose dahulu.","Decision boleh menjadi Yes, No, Not Now atau More Info.","Jika fit tidak wujud, graceful exit boleh menjadi next best move.","Jangan gunakan fake urgency atau scarcity."].map(x=><div className="resource-card" key={x}><p>☐ {x}</p></div>)}</div>
   <p className="muted" style={{marginTop:18}}>Lead State membantu mengklasifikasikan tahap behaviour/evidence. Close Path membantu menentukan apa yang perlu dijelaskan dan bagaimana mendapatkan next step. Ia bukan state baru.</p>
  </section>
  <section className="card"><div className="eyebrow">HOW TO USE</div><ol><li>Check fit — jangan cuba close jika solution memang tidak sesuai.</li><li>Confirm clarity — problem, outcome dan solution fit perlu cukup jelas untuk decision.</li><li>Name the barrier — jika buyer belum membuat keputusan, cari apa yang sebenarnya belum jelas.</li><li>Choose the close — gunakan Direct, Choice atau Conditional Close berdasarkan readiness, bukan preference seller.</li><li>Confirm next step — decision yang baik berakhir dengan next step yang jelas atau keputusan yang jelas untuk tidak meneruskan.</li></ol><p className="muted">Urgency hanya digunakan jika genuine. “Not Now” bukan objection yang mesti dipatahkan.</p></section>
 </main>
}
