"use client";

import { useCaseToolState, useSalesCases } from "../sales-case-provider";
import CaseLink from "../case-link";

import { useMemo } from "react";
import { diagnoseCase } from "@/lib/bros-sell/sales-case";

const levels = [
["1 — REMIND","Bring the existing conversation back into view.","Recent conversation / quotation / promised action.","Context + brief reminder + easy response.","Saya follow up semula tentang [context] yang kita bincang. Masih relevan untuk anda?","Reply / update / no response","If relevant → continue. If not → clarify.","Repeated non-response without meaningful reason to continue."],
["2 — CLARIFY","Find what remains unclear.","Buyer showed interest but decision is incomplete.","Context + focused clarification question.","Ada bahagian tertentu yang anda masih perlukan penjelasan sebelum boleh decide?","Specific question / barrier","Answer the actual issue.","No relevant unresolved issue."],
["3 — REINFORCE","Reconnect solution to relevant value.","Buyer understands offer but has not decided.","Problem + relevant outcome + concise proof/assurance.","Untuk isu [problem], point utama solution ini ialah [outcome/mechanism]. Saya sertakan [real proof/assurance] untuk rujukan.","Engagement / new question","Move to decision if ready.","If buyer is clearly not interested, do not keep reinforcing."],
["4 — DIAGNOSE","Understand the reason for the stall.","Repeated delay / vague response / quotation silence.","Neutral status question + barrier/timing check.","Saya nak pastikan saya tak follow up secara rawak. Adakah isu ini masih relevan, atau ada perkara lain yang menghalang?","Barrier / timing / clear no","Address barrier, set re-entry or close loop.","Clear no or no future relevance."],
["5 — DECIDE","Invite a clear decision.","Enough context exists for decision.","Simple decision question with legitimate options.","Berdasarkan apa yang kita bincang, anda mahu kita teruskan, tangguhkan, atau tutup dahulu?","Yes / No / Not Now / More Info","Confirm the chosen next step.","Buyer needs more information — return to clarify, not pressure."],
["6 — RE-ENTER","Restart a relevant conversation after a pause.","Old lead + genuine new trigger/relevance.","Previous context + new relevance + permission to reopen.","Kita pernah bincang [problem]. Sekarang [genuine trigger] berlaku. Adakah perkara ini kembali relevan untuk anda?","Re-engagement / no","Requalify from current context.","No relevance / no permission to continue."]
] as const;

const purposes = ["REMIND","CLARIFY","REINFORCE","DIAGNOSE","DECIDE","RE-ENTER"] as const;
const qa = [
"Adakah follow-up ini mempunyai purpose yang jelas?",
"Adakah ia menggunakan context conversation sebenar?",
"Adakah ia memberi value / clarification yang relevan jika diperlukan?",
"Adakah buyer boleh memberi respons yang mudah dan jelas?",
"Adakah next move sudah dikenal pasti?",
"Adakah terdapat stop condition?",
"Adakah saya menghormati clear No atau no future relevance?"
];

