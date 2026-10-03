import { BROS_STAGES, type BrosStage } from './system-registry.ts';
import { validToolData } from './tool-schema.ts';

export const DIMENSIONS = ['Relevance', 'Need', 'Readiness', 'Fit', 'Access', 'Engagement'] as const;
export const OBSERVATIONS = ['unknown', 'aware', 'price_asked', 'proposal_requested', 'no_reply', 'replied', 'interested', 'needs_clarification', 'objection', 'price_objection', 'delayed_decision', 'yes', 'no', 'not_now', 'more_info', 'closed', 'lost', 'resolved', 'follow_up_required', 'other'] as const;
export const OUTCOMES: readonly Observation[] = OBSERVATIONS.filter(value => value !== 'unknown');
export const FACT_KEYS = ['buyer', 'business', 'offer', 'investment', 'currentSituation', 'problem', 'impact', 'desiredOutcome', 'criteria', 'barrier', 'authority', 'trigger', 'mechanism', 'proof', 'assurance', 'reasonToAct'] as const;
export type FactKey = typeof FACT_KEYS[number];
export type Dimension = typeof DIMENSIONS[number];
export type Observation = typeof OBSERVATIONS[number];
export type CaseStatus = 'active' | 'deferred' | 'closed' | 'lost' | 'resolved';
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
export type CaseEvent = {
  id: string; kind: 'action' | 'outcome' | 'reopen'; at: string; note: string;
  tool?: string; actionId?: string; outcome?: Observation; evidenceSnapshot?: string;
};
export type CaseDocument = {
  version: 1; title: string; situation: string; evidence: string; channel: string;
  facts: Partial<Record<FactKey, string>>;
  signals: Record<Dimension, { status: 'unknown' | 'confirmed' | 'no'; note: string }>;
  observation: Observation; status: CaseStatus; dueAt: string | null;
  stageOverride: BrosStage | null; stageReason: string;
  tools: Record<string, Record<string, JsonValue>>; history: CaseEvent[]; example: boolean;
};
export type SalesCase = { id: string; revision: number; created_at: string; updated_at: string; document: CaseDocument };
export const OBSERVATION_LABELS: Record<Observation, string> = {
  unknown: 'Belum diketahui', aware: 'Menyedari tawaran / masalah', price_asked: 'Bertanya harga', proposal_requested: 'Meminta cadangan / skop', no_reply: 'Tiada balasan', replied: 'Sudah membalas',
  interested: 'Menyatakan minat', needs_clarification: 'Perlu penjelasan', objection: 'Ada bantahan',
  price_objection: 'Bantahan harga', delayed_decision: 'Keputusan ditangguhkan', yes: 'Ya, mahu teruskan',
  no: 'Tidak mahu teruskan', not_now: 'Bukan sekarang', more_info: 'Perlu maklumat lagi', closed: 'Jualan disahkan',
  lost: 'Peluang ditutup / tidak sesuai', resolved: 'Situasi operasi selesai', follow_up_required: 'Susulan diperlukan', other: 'Lain-lain',
};
export const STAGE_GUIDANCE: Record<BrosStage, string> = {
  TARGET: 'Tentukan sasaran dan siapa yang relevan sebelum menambah aktiviti.', BUYER: 'Fahami keadaan, masalah dan hasil yang pembeli mahu.',
  OFFER: 'Jelaskan tawaran, skop, bukti dan harga sebenar.', LEAD: 'Bezakan pertanyaan daripada peluang yang layak.',
  QUALIFY: 'Sahkan keperluan, kesesuaian, kesediaan dan pihak pembuat keputusan.', VALUE: 'Hubungkan masalah dan hasil pembeli kepada penyelesaian.',
  CLOSE: 'Jelaskan pilihan, halangan keputusan dan langkah yang dipersetujui.', 'FOLLOW-UP': 'Susulan mesti mempunyai tujuan, konteks dan keadaan untuk berhenti.',
  MULTIPLY: 'Semak hasil pelanggan sebelum meminta repeat atau referral yang relevan.', OPERATE: 'Semak bukti, hasil dan kekangan sebelum mengubah proses.',
};
export const TOOL_BY_STAGE: Record<BrosStage, string> = {
  TARGET: 'target-calculator', BUYER: 'buyer-intelligence', OFFER: 'offer-stack', LEAD: 'lead-state', QUALIFY: 'buyer-intelligence',
  VALUE: 'value-bridge', CLOSE: 'close-path', 'FOLLOW-UP': 'follow-up', MULTIPLY: 'customer-multiplication', OPERATE: 'operator-dashboard',
};

