"use client";

import { useMemo, useState } from "react";
import { BROS_SALES_FUNNEL_FORMULAS } from "@/lib/bros-sell/system-registry";
import { calculateSalesTarget } from "@/lib/bros-sell/sales-target";

function whole(value: number) {\n  return Math.ceil(value);\n}\n\nexport default function TargetCalculatorPage() {
  const [revenueTarget, setRevenueTarget] = useState("10000");
  const [averageDealSize, setAverageDealSize] = useState("500");
  const [closeRate, setCloseRate] = useState("25");
  const [qualificationRate, setQualificationRate] = useState("50");
  const [conversationRate, setConversationRate] = useState("20");

  const result = useMemo(() => {
    return calculateSalesTarget({
      revenueTarget: Number(revenueTarget),
      averageDealSize: Number(averageDealSize),
      closeRate: Number(closeRate) / 100,
      qualificationRate: Number(qualificationRate) / 100,
      conversationRate: Number(conversationRate) / 100,
    });
  }, [revenueTarget, averageDealSize, closeRate, qualificationRate, conversationRate]);

  return (
    <main className="container" style={{padding:"28px 0 60px"}}>
      <header className="app-header">
        <div>
          <div className="brand" style={{fontSize:24}}>BROS SELL™</div>
          <div className="muted">Target Calculator</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <a className="btn secondary" href="/app">Analyzer</a>
          <a className="btn secondary" href="/app/resources">Resources</a>
        </div>
      </header>

      <section className="hero">
        <p className="muted">TARGET → OPERATE</p>
        <h1>Sales Target Calculator</h1>
        <p className="muted hero-copy">
          Tukarkan sasaran revenue kepada anggaran sales, opportunities, conversations dan leads yang diperlukan.
          Gunakan angka sebenar anda; calculator ini membantu perancangan, bukan menjamin hasil.
        </p>
      </section>

      <section className="analyzer-grid">
        <div className="card">
          <div className="eyebrow">INPUT</div>
          <h2>Sasaran & conversion assumptions</h2>
          <div style={{display:"grid",gap:14,marginTop:18}}>
            <label className="field-label">
              <span>Revenue target (RM)</span>
              <input className="input" type="number" min="1" value={revenueTarget} onChange={(e)=>setRevenueTarget(e.target.value)} />
            </label>
            <label className="field-label">
              <span>Average deal size (RM)</span>
              <input className="input" type="number" min="1" value={averageDealSize} onChange={(e)=>setAverageDealSize(e.target.value)} />
            </label>
            <label className="field-label">
              <span>Close rate (%)</span>
              <input className="input" type="number" min="0.01" max="100" step="0.1" value={closeRate} onChange={(e)=>setCloseRate(e.target.value)} />
            </label>
            <label className="field-label">
              <span>Qualification rate (%)</span>
              <input className="input" type="number" min="0.01" max="100" step="0.1" value={qualificationRate} onChange={(e)=>setQualificationRate(e.target.value)} />
            </label>
            <label className="field-label">
              <span>Conversation rate (%)</span>
              <input className="input" type="number" min="0.01" max="100" step="0.1" value={conversationRate} onChange={(e)=>setConversationRate(e.target.value)} />
            </label>
          </div>
          <p className="field-note" style={{marginTop:14}}>
            Formula registry: {BROS_SALES_FUNNEL_FORMULAS.requiredSales} → {BROS_SALES_FUNNEL_FORMULAS.requiredOpportunities} → {BROS_SALES_FUNNEL_FORMULAS.requiredConversations} → {BROS_SALES_FUNNEL_FORMULAS.requiredLeads}
          </p>
        </div>

        <div className="card">
          <div className="eyebrow">OUTPUT</div>
          <h2>Required operating volume</h2>
          {!result ? (
            <p className="muted" style={{marginTop:18}}>Masukkan nilai positif untuk semua input.</p>
          ) : (
            <div style={{display:"grid",gap:10,marginTop:18}}>
              {[
                ["Sales required", result.requiredSales, "sale"],
                ["Opportunities required", result.requiredOpportunities, "opportunity"],
                ["Conversations required", result.requiredConversations, "conversation"],
                ["Leads required", result.requiredLeads, "lead"],
              ].map(([label,value,unit]) => (
                <div key={String(label)} className="result-block" style={{border:"1px solid #27272a",borderRadius:14,padding:16}}>
                  <small className="muted">{label}</small>
                  <strong style={{fontSize:28}}>{whole(Number(value)).toLocaleString("en-MY")}</strong>
                  <span className="field-note">{unit}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="card resource-section">
        <div className="eyebrow">HOW TO READ THIS</div>
        <h2>Jangan ubah target terus menjadi “kena cari lebih ramai leads”.</h2>
        <p className="muted">
          Calculator ini menunjukkan hubungan antara target revenue dan volume yang diperlukan pada setiap peringkat.
          Jika output terlalu tinggi, cari assumption mana yang paling lemah: average deal size, close rate,
          qualification rate atau conversation rate. Itu memberi anda titik untuk diperbaiki.
        </p>
        <div className="decision-flow">
          <span>Revenue Target</span><b>→</b><span>Sales</span><b>→</b><span>Opportunities</span><b>→</b><span>Conversations</span><b>→</b><span>Leads</span>
        </div>
      </section>
    </main>
  );
}
