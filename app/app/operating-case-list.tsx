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
    const priority = casePriority(value);
    return <article className="resource-card case-operating-row" key={value.id}>
      <div>
        <small className="muted">{priority.label}</small>
        <h3>{value.document.title}</h3>
        <p>{next.action}</p>
        <details className="row-system-detail">
          <summary>Detail</summary>
          <p className="muted">{next.stage} · {next.leadState}{value.document.dueAt && ` · ${new Date(value.document.dueAt).toLocaleString('ms-MY')}`}</p>
        </details>
      </div>
      <CaseLink className="btn" href={`/app?case=${value.id}`}>Teruskan</CaseLink>
    </article>;
  }

  return <section className="card resource-section">
    <div className="eyebrow">NEXT ACTION</div>
    <h2>Cases yang perlukan perhatian</h2>
    {loading ? <p>Memuatkan cases...</p> : error ? <p role="alert">Data case belum dapat disahkan: {error}</p> : <>
      <p className="muted">{active.length ? `${active.length} case memerlukan perhatian.` : 'Tiada case sebenar yang memerlukan tindakan sekarang.'}</p>
      <div className="case-list">{ranked.length ? ranked.map(row) : <p className="muted">Mulakan case baharu dari Home apabila ada situasi jualan untuk diselesaikan.</p>}</div>
      {!!active.length && <details className="advanced-details-inline"><summary>Lihat pipeline mengikut stage</summary><table className="case-pipeline"><thead><tr><th>Stage</th><th>Case</th></tr></thead><tbody>{Object.entries(active.reduce<Record<string, number>>((counts, value) => { const stage = diagnoseCase(value.document).stage; counts[stage] = (counts[stage] ?? 0) + 1; return counts; }, {})).map(([stage, count]) => <tr key={stage}><td>{stage}</td><td>{count}</td></tr>)}</tbody></table></details>}
      <details className="advanced-details-inline"><summary>Case lama / selesai</summary><div className="case-list">{real.filter(value => value.document.history.length || diagnoseCase(value.document).terminal).sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, 20).map(value => <article key={value.id}><CaseLink href={`/app?case=${value.id}`}><strong>{value.document.title}</strong></CaseLink><p>{value.document.status} · {value.document.history.at(-1)?.note ?? 'Belum ada hasil direkod.'}</p></article>)}</div></details>
    </>}
  </section>;
}