export function newCase(title: string, situation: string): CaseDocument {
  return { version: 1, title, situation, evidence: '', channel: 'WhatsApp', facts: {},
    signals: Object.fromEntries(DIMENSIONS.map(d => [d, { status: 'unknown', note: '' }])) as CaseDocument['signals'],
    observation: 'unknown', status: 'active', dueAt: null, stageOverride: null, stageReason: '', tools: {}, history: [], example: false };
}

export function exampleCase(): CaseDocument {
  const value = newCase('Contoh: pembeli senyap selepas harga', 'Saya jual servis RM500. Prospek WhatsApp tanya harga. Saya jawab RM500. Mesej dibaca, tetapi belum dibalas.');
  value.example = true;
  value.facts = { offer: 'Servis', investment: 'RM500' };
  value.evidence = 'Pembeli bertanya harga; saya menjawab RM500. Status mesej menunjukkan dibaca. Tiada sebab penolakan dinyatakan.';
  value.observation = 'no_reply';
  value.signals.Engagement = { status: 'confirmed', note: 'Pembeli sendiri bertanya harga melalui WhatsApp.' };
  return value;
}

export function pendingAction(doc: CaseDocument): CaseEvent | undefined {
  return [...doc.history].reverse().find(event => event.kind === 'action' && !doc.history.some(result => result.kind === 'outcome' && result.actionId === event.id));
}

export function followUpCount(doc: CaseDocument): number {
  const lastReopen = doc.history.findLastIndex(event => event.kind === 'reopen');
  return doc.history.slice(lastReopen + 1).filter(event => event.kind === 'action' && event.tool === 'follow-up').length;
}

