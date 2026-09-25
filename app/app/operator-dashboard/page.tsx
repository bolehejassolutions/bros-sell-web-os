"use client";

import { useMemo, useState } from "react";

type Metric = {
  name: string;
  direction?: "higher" | "lower";
};

const metrics: Metric[] = [
  { name: "Leads" },
  { name: "Conversations" },
  { name: "Qualified" },
  { name: "Offers" },
  { name: "Closes" },
  { name: "Revenue (RM)" },
  { name: "Average Deal Size (RM)" },
  { name: "Follow-Up Response Rate" },
  { name: "Referral" },
  { name: "Repeat Purchase" },
  { name: "Time-to-Close (days)", direction: "lower" },
  { name: "Cost per Lead (RM)", direction: "lower" },
  { name: "Revenue / Conversation (RM)" },
];

export default function OperatorDashboardPage() {
  const [values, setValues] = useState<Record<string, { target: string; actual: string }>>(
    Object.fromEntries(metrics.map((metric) => [metric.name, { target: "", actual: "" }]))
  );
  const [bottleneck, setBottleneck] = useState("");
  const [nextMove, setNextMove] = useState("");

  const rows = useMemo(() => metrics.map((metric) => {
    const target = Number(values[metric.name]?.target);
    const actual = Number(values[metric.name]?.actual);
    const ready = Number.isFinite(target) && Number.isFinite(actual) && target > 0 && actual >= 0;
    const variance = ready ? actual - target : null;
    const rate = ready ? actual / target : null;
    const onTarget = ready
      ? metric.direction === "lower" ? actual <= target : actual >= target
      : null;
    return { ...metric, target, actual, ready, variance, rate, onTarget };
  }), [values]);

  function update(name: string, field: "target" | "actual", value: string) {
    setValues((current) => ({
      ...current,
      [name]: { ...current[name], [field]: value },
    }));
  }

  return (
    <main className="container" style={{padding:"28px 0 60px"}}>
      <header className="app-header">
        <div>
          <div className="brand" style={{fontSize:24}}>BROS SELL™</div>
          <div className="muted">Operator Dashboard</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <a className="btn secondary" href="/app/target-calculator">Target Calculator</a>
          <a className="btn secondary" href="/app/resources">Resources</a>
        </div>
      </header>

      <section className="hero">
        <p className="muted">OPERATE → DIAGNOSE → ADJUST</p>
        <h1>Operator Dashboard</h1>
        <p className="muted hero-copy">
          Masukkan Target dan Actual untuk melihat variance, rate dan status operasi.
          Gunakan dashboard ini untuk mencari bottleneck sebelum menambah aktiviti upstream.
        </p>
      </section>

      <section className="card resource-section">
        <div className="eyebrow">OPERATING METRICS</div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",minWidth:820}}>
            <thead>
              <tr>
                {["Metric","Target","Actual","Variance","Rate","Status"].map((label)=>
                  <th key={label} style={{textAlign:"left",padding:"10px 8px",borderBottom:"1px solid #27272a"}}>{label}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.name}>
                  <td style={{padding:"10px 8px",borderBottom:"1px solid #27272a"}}>
                    <strong>{row.name}</strong>
                    <div className="field-note">Monthly</div>
                  </td>
                  <td style={{padding:"10px 8px",borderBottom:"1px solid #27272a"}}>
                    <input className="input" style={{minWidth:120}} type="number" min="0" value={values[row.name].target} onChange={(e)=>update(row.name,"target",e.target.value)} />
                  </td>
                  <td style={{padding:"10px 8px",borderBottom:"1px solid #27272a"}}>
                    <input className="input" style={{minWidth:120}} type="number" min="0" value={values[row.name].actual} onChange={(e)=>update(row.name,"actual",e.target.value)} />
                  </td>
                  <td style={{padding:"10px 8px",borderBottom:"1px solid #27272a"}}>{row.variance === null ? "—" : row.variance.toLocaleString("en-MY")}</td>
                  <td style={{padding:"10px 8px",borderBottom:"1px solid #27272a"}}>{row.rate === null ? "—" : \`\${(row.rate * 100).toFixed(1)}%\`}</td>
                  <td style={{padding:"10px 8px",borderBottom:"1px solid #27272a"}}>
                    {!row.ready ? "—" : row.onTarget ? "ON TARGET" : "REVIEW"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="field-note" style={{marginTop:12}}>
          Status kekal kosong sehingga Target dan Actual kedua-duanya diisi. Untuk Time-to-Close dan Cost per Lead, nilai lebih rendah dianggap lebih baik.
        </p>
      </section>

      <section className="card resource-section">
        <div className="eyebrow">BOTTLENECK DIAGNOSIS</div>
        <h2>Fix the constraint before adding more activity upstream.</h2>
        <p className="muted">
          Cari earliest meaningful stage di mana Actual jatuh di bawah operating target. Gunakan satu bottleneck utama untuk menentukan next operating move.
        </p>
        <div className="analyzer-grid" style={{marginTop:18}}>
          <label className="field-label">
            <span>This period&apos;s primary bottleneck</span>
            <input className="input" value={bottleneck} onChange={(e)=>setBottleneck(e.target.value)} placeholder="Contoh: Qualification rate" />
          </label>
          <label className="field-label">
            <span>Next operating move</span>
            <input className="input" value={nextMove} onChange={(e)=>setNextMove(e.target.value)} placeholder="Contoh: Improve qualification questions" />
          </label>
        </div>
      </section>

      <section className="card">
        <div className="eyebrow">OPERATING RULE</div>
        <h2>Diagnose first. Add volume second.</h2>
        <p className="muted">
          Dashboard ini ialah alat diagnosis operasi, bukan jaminan revenue. Jika satu stage menjadi constraint, ubah assumption atau proses pada stage tersebut sebelum sekadar menambah lead.
        </p>
      </section>
    </main>
  );
}
