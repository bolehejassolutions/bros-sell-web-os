"use client";

import { useState } from "react";

const canvasFields = [
  ["WHO","Siapa buyer / decision participant?","Role, business context, relevant characteristics."],
  ["CURRENT STATE","Apa keadaan buyer sekarang?","Current process, situation, existing solution or workaround."],
  ["PROBLEM","Apa masalah sebenar?","Separate the surface symptom from the underlying problem."],
  ["IMPACT","Apa kesan masalah tersebut?","Financial, time, operational, opportunity or risk impact. Use actual information where available."],
  ["TRIGGER","Kenapa isu ini penting sekarang?","Event, change, deadline, pain increase, new opportunity or other trigger."],
  ["DESIRED RESULT","Apa outcome yang buyer mahu?","Describe the desired future state in buyer language."],
  ["DECISION CRITERIA","Apa yang menentukan keputusan?","Price, fit, speed, quality, trust, proof, convenience, implementation or other criteria."],
  ["BARRIER","Apa yang boleh menghalang keputusan?","Budget, timing, comparison, authority, trust, fit, uncertainty or another real barrier."],
  ["AUTHORITY","Siapa terlibat dalam keputusan?","Buyer, decision maker, influencer, approver or other stakeholder."]
] as const;

const questions = [
  ["Q1 — SITUATION","Apa yang sedang berlaku sekarang?","Establish relevant context before diagnosing."],
  ["Q2 — PROBLEM","Apa yang paling mengganggu / menghalang sekarang?","Identify the meaningful problem, not just the visible symptom."],
  ["Q3 — IMPACT","Apa kesannya jika perkara ini berterusan?","Explore consequence in the buyer's own context. Do not manufacture numbers."],
  ["Q4 — DESIRED RESULT","Apa yang anda mahu berlaku sebaliknya?","Clarify the desired future state or outcome."],
  ["Q5 — DECISION","Apa yang perlu jelas sebelum anda boleh buat keputusan?","Surface decision criteria, barriers, timing, authority or next-step conditions."]
] as const;

export default function BuyerIntelligencePage(){
  const [answers,setAnswers]=useState<Record<string,string>>({});
  const [synthesis,setSynthesis]=useState<Record<string,string>>({});
  const set=(key:string,value:string)=>setAnswers(prev=>({...prev,[key]:value}));
  const setSyn=(key:string,value:string)=>setSynthesis(prev=>({...prev,[key]:value}));

  return <main className="container" style={{padding:"28px 0 60px"}}>
    <header className="app-header">
      <div><div className="brand" style={{fontSize:24}}>BROS SELL™</div><div className="muted">Buyer Intelligence</div></div>
      <div style={{display:"flex",gap:8}}><a className="btn secondary" href="/app">Analyzer</a><a className="btn secondary" href="/app/resources">Resources</a></div>
    </header>

    <section className="hero">
      <p className="muted">BUYER → QUALIFY</p>
      <h1>Buyer Intelligence</h1>
      <p className="muted hero-copy">Fahami keadaan buyer sebelum menentukan apa yang perlu dikatakan, ditawarkan atau dicadangkan. Gunakan evidence sebenar, bukan andaian.</p>
    </section>

    <section className="card resource-section">
      <div className="eyebrow">ANALYTICAL VIEW</div>
      <h2>Buyer Intelligence Canvas</h2>
      <p className="muted">Isi berdasarkan actual conversations, observation dan available evidence. Jangan paksa semua ruang diisi jika maklumat belum diketahui.</p>
      <div className="resource-grid">
        {canvasFields.map(([key,q,help])=><article className="resource-card" key={key}>
          <div><small className="muted">{key}</small><h2>{q}</h2><p className="field-note">{help}</p></div>
          <textarea className="input textarea compact" rows={4} value={answers[key]??""} onChange={e=>set(key,e.target.value)} placeholder="Apa yang anda tahu berdasarkan evidence?" />
        </article>)}
      </div>
    </section>

    <section className="card resource-section">
      <div className="eyebrow">CONVERSATIONAL VIEW</div>
      <h2>BROS 5Q</h2>
      <p className="muted">BROS 5Q bukan skrip kaku. Jawapan buyer menentukan soalan atau move seterusnya. Go deeper hanya apabila diperlukan.</p>
      <div className="resource-grid">
        {questions.map(([key,q,help])=><article className="resource-card" key={key}>
          <div><small className="muted">{key}</small><h2>{q}</h2><p className="field-note">{help}</p></div>
          <textarea className="input textarea compact" rows={4} value={answers[key]??""} onChange={e=>set(key,e.target.value)} placeholder="Catat jawapan buyer / evidence..." />
        </article>)}
      </div>
    </section>

    <section className="card resource-section">
      <div className="eyebrow">CONVERSATION SYNTHESIS</div>
      <h2>Build decision clarity</h2>
      <div className="resource-grid">
        {[
          ["What I understand","Ringkaskan situasi + problem dalam bahasa buyer."],
          ["Why it matters","Nyatakan impact yang buyer sendiri sahkan."],
          ["What they want","Nyatakan desired result tanpa menambah andaian."],
          ["What must be clear","Senaraikan decision criteria / barrier yang masih terbuka."],
          ["Next question / move","Pilih satu langkah paling relevan — jangan terus pitch jika diagnosis belum cukup."]
        ].map(([key,help])=><label className="field-label" key={key}><span>{key}</span><span className="field-note">{help}</span><textarea className="input textarea compact" rows={3} value={synthesis[key]??""} onChange={e=>setSyn(key,e.target.value)} /></label>)}
      </div>
    </section>

    <section className="card resource-section">
      <div className="eyebrow">OPERATING RULE</div>
      <h2>Analytical view ≠ conversational script</h2>
      <p className="muted">Buyer Intelligence Map ialah analytical view. BROS 5Q ialah conversational view. Kedua-duanya saling melengkapi tetapi bukan duplicate.</p>
      <p className="muted">Kerangka ini gagal apabila seller mengisi ruang dengan andaian, menggunakan jargon sendiri, bertanya secara mekanikal, atau melompat kepada offer sebelum current state, problem dan decision context cukup jelas.</p>
    </section>
  </main>;
}