export function diagnoseCase(doc: CaseDocument) {
  const confirmed = (dimension: Dimension) => doc.signals[dimension].status === 'confirmed' && !!doc.signals[dimension].note.trim();
  const missing = DIMENSIONS.filter(d => !confirmed(d));
  const qualified = DIMENSIONS.every(confirmed);
  const terminal = ['closed', 'lost', 'resolved'].includes(doc.status);
  const followUps = followUpCount(doc);
  const unsuitable = (['Relevance', 'Need', 'Fit'] as Dimension[]).some(d => doc.signals[d].status === 'no' && !!doc.signals[d].note.trim());
  const stop = doc.status === 'lost' || doc.observation === 'no' || doc.observation === 'lost' || unsuitable;
  let stage: BrosStage = 'QUALIFY';
  let tool = 'buyer-intelligence';
  let action = 'Jelaskan satu maklumat pembeli yang masih belum diketahui.';
  let why = 'Maklumat kelayakan belum cukup untuk menganggap pertanyaan ini sebagai peluang yang layak.';
  let question = missing[0] ? `Apakah bukti sebenar untuk ${missing[0]}?` : 'Apakah langkah yang pembeli mahu selepas ini?';
  if (doc.status === 'closed') { stage = 'MULTIPLY'; tool = 'customer-multiplication'; action = 'Semak penghantaran dan hasil pelanggan sebelum mempertimbangkan repeat atau referral.'; why = 'Jualan telah direkodkan sebagai disahkan. Manfaat pelanggan perlu diperiksa dahulu.'; }
  else if (doc.status === 'resolved') { stage = 'OPERATE'; tool = 'operator-dashboard'; action = 'Semak apa yang dipelajari daripada case yang selesai.'; why = 'Situasi telah direkodkan sebagai selesai.'; }
  else if (stop) { stage = 'TARGET'; tool = 'operator-dashboard'; action = 'Hormati keputusan dan hentikan susulan.'; why = unsuitable ? 'Bukti negatif untuk relevansi, keperluan atau kesesuaian telah direkodkan.' : 'Keputusan tidak mahu meneruskan atau peluang ditutup telah direkodkan.'; }
  else if (!doc.evidence.trim() && !DIMENSIONS.some(d => doc.signals[d].status !== 'unknown' && doc.signals[d].note.trim())) { stage = 'LEAD'; tool = 'lead-state'; action = 'Rekod kata-kata atau tindakan terakhir pembeli dahulu.'; why = 'Situasi penjual sahaja belum membuktikan niat pembeli.'; question = 'Apa yang pembeli sendiri nyatakan atau lakukan?'; }
  else if (doc.status === 'deferred' || ['not_now', 'delayed_decision'].includes(doc.observation)) { stage = 'FOLLOW-UP'; tool = 'follow-up'; action = doc.dueAt ? 'Semak semula pada tarikh susulan yang dipersetujui.' : 'Sahkan bila dan atas sebab apa perbualan patut dibuka semula.'; why = 'Pembeli menangguhkan keputusan. Ini bukan arahan untuk terus mengejar.'; question = 'Bila perkara ini kembali relevan untuk anda?'; }
  else if (['price_objection', 'objection'].includes(doc.observation)) { stage = 'VALUE'; tool = 'objection-playbook'; action = 'Jelaskan maksud bantahan sebelum memberi hujah atau diskaun.'; why = 'Bantahan dicatat, tetapi punca sebenar masih perlu disahkan; harga tidak membuktikan isu bajet.'; question = 'Bahagian mana yang belum sesuai: skop, nilai, bajet, atau perkara lain?'; }
  else if (doc.observation === 'no_reply') {
    stage = 'FOLLOW-UP'; tool = 'follow-up';
    action = followUps >= 5 ? 'Hentikan susulan berulang; tunggu sebab baharu yang benar-benar relevan.' : 'Pilih satu susulan berasaskan konteks, dengan soalan yang mudah dijawab.';
    why = 'Tiada balasan ialah pemerhatian; ia tidak membuktikan penolakan, isu harga atau niat pembeli.';
    question = 'Adakah servis ini masih relevan, atau ada bahagian yang perlu saya jelaskan?';
  }
  else if (['yes', 'more_info', 'needs_clarification'].includes(doc.observation)) { stage = 'CLOSE'; tool = doc.observation === 'yes' ? 'close-path' : 'buyer-intelligence'; action = doc.observation === 'yes' ? 'Sahkan langkah, tanggungjawab dan pengesahan pesanan / bayaran.' : 'Jawab maklumat khusus yang masih diperlukan pembeli.'; why = 'Respons pembeli dinyatakan secara jelas. Ya untuk meneruskan masih belum sama dengan jualan disahkan.'; }
  else if (doc.observation === 'price_asked') { stage = 'OFFER'; tool = 'offer-stack'; action = 'Jawab harga dengan jelas jika skop cukup; jelaskan konteks minimum jika belum.'; why = 'Pertanyaan harga menunjukkan interaksi, bukan bukti pembeli sudah layak atau mahu membeli.'; }
  else if (doc.observation === 'proposal_requested') { stage = 'OFFER'; tool = 'offer-stack'; action = 'Jelaskan skop yang diminta dan semak bukti kelayakan yang masih belum cukup.'; why = 'Permintaan cadangan ialah tingkah laku membeli aktif, tetapi belum membuktikan semua dimensi kelayakan.'; }
  else if (qualified) { stage = 'VALUE'; tool = 'value-bridge'; action = 'Hubungkan masalah dan hasil pembeli kepada tawaran yang sesuai.'; why = 'Enam dimensi kelayakan mempunyai bukti yang disahkan oleh penjual.'; }
  else if (doc.observation === 'other') { stage = 'OPERATE'; tool = 'operator-dashboard'; action = 'Semak perubahan yang direkodkan sebelum memilih langkah baharu.'; why = 'Hasil lain-lain memerlukan semakan; sistem tidak menganggapnya berjaya atau gagal.'; }
  if (doc.stageOverride && !terminal && !stop) { stage = doc.stageOverride; tool = TOOL_BY_STAGE[stage]; action = STAGE_GUIDANCE[stage]; why = `Peringkat dipilih oleh anda: ${doc.stageReason}`; }
  const decision = ['yes', 'no', 'not_now', 'more_info', 'closed', 'lost', 'delayed_decision'].includes(doc.observation);
  const leadState = decision ? 'Decision' : doc.observation === 'proposal_requested' ? 'Active' : qualified ? 'Qualified' : confirmed('Engagement') || ['price_asked', 'replied', 'interested', 'no_reply', 'objection', 'price_objection'].includes(doc.observation) ? 'Engaged' : doc.observation === 'aware' ? 'Aware' : 'Unknown';
  return { stage, leadState, missing, tool, action, why, question, terminal, stop,
    paused: doc.status === 'deferred' || ['not_now', 'delayed_decision'].includes(doc.observation) || (doc.observation === 'no_reply' && followUps >= 5),
    followUpLevel: ['REMIND', 'CLARIFY', 'REINFORCE', 'DIAGNOSE', 'DECIDE', 'RE-ENTER'][Math.min(followUps, 5)],
    known: [doc.evidence.trim() && `Bukti: ${doc.evidence}`, doc.observation !== 'unknown' && `Pemerhatian: ${OBSERVATION_LABELS[doc.observation]}`, ...DIMENSIONS.filter(d => doc.signals[d].status !== 'unknown' && doc.signals[d].note.trim()).map(d => `${d} (${doc.signals[d].status}): ${doc.signals[d].note}`)].filter(Boolean) as string[],
    inferred: terminal || stop ? [] : [`Peringkat ${stage} ialah cadangan operasi berdasarkan maklumat yang direkodkan, bukan kepastian tentang niat pembeli.`],
  };
}

