'use client';

import Link from 'next/link';
import { useState } from 'react';
import { BROS_STAGES } from '@/lib/bros-sell/system-registry';
import {
  DIMENSIONS,
  OBSERVATIONS,
  OBSERVATION_LABELS,
  OUTCOMES,
  STAGE_GUIDANCE,
  diagnoseCase,
  exampleCase,
  newCase,
  pendingAction,
  recordAction,
  recordOutcome,
  reopenCase,
  type CaseDocument,
  type FactKey,
  type Observation,
} from '@/lib/bros-sell/sales-case';
import { useSalesCases } from './sales-case-provider';

const toolLabels: Record<string, string> = {
  'target-calculator': 'Semak sasaran',
  'buyer-intelligence': 'Fahami buyer',
  'offer-stack': 'Jelaskan tawaran',
  'lead-state': 'Semak status buyer',
  'value-bridge': 'Jelaskan nilai',
  'close-path': 'Sediakan next step',
  'objection-playbook': 'Fahami bantahan',
  'whatsapp-scripts': 'Bina mesej',
  'follow-up': 'Bina follow-up',
  'customer-multiplication': 'Repeat & referral',
  'operator-dashboard': 'Semak insights',
};

function suggestedTitle(reference: string, situation: string) {
  const cleanReference = reference.trim();
  if (cleanReference) return cleanReference.slice(0, 160);
  const cleanSituation = situation.trim().replace(/\s+/g, ' ');
  return cleanSituation.length > 72 ? `${cleanSituation.slice(0, 69)}...` : cleanSituation;
}

