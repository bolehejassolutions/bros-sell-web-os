'use client';

import Link from 'next/link';
import { useState } from 'react';
import { BROS_STAGES } from '@/lib/bros-sell/system-registry';
import { DIMENSIONS, OBSERVATIONS, OBSERVATION_LABELS, OUTCOMES, STAGE_GUIDANCE, diagnoseCase, exampleCase, newCase, pendingAction, recordAction, recordOutcome, reopenCase, type CaseDocument, type FactKey, type Observation } from '@/lib/bros-sell/sales-case';
import { useSalesCases } from './sales-case-provider';

const TOOL_LABELS: Record<string,string> = {
  'target-calculator': 'Sasaran jualan',
  'buyer-intelligence': 'Fahami buyer',
  'offer-stack': 'Jelaskan offer',
  'value-bridge': 'Jelaskan value',
  'lead-state': 'Semak status buyer',
  'close-path': 'Tentukan laluan keputusan',
  'objection-playbook': 'Fahami objection',
  'whatsapp-scripts': 'Bina mesej WhatsApp',
  'follow-up': 'Bina follow-up',
  'customer-multiplication': 'Repeat & referral',
  'implementation-tracker': 'Pelan pelaksanaan',
};

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
    try {
      await create(document);
      setTitle(''); setSituation(''); setEvidence(''); setBuyer(''); setOffer(''); setInvestment(''); setObservation('unknown');
    } catch (failure) {
      setMessage(failure instanceof Error ? failure.message : 'Case belum disimpan.');
    } finally {
      setBusy(false);
    }
  }

  function createFromCurrentInput() {
    const cleanSituation = situation.trim();
    const autoTitle = title.trim() || buyer.trim() || cleanSituation.replace(/\s+/g,' ').slice(0,72) || 'Case baharu';
    const doc = newCase(autoTitle, cleanSituation);
    doc.evidence = evidence.trim();
    doc.facts = { buyer: buyer.trim(), offer: offer.trim(), investment: investment.trim() };
    doc.observation = observation;
    if (observation === 'no') doc.status = 'lost';
    if (observation === 'not_now' || observation === 'delayed_decision') doc.status = 'deferred';
    return doc;
  }

  return <section className="case-workspace" aria-label="BROS SELL guided workflow">
    {!active && <section className="card simple-start-card">
      <div className="eyebrow">MULAKAN DI SINI</div>
      <h1>Apa yang sedang berlaku dalam jualan anda sekarang?</h1>
      <p className="muted">Ceritakan dengan bahasa biasa. Kita tentukan satu langkah seterusnya.</p>
      <form className="case-form simple-start-form" onSubmit={event => { event.preventDefault(); void start(createFromCurrentInput()); }}>
        <label className="field-label">
          <span>Customer / deal</span><small className="muted">(optional)</small>
          <input className="input" maxLength={160} value={buyer} onChange={event => setBuyer(event.target.value)} placeholder="Contoh: Ali · Sofa cleaning RM500" />
        </label>
        <label className="field-label">
          <span>Apa yang berlaku?</span>
          <textarea className="input textarea situation-input" required maxLength={12000} value={situation} onChange={event => setSituation(event.target.value)} placeholder="Contoh: Customer tanya harga, saya jawab RM500. Dia baca tetapi belum balas sejak semalam." />
        </label>

        <details className="optional-details">
          <summary>Tambah detail sekarang <span className="muted">(optional)</span></summary>
          <div className="case-form optional-details-body">
            <label className="field-label"><span>Tajuk case</span><input className="input" maxLength={160} value={title} onChange={event => setTitle(event.target.value)} placeholder="Jika kosong, sistem akan namakan secara automatik" /></label>
            <div className="analyzer-grid">
              <label className="field-label"><span>Tawaran / servis</span><input className="input" value={offer} onChange={event => setOffer(event.target.value)} /></label>
              <label className="field-label"><span>Harga / investment</span><input className="input" value={investment} onChange={event => setInvestment(event.target.value)} /></label>
            </div>
            <label className="field-label"><span>Bukti sebenar yang anda ada</span><textarea className="input textarea compact" maxLength={12000} value={evidence} onChange={event => setEvidence(event.target.value)} placeholder="Apa yang customer betul-betul cakap atau buat?" /></label>
            <label className="field-label"><span>Pemerhatian terakhir</span><select className="input" value={observation} onChange={event => setObservation(event.target.value as Observation)}>{OBSERVATIONS.filter(value => !['closed', 'lost', 'resolved'].includes(value)).map(value => <option key={value} value={value}>{OBSERVATION_LABELS[value]}</option>)}</select></label>
          </div>
        </details>

        <button className="btn primary-action" disabled={busy || loading || !!error}>{busy ? 'Sedang menyimpan...' : 'Tentukan next move'}</button>
        {message && <p role="alert">{message}</p>}
      </form>

      <details className="example-launcher">
        <summary>Nak lihat contoh dahulu?</summary>
        <div className="example-launcher-body">
          <p className="muted">Gunakan satu case latihan RM500 untuk melihat bagaimana loop diagnosis → action → outcome berfungsi.</p>
          <button className="btn secondary" type="button" disabled={busy || loading || !!error} onClick={() => void start(exampleCase())}>Jalankan contoh RM500</button>
        </div>
      </details>
    </section>}

    {active && <>
      <section className="case-current-heading">
        <div>
          <div className="eyebrow">{active.document.example ? 'CONTOH LATIHAN' : 'CASE SEMASA'}</div>
          <h1>{active.document.title}</h1>
        </div>
      </section>

      {!active.document.evidence.trim() && !pendingAction(active.document) && !diagnoseCase(active.document).terminal && !diagnoseCase(active.document).stop
        ? <BuyerResponseCheck key={active.id} />
        : <><CaseDiagnosis /><CaseActionPanel key={active.id} /></>}

      <details className="card advanced-details">
        <summary>Tambah konteks jika cadangan belum tepat</summary>
        <div className="case-form advanced-details-body">
          <label className="field-label"><span>Tajuk case semasa</span><input className="input" maxLength={160} value={active.document.title} onChange={event => update(doc => ({ ...doc, title: event.target.value }))} /></label>
          <div className="analyzer-grid">{([['buyer', 'Pembeli'], ['business', 'Bisnes / konteks'], ['offer', 'Tawaran / servis'], ['investment', 'Harga / investment']] as [FactKey, string][]).map(([key, label]) => <label className="field-label" key={key}><span>{label}</span><input className="input" value={active.document.facts[key] ?? ''} onChange={event => update(doc => ({ ...doc, facts: { ...doc.facts, [key]: event.target.value } }))} /></label>)}</div>
          <label className="field-label"><span>Situasi semasa</span><textarea className="input textarea compact" maxLength={12000} value={active.document.situation} onChange={event => update(doc => ({ ...doc, situation: event.target.value }))} /></label>
          <label className="field-label"><span>Bukti tersedia</span><textarea className="input textarea compact" maxLength={12000} value={active.document.evidence} onChange={event => update(doc => ({ ...doc, evidence: event.target.value }))} /></label>
          <div className="analyzer-grid">
            <label className="field-label"><span>Saluran perbualan</span><select className="input" value={active.document.channel} onChange={event => update(doc => ({ ...doc, channel: event.target.value }))}>{['WhatsApp', 'Phone', 'Instagram DM', 'Facebook Messenger', 'TikTok DM', 'Marketplace Chat', 'Email', 'In-person', 'Other'].map(value => <option key={value}>{value}</option>)}</select></label>
            <label className="field-label"><span>Tarikh susulan yang dipersetujui / dirancang</span><input className="input" type="datetime-local" value={localDate(active.document.dueAt)} onChange={event => update(doc => ({ ...doc, dueAt: event.target.value ? new Date(event.target.value).toISOString() : null }))} /></label>
          </div>
        </div>
      </details>

      <QualificationEvidence />

      <details className="card advanced-details">
        <summary>Lihat logik sistem</summary>
        <div className="case-form advanced-details-body">
          <p className="muted">Peta ini membantu power user memahami model BROS SELL. Anda tidak perlu menguasainya untuk menggunakan Web OS.</p>
          {BROS_STAGES.map(stage => <p key={stage}><strong>{stage}</strong> · {STAGE_GUIDANCE[stage]}</p>)}
          <label className="field-label"><span>Pilih peringkat sendiri jika bukti memerlukannya</span><select className="input" value={active.document.stageOverride ?? ''} onChange={event => update(doc => ({ ...doc, stageOverride: event.target.value ? event.target.value as CaseDocument['stageOverride'] : null }))}><option value="">Gunakan cadangan sistem</option>{BROS_STAGES.map(stage => <option key={stage}>{stage}</option>)}</select></label>
          {active.document.stageOverride && <label className="field-label"><span>Sebab berdasarkan bukti</span><input className="input" required value={active.document.stageReason} onChange={event => update(doc => ({ ...doc, stageReason: event.target.value }))} /></label>}
        </div>
      </details>

      <details className="card advanced-details">
        <summary>Sejarah case</summary>
        <div className="advanced-details-body">
          {active.document.history.length ? <ol className="case-history">{[...active.document.history].reverse().map(event => <li key={event.id}><strong>{event.kind === 'action' ? 'Tindakan' : event.kind === 'reopen' ? 'Dibuka semula' : `Hasil: ${OBSERVATION_LABELS[event.outcome!]}`}</strong><time dateTime={event.at}>{new Date(event.at).toLocaleString('ms-MY')}</time><p>{event.note}</p>{event.evidenceSnapshot && <details><summary>Bukti sebelum tindakan</summary><p>{event.evidenceSnapshot}</p></details>}</li>)}</ol> : <p className="muted">Belum ada tindakan direkodkan.</p>}
        </div>
      </details>
    </>}
  </section>;
}

