"use client";

import { useMemo, useState } from "react";

const days=[
[1,"TARGET","Set monthly revenue target + average deal size","Target numbers","Revenue / deal size"],
[2,"TARGET","Calculate sales required","Sales required","Required closes"],
[3,"TARGET","Calculate qualified opportunities required","Opportunity target","Qualified required"],
[4,"TARGET","Calculate conversations required","Conversation target","Conversation volume"],
[5,"TARGET","Calculate leads required","Lead target","Lead volume"],
[6,"TARGET","Review current numbers","Baseline snapshot","Current bottleneck"],
[7,"TARGET","Choose ONE priority bottleneck","30-day focus","Priority selected"],
[8,"BUYER","Build Buyer Intelligence Map for one real segment","Completed canvas","Buyer clarity"],
[9,"BUYER","Identify buyer language","Phrase bank","Language captured"],
[10,"BUYER","Run BROS 5Q on real conversations","Conversation notes","5Q completeness"],
[11,"BUYER","Identify buying signals","Signal list","Signal quality"],
[12,"QUALIFY","Define minimum qualification","Qualification criteria","Fit/readiness"],
[13,"QUALIFY","Review red flags + decision authority","Checklist","Qualified quality"],
[14,"QUALIFY","Audit lead quality","Lead-state review","Pipeline quality"],
[15,"OFFER","Build / refine Offer Stack","Offer draft","Offer clarity"],
[16,"OFFER","Write one-line offer","One-line statement","Clarity"],
[17,"VALUE","Build Value Bridge","Value statement","Value articulation"],
[18,"VALUE","Add real proof / assurance","Proof inventory","Trust signal"],
[19,"VALUE","Test context-before-price response","Conversation examples","Price handling"],
[20,"VALUE","Review one offer conversation","Before/after note","Conversion signal"],
[21,"CLOSE","Map BROS Close Path","Decision path","Close clarity"],
[22,"CLOSE","Choose appropriate close type","Direct/Choice/Conditional","Readiness fit"],
[23,"CLOSE","Diagnose one stalled decision","Barrier diagnosis","Barrier clarity"],
[24,"FOLLOW-UP","Apply Follow-Up Ladder","Follow-up records","Response signal"],
[25,"WHATSAPP / PHONE","Audit one WhatsApp or call sequence","Sequence review","Channel quality"],
[26,"OPERATE","Run 45-minute operating routine","Routine log","Execution consistency"],
[27,"MULTIPLY","Review result/proof/referral/repeat opportunities","Customer review","Expansion signals"],
[28,"OPERATE","Review KPI + pipeline leaks","Dashboard snapshot","Bottleneck"],
[29,"AUDIT","Compare baseline vs current","30-day audit","Change measured"],
[30,"ADJUST","Keep, change, remove; set next target","Next-cycle plan","Next target"]
] as const;

const week=[["WEEK 1","TARGET & NUMBERS",1,7],["WEEK 2","BUYER & QUALIFY",8,14],["WEEK 3","OFFER & VALUE",15,20],["WEEK 4","CLOSE & OPERATE",21,28],["DAYS 29–30","AUDIT → ADJUST → RETURN TO TARGET",29,30]] as const;
const statuses=["Not Started","In Progress","Done","Skip"] as const;