export default function SalesCaseWorkspace() {
  const { active, create, update, loading, error } = useSalesCases();
  const [reference, setReference] = useState('');
  const [situation, setSituation] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function start(document: CaseDocument) {
    setBusy(true);
    setMessage('');
    try {
      await create(document);
      setReference('');
      setSituation('');
    } catch (failure) {
      setMessage(failure instanceof Error ? failure.message : 'Case belum disimpan.');
    } finally {
      setBusy(false);
    }
  }

  function createSimpleCase() {
    const cleanSituation = situation.trim();
    if (!cleanSituation) {
      setMessage('Ceritakan situasi sebenar sebelum meneruskan.');
      return;
    }
    const doc = newCase(suggestedTitle(reference, cleanSituation), cleanSituation);
    if (reference.trim()) doc.facts.buyer = reference.trim();
    void start(doc);
  }

  return (
    <section className="case-workspace" aria-label="BROS SELL guided workflow">
      {!active && (
        <section className="card quick-start-card">
          <form
            className="case-form"
            onSubmit={event => {
              event.preventDefault();
              createSimpleCase();
            }}
          >
            <label className="field-label">
              <span>Customer / deal (optional)</span>
              <input
                className="input"
                maxLength={160}
                value={reference}
                onChange={event => setReference(event.target.value)}
                placeholder="Contoh: Ali · Sofa cleaning"
              />
            </label>
            <label className="field-label primary-situation">
              <span>Apa yang sedang berlaku?</span>
              <textarea
                className="input textarea"
                required
                maxLength={12000}
                value={situation}
                onChange={event => setSituation(event.target.value)}
                placeholder="Contoh: Customer tanya harga, saya dah jawab RM500 dan sekarang dia senyap."
              />
            </label>
            <button className="btn primary-cta" disabled={busy || loading || !!error}>
              {busy ? 'Sedang menyimpan...' : 'Tentukan next move'}
            </button>
            <details className="quiet-details">
              <summary>Cuba dengan contoh latihan</summary>
              <button
                className="btn secondary"
                type="button"
                disabled={busy || loading || !!error}
                onClick={() => void start(exampleCase())}
              >
                Jalankan contoh RM500
              </button>
            </details>
            {message && <p role="alert">{message}</p>}
          </form>
        </section>
      )}

      {active && (
        <>
          <section className="card case-focus">
            <div className="case-focus-heading">
              <div>
                <div className="eyebrow">CASE SEMASA</div>
                <h2>{active.document.title}</h2>
              </div>
              {active.document.example && <span className="case-example">CONTOH LATIHAN</span>}
            </div>

            <label className="field-label">
              <span>Situasi semasa</span>
              <textarea
                className="input textarea compact"
                maxLength={12000}
                value={active.document.situation}
                onChange={event => update(doc => ({ ...doc, situation: event.target.value }))}
              />
            </label>

            <label className="field-label">
              <span>Apa yang customer cakap atau buat terakhir?</span>
              <textarea
                className="input textarea compact"
                maxLength={12000}
                value={active.document.evidence}
                onChange={event => update(doc => ({ ...doc, evidence: event.target.value }))}
                placeholder="Rekod bukti sebenar. Jika belum ada, biarkan kosong."
              />
            </label>

            <label className="field-label">
              <span>Status terakhir yang anda nampak</span>
              <select
                className="input"
                value={active.document.observation}
                onChange={event => {
                  const observation = event.target.value as Observation;
                  update(doc => ({
                    ...doc,
                    observation,
                    status: observation === 'no' ? 'lost' : ['not_now', 'delayed_decision'].includes(observation) ? 'deferred' : doc.status === 'lost' || doc.status === 'deferred' ? 'active' : doc.status,
                  }));
                }}
              >
                {OBSERVATIONS.filter(value => !['closed', 'lost', 'resolved'].includes(value)).map(value => (
                  <option key={value} value={value}>{OBSERVATION_LABELS[value]}</option>
                ))}
              </select>
            </label>
          </section>

          <CaseDiagnosis />
          <CaseActionPanel key={active.id} />

          <details className="card advanced-panel">
            <summary>Lihat maklumat & diagnosis penuh</summary>
            <div className="case-form advanced-content">
              <h3>Maklumat tambahan</h3>
              <label className="field-label">
                <span>Tajuk case semasa</span>
                <input
                  className="input"
                  maxLength={160}
                  value={active.document.title}
                  onChange={event => update(doc => ({ ...doc, title: event.target.value }))}
                />
              </label>
              <div className="analyzer-grid">
                {([
                  ['buyer', 'Pembeli'],
                  ['business', 'Bisnes / konteks'],
                  ['offer', 'Tawaran / servis'],
                  ['investment', 'Harga / investment'],
                ] as [FactKey, string][]).map(([key, label]) => (
                  <label className="field-label" key={key}>
                    <span>{label}</span>
                    <input
                      className="input"
                      value={active.document.facts[key] ?? ''}
                      onChange={event => update(doc => ({ ...doc, facts: { ...doc.facts, [key]: event.target.value } }))}
                    />
                  </label>
                ))}
              </div>
              <label className="field-label">
                <span>Saluran perbualan</span>
                <select
                  className="input"
                  value={active.document.channel}
                  onChange={event => update(doc => ({ ...doc, channel: event.target.value }))}
                >
                  {['WhatsApp', 'Phone', 'Instagram DM', 'Facebook Messenger', 'TikTok DM', 'Marketplace Chat', 'Email', 'In-person', 'Other'].map(value => <option key={value}>{value}</option>)}
                </select>
              </label>
              <label className="field-label">
                <span>Tarikh susulan yang dipersetujui / dirancang</span>
                <input
                  className="input"
                  type="datetime-local"
                  value={localDate(active.document.dueAt)}
                  onChange={event => update(doc => ({ ...doc, dueAt: event.target.value ? new Date(event.target.value).toISOString() : null }))}
                />
              </label>

              <QualificationEvidence />

              <details className="nested-details">
                <summary>Lihat sistem 10 peringkat</summary>
                <div className="case-form">
                  {BROS_STAGES.map(stage => <p key={stage}><strong>{stage}</strong> · {STAGE_GUIDANCE[stage]}</p>)}
                  <label className="field-label">
                    <span>Pilih peringkat sendiri jika bukti memerlukannya</span>
                    <select
                      className="input"
                      value={active.document.stageOverride ?? ''}
                      onChange={event => update(doc => ({ ...doc, stageOverride: event.target.value ? event.target.value as CaseDocument['stageOverride'] : null }))}
                    >
                      <option value="">Gunakan cadangan sistem</option>
                      {BROS_STAGES.map(stage => <option key={stage}>{stage}</option>)}
                    </select>
                  </label>
                  {active.document.stageOverride && (
                    <label className="field-label">
                      <span>Sebab berdasarkan bukti</span>
                      <input
                        className="input"
                        required
                        value={active.document.stageReason}
                        onChange={event => update(doc => ({ ...doc, stageReason: event.target.value }))}
                      />
                    </label>
                  )}
                </div>
              </details>
            </div>
          </details>

          <details className="card quiet-details">
            <summary>Sejarah case</summary>
            {active.document.history.length ? (
              <ol className="case-history">
                {[...active.document.history].reverse().map(event => (
                  <li key={event.id}>
                    <strong>{event.kind === 'action' ? 'Tindakan' : event.kind === 'reopen' ? 'Dibuka semula' : `Hasil: ${OBSERVATION_LABELS[event.outcome!]}`}</strong>
                    <time dateTime={event.at}>{new Date(event.at).toLocaleString('ms-MY')}</time>
                    <p>{event.note}</p>
                  </li>
                ))}
              </ol>
            ) : <p className="muted">Belum ada tindakan direkodkan.</p>}
          </details>
        </>
      )}
    </section>
  );
}