export function CaseDiagnosis() {
  const { active } = useSalesCases();
  if (!active) return null;
  const result = diagnoseCase(active.document);
  const missing = active.document.observation === 'no_reply'
    ? 'Sebab customer belum membalas masih belum diketahui.'
    : ['objection', 'price_objection'].includes(active.document.observation)
      ? 'Maksud sebenar bantahan customer belum disahkan.'
      : result.missing.length ? 'Keperluan, kesesuaian dan kesediaan customer belum disahkan sepenuhnya.' : 'Tiada jurang utama yang dikenal pasti daripada bukti semasa.';
  const question = result.question.replace(/Relevance|Need|Readiness|Fit|Access|Engagement/g, dimension => ({ Relevance: 'relevansi tawaran', Need: 'keperluan customer', Readiness: 'kesediaan customer', Fit: 'kesesuaian tawaran', Access: 'pihak yang membuat keputusan', Engagement: 'respons customer' })[dimension]!);
  const toolLabel = TOOL_LABELS[result.tool] ?? 'Panduan seterusnya';

  return <section className="card case-diagnosis simplified-diagnosis" aria-label="Diagnosis case">
    <div className="diagnosis-block">
      <div className="eyebrow">APA YANG BERLAKU</div>
      <h2>{result.why}</h2>
    </div>
    <div className="diagnosis-block">
      <div className="eyebrow">APA YANG BELUM PASTI</div>
      <p>{missing}</p>
      {!result.terminal && !result.stop && question && <p className="diagnosis-question">{question}</p>}
    </div>
    <div className="diagnosis-block next-block">
      <div className="eyebrow">BUAT SEKARANG</div>
      <h2>{result.action}</h2>
      {!result.terminal && !result.stop && <Link className="btn primary-action" href={`/app/${result.tool}?case=${active.id}`}>{toolLabel}</Link>}
      <p className="field-note">Cadangan berubah apabila bukti berubah. Rekod outcome selepas anda bertindak.</p>
    </div>
    <details className="diagnosis-system-detail">
      <summary>Lihat diagnosis penuh</summary>
      <div className="diagnosis-system-grid">
        <div><strong>Stage</strong><p>{result.stage}</p></div>
        <div><strong>Status buyer</strong><p>{result.leadState}</p></div>
        <div><strong>Status case</strong><p>{active.document.status}</p></div>
      </div>
      <p className="muted">{STAGE_GUIDANCE[result.stage]}</p>
      <div className="diagnosis-evidence-detail">
        <h3>Diketahui</h3>{result.known.length ? <ul>{result.known.map(item => <li key={item}>{item}</li>)}</ul> : <p>Belum ada bukti pembeli direkodkan.</p>}
        <h3>Andaian sistem</h3>{result.inferred.map(item => <p key={item}>{item}</p>)}
        <h3>Belum diketahui / belum disahkan</h3><p>{result.missing.join(', ') || 'Enam dimensi mempunyai bukti.'}</p>
      </div>
    </details>
  </section>;
}

