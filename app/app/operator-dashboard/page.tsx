"use client";

import { useCaseToolState, useSalesCases } from "../sales-case-provider";
import { diagnoseCase, pendingAction } from "@/lib/bros-sell/sales-case";
import OperatingCaseList from '../operating-case-list';
import { useState } from "react";

type Metric = { name: string; direction?: "higher" | "lower" };
const metrics: Metric[] = [
  { name: "Leads" }, { name: "Conversations" }, { name: "Qualified" }, { name: "Offers" },
  { name: "Closes" }, { name: "Revenue (RM)" }, { name: "Average Deal Size (RM)" },
  { name: "Follow-Up Response Rate" }, { name: "Referral" }, { name: "Repeat Purchase" },
  { name: "Time-to-Close (days)", direction: "lower" }, { name: "Cost per Lead (RM)", direction: "lower" },
  { name: "Revenue / Conversation (RM)" },
];

export default function OperatorDashboardPage() {
  const { active, cases } = useSalesCases();
  const [now] = useState(() => Date.now());
  const real = cases.filter(row => !row.document.example);
  const activeCases = real.filter(row => !diagnoseCase(row.document).terminal && !diagnoseCase(row.document).stop);
  const waitingOutcome = real.filter(row => Boolean(pendingAction(row.document))).length;
  const waitingDecision = activeCases.filter(row => diagnoseCase(row.document).leadState === "Decision").length;
  const dueFollowUp = activeCases.filter(row => row.document.dueAt && new Date(row.document.dueAt).getTime() <= now).length;

  const [values, setValues] = useCaseToolState<Record<string, { target: string; actual: string }>>("operator-dashboard","values",
    Object.fromEntries(metrics.map((metric) => [metric.name, { target: "", actual: "" }]))
  );
  const [bottleneck, setBottleneck] = useCaseToolState("operator-dashboard","bottleneck","");
  const [nextMove, setNextMove] = useCaseToolState("operator-dashboard","nextMove","");

  function update(name: string, field: "target" | "actual", value: string) {
    setValues(current => ({ ...current, [name]: { ...current[name], [field]: value } }));
  }

  return (
    <main className="container cases-page">
      <section className="hero simple-hero">
        <div className="eyebrow">CASES</div>
        <h1>Apa yang perlukan perhatian?</h1>
        <p className="muted hero-copy">Semak case yang perlu tindakan. Metrik lanjutan hanya dibuka apabila anda memang mahu mengurus operasi secara lebih mendalam.</p>
      </section>

      <section className="insight-grid" aria-label="Case insights">
        <article className="card insight-card"><strong>{activeCases.length}</strong><span>Case aktif</span></article>
        <article className="card insight-card"><strong>{dueFollowUp}</strong><span>Susulan perlu disemak</span></article>
        <article className="card insight-card"><strong>{waitingOutcome}</strong><span>Hasil belum direkod</span></article>
        <article className="card insight-card"><strong>{waitingDecision}</strong><span>Menunggu keputusan</span></article>
      </section>

      <OperatingCaseList />

      {active && <details className="card advanced-details">
        <summary>Advanced metrics · {active.document.title}</summary>
        <div className="advanced-details-body">
          <p className="muted">Semua nilai ini diisi manual dan disimpan bersama case. Ia bukan laporan revenue automatik.</p>
          <div className="metric-table-wrap">
            <table className="metric-table">
              <thead><tr>{["Metric","Target","Actual","Variance","Rate","Status"].map(label=><th key={label}>{label}</th>)}</tr></thead>
              <tbody>{metrics.map(metric => {
                const target = Number(values[metric.name]?.target);
                const actual = Number(values[metric.name]?.actual);
                const ready = !!values[metric.name]?.target.trim() && !!values[metric.name]?.actual.trim() && Number.isFinite(target) && Number.isFinite(actual) && target > 0 && actual >= 0;
                const variance = ready ? actual - target : null;
                const rate = ready ? actual / target : null;
                const onTarget = ready ? metric.direction === "lower" ? actual <= target : actual >= target : null;
                return <tr key={metric.name}>
                  <td><strong>{metric.name}</strong></td>
                  <td><input className="input" type="number" min="0" value={values[metric.name].target} onChange={e=>update(metric.name,"target",e.target.value)} /></td>
                  <td><input className="input" type="number" min="0" value={values[metric.name].actual} onChange={e=>update(metric.name,"actual",e.target.value)} /></td>
                  <td>{variance === null ? "—" : variance.toLocaleString("en-MY")}</td>
                  <td>{rate === null ? "—" : `${(rate * 100).toFixed(1)}%`}</td>
                  <td>{!ready ? "—" : onTarget ? "ON TARGET" : "REVIEW"}</td>
                </tr>;
              })}</tbody>
            </table>
          </div>

          <div className="analyzer-grid">
            <label className="field-label"><span>Primary bottleneck</span><input className="input" value={bottleneck} onChange={e=>setBottleneck(e.target.value)} /></label>
            <label className="field-label"><span>Next operating move</span><input className="input" value={nextMove} onChange={e=>setNextMove(e.target.value)} /></label>
          </div>
        </div>
      </details>}
    </main>
  );
}