export function CaseDiagnosis() {
  const { active } = useSalesCases();
  if (!active) return null;
  const result = diagnoseCase(active.document);
  const missing = result.missing.length ? result.question : 'Maklumat utama yang diperlukan sudah direkodkan.';
  const label = toolLabels[result.tool] ?? 'Teruskan';

  return (
    <section className="card simple-diagnosis" aria-label="Diagnosis case">
      <div className="diagnosis-block">
        <div className="eyebrow">APA YANG BERLAKU</div>
        <p>{result.why}</p>
      </div>
      <div className="diagnosis-block">
        <div className="eyebrow">APA YANG BELUM PASTI</div>
        <p>{result.terminal || result.stop ? 'Tiada soalan tambahan diperlukan untuk meneruskan case ini.' : missing}</p>
      </div>
      <div className="diagnosis-block diagnosis-next">
        <div className="eyebrow">BUAT SEKARANG</div>
        <h2>{result.action}</h2>
        {!result.terminal && !result.stop && (
          <Link className="btn primary-cta" href={`/app/${result.tool}?case=${active.id}`}>{label}</Link>
        )}
        <p className="field-note">
          Cadangan ini berdasarkan maklumat yang anda rekodkan. BROS SELL tidak menganggapnya sebagai kepastian tentang niat buyer.
        </p>
      </div>
      <details className="diagnosis-details">
        <summary>Lihat diagnosis penuh</summary>
        <div className="diagnosis-full">
          <p><strong>Peringkat:</strong> {result.stage}</p>
          <p><strong>Status buyer:</strong> {result.leadState}</p>
          <p><strong>Panduan:</strong> {STAGE_GUIDANCE[result.stage]}</p>
          <h3>Diketahui</h3>
          {result.known.length ? <ul>{result.known.map(item => <li key={item}>{item}</li>)}</ul> : <p>Belum ada bukti buyer direkodkan.</p>}
          <h3>Andaian sistem</h3>
          {result.inferred.map(item => <p key={item}>{item}</p>)}
          <h3>Belum disahkan</h3>
          <p>{result.missing.join(', ') || 'Enam dimensi mempunyai bukti.'}</p>
          <p className="field-note">Tool dalaman: {result.tool.replaceAll('-', ' ')}</p>
        </div>
      </details>
    </section>
  );
}