function BuyerResponseCheck() {
  const { active, update } = useSalesCases();
  const [response, setResponse] = useState<Observation | ''>('');
  const [buyerEvidence, setBuyerEvidence] = useState(active?.document.situation ?? '');
  if (!active) return null;
  return <section className="card case-form buyer-response-check">
    <div className="eyebrow">SATU PERKARA UNTUK DISAHKAN</div>
    <h2>Apa respons terakhir customer?</h2>
    <p className="muted">Sahkan apa yang customer benar-benar cakap atau buat. Sistem tidak meneka niat daripada cerita sahaja.</p>
    <form className="case-form" onSubmit={event => {
      event.preventDefault();
      if (!response || !buyerEvidence.trim()) return;
      update(doc => ({ ...doc, evidence: buyerEvidence.trim(), observation: response,
        status: response === 'no' ? 'lost' : ['not_now', 'delayed_decision'].includes(response) ? 'deferred' : 'active' }));
    }}>
      <label className="field-label"><span>Respons terakhir customer</span><select className="input" required value={response} onChange={event => setResponse(event.target.value as Observation | '')}>
        <option value="">Pilih respons yang anda lihat</option>
        {(['no_reply', 'price_asked', 'price_objection', 'objection', 'replied', 'interested', 'more_info', 'yes', 'no', 'not_now', 'unknown'] as Observation[]).map(value => <option key={value} value={value}>{OBSERVATION_LABELS[value]}</option>)}
      </select></label>
      <label className="field-label"><span>Kata-kata / tindakan customer</span><textarea className="input textarea compact" required maxLength={12000} value={buyerEvidence} onChange={event => setBuyerEvidence(event.target.value)} /></label>
      <button className="btn primary-action">Sahkan & tentukan next move</button>
    </form>
  </section>;
}

