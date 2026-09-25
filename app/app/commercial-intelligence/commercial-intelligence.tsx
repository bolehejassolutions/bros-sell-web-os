"use client";

import { useEffect, useMemo, useState } from "react";

type Channel = { name: string; reach: string; engagement: string; clicks: string };
type Funnel = { sessions: string; cta: string; checkout: string; paid: string; revenue: string };
type Decision = { date: string; evidence: string; decision: string; next: string };

const defaultChannels: Channel[] = [
  { name: "Facebook", reach: "", engagement: "", clicks: "" },
  { name: "Instagram", reach: "", engagement: "", clicks: "" },
  { name: "TikTok", reach: "", engagement: "", clicks: "" },
  { name: "LinkedIn", reach: "", engagement: "", clicks: "" },
];
const initialFunnel: Funnel = { sessions: "", cta: "", checkout: "", paid: "", revenue: "" };

export default function CommercialIntelligence() {
  const [funnel, setFunnel] = useState<Funnel>(initialFunnel);
  const [channels, setChannels] = useState<Channel[]>(defaultChannels);
  const [period, setPeriod] = useState("26–30 Sep 2026");
  const [constraint, setConstraint] = useState("");
  const [decision, setDecision] = useState<Decision>({ date: "", evidence: "", decision: "", next: "" });
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("bros_commercial_intelligence_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        setFunnel(parsed.funnel ?? initialFunnel);
        setChannels(parsed.channels ?? defaultChannels);
        setPeriod(parsed.period ?? "26–30 Sep 2026");
        setConstraint(parsed.constraint ?? "");
        setDecisions(parsed.decisions ?? []);
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("bros_commercial_intelligence_v1", JSON.stringify({ funnel, channels, period, constraint, decisions }));
  }, [hydrated, funnel, channels, period, constraint, decisions]);

  const rates = useMemo(() => {
    const n = Number(funnel.sessions), c = Number(funnel.cta), p = Number(funnel.paid);
    return {
      ctaRate: n > 0 ? c / n : null,
      paidFromCta: c > 0 ? p / c : null,
      paidFromSessions: n > 0 ? p / n : null,
      revenuePerCustomer: p > 0 ? Number(funnel.revenue) / p : null,
    };
  }, [funnel]);

  function updateFunnel(key: keyof Funnel, value: string) {
    setFunnel((current) => ({ ...current, [key]: value }));
  }
  function updateChannel(index: number, key: keyof Channel, value: string) {
    setChannels((current) => current.map((channel, i) => i === index ? { ...channel, [key]: value } : channel));
  }
  function addDecision() {
    if (!decision.evidence.trim() || !decision.decision.trim()) return;
    setDecisions((current) => [{ ...decision, date: decision.date || new Date().toISOString().slice(0, 10) }, ...current]);
    setDecision({ date: "", evidence: "", decision: "", next: "" });
  }
  function reset() {
    if (!window.confirm("Reset internal Commercial Intelligence data?")) return;
    setFunnel(initialFunnel); setChannels(defaultChannels); setPeriod("26–30 Sep 2026"); setConstraint(""); setDecisions([]);
    localStorage.removeItem("bros_commercial_intelligence_v1");
  }

  return (
    <main className="container commercial-intelligence" style={{padding:"28px 0 60px"}}>
      <section className="hero">
        <p className="muted">INTERNAL · MEASURE → DIAGNOSE → DECIDE</p>
        <h1>Commercial Intelligence</h1>
        <p className="muted hero-copy">Internal decision layer for BROS SELL™. Capture evidence from Metricool, GA4 and HitPay, identify the constraint, and record the next move.</p>
        <div className="ci-toolbar">
          <label className="field-label"><span>Period</span><input className="input" value={period} onChange={(e)=>setPeriod(e.target.value)} /></label>
          <button className="btn secondary" onClick={reset}>Reset local data</button>
        </div>
      </section>

      <section className="ci-grid">
        <article className="card">
          <div className="eyebrow">FUNNEL</div><h2>Attention → payment</h2>
          <div className="ci-funnel">
            {([["sessions","GA4 sessions"],["cta","HitPay CTA clicks"],["checkout","HitPay checkout activity"],["paid","Paid customers"],["revenue","Revenue (RM)"]] as const).map(([key,label]) => (
              <label className="field-label" key={key}><span>{label}</span><input className="input" type="number" min="0" value={funnel[key]} onChange={(e)=>updateFunnel(key,e.target.value)} /></label>
            ))}
          </div>
          <div className="ci-stat-grid">
            <div><small>CTA / session</small><strong>{rates.ctaRate === null ? "—" : `${(rates.ctaRate*100).toFixed(1)}%`}</strong></div>
            <div><small>Paid / CTA</small><strong>{rates.paidFromCta === null ? "—" : `${(rates.paidFromCta*100).toFixed(1)}%`}</strong></div>
            <div><small>Paid / session</small><strong>{rates.paidFromSessions === null ? "—" : `${(rates.paidFromSessions*100).toFixed(1)}%`}</strong></div>
            <div><small>Revenue / customer</small><strong>{rates.revenuePerCustomer === null ? "—" : `RM ${rates.revenuePerCustomer.toFixed(2)}`}</strong></div>
          </div>
        </article>

        <article className="card">
          <div className="eyebrow">CONSTRAINT</div><h2>What is limiting movement?</h2>
          <p className="muted">Record one primary constraint only. Do not solve every metric at once.</p>
          <textarea className="textarea compact" value={constraint} onChange={(e)=>setConstraint(e.target.value)} placeholder="Example: Good reach, weak HitPay CTA rate." />
          <div className="ci-rule">Rule: fix the earliest meaningful constraint before adding more upstream volume.</div>
        </article>
      </section>

      <section className="card resource-section">
        <div className="eyebrow">CHANNEL INTELLIGENCE</div><h2>Distribution scoreboard</h2>
        <p className="muted">Enter published-period totals from Metricool. Keep channel metrics comparable within the same period.</p>
        <div className="ci-table-wrap"><table className="ci-table"><thead><tr><th>Channel</th><th>Reach / views</th><th>Engagement</th><th>Clicks</th></tr></thead><tbody>
          {channels.map((channel,index)=><tr key={channel.name}><td><strong>{channel.name}</strong></td><td><input className="input" type="number" min="0" value={channel.reach} onChange={(e)=>updateChannel(index,"reach",e.target.value)} /></td><td><input className="input" type="number" min="0" value={channel.engagement} onChange={(e)=>updateChannel(index,"engagement",e.target.value)} /></td><td><input className="input" type="number" min="0" value={channel.clicks} onChange={(e)=>updateChannel(index,"clicks",e.target.value)} /></td></tr>)}
        </tbody></table></div>
      </section>

      <section className="ci-grid">
        <article className="card">
          <div className="eyebrow">DECISION LOG</div><h2>Evidence → decision → next action</h2>
          <div className="ci-form-grid">
            <label className="field-label"><span>Date</span><input className="input" type="date" value={decision.date} onChange={(e)=>setDecision({...decision,date:e.target.value})}/></label>
            <label className="field-label"><span>Evidence</span><textarea className="textarea compact" value={decision.evidence} onChange={(e)=>setDecision({...decision,evidence:e.target.value})} placeholder="What actually happened?"/></label>
            <label className="field-label"><span>Decision</span><textarea className="textarea compact" value={decision.decision} onChange={(e)=>setDecision({...decision,decision:e.target.value})} placeholder="What are we changing or keeping?"/></label>
            <label className="field-label"><span>Next action</span><textarea className="textarea compact" value={decision.next} onChange={(e)=>setDecision({...decision,next:e.target.value})} placeholder="Who / what / when?"/></label>
          </div>
          <button className="btn" onClick={addDecision}>Add decision</button>
        </article>

        <article className="card">
          <div className="eyebrow">OPERATING RULES</div><h2>Keep the intelligence layer honest.</h2>
          <ul className="ci-rules">
            <li>Metricool = distribution evidence.</li><li>GA4 = website behaviour.</li><li>HitPay = checkout and paid-customer truth.</li>
            <li>Do not call a post “winner” from reach alone.</li><li>Do not increase ad spend before the conversion constraint is understood.</li><li>Record decisions from evidence, not intuition.</li>
          </ul>
        </article>
      </section>

      <section className="card resource-section">
        <div className="eyebrow">HISTORY</div><h2>Decision history</h2>
        {decisions.length === 0 ? <p className="muted">No decisions logged yet.</p> : <div className="ci-history">{decisions.map((item,index)=><article key={`${item.date}-${index}`}><small>{item.date}</small><strong>{item.evidence}</strong><p>{item.decision}</p>{item.next && <span className="muted">Next: {item.next}</span>}</article>)}</div>}
      </section>

      <section className="card"><div className="eyebrow">SOURCE DISCIPLINE</div><p className="muted">This dashboard intentionally does not invent or automatically infer commercial results. Enter verified figures from the connected systems, then use the resulting funnel and decision log to determine the next move.</p></section>
    </main>
  );
}