export function QualificationEvidence() {
  const { active, update } = useSalesCases();
  if (!active) return null;
  return (
    <details className="nested-details">
      <summary>Apa yang kita tahu tentang kelayakan?</summary>
      <p className="muted">Sahkan hanya perkara yang mempunyai bukti. Anda tidak perlu lengkapkan semuanya untuk mula.</p>
      <div className="case-signal-grid">
        {DIMENSIONS.map(dimension => (
          <div className="case-form" key={dimension}>
            <label className="field-label">
              <span>{dimension}</span>
              <select
                className="input"
                value={active.document.signals[dimension].status}
                onChange={event => update(doc => ({
                  ...doc,
                  signals: {
                    ...doc.signals,
                    [dimension]: {
                      ...doc.signals[dimension],
                      status: event.target.value as 'unknown' | 'confirmed' | 'no',
                    },
                  },
                }))}
              >
                <option value="unknown">Belum diketahui</option>
                <option value="confirmed">Disahkan dengan bukti</option>
                <option value="no">Bukti negatif / tidak sesuai</option>
              </select>
            </label>
            <label className="field-label">
              <span>Bukti {dimension}</span>
              <textarea
                className="input textarea compact"
                rows={2}
                value={active.document.signals[dimension].note}
                onChange={event => update(doc => ({
                  ...doc,
                  signals: {
                    ...doc.signals,
                    [dimension]: { ...doc.signals[dimension], note: event.target.value },
                  },
                }))}
              />
            </label>
          </div>
        ))}
      </div>
    </details>
  );
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
    try {
      const next = change(active.document);
      update(() => next);
      setMessage('');
      setAction('');
      setNote('');
    } catch (failure) {
      setMessage(failure instanceof Error ? failure.message : 'Maklumat belum lengkap.');
    }
  };

  return (
    <section className="card case-form operating-loop" aria-label="Operating loop">
      <div className="eyebrow">{pending ? 'APA YANG BERLAKU SELEPAS ITU?' : 'SELEPAS ANDA BERTINDAK'}</div>
      <h2>{pending ? 'Rekod respons atau hasil sebenar.' : 'Catat tindakan sebenar apabila anda sudah melakukannya.'}</h2>
      {((result.terminal && active.document.status !== 'closed') || result.stop || result.paused) && !pending ? (
        <>
          <p>{result.action}</p>
          <label className="field-label">
            <span>Sebab baharu yang relevan / persetujuan membuka semula</span>
            <input className="input" value={reason} onChange={event => setReason(event.target.value)} />
          </label>
          <button className="btn secondary" disabled={!reason.trim()} onClick={() => run(doc => reopenCase(doc, reason))}>Buka semula case</button>
        </>
      ) : pending ? (
        <form className="case-form" onSubmit={event => {
          event.preventDefault();
          run(doc => recordOutcome(doc, outcome, note, due ? new Date(due).toISOString() : null));
        }}>
          <p><strong>Tindakan terakhir:</strong> {pending.note}</p>
          <label className="field-label">
            <span>Apa yang berlaku?</span>
            <select className="input" value={outcome} onChange={event => setOutcome(event.target.value as Observation)}>
              {OUTCOMES.filter(value => active.document.status !== 'closed' || ['replied', 'needs_clarification', 'follow_up_required', 'resolved', 'other'].includes(value)).map(value => (
                <option key={value} value={value}>{OBSERVATION_LABELS[value]}</option>
              ))}
            </select>
          </label>
          <label className="field-label">
            <span>Respons / bukti sebenar</span>
            <textarea className="input textarea compact" required value={note} onChange={event => setNote(event.target.value)} />
          </label>
          <label className="field-label">
            <span>Tarikh susulan seterusnya jika relevan</span>
            <input className="input" type="datetime-local" value={due} onChange={event => setDue(event.target.value)} />
          </label>
          <button className="btn">Rekod & tentukan next move</button>
          <p className="field-note">Pilih jualan disahkan hanya apabila pesanan / bayaran sebenar telah disahkan.</p>
        </form>
      ) : (
        <form className="case-form" onSubmit={event => {
          event.preventDefault();
          run(doc => recordAction(doc, action, result.tool));
        }}>
          <p className="muted">BROS SELL tidak menghantar mesej bagi pihak anda. Selepas anda bertindak di saluran sebenar, rekod tindakan itu di sini.</p>
          <label className="field-label">
            <span>Apa yang anda lakukan?</span>
            <textarea className="input textarea compact" required value={action} onChange={event => setAction(event.target.value)} />
          </label>
          <button className="btn">Rekod tindakan</button>
        </form>
      )}
      {message && <p role="alert">{message}</p>}
    </section>
  );
}

function localDate(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