export function recordAction(doc: CaseDocument, note: string, tool: string, at = new Date().toISOString()): CaseDocument {
  const diagnosis = diagnoseCase(doc);
  if ((diagnosis.terminal && doc.status !== 'closed') || diagnosis.stop || diagnosis.paused) throw new Error('Buka semula case dengan sebab yang relevan sebelum merekod tindakan baharu.');
  if (pendingAction(doc)) throw new Error('Rekod hasil tindakan terdahulu dahulu.');
  if (!note.trim()) throw new Error('Nyatakan tindakan yang benar-benar dilakukan.');
  return { ...doc, history: [...doc.history, { id: crypto.randomUUID(), kind: 'action', at, note: note.trim(), tool, evidenceSnapshot: doc.evidence }] };
}

export function recordOutcome(doc: CaseDocument, outcome: Observation, note: string, dueAt: string | null, at = new Date().toISOString()): CaseDocument {
  const action = pendingAction(doc);
  if (!action) throw new Error('Rekod tindakan dahulu sebelum merekod hasil.');
  if (!OUTCOMES.includes(outcome) || !note.trim()) throw new Error('Pilih hasil dan sertakan bukti sebenar.');
  if (doc.status === 'closed' && !['replied', 'needs_clarification', 'follow_up_required', 'resolved', 'other'].includes(outcome)) throw new Error('Rekod hasil pelanggan selepas jualan; bina case baharu untuk peluang jualan seterusnya.');
  if (dueAt && !Number.isFinite(Date.parse(dueAt))) throw new Error('Tarikh susulan tidak sah.');
  const status: CaseStatus = doc.status === 'closed' || outcome === 'closed' ? 'closed' : ['lost', 'no'].includes(outcome) ? 'lost' : outcome === 'resolved' ? 'resolved' : ['delayed_decision', 'not_now'].includes(outcome) ? 'deferred' : 'active';
  const value = { ...doc, observation: outcome, status, dueAt: status === 'closed' || status === 'lost' ? null : dueAt,
    stageOverride: null, stageReason: '', evidence: note.trim(),
    history: [...doc.history, { id: crypto.randomUUID(), kind: 'outcome' as const, at, note: note.trim(), actionId: action.id, outcome }] };
  if (outcome === 'replied' || outcome === 'interested') value.signals = { ...doc.signals, Engagement: { status: 'confirmed', note: note.trim() } };
  return value;
}

