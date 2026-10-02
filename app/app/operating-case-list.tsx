'use client';
import CaseLink from './case-link';
import { useSalesCases } from './sales-case-provider';
import { casePriority, diagnoseCase, pendingAction, type SalesCase } from '@/lib/bros-sell/sales-case';

export default function OperatingCaseList() {
  const { cases, loading, error } = useSalesCases();
  const real = cases.filter(row => !row.document.example);
  const active = real.filter(row => pendingAction(row.document) || (!diagnoseCase(row.document).terminal && !diagnoseCase(row.document).stop));
  const ranked = [...active].sort((a, b) => casePriority(a).rank - casePriority(b).rank || (a.document.dueAt ?? a.updated_at).localeCompare(b.document.dueAt ?? b.updated_at));
  function row(value: SalesCase) {
    const next = diagnoseCase(value.document);
    return <article className="resource-card case-operating-row" key={value.id}><div><small>{casePriority(value).label}</small><h3>{value.document.title}</h3><p className="muted">{next.stage} · {next.leadState}{value.document.dueAt && ` · ${new Date(value.document.dueAt).toLocaleString('ms-MY')}`}</p><p>{next.action}</p></div><CaseLink className="btn" href={`/app?case=${value.id}`}>Teruskan case</CaseLink></article>;
  }
  return <section className="card resource-section"><div className="eyebrow">APA YANG PERLU DIBUAT SEKARANG?</div><h2>Sales Cases & langkah seterusnya</h2>
    {loading ? <p>Memuatkan operasi...</p> : error ? <p role="alert">Data operasi belum dapat disahkan: {error}</p> : <>
      <p className="muted">{active.length} case aktif / ditangguhkan. Case latihan tidak dikira sebagai pelanggan atau pipeline sebenar.</p>
      <div className="case-list">{ranked.length ? ranked.map(row) : <p>Belum ada case sebenar yang memerlukan tindakan. Bina satu case di Analyzer.</p>}</div>
      {!!active.length && <details><summary>Pipeline mengikut peringkat</summary><table className="case-pipeline"><thead><tr><th>Peringkat</th><th>Case</th></tr></thead><tbody>{Object.entries(active.reduce<Record<string, number>>((counts, value) => { const stage = diagnoseCase(value.document).stage; counts[stage] = (counts[stage] ?? 0) + 1; return counts; }, {})).map(([stage, count]) => <tr key={stage}><td>{stage}</td><td>{count}</td></tr>)}</tbody></table></details>}
      <details><summary>Hasil terkini dan case yang ditutup</summary><div className="case-list">{real.filter(value => value.document.history.length || diagnoseCase(value.document).terminal).sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, 20).map(value => <article key={value.id}><CaseLink href={`/app?case=${value.id}`}><strong>{value.document.title}</strong></CaseLink><p>{value.document.status} · {value.document.history.at(-1)?.note ?? 'Belum ada hasil direkod.'}</p></article>)}</div></details>
    </>}
  </section>;
}
