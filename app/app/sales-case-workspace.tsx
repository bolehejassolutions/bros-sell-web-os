'use client';

import Link from 'next/link';
import { useState } from 'react';
import { BROS_STAGES } from '@/lib/bros-sell/system-registry';
import { DIMENSIONS, OBSERVATIONS, OBSERVATION_LABELS, OUTCOMES, STAGE_GUIDANCE, diagnoseCase, exampleCase, newCase, pendingAction, recordAction, recordOutcome, reopenCase, type CaseDocument, type FactKey, type Observation } from '@/lib/bros-sell/sales-case';
import { useSalesCases } from './sales-case-provider';

export default function SalesCaseWorkspace() {
  const { active, create, update, loading, error } = useSalesCases();
  const [title, setTitle] = useState('');
  const [situation, setSituation] = useState('');
  const [evidence, setEvidence] = useState('');
  const [buyer, setBuyer] = useState('');
  const [offer, setOffer] = useState('');
  const [investment, setInvestment] = useState('');
  const [observation, setObservation] = useState<Observation>('unknown');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function start(document: CaseDocument) {
    setBusy(true); setMessage('');
    try { await create(document); setTitle(''); setSituation(''); setEvidence(''); setBuyer(''); setOffer(''); setInvestment(''); setObservation('unknown'); }
    catch (failure) { setMessage(failure instanceof Error ? failure.message : 'Case belum disimpan.'); }
    finally { setBusy(false); }
  }
  return <section className="case-workspace" aria-label="Situation Analyzer">
    <section className="card">
      <div className="eyebrow">SITUATION ANALYZER</div><h2>Mulakan dengan satu situasi sebenar.</h2>
      <ol className="case-onboarding"><li>Rekod situasi dan bukti.</li><li>Semak WHAT / WHY / NEXT.</li><li>Gunakan tool yang dicadangkan.</li><li>Rekod tindakan, hasil dan langkah seterusnya.</li></ol>
      <details open={!active}>
        <summary>Bina Sales Case baharu</summary>
        <form className="case-form" onSubmit={event => { event.preventDefault(); const doc = newCase(title.trim(), situation.trim()); doc.evidence = evidence; doc.facts = { buyer, offer, investment }; doc.observation = observation; if (observation === 'no') doc.status = 'lost'; if (observation === 'not_now' || observation === 'delayed_decision') doc.status = 'deferred'; void start(doc); }}>
          <label className="field-label"><span>Tajuk case</span><input className="input" required maxLength={160} value={title} onChange={event => setTitle(event.target.value)} /></label>
          <div className="analyzer-grid"><label className="field-label"><span>Pembeli / nama rujukan</span><input className="input" value={buyer} onChange={event => setBuyer(event.target.value)} /></label><label className="field-label"><span>Tawaran / servis</span><input className="input" value={offer} onChange={event => setOffer(event.target.value)} /></label></div>
          <label className="field-label"><span>Harga / investment</span><input className="input" value={investment} onChange={event => setInvestment(event.target.value)} /></label>
          <label className="field-label"><span>Situasi jualan</span><textarea className="input textarea compact" required maxLength={12000} value={situation} onChange={event => setSituation(event.target.value)} /></label>
          <label className="field-label"><span>Bukti: kata-kata atau tindakan sebenar pembeli</span><textarea className="input textarea compact" required={observation !== 'unknown'} maxLength={12000} value={evidence} onChange={event => setEvidence(event.target.value)} /></label>
          <label className="field-label"><span>Pemerhatian terakhir</span><select className="input" value={observation} onChange={event => setObservation(event.target.value as Observation)}>{OBSERVATIONS.filter(value => !['closed', 'lost', 'resolved'].includes(value)).map(value => <option key={value} value={value}>{OBSERVATION_LABELS[value]}</option>)}</select></label>
          <div className="case-actions"><button className="btn" disabled={busy || loading || !!error}>{busy ? 'Sedang menyimpan...' : 'Bina case & analisis'}</button><button className="btn secondary" type="button" disabled={busy || loading || !!error} onClick={() => void start(exampleCase())}>Jalankan contoh RM500</button></div>
          <p className="field-note">Contoh ditandakan sebagai latihan dan diasingkan daripada senarai operasi sebenar. Tiada mesej dihantar oleh sistem.</p>
          {message && <p role="alert">{message}</p>}
        </form>
      </details>
    </section>
    {active && <>
      <section className="card case-form">
        <div className="eyebrow">SITUATION → EVIDENCE</div><h2>{active.document.title}</h2>
        {active.document.example && <p className="case-example">CONTOH LATIHAN · bukan rekod pelanggan sebenar</p>}
        <label className="field-label"><span>Tajuk case semasa</span><input className="input" maxLength={160} value={active.document.title} onChange={event => update(doc => ({ ...doc, title: event.target.value }))} /></label>
        <div className="analyzer-grid">{([['buyer', 'Pembeli'], ['business', 'Bisnes / konteks'], ['offer', 'Tawaran / servis'], ['investment', 'Harga / investment']] as [FactKey, string][]).map(([key, label]) => <label className="field-label" key={key}><span>{label}</span><input className="input" value={active.document.facts[key] ?? ''} onChange={event => update(doc => ({ ...doc, facts: { ...doc.facts, [key]: event.target.value } }))} /></label>)}</div>
        <label className="field-label"><span>Situasi semasa</span><textarea className="input textarea compact" maxLength={12000} value={active.document.situation} onChange={event => update(doc => ({ ...doc, situation: event.target.value }))} /></label>
        <label className="field-label"><span>Bukti tersedia</span><textarea className="input textarea compact" maxLength={12000} value={active.document.evidence} onChange={event => update(doc => ({ ...doc, evidence: event.target.value }))} /></label>
        <label className="field-label"><span>Saluran perbualan</span><select className="input" value={active.document.channel} onChange={event => update(doc => ({ ...doc, channel: event.target.value }))}>{['WhatsApp', 'Phone', 'Instagram DM', 'Facebook Messenger', 'TikTok DM', 'Marketplace Chat', 'Email', 'In-person', 'Other'].map(value => <option key={value}>{value}</option>)}</select></label>
        <label className="field-label"><span>Tarikh susulan yang dipersetujui / dirancang</span><input className="input" type="datetime-local" value={localDate(active.document.dueAt)} onChange={event => update(doc => ({ ...doc, dueAt: event.target.value ? new Date(event.target.value).toISOString() : null }))} /></label>
      </section>
      <CaseDiagnosis />
      <QualificationEvidence />
      <details className="card"><summary>Peta 10 peringkat dan panduan ringkas</summary><div className="case-form">{BROS_STAGES.map(stage => <p key={stage}><strong>{stage}</strong> · {STAGE_GUIDANCE[stage]}</p>)}<label className="field-label"><span>Pilih peringkat sendiri jika bukti memerlukannya</span><select className="input" value={active.document.stageOverride ?? ''} onChange={event => update(doc => ({ ...doc, stageOverride: event.target.value ? event.target.value as CaseDocument['stageOverride'] : null }))}><option value="">Gunakan cadangan sistem</option>{BROS_STAGES.map(stage => <option key={stage}>{stage}</option>)}</select></label>{active.document.stageOverride && <label className="field-label"><span>Sebab berdasarkan bukti</span><input className="input" required value={active.document.stageReason} onChange={event => update(doc => ({ ...doc, stageReason: event.target.value }))} /></label>}</div></details>
      <CaseActionPanel key={active.id} />
      <section className="card"><h2>Sejarah case</h2>{active.document.history.length ? <ol className="case-history">{[...active.document.history].reverse().map(event => <li key={event.id}><strong>{event.kind === 'action' ? 'Tindakan' : event.kind === 'reopen' ? 'Dibuka semula' : `Hasil: ${OBSERVATION_LABELS[event.outcome!]}`}</strong><time dateTime={event.at}>{new Date(event.at).toLocaleString('ms-MY')}</time><p>{event.note}</p>{event.evidenceSnapshot && <details><summary>Bukti sebelum tindakan</summary><p>{event.evidenceSnapshot}</p></details>}</li>)}</ol> : <p className="muted">Belum ada tindakan direkodkan. Gunakan tool, lakukan tindakan dan rekod hasilnya.</p>}</section>
    </>}
  </section>;
}

