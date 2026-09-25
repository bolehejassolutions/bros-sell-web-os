"use client";

import { useState } from "react";

const fields = [
  ["PROBLEM","Masalah utama yang diselesaikan","State the relevant problem in buyer language."],
  ["OUTCOME","Hasil yang buyer mahu","Describe the desired result, not merely the deliverable."],
  ["MECHANISM","Bagaimana solution membantu","Explain the relevant method/process without unnecessary complexity."],
  ["PROOF","Bukti yang benar-benar tersedia","Use real evidence: results, demonstrations, credentials, process evidence or relevant proof."],
  ["RISK REDUCTION","Bagaimana ketidakpastian dikurangkan","Clarify scope, process, expectations, terms or other legitimate reassurance."],
  ["INVESTMENT","Harga / investment","State the actual investment clearly when the context is sufficient."],
  ["REASON TO ACT","Kenapa tindakan relevan sekarang","Use a real deadline, trigger, availability, timing or consequence — never fabricated urgency."]
] as const;

export default function OfferStackPage(){
  const [values,setValues]=useState<Record<string,string>>({});
  const set=(k:string,v:string)=>setValues(p=>({...p,[k]:v}));
  const line=(k:string)=>values[k]||"";
  const oneLine=`Untuk ${line("PROBLEM") ? "buyer yang menghadapi "+line("PROBLEM") : "[buyer]"}, kami membantu ${line("PROBLEM")||"[problem]"} supaya ${line("OUTCOME")||"[outcome]"} melalui ${line("MECHANISM")||"[mechanism]"}.`;
  const bridge=[line("PROBLEM"),line("OUTCOME"),line("MECHANISM"),line("PROOF"),line("RISK REDUCTION"),line("INVESTMENT")].filter(Boolean).join(" → ");
  return <main className="container" style={{padding:"28px 0 60px"}}>
    <header className="app-header"><div><div className="brand" style={{fontSize:24}}>BROS SELL™</div><div className="muted">Offer Stack Builder</div></div><div style={{display:"flex",gap:8}}><a className="btn secondary" href="/app">Analyzer</a><a className="btn secondary" href="/app/resources">Resources</a></div></header>
    <section className="hero"><p className="muted">OFFER → VALUE</p><h1>Offer Stack Builder</h1><p className="muted hero-copy">Build the offer around the buyer's problem and desired outcome — not around a list of features.</p></section>
    <section className="card resource-section"><div className="eyebrow">BUILD THE OFFER</div><div className="resource-grid">
      {fields.map(([key,title,help])=><article className="resource-card" key={key}><div><small className="muted">{key}</small><h2>{title}</h2><p className="field-note">{help}</p></div><textarea className="input textarea compact" rows={4} value={values[key]||""} onChange={e=>set(key,e.target.value)} placeholder="Tulis berdasarkan evidence sebenar..." /></article>)}
    </div></section>
    <section className="card resource-section"><div className="eyebrow">OFFER STACK SYNTHESIS</div><div className="resource-grid">
      <article className="resource-card"><small className="muted">ONE-LINE OFFER</small><p>{oneLine}</p></article>
      <article className="resource-card"><small className="muted">VALUE BRIDGE</small><p>{bridge||"Problem → Impact → Desired Outcome → Solution → Proof / Assurance → Investment"}</p></article>
      <label className="field-label"><span>Decision Question</span><span className="field-note">Apa yang masih perlu buyer faham atau sahkan sebelum boleh membuat keputusan?</span><textarea className="input textarea compact" rows={3} value={values.DECISION||""} onChange={e=>set("DECISION",e.target.value)} /></label>
      <label className="field-label"><span>Next Move</span><span className="field-note">Apa langkah paling relevan selepas offer diterangkan?</span><textarea className="input textarea compact" rows={3} value={values.NEXT||""} onChange={e=>set("NEXT",e.target.value)} /></label>
    </div></section>
    <section className="card resource-section"><div className="eyebrow">BROS QUALITY CHECK</div><div className="resource-grid">
      {["Offer bermula daripada problem buyer, bukan produk semata-mata.","Outcome boleh difahami tanpa jargon.","Mechanism menerangkan bagaimana solution bekerja secara relevan.","Semua proof adalah benar dan boleh disokong.","Risk reduction tidak menjanjikan perkara yang tidak dikawal.","Investment jelas apabila konteks sudah mencukupi.","Reason to act adalah genuine."].map(x=><div className="resource-card" key={x}><p>☐ {x}</p></div>)}
    </div><p className="muted" style={{marginTop:18}}>Gagal apabila offer menjadi feature dump, outcome tidak jelas, proof direka atau dibesar-besarkan, risk reduction dijanjikan tanpa asas, atau reason to act menggunakan fake scarcity / fake urgency.</p></section>
    <section className="card"><div className="eyebrow">RELATION TO VALUE BEFORE PRICE</div><p className="muted">Offer Stack menentukan komponen offer. Value Before Price menentukan urutan dan konteks apabila investment dibincangkan. Prinsipnya bukan mengelak harga; jangan jadikan harga sebagai jawapan pertama apabila konteks belum jelas.</p></section>
  </main>;
}
