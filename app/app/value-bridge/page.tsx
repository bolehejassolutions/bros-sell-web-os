"use client";

import { useState } from "react";

const fields = [
  ["PROBLEM","Apa masalah yang buyer sendiri sahkan?","Use the diagnosed problem. Avoid generic pain-point language."],
  ["IMPACT","Apa kesan / kos apabila masalah berterusan?","Use actual buyer context. Do not invent financial or operational figures."],
  ["DESIRED OUTCOME","Apa perubahan yang buyer mahu?","State the desired future state in the buyer's language."],
  ["SOLUTION FIT","Bagaimana solution ini membantu mencapai outcome?","Connect the relevant mechanism to the diagnosed problem."],
  ["PROOF / ASSURANCE","Apa evidence atau reassurance yang relevan?","Use real proof, process clarity, scope, terms or other legitimate risk reduction."],
  ["INVESTMENT","Apakah investment yang diperlukan?","State the actual price/investment clearly when context is sufficient."]
] as const;

export default function ValueBridgePage(){
 const [v,setV]=useState<Record<string,string>>({});
 const set=(k:string,x:string)=>setV(p=>({...p,[k]:x}));
 const value=(k:string)=>v[k]||"";
 const one=[value("PROBLEM"),value("IMPACT"),value("DESIRED OUTCOME"),value("SOLUTION FIT"),value("PROOF / ASSURANCE"),value("INVESTMENT")].filter(Boolean).join(" → ");
 const statement=`Because ${value("PROBLEM")||"[PROBLEM]"} is causing ${value("IMPACT")||"[IMPACT]"}, the desired result is ${value("DESIRED OUTCOME")||"[OUTCOME]"}. Our solution addresses this through ${value("SOLUTION FIT")||"[MECHANISM]"}, supported by ${value("PROOF / ASSURANCE")||"[PROOF / ASSURANCE]"}. The investment is ${value("INVESTMENT")||"[INVESTMENT]"}.`;
 return <main className="container" style={{padding:"28px 0 60px"}}>
  <header className="app-header"><div><div className="brand" style={{fontSize:24}}>BROS SELL™</div><div className="muted">Value Bridge</div></div><div style={{display:"flex",gap:8}}><a className="btn secondary" href="/app">Analyzer</a><a className="btn secondary" href="/app/resources">Resources</a><a className="btn secondary" href="/app/offer-stack">Offer Stack</a></div></header>
  <section className="hero"><p className="muted">VALUE → CLOSE</p><h1>Value Bridge Worksheet</h1><p className="muted hero-copy">Bridge the buyer's current problem to the desired outcome, then show why the solution and investment make sense.</p></section>
  <section className="card resource-section"><div className="eyebrow">THE VALUE BRIDGE</div><div className="resource-grid">
   {fields.map(([key,title,help])=><article className="resource-card" key={key}><div><small className="muted">{key}</small><h2>{title}</h2><p className="field-note">{help}</p></div><textarea className="input textarea compact" rows={4} value={value(key)} onChange={e=>set(key,e.target.value)} placeholder="Tulis berdasarkan evidence sebenar..." /></article>)}
  </div></section>
  <section className="card resource-section"><div className="eyebrow">ONE-LINE VERSION</div><p className="muted">{one||"Problem → Impact → Desired Outcome → Solution → Proof / Assurance → Investment"}</p><div className="eyebrow" style={{marginTop:22}}>BROS VALUE STATEMENT</div><p>{statement}</p></section>
  <section className="card resource-section"><div className="eyebrow">BROS QUALITY CHECK</div><div className="resource-grid">
   {["Problem dan impact datang daripada diagnosis sebenar.","Outcome dinyatakan sebagai hasil yang buyer mahu, bukan feature.","Solution fit jelas — bukan sekadar senarai deliverables.","Proof / assurance adalah benar dan relevan.","Investment tidak disamarkan atau sengaja dielakkan.","Value statement membantu buyer memahami decision, bukan memaksa decision."].map(x=><div className="resource-card" key={x}><p>☐ {x}</p></div>)}
  </div><p className="muted" style={{marginTop:18}}>Gagal apabila seller terus menyebut solution sebelum problem dan impact jelas, menganggap semua buyer menghargai perkara yang sama, mengada-adakan cost of inaction, atau menggunakan value explanation untuk mengelakkan perbincangan harga.</p></section>
  <section className="card"><div className="eyebrow">OPERATING RULE</div><p className="muted">Value Bridge bukan teknik menyembunyikan harga. Jika context sudah cukup dan buyer meminta harga, jawab dengan jelas. Ia memberi context supaya investment boleh dinilai dengan lebih baik.</p><p className="muted">Offer Stack menentukan apa yang perlu ada dalam offer. Value Bridge menentukan bagaimana komponen tersebut dihubungkan dalam explanation kepada buyer. Kedua-duanya bekerja bersama, tetapi fungsinya berbeza.</p></section>
 </main>
}