export function CaseDiagnosis() {
  const { active } = useSalesCases();
  if (!active) return null;
  const result = diagnoseCase(active.document);
  return <section className="card case-diagnosis" aria-label="Diagnosis case">
    <div><div className="eyebrow">WHAT · KEADAAN</div><h2>{result.stage} · {result.leadState}</h2><p>{STAGE_GUIDANCE[result.stage]}</p><p className="muted">Status case: {active.document.status} · Lead State tidak sama dengan jualan.</p></div>
    <div><div className="eyebrow">WHY · SEBAB</div><p>{result.why}</p><details><summary>Diketahui / andaian / belum diketahui</summary><h3>Diketahui</h3>{result.known.length ? <ul>{result.known.map(item => <li key={item}>{item}</li>)}</ul> : <p>Belum ada bukti pembeli direkodkan.</p>}<h3>Andaian sistem</h3>{result.inferred.map(item => <p key={item}>{item}</p>)}<h3>Belum diketahui / belum disahkan</h3><p>{result.missing.join(', ') || 'Enam dimensi mempunyai bukti.'}</p></details></div>
    <div><div className="eyebrow">NEXT · TINDAKAN DISYORKAN</div><h3>{result.action}</h3>{!result.terminal && !result.stop && <p>{result.question}</p>}<Link className="btn" href={`/app/${result.tool}?case=${active.id}`}>Buka {result.tool.replaceAll('-', ' ')}</Link><p className="field-note">Cadangan ini berpandukan maklumat yang anda rekodkan. Ubah bukti apabila keadaan berubah.</p></div>
  </section>;
}