export function reopenCase(doc: CaseDocument, note: string): CaseDocument {
  if (pendingAction(doc)) throw new Error('Rekod hasil tindakan terdahulu dahulu.');
  if (doc.status === 'closed') throw new Error('Bina case baharu untuk peluang jualan seterusnya.');
  if (!note.trim()) throw new Error('Nyatakan sebab baharu yang relevan atau persetujuan pembeli.');
  return { ...doc, status: 'active', observation: 'unknown', dueAt: null, stageOverride: null, stageReason: '',
    history: [...doc.history, { id: crypto.randomUUID(), kind: 'reopen', at: new Date().toISOString(), note: note.trim() }] };
}

export function casePriority(value: SalesCase, now = Date.now()) {
  const d = diagnoseCase(value.document);
  if (pendingAction(value.document)) return { rank: 1, label: 'Hasil tindakan belum direkod' };
  if (d.terminal || d.stop) return { rank: 9, label: 'Selesai / ditutup' };
  if (value.document.dueAt && Date.parse(value.document.dueAt) <= now) return { rank: 0, label: 'Susulan perlu disemak' };
  if (['objection', 'price_objection'].includes(value.document.observation)) return { rank: 2, label: 'Bantahan belum dijelaskan' };
  if (d.paused) return { rank: 7, label: 'Ditangguhkan / berhenti sementara' };
  return { rank: d.missing.length ? 3 : 4, label: d.missing.length ? 'Kelayakan belum lengkap' : 'Langkah seterusnya tersedia' };
}

export function isCaseDocument(value: unknown): value is CaseDocument {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const v = value as CaseDocument;
  if (v.version !== 1 || typeof v.title !== 'string' || !v.title.trim() || v.title.length > 160 || typeof v.situation !== 'string' || !v.situation.trim()) return false;
  if (['situation', 'evidence', 'channel', 'stageReason'].some(k => typeof (v as unknown as Record<string, unknown>)[k] !== 'string' || String((v as unknown as Record<string, unknown>)[k]).length > 12000)) return false;
  if (!OBSERVATIONS.includes(v.observation) || !['active', 'deferred', 'closed', 'lost', 'resolved'].includes(v.status) || typeof v.example !== 'boolean') return false;
  if (v.observation !== 'unknown' && !v.evidence.trim()) return false;
  if (v.dueAt !== null && (typeof v.dueAt !== 'string' || !Number.isFinite(Date.parse(v.dueAt)))) return false;
  if (v.stageOverride !== null && (!BROS_STAGES.includes(v.stageOverride) || !v.stageReason.trim())) return false;
  if (!v.facts || typeof v.facts !== 'object' || Array.isArray(v.facts) || Object.entries(v.facts).some(([key, text]) => !FACT_KEYS.includes(key as FactKey) || typeof text !== 'string' || text.length > 12000)) return false;
  if (!v.signals || DIMENSIONS.some(d => !v.signals[d] || !['unknown', 'confirmed', 'no'].includes(v.signals[d].status) || typeof v.signals[d].note !== 'string' || v.signals[d].note.length > 12000 || (v.signals[d].status !== 'unknown' && !v.signals[d].note.trim()))) return false;
  if (!validToolData(v.tools) || !Array.isArray(v.history) || v.history.length > 1000) return false;
  const ids = new Set<string>();
  let outstanding: string | null = null;
  for (const event of v.history) {
    if (!event || typeof event.id !== 'string' || ids.has(event.id) || !['action', 'outcome', 'reopen'].includes(event.kind) || typeof event.note !== 'string' || !event.note.trim() || event.note.length > 12000 || typeof event.at !== 'string' || !Number.isFinite(Date.parse(event.at))) return false;
    ids.add(event.id);
    if (event.evidenceSnapshot !== undefined && (typeof event.evidenceSnapshot !== 'string' || event.evidenceSnapshot.length > 12000)) return false;
    if (event.kind === 'action') { if (outstanding || typeof event.tool !== 'string') return false; outstanding = event.id; }
    if (event.kind === 'outcome') { if (!event.outcome || !OUTCOMES.includes(event.outcome) || event.actionId !== outstanding) return false; outstanding = null; }
    if (event.kind === 'reopen' && outstanding) return false;
  }
  return JSON.stringify(v).length <= 200000;
}