export function QualificationEvidence() {
  const { active, update } = useSalesCases();
  if (!active) return null;
  return <details className="card advanced-details"><summary>Apa yang kita tahu <span className="muted">(lanjutan)</span></summary><div className="advanced-details-body"><p className="muted">Gunakan bahagian ini hanya apabila anda perlu mengesahkan qualification dengan lebih tepat. Jangan anggap signal tanpa bukti.</p><div className="case-signal-grid">{DIMENSIONS.map(dimension => <div className="case-form" key={dimension}><label className="field-label"><span>{dimension}</span><select className="input" value={active.document.signals[dimension].status} onChange={event => update(doc => ({ ...doc, signals: { ...doc.signals, [dimension]: { ...doc.signals[dimension], status: event.target.value as 'unknown' | 'confirmed' | 'no' } } }))}><option value="unknown">Belum diketahui</option><option value="confirmed">Disahkan dengan bukti</option><option value="no">Bukti negatif / tidak sesuai</option></select></label><label className="field-label"><span>Bukti {dimension}</span><textarea className="input textarea compact" rows={2} value={active.document.signals[dimension].note} onChange={event => update(doc => ({ ...doc, signals: { ...doc.signals, [dimension]: { ...doc.signals[dimension], note: event.target.value } } }))} /></label></div>)}</div></div></details>;
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

  return <section className="card case-form action-card" aria-label="Operating loop">
    <div className="eyebrow">{pending ? 'REKOD HASIL' : 'SELEPAS ANDA BERTINDAK'}</div>
    <h2>{pending ? 'Apa yang berlaku selepas tindakan itu?' : 'Rekod apa yang anda benar-benar lakukan.'}</h2>
    {((result.terminal && active.document.status !== 'closed') || result.stop || result.paused) && !pending ? <><p>{result.action}</p><label className="field-label"><span>Sebab baharu yang relevan / persetujuan membuka semula</span><input className="input" value={reason} onChange={event => setReason(event.target.value)} /></label><button className="btn secondary" disabled={!reason.trim()} onClick={() => run(doc => reopenCase(doc, reason))}>Buka semula case</button></> : pending ? <form className="case-form" onSubmit={event => { event.preventDefault(); run(doc => recordOutcome(doc, outcome, note, due ? new Date(due).toISOString() : null)); }}>
      <p><strong>Tindakan terakhir:</strong> {pending.note}</p>
      <label className="field-label"><span>Hasil tindakan</span><select className="input" value={outcome} onChange={event => setOutcome(event.target.value as Observation)}>{OUTCOMES.filter(value => active.document.status !== 'closed' || ['replied', 'needs_clarification', 'follow_up_required', 'resolved', 'other'].includes(value)).map(value => <option key={value} value={value}>{OBSERVATION_LABELS[value]}</option>)}</select></label>
      <label className="field-label"><span>Apa yang customer buat / cakap?</span><textarea className="input textarea compact" required value={note} onChange={event => setNote(event.target.value)} /></label>
      <label className="field-label"><span>Tarikh susulan seterusnya jika relevan</span><input className="input" type="datetime-local" value={due} onChange={event => setDue(event.target.value)} /></label>
      <button className="btn primary-action">Rekod hasil & tentukan next move</button>
      <p className="field-note">Pilih jualan disahkan hanya apabila pesanan / bayaran sebenar telah disahkan.</p>
    </form> : <form className="case-form" onSubmit={event => { event.preventDefault(); run(doc => recordAction(doc, action, result.tool)); }}>
      <p className="muted">Web OS tidak menghantar mesej bagi pihak anda. Selepas anda melakukan tindakan di saluran sebenar, catat ringkas di sini.</p>
      <label className="field-label"><span>Tindakan yang telah dilakukan</span><textarea className="input textarea compact" required value={action} onChange={event => setAction(event.target.value)} /></label>
      <button className="btn secondary">Rekod tindakan dilakukan</button>
    </form>}
    {message && <p role="alert">{message}</p>}
  </section>;
}

function localDate(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