export default function FollowUpLadderPage(){
 const [level,setLevel]=useCaseToolState("follow-up","level",0);
 const [leadContext,setLeadContext]=useCaseToolState("follow-up","leadContext","");
 const { active } = useSalesCases();
 const state = active ? diagnoseCase(active.document).leadState : "Unknown";
 const [event,setEvent]=useCaseToolState("follow-up","event","");
 const [purpose,setPurpose]=useCaseToolState<(typeof purposes)[number]>("follow-up","purpose","REMIND");
 const [draft,setDraft]=useCaseToolState("follow-up","draft","");
 const [decision,setDecision]=useCaseToolState("follow-up","decision","");
 const [nextStep,setNextStep]=useCaseToolState("follow-up","nextStep","");
 const [stop,setStop]=useCaseToolState("follow-up","stop","");
 const [checks,setChecks]=useCaseToolState<boolean[]>("follow-up","checks",[]);
 const selected=levels[level];
 const filtered=useMemo(()=>levels.findIndex(x=>x[0].includes(purpose)),[purpose]);
 const preview=draft||(active ? diagnoseCase(active.document).question : levels[filtered<0?level:filtered][4]);
 const setPurposeAndLevel=(p:(typeof purposes)[number])=>{setPurpose(p);const i=levels.findIndex(x=>x[0].includes(p));if(i>=0)setLevel(i);setDraft("");};
 return <main className="container" style={{padding:"28px 0 60px"}}>
  <header className="app-header"><div><div className="brand" style={{fontSize:24}}>BROS SELL™</div><div className="muted">Follow-Up Ladder Library</div></div><div style={{display:"flex",gap:8}}><CaseLink className="btn secondary" href="/app">Analyzer</CaseLink><CaseLink className="btn secondary" href="/app/resources">Resources</CaseLink></div></header>
  <section className="hero simple-hero"><h1>Bina satu susulan yang relevan.</h1><p className="muted">Gunakan konteks perbualan sebenar. Tiada balasan belum bermaksud customer menolak.</p></section>
  <section className="card case-form guided-message"><div className="eyebrow">BUAT SEKARANG</div><h2>Semak mesej. Hantar apabila sesuai.</h2><p className="muted">Sesuaikan ayat ini, kemudian hantar sendiri melalui saluran perbualan anda.</p>
    <label className="field-label"><span>Adapted message</span><textarea className="input textarea compact" rows={3} value={draft} onChange={e=>setDraft(e.target.value)} placeholder={preview} /></label>
    <div className="diagnosis-question" aria-label="Mesej susulan"><p style={{whiteSpace:"pre-wrap"}}>{preview}</p></div>
    <p className="field-note">Rekod tindakan selepas menghantar. Hormati keputusan tidak mahu meneruskan; jangan buat susulan berulang tanpa sebab yang relevan.</p>
  </section>
  <details className="card advanced-details"><summary>Lihat panduan susulan penuh</summary><div className="advanced-details-body">  <section className="card resource-section"><div className="eyebrow">FOLLOW-UP LADDER</div><div className="decision-flow">{levels.map((x,i)=><button type="button" className={i===level?"btn":"btn secondary"} key={x[0]} onClick={()=>{setLevel(i);setPurpose(x[0].split(" — ")[1] as typeof purposes[number]);setDraft("");}}>{x[0]}</button>)}</div></section>
  <section className="card resource-section"><div className="eyebrow">SELECT PURPOSE</div><div className="form-grid"><label><span>Purpose</span><select className="input" value={purpose} onChange={e=>setPurposeAndLevel(e.target.value as typeof purposes[number])}>{purposes.map(x=><option key={x}>{x}</option>)}</select></label><div className="resource-card"><small className="muted">WHEN TO USE</small><p>{selected[2]}</p></div></div></section>
  <section className="card resource-section"><div className="eyebrow">FOLLOW-UP PLANNER</div><div className="resource-grid"><label className="field-label"><span>Lead / Context</span><textarea className="input textarea" rows={3} value={leadContext} onChange={e=>setLeadContext(e.target.value)} placeholder="Who / what conversation is this?" /></label><label className="field-label"><span>Current State</span><textarea className="input textarea" rows={3} value={state} readOnly placeholder="Current Lead State / relevant status." /></label><label className="field-label"><span>Last Meaningful Event</span><textarea className="input textarea" rows={3} value={event} onChange={e=>setEvent(e.target.value)} placeholder="What actually happened last?" /></label><label className="field-label"><span>Purpose of Next Touch</span><input className="input" value={purpose} readOnly /></label></div></section>
  <section className="card resource-section"><div className="eyebrow">EXPECTED SIGNAL → NEXT MOVE</div><div className="resource-grid"><article className="resource-card"><small className="muted">EXPECTED SIGNAL</small><h2>{selected[5]}</h2></article><article className="resource-card"><small className="muted">NEXT MOVE</small><h2>{selected[6]}</h2></article><article className="resource-card"><small className="muted">STOP / EXIT</small><h2>{selected[7]}</h2></article></div><div className="form-grid" style={{marginTop:18}}><label><span>Expected Decision / Signal observed</span><input className="input" value={decision} onChange={e=>setDecision(e.target.value)} placeholder="What happened?" /></label><label><span>Next Step</span><input className="input" value={nextStep} onChange={e=>setNextStep(e.target.value)} placeholder="What happens next?" /></label></div><label className="field-label" style={{marginTop:18}}><span>Stop / Exit condition</span><input className="input" value={stop} onChange={e=>setStop(e.target.value)} placeholder={selected[7]} /></label></section>
  <section className="card resource-section"><div className="eyebrow">FOLLOW-UP QUALITY CHECK</div><div className="resource-grid">{qa.map((q,i)=><label className="resource-card" key={q}><span style={{display:"flex",gap:10,alignItems:"flex-start"}}><input type="checkbox" checked={Boolean(checks[i])} onChange={e=>setChecks(p=>{const n=[...p];n[i]=e.target.checked;return n;})}/><span>{q}</span></span></label>)}</div></section>
  <section className="card resource-section"><div className="eyebrow">RELATION TO LEAD STATE</div><p className="muted">Follow-Up Ladder ialah execution framework. Lead State ialah classification layer. Gunakan current state untuk menentukan follow-up yang sesuai, tetapi jangan anggap setiap follow-up mesti menaikkan state.</p></section>
  <section className="card resource-section"><div className="eyebrow">STOP CONDITION</div><p className="muted">Stop atau close loop apabila buyer memberi clear No, menyatakan tiada future relevance, atau repeated non-response menunjukkan tiada asas yang munasabah untuk terus mengganggu. Reactivation hanya apabila terdapat genuine relevance.</p></section>
  <section className="card"><div className="eyebrow">FAILURE MODE</div><p className="muted">Kerangka ini gagal apabila follow-up menjadi spam: mesej berulang tanpa konteks, pressure selepas silence, atau urgency yang direka untuk mencipta response.</p><h2 style={{marginTop:20}}>Purpose first.</h2><p className="muted">Satu follow-up tidak perlu menjawab semua perkara. Record outcome dan gunakan response untuk menentukan state dan next move.</p></section></div></details>
 </main>
}
