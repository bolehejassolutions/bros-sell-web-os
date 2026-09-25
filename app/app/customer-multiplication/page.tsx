"use client";

import { useState } from "react";

const motions=[
["Repeat","Adakah customer mempunyai recurring need / next cycle?","Evidence / Trigger:"],
["Upsell","Adakah customer mempunyai need yang lebih luas / higher-value solution yang relevan?","Evidence / Trigger:"],
["Cross-sell","Adakah ada complementary solution yang menyelesaikan need lain yang nyata?","Evidence / Trigger:"],
["Referral","Adakah result dan relationship cukup baik untuk meminta referral secara relevan?","Evidence / Trigger:"]
] as const;

const checks=[
"Result dicatat berdasarkan evidence, bukan claim yang direka.",
"Proof adalah real dan penggunaannya mempunyai permission yang sesuai jika diperlukan.",
"Referral diminta selepas ada asas value / relevance.",
"Repeat, upsell dan cross-sell dicetuskan oleh need atau trigger sebenar.",
"Customer experience tidak dikorbankan untuk mengejar second sale.",
"Jika tiada need, tiada expansion dipaksa."
];

export default function CustomerMultiplicationPage(){
 const [customer,setCustomer]=useState("");
 const [purchase,setPurchase]=useState("");
 const [expected,setExpected]=useState("");
 const [actual,setActual]=useState("");
 const [proof,setProof]=useState("");
 const [permission,setPermission]=useState("");
 const [referral,setReferral]=useState("");
 const [repeat,setRepeat]=useState("");
 const [expansion,setExpansion]=useState("");
 const [next,setNext]=useState("");
 const [checksState,setChecksState]=useState<boolean[]>([]);
 return <main className="container" style={{padding:"28px 0 60px"}}>
  <header className="app-header"><div><div className="brand" style={{fontSize:24}}>BROS SELL™</div><div className="muted">Customer Multiplication Planner</div></div><div style={{display:"flex",gap:8}}><a className="btn secondary" href="/app">Analyzer</a><a className="btn secondary" href="/app/resources">Resources</a></div></header>
  <section className="hero"><p className="muted">PURCHASE → RESULT → PROOF → REFERRAL / REPEAT / EXPANSION</p><h1>Customer Multiplication Planner</h1><p className="muted hero-copy">Grow from real customer value. Multiplication begins with customer outcome, not extraction.</p></section>
  <section className="card resource-section"><div className="eyebrow">BROS CUSTOMER MULTIPLICATION LOOP</div><div className="decision-flow">{["CUSTOMER","PURCHASE","RESULT","PROOF","REFERRAL","NEW CUSTOMER"].map((x,i)=><span key={x}><b>{x}</b>{i<5&&<b> → </b>}</span>)}</div><p className="muted" style={{marginTop:18}}>Post-purchase expansion juga termasuk relevant <strong>REPEAT, UPSELL</strong> dan <strong>CROSS-SELL</strong> apabila genuine need atau trigger wujud.</p></section>
  <section className="card resource-section"><div className="eyebrow">CUSTOMER RECORD</div><div className="resource-grid">
   <label className="field-label"><span>Customer / Account</span><input className="input" value={customer} onChange={e=>setCustomer(e.target.value)} /></label>
   <label className="field-label"><span>Purchase / Solution</span><textarea className="input textarea compact" rows={3} value={purchase} onChange={e=>setPurchase(e.target.value)} /></label>
   <label className="field-label"><span>Expected Result</span><textarea className="input textarea compact" rows={3} value={expected} onChange={e=>setExpected(e.target.value)} /></label>
   <label className="field-label"><span>Actual Result / Evidence</span><textarea className="input textarea compact" rows={3} value={actual} onChange={e=>setActual(e.target.value)} placeholder="Evidence sebenar — bukan claim." /></label>
   <label className="field-label"><span>Proof Asset</span><textarea className="input textarea compact" rows={3} value={proof} onChange={e=>setProof(e.target.value)} placeholder="Testimonial / screenshot / before-after / metric / case note / demonstration / other" /></label>
   <label className="field-label"><span>Referral Opportunity</span><textarea className="input textarea compact" rows={3} value={referral} onChange={e=>setReferral(e.target.value)} /></label>
   <label className="field-label"><span>Repeat / Expansion Trigger</span><textarea className="input textarea compact" rows={3} value={expansion} onChange={e=>setExpansion(e.target.value)} /></label>
   <label className="field-label"><span>Next Move</span><textarea className="input textarea compact" rows={3} value={next} onChange={e=>setNext(e.target.value)} /></label>
  </div></section>
  <section className="card resource-section"><div className="eyebrow">PROOF BUILDER</div><div className="resource-grid">
   {[["Customer Situation","What was the relevant starting context?"],["Solution Delivered","What was actually provided?"],["Observed Result","What changed, based on real evidence?"],["Proof Format","Testimonial / screenshot / before-after / metric / case note / demonstration / other"],["Permission / Usage","Is the proof approved for marketing use? Record only what is actually permitted."]].map(([h,q])=><article className="resource-card" key={h}><h2>{h}</h2><p className="muted">{q}</p></article>)}
  </div><div className="result-block" style={{marginTop:18}}><small className="muted">PROOF RULE</small><p>Jangan jadikan contoh ilustrasi sebagai customer proof. Gunakan evidence sebenar untuk testimonial, case study, metric atau demonstration. Jika tiada proof, gunakan assurance yang jujur — bukan fabricated result.</p></div></section>
  <section className="card resource-section"><div className="eyebrow">EXPANSION DECISION</div><div className="resource-grid">{motions.map(([name,q,label])=><article className="resource-card" key={name}><small className="muted">{name.toUpperCase()}</small><h2>{q}</h2><label className="field-label" style={{marginTop:12}}><span>{label}</span><textarea className="input textarea compact" rows={3} value={name==="Repeat"?repeat:name==="Referral"?referral:expansion} onChange={e=>name==="Repeat"?setRepeat(e.target.value):name==="Referral"?setReferral(e.target.value):setExpansion(e.target.value)} /></label></article>)}</div></section>
  <section className="card resource-section"><div className="eyebrow">BROS QUALITY CHECK</div><div className="resource-grid">{checks.map((q,i)=><label className="resource-card" key={q}><span style={{display:"flex",gap:10,alignItems:"flex-start"}}><input type="checkbox" checked={Boolean(checksState[i])} onChange={e=>setChecksState(p=>{const n=[...p];n[i]=e.target.checked;return n;})}/><span>{q}</span></span></label>)}</div></section>
  <section className="card"><div className="eyebrow">KERANGKA INI GAGAL APABILA...</div><p className="muted">Seller mengejar referral sebelum menghasilkan result, menggunakan testimonial tanpa asas, memaksa upsell/cross-sell, atau menganggap setiap customer mesti membeli lagi. Multiplication bermula daripada customer value, bukan extraction.</p><div className="eyebrow" style={{marginTop:24}}>HOW TO USE</div><ol><li>Start after purchase — rekod apa yang customer beli dan outcome yang dijangka.</li><li>Capture actual result — cari evidence sebenar. Jangan tukar expectation menjadi claim.</li><li>Build proof — pilih format proof yang benar dan sesuai digunakan.</li><li>Find legitimate trigger — cari sebab sebenar untuk referral, repeat atau expansion.</li><li>Act selectively — tidak semua customer memerlukan semua growth motion.</li></ol><p className="muted">Jika result belum wujud atau need tidak relevan, jangan paksa referral, repeat atau expansion.</p></section>
 </main>
}