export default function ImplementationTrackerPage(){
 const [status,setStatus]=useState<Record<number,typeof statuses[number]>>({});
 const [evidence,setEvidence]=useState<Record<number,string>>({});
 const [notes,setNotes]=useState<Record<number,string>>({});
 const [filter,setFilter]=useState("All");
 const [baseline,setBaseline]=useState("");
 const [biggestChange,setBiggestChange]=useState("");
 const [improved,setImproved]=useState("");
 const [notImproved,setNotImproved]=useState("");
 const [keep,setKeep]=useState("");
 const [change,setChange]=useState("");
 const [remove,setRemove]=useState("");
 const [nextTarget,setNextTarget]=useState("");
 const visible=filter==="All"?days:days.filter(d=>d[1]===filter);
 const done=days.filter(d=>status[d[0]]==="Done").length;
 const started=days.filter(d=>status[d[0]]&&status[d[0]]!=="Not Started").length;
 const completion=Math.round(done/30*100);
 const currentWeek=useMemo(()=>{const first=days.find(d=>status[d[0]]!=="Done");return first?week.find(w=>first[0]>=w[2]&&first[0]<=w[3]):week[4]},[status]);
 const updateStatus=(day:number,value:typeof statuses[number])=>setStatus(p=>({...p,[day]:value}));
 return <main className="container" style={{padding:"28px 0 60px"}}>
  <header className="app-header"><div><div className="brand" style={{fontSize:24}}>BROS SELL™</div><div className="muted">30-Day Implementation Tracker</div></div><div style={{display:"flex",gap:8}}><a className="btn secondary" href="/app">Analyzer</a><a className="btn secondary" href="/app/resources">Resources</a></div></header>
  <section className="hero"><p className="muted">TARGET → BUYER → OFFER → LEAD → QUALIFY → VALUE → CLOSE → FOLLOW-UP → MULTIPLY → OPERATE</p><h1>30-Day Implementation Tracker</h1><p className="muted hero-copy">Tukar BROS SELL daripada pengetahuan kepada operating habit melalui satu perubahan yang boleh diukur pada satu masa.</p></section>
  <section className="card resource-section"><div className="eyebrow">30-DAY IMPLEMENTATION MAP</div><div className="resource-grid">{week.map(w=><article className="resource-card" key={w[0]}><small className="muted">{w[0]}</small><h2>{w[1]}</h2><p>Days {w[2]}–{w[3]}</p></article>)}</div></section>
  <section className="card resource-section"><div className="eyebrow">OPERATING SNAPSHOT</div><div className="form-grid"><div className="result-block"><small className="muted">DONE</small><div className="result-stage">{done}/30</div></div><div className="result-block"><small className="muted">STARTED / ACTIVE</small><div className="result-stage">{started}/30</div></div><div className="result-block"><small className="muted">COMPLETION</small><div className="result-stage">{completion}%</div></div><div className="resource-card"><small className="muted">CURRENT CYCLE</small><h2>{currentWeek?.[0]} · {currentWeek?.[1]}</h2><p className="muted">One priority bottleneck at a time.</p></div></div></section>
  <section className="card resource-section"><div className="eyebrow">DAILY TRACKER</div><div className="form-grid"><label><span>Filter</span><select className="input" value={filter} onChange={e=>setFilter(e.target.value)}><option>All</option>{[...new Set(days.map(d=>d[1]))].map(x=><option key={x}>{x}</option>)}</select></label></div><div style={{display:"grid",gap:12,marginTop:18}}>{visible.map(d=><article className="resource-card" key={d[0]}><div style={{display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}><div><small className="muted">DAY {d[0]} · {d[1]}</small><h2>{d[2]}</h2><p className="muted">Evidence / Output: {d[3]} · Metric / Signal: {d[4]}</p></div><select className="input" style={{maxWidth:170}} value={status[d[0]]||"Not Started"} onChange={e=>updateStatus(d[0],e.target.value as typeof statuses[number])}>{statuses.map(x=><option key={x}>{x}</option>)}</select></div><div className="form-grid" style={{marginTop:12}}><label className="field-label"><span>Evidence recorded</span><textarea className="input textarea compact" rows={2} value={evidence[d[0]]||""} onChange={e=>setEvidence(p=>({...p,[d[0]]:e.target.value}))} placeholder="Evidence sebenar, bukan sekadar 'done'." /></label><label className="field-label"><span>Next Move / Note</span><textarea className="input textarea compact" rows={2} value={notes[d[0]]||""} onChange={e=>setNotes(p=>({...p,[d[0]]:e.target.value}))} /></label></div></article>)}</div></section>
  <section className="card resource-section"><div className="eyebrow">30-DAY AUDIT</div><div className="resource-grid">
   {[["Baseline bottleneck",baseline,setBaseline],["Biggest change observed",biggestChange,setBiggestChange],["Metric that improved",improved,setImproved],["Metric that did not improve",notImproved,setNotImproved],["What should be kept",keep,setKeep],["What should be changed",change,setChange],["What should be removed",remove,setRemove],["Next 30-day target",nextTarget,setNextTarget]].map(([label,value,setter])=><label className="field-label" key={label as string}><span>{label as string}</span><textarea className="input textarea compact" rows={2} value={value as string} onChange={e=>(setter as React.Dispatch<React.SetStateAction<string>>)(e.target.value)} /></label>)}
  </div></section>
  <section className="card resource-section"><div className="eyebrow">OPERATING RULES</div><div className="resource-grid">{["Gunakan real data dan real conversations.","Jangan ubah terlalu banyak variable pada masa yang sama.","Cari bottleneck dahulu sebelum tambah teknik.","Record evidence setiap hari.","Jika tidak relevan kepada model bisnes, tandakan Skip.","Hari 29–30 menentukan apa yang masuk ke cycle seterusnya."].map(x=><div className="resource-card" key={x}><p>{x}</p></div>)}</div></section>
  <section className="card"><div className="eyebrow">BROS SYSTEM LOOP</div><h2>TARGET → BUYER → OFFER → LEAD → QUALIFY → VALUE → CLOSE → FOLLOW-UP → MULTIPLY → OPERATE → kembali kepada TARGET.</h2><p className="muted">Kerangka ini gagal apabila tracker dijadikan checklist kosong: terlalu banyak perubahan serentak, tiada baseline, tiada evidence, atau menambah teknik tanpa membaiki bottleneck. 30 hari ini ialah implementation cycle, bukan perlumbaan menyiapkan semua perkara.</p><div className="eyebrow" style={{marginTop:24}}>HOW TO USE</div><p className="muted">Gunakan tracker dengan data sebenar. Fokus pada satu bottleneck utama. Setiap hari mesti menghasilkan evidence, bukan sekadar membaca atau menanda selesai.</p></section>
 </main>
}