export function QualificationEvidence() {
  const { active, update } = useSalesCases();
  if (!active) return null;
  return <details className="card"><summary>Kelayakan: sahkan bukti, jangan anggap</summary><p className="muted">Menyebut harga, bajet atau niat membeli tidak mengesahkan semua dimensi. Setiap signal perlu nota bukti.</p><div className="case-signal-grid">{DIMENSIONS.map(dimension => <div className="case-form" key={dimension}><label className="field-label"><span>{dimension}</span><select className="input" value={active.document.signals[dimension].status} onChange={event => update(doc => ({ ...doc, signals: { ...doc.signals, [dimension]: { ...doc.signals[dimension], status: event.target.value as 'unknown' | 'confirmed' | 'no' } } }))}><option value="unknown">Belum diketahui</option><option value="confirmed">Disahkan dengan bukti</option><option value="no">Bukti negatif / tidak sesuai</option></select></label><label className="field-label"><span>Bukti {dimension}</span><textarea className="input textarea compact" rows={2} value={active.document.signals[dimension].note} onChange={event => update(doc => ({ ...doc, signals: { ...doc.signals, [dimension]: { ...doc.signals[dimension], note: event.target.value } } }))} /></label></div>)}</div></details>;
}

export function CaseActionPanel() {
  const { active, update } = useSalesCases();
  const [action, setAction] = useState('');
  const [outcome, setOutcome] = useState<Observation>('replied');
  const [note, setNote] = useState('');
  const [due, setDue] = useState('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  if (!active) return null;
  const result = diagnoseCase(active.document);
  const pending = pendingAction(active.document);
  const run = (change: (document: CaseDocument) => CaseDocument) => {
    try { const next = change(active.document); update(() => next); setMessage(''); setAction(''); setNote(''); }
    catch (failure) { setMessage(failure instanceof Error ? failure.message : 'Maklumat belum lengkap.'); }
  };
  return <section className="card case-form" aria-label="Operating loop">
    <div className="eyebrow">ACTION → OUTCOME → NEXT ACTION</div>
    <h2>{pending ? 'Apa yang berlaku selepas tindakan itu?' : 'Rekod tindakan sebenar.'}</h2>
    {((result.terminal && active.document.status !== 'closed') || result.stop || result.paused) && !pending ? <><p>{result.action}</p><label className="field-label"><span>Sebab baharu yang relevan / persetujuan membuka semula</span><input className="input" value={reason} onChange={event => setReason(event.target.value)} /></label><button className="btn secondary" disabled={!reason.trim()} onClick={() => run(doc => reopenCase(doc, reason))}>Buka semula case</button></> : pending ? <form className="case-form" onSubmit={event => { event.preventDefault(); run(doc => recordOutcome(doc, outcome, note, due ? new Date(due).toISOString() : null)); }}>
      <p><strong>Tindakan direkod:</strong> {pending.note}</p>
      <label className="field-label"><span>Hasil tindakan</span><select className="input" value={outcome} onChange={event => setOutcome(event.target.value as Observation)}>{OUTCOMES.filter(value => active.document.status !== 'closed' || ['replied', 'needs_clarification', 'follow_up_required', 'resolved', 'other'].includes(value)).map(value => <option key={value} value={value}>{OBSERVATION_LABELS[value]}</option>)}</select></label>
      <label className="field-label"><span>Bukti hasil / respons sebenar</span><textarea className="input textarea compact" required value={note} onChange={event => setNote(event.target.value)} /></label>
      <label className="field-label"><span>Tarikh susulan seterusnya jika relevan</span><input className="input" type="datetime-local" value={due} onChange={event => setDue(event.target.value)} /></label>
      <button className="btn">Rekod hasil & tentukan next action</button><p className="field-note">Pilih jualan disahkan hanya apabila pesanan / bayaran sebenar telah disahkan. Minat atau jawapan Ya sahaja belum membuktikan jualan.</p>
    </form> : <form className="case-form" onSubmit={event => { event.preventDefault(); run(doc => recordAction(doc, action, result.tool)); }}>
      <p className="muted">Gunakan tool, lakukan satu tindakan di saluran anda, kemudian catat apa yang anda benar-benar lakukan. Sistem tidak menghantar mesej bagi pihak anda.</p>
      <label className="field-label"><span>Tindakan yang telah dilakukan</span><textarea className="input textarea compact" required value={action} onChange={event => setAction(event.target.value)} /></label><button className="btn">Rekod tindakan dilakukan</button>
    </form>}
    {message && <p role="alert">{message}</p>}
  </section>;
}

function localDate(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
