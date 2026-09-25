"use client";

import { useEffect, useMemo, useState } from "react";

type Stage =
  | "TARGET" | "BUYER" | "OFFER" | "LEAD" | "QUALIFY"
  | "VALUE" | "CLOSE" | "FOLLOW-UP" | "MULTIPLY" | "OPERATE";

type Dimension = "Relevance" | "Need" | "Readiness" | "Fit" | "Access" | "Engagement";
type SignalStatus = "Signal" | "Gap / Unknown";

type CaseState = {
  situation: string;
  evidence: string;
  channel: string;
  leadState: string;
  leadSource: string;
  stage: Stage;
  missingDimension: Dimension;
  refined: boolean;
  actionType: string;
  timing: string;
  actionDone: boolean;
  outcome: string;
  createdAt: string;
};

const stages: Stage[] = [
  "TARGET","BUYER","OFFER","LEAD","QUALIFY",
  "VALUE","CLOSE","FOLLOW-UP","MULTIPLY","OPERATE"
];

const resourceMap: Record<Stage, { chapter: string; asset: string; file: string }> = {
  TARGET: { chapter: "Chapters 2–3", asset: "Sales Target Calculator + Operator Dashboard", file: "BROS_SELL_ASSET_01_Sales_Target_Calculator_Operator_Dashboard.xlsx" },
  BUYER: { chapter: "Chapters 4–6", asset: "Buyer Intelligence Canvas + BROS 5Q Worksheet", file: "BROS_SELL_ASSET_03_Buyer_Intelligence_Canvas.xlsx + BROS_SELL_ASSET_04_BROS_5Q_Worksheet.xlsx" },
  OFFER: { chapter: "Chapters 7–9", asset: "Offer Stack Builder", file: "BROS_SELL_ASSET_05_Offer_Stack_Builder.xlsx" },
  LEAD: { chapter: "Chapters 10–12", asset: "Lead State Classifier", file: "BROS_SELL_ASSET_07_Lead_State_Classifier.xlsx" },
  QUALIFY: { chapter: "Chapters 13–15", asset: "BROS 5Q Worksheet + qualification workflow", file: "BROS_SELL_ASSET_04_BROS_5Q_Worksheet.xlsx" },
  VALUE: { chapter: "Chapters 16–18", asset: "Value Bridge Worksheet", file: "BROS_SELL_ASSET_06_Value_Bridge_Worksheet.xlsx" },
  CLOSE: { chapter: "Chapters 19–21", asset: "Close Path Decision Tree + Objection Playbook", file: "BROS_SELL_ASSET_08_Close_Path_Decision_Tree.xlsx + BROS_SELL_ASSET_09_Objection_Playbook.xlsx" },
  "FOLLOW-UP": { chapter: "Chapters 22–24", asset: "Follow-Up Ladder", file: "BROS_SELL_ASSET_11_Follow_Up_Ladder_Library.xlsx" },
  MULTIPLY: { chapter: "Chapters 31–33", asset: "Customer Multiplication Planner", file: "BROS_SELL_ASSET_12_Customer_Multiplication_Planner.xlsx" },
  OPERATE: { chapter: "Chapters 34–36", asset: "30-Day Implementation Tracker + Operator Dashboard", file: "BROS_SELL_ASSET_13_30-Day_Implementation_Tracker.xlsx + BROS_SELL_ASSET_01_Sales_Target_Calculator_Operator_Dashboard.xlsx" },
};

const rules: Record<Stage, { keywords: string[]; diagnosis: string; action: string; question: string; recommendedAction: string }> = {
  TARGET: {
    keywords: ["target", "audience", "sasaran", "orang yang betul", "customer mana", "siapa nak jual"],
    diagnosis: "Semak sama ada masalah bermula sebelum conversation — seller mungkin belum cukup jelas tentang siapa yang patut dilayan.",
    action: "Nyatakan buyer yang paling relevan untuk situasi ini dan siapa yang patut ditapis keluar.",
    question: "Siapa yang paling relevan untuk offer ini, dan apa yang menjadikan mereka sesuai?",
    recommendedAction: "Qualify"
  },
  BUYER: {
    keywords: ["buyer", "faham customer", "keperluan", "masalah customer", "nak apa", "need"],
    diagnosis: "Isu mungkin berkait dengan pemahaman buyer: konteks, masalah atau outcome yang mereka cari belum cukup jelas.",
    action: "Kenal pasti konteks buyer, masalah utama dan outcome yang mereka mahu sebelum menerangkan offer.",
    question: "Apa yang buyer cuba selesaikan, dan apa outcome yang mereka mahu?",
    recommendedAction: "Clarify"
  },
  OFFER: {
    keywords: ["offer", "pakej", "package", "quotation", "sebut harga", "scope", "harga"],
    diagnosis: "Isu mungkin berada pada kejelasan offer — buyer mungkin belum nampak dengan tepat apa yang ditawarkan dan untuk siapa ia sesuai.",
    action: "Perjelas scope, deliverable dan fit offer sebelum cuba mengatasi bantahan harga.",
    question: "Adakah buyer jelas apa yang mereka dapat, untuk situasi apa, dan apa yang tidak termasuk?",
    recommendedAction: "Clarify"
  },
  LEAD: {
    keywords: ["enquiry", "inquiry", "lead", "tanya", "masuk whatsapp", "prospek"],
    diagnosis: "Enquiry belum semestinya peluang yang sama nilainya. Lead state perlu dikenal pasti sebelum proses diteruskan.",
    action: "Klasifikasikan lead sebagai Aware, Engaged, Qualified, Active atau Decision berdasarkan bukti yang ada.",
    question: "Apa signal yang menunjukkan lead ini sedang berada pada state yang mana?",
    recommendedAction: "Qualify"
  },
  QUALIFY: {
    keywords: ["serius", "sesuai", "bajet", "budget", "fit", "layak", "qualified", "qualify"],
    diagnosis: "Masalah mungkin bukan kekurangan leads tetapi kekurangan maklumat untuk menentukan fit dan readiness.",
    action: "Semak Relevance, Need, Readiness, Fit, Access dan Engagement. Jangan terus mengejar sebelum gap maklumat jelas.",
    question: "Apa yang masih belum diketahui untuk menentukan sama ada prospect ini patut diteruskan?",
    recommendedAction: "Qualify"
  },
  VALUE: {
    keywords: ["mahal", "murah", "nilai", "worth", "benefit", "hasil", "result", "value"],
    diagnosis: "Buyer mungkin melihat harga sebelum cukup jelas tentang nilai, outcome atau kaitannya dengan masalah mereka.",
    action: "Sambungkan offer kepada konteks, masalah dan outcome buyer. Jangan sekadar menambah hujah.",
    question: "Adakah buyer nampak hubungan antara masalah mereka, outcome yang dicari dan offer?",
    recommendedAction: "Explain Value"
  },
  CLOSE: {
    keywords: ["confirm", "booking", "book", "beli", "proceed", "bayar", "payment", "close"],
    diagnosis: "Decision path mungkin belum cukup jelas walaupun buyer sudah mempunyai maklumat yang diperlukan.",
    action: "Nyatakan next step yang spesifik supaya buyer tahu apa yang perlu dibuat untuk meneruskan keputusan.",
    question: "Apakah satu next step yang jelas dan munasabah untuk buyer sekarang?",
    recommendedAction: "Close"
  },
  "FOLLOW-UP": {
    keywords: ["senyap", "tak reply", "tak balas", "follow up", "follow-up", "ghost", "diam"],
    diagnosis: "Follow-up mungkin sedang menjadi aktiviti mengejar, bukan proses yang mempunyai sebab, timing dan structure.",
    action: "Tentukan sebab follow-up, timing yang sesuai dan maklumat baharu atau keputusan yang perlu dijelaskan.",
    question: "Kenapa follow-up ini perlu dibuat sekarang, dan apa yang berubah atau perlu dijelaskan?",
    recommendedAction: "Follow Up"
  },
  MULTIPLY: {
    keywords: ["ulang", "repeat", "referral", "rujuk", "boleh ulang", "repeatable"],
    diagnosis: "Apa yang berjaya mungkin belum diterjemahkan menjadi behaviour atau proses yang boleh diulang.",
    action: "Dokumentasikan pattern yang berjaya dan tentukan apa yang perlu dibuat secara konsisten.",
    question: "Apa yang berlaku dalam sale yang berjaya ini yang boleh diulang tanpa bergantung pada improvisasi?",
    recommendedAction: "Clarify"
  },
  OPERATE: {
    keywords: ["sistem", "process", "proses", "team", "konsisten", "consistent", "dashboard", "operate"],
    diagnosis: "Masalah mungkin sudah berada pada tahap operasi: proses perlu dipantau dan diperbaiki sebagai satu sistem.",
    action: "Tetapkan process, owner, signal dan ukuran yang boleh digunakan untuk memantau prestasi.",
    question: "Apa yang perlu dipantau supaya proses ini boleh beroperasi secara konsisten?",
    recommendedAction: "Stop & Reassess"
  }
};

const stateOptions = ["Aware", "Engaged", "Qualified", "Active", "Decision"];
const actionOptions = ["Clarify", "Qualify", "Explain Value", "Close", "Follow Up", "Stop & Reassess"];
const timingOptions = ["Now", "Today", "24 hours", "2–3 days", "Later"];
const outcomeOptions = ["No response", "Replied", "Qualified", "Offer sent", "Closed", "Not fit", "Other"];

const channelOptions = [
  "WhatsApp", "Phone", "Instagram DM", "Facebook Messenger", "TikTok DM",
  "Marketplace Chat", "Email", "Website / Form", "In-person", "SMS", "Other"
];

const leadSourceOptions = [
  "Unknown", "Organic Social", "Paid Ads", "Search / Google", "Referral",
  "Existing Customer", "Marketplace", "Website / Form", "Walk-in",
  "Outbound", "Networking / Event", "Other"
];

const dimensionRules: Record<Dimension, string[]> = {
  Relevance: ["sesuai", "relevan", "target", "sasaran", "buyer", "siapa", "fit"],
  Need: ["perlu", "masalah", "problem", "need", "perlukan", "sakit", "outcome", "keperluan"],
  Readiness: ["serius", "sekarang", "bila", "proceed", "confirm", "booking", "bayar", "decision", "nak beli"],
  Fit: ["sesuai", "bajet", "budget", "scope", "package", "pakej", "fit"],
  Access: ["owner", "decision maker", "bos", "pengurus", "approval", "approve", "team"],
  Engagement: ["reply", "balas", "tanya", "respond", "engaged", "follow up", "follow-up", "meeting", "call", "senyap", "diam"],
};

const diagnosticQuestions: Record<Dimension, string> = {
  Relevance: "Siapa buyer ini, dan apa yang menjadikan situasi atau offer ini relevan kepada mereka?",
  Need: "Masalah atau keperluan apa yang buyer sendiri nyatakan atau tunjukkan?",
  Readiness: "Apakah signal bahawa buyer mahu membuat keputusan sekarang, kemudian, atau belum bersedia?",
  Fit: "Adakah offer, scope dan bajet sesuai dengan situasi buyer?",
  Access: "Adakah orang yang kita sedang berurusan mempunyai kuasa atau akses untuk membuat keputusan?",
  Engagement: "Apakah tindakan atau respons terakhir buyer yang menunjukkan tahap engagement mereka?"
};

function containsAny(text: string, phrases: string[]) {
  const normalized = text.toLowerCase();
  return phrases.some((phrase) => normalized.includes(phrase));
}

function scoreStage(text: string, stage: Stage, leadState: string, channel: string, leadSource: string) {
  const normalized = text.toLowerCase();
  let score = rules[stage].keywords.reduce((total, keyword) => total + (normalized.includes(keyword) ? 1 : 0), 0);

  const highSignalWeights: Partial<Record<Stage, { phrases: string[]; weight: number }[]>> = {
    "FOLLOW-UP": [{ phrases: ["tak reply", "tak balas", "senyap", "ghost", "diam"], weight: 4 }],
    OFFER: [{ phrases: ["harga", "quotation", "sebut harga", "pakej", "package", "scope"], weight: 2 }],
    LEAD: [{ phrases: ["tanya", "enquiry", "inquiry", "masuk whatsapp", "prospek"], weight: 2 }],
  };

  for (const signal of highSignalWeights[stage] ?? []) {
    if (containsAny(normalized, signal.phrases)) score += signal.weight;
  }

  const stateWeights: Record<string, Partial<Record<Stage, number>>> = {
    Aware: { TARGET: 2, BUYER: 1, LEAD: 2 },
    Engaged: { BUYER: 1, LEAD: 2, QUALIFY: 2 },
    Qualified: { QUALIFY: 2, VALUE: 2, CLOSE: 1 },
    Active: { VALUE: 1, CLOSE: 2, "FOLLOW-UP": 1 },
    Decision: { CLOSE: 3, "FOLLOW-UP": 2 },
  };

  score += stateWeights[leadState]?.[stage] ?? 0;

  if (channel === "Marketplace Chat" && stage === "LEAD") score += 1;
  if (channel === "Phone" && stage === "CLOSE") score += 1;
  if (channel === "WhatsApp" && stage === "FOLLOW-UP") score += 1;
  if (leadSource === "Referral" && stage === "BUYER") score += 1;
  if (leadSource === "Paid Ads" && stage === "QUALIFY") score += 1;

  return score;
}

function diagnoseDimensions(text: string, leadState: string): { dimension: Dimension; status: SignalStatus }[] {
  const normalized = text.toLowerCase();

  return (Object.keys(dimensionRules) as Dimension[]).map((dimension) => {
    const signal = dimensionRules[dimension].some((keyword) => normalized.includes(keyword));
    const stateSignal =
      (dimension === "Engagement" && leadState !== "Unknown") ||
      (dimension === "Readiness" && ["Qualified", "Active", "Decision"].includes(leadState)) ||
      (dimension === "Relevance" && ["Aware", "Engaged", "Qualified", "Active", "Decision"].includes(leadState));

    return { dimension, status: signal || stateSignal ? "Signal" : "Gap / Unknown" };
  });
}

function outcomeRoute(outcome: string): { stage: Stage; action: string; message: string } {
  switch (outcome) {
    case "No response":
      return { stage: "FOLLOW-UP", action: "Follow Up", message: "Tiada respons baharu. Jangan ulang mesej secara automatik; semak sebab, timing dan apa yang patut berubah." };
    case "Replied":
      return { stage: "QUALIFY", action: "Qualify", message: "Ada signal baharu. Gunakan respons sebenar untuk mengemas kini Need, Readiness, Fit dan Engagement." };
    case "Qualified":
      return { stage: "VALUE", action: "Explain Value", message: "Prospek kini lebih jelas dari segi fit. Sambungkan masalah dan outcome kepada offer." };
    case "Offer sent":
      return { stage: "CLOSE", action: "Close", message: "Offer sudah dihantar. Semak decision path, barrier dan next step yang jelas." };
    case "Closed":
      return { stage: "MULTIPLY", action: "Clarify", message: "Sale berlaku. Cari pattern, proof, repeat atau referral yang benar-benar relevan." };
    case "Not fit":
      return { stage: "TARGET", action: "Stop & Reassess", message: "Jangan paksa conversion. Gunakan hasil ini untuk memperbaiki targeting atau qualification." };
    default:
      return { stage: "OPERATE", action: "Stop & Reassess", message: "Maklumat belum cukup untuk routing seterusnya. Rekod apa yang berubah dan semak semula situasi." };
  }
}

function channelGuidance(channel: string, action: string) {
  if (action === "Follow Up") {
    if (channel === "Phone") return "Phone: follow-up patut mempunyai tujuan dan next step, bukan sekadar bertanya status.";
    if (channel === "Marketplace Chat") return "Marketplace: kekalkan follow-up ringkas dan terus kepada keputusan atau maklumat yang masih diperlukan.";
    return `${channel}: gunakan satu sebab yang jelas untuk follow-up dan elakkan mesej berulang tanpa maklumat baharu.`;
  }
  if (action === "Close") {
    if (channel === "Phone" || channel === "In-person") return `${channel}: sahkan keputusan, next step dan siapa yang perlu bertindak.`;
    return `${channel}: jadikan next step mudah difahami dan boleh dilakukan tanpa ambiguity.`;
  }
  return `${channel}: pilih tindakan yang sesuai dengan cara buyer sedang berinteraksi, bukan sekadar ikut script.`;
}

export default function SituationAnalyzer() {
  const [situation, setSituation] = useState("");
  const [evidence, setEvidence] = useState("");
  const [channel, setChannel] = useState("WhatsApp");
  const [leadState, setLeadState] = useState("Unknown");
  const [leadSource, setLeadSource] = useState("Unknown");
  const [analyzed, setAnalyzed] = useState(false);
  const [refined, setRefined] = useState(false);
  const [actionType, setActionType] = useState("Clarify");
  const [timing, setTiming] = useState("Now");
  const [actionDone, setActionDone] = useState(false);
  const [outcome, setOutcome] = useState("");
  const [nextRoute, setNextRoute] = useState<{ stage: Stage; action: string; message: string } | null>(null);
  const [savedCase, setSavedCase] = useState<CaseState | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("bros_sell_current_case");
      if (raw) setSavedCase(JSON.parse(raw) as CaseState);
    } catch {}
  }, []);

  const combinedEvidence = `${situation} ${evidence}`;

  const ranked = useMemo(() => {
    if (!situation.trim()) return [];
    return stages
      .map((stage) => ({ stage, score: scoreStage(combinedEvidence, stage, leadState, channel, leadSource) }))
      .sort((a, b) => b.score - a.score);
  }, [situation, evidence, leadState, channel, leadSource]);

  const primary = ranked[0]?.stage ?? "LEAD";
  const result = rules[primary];

  const dimensions = useMemo(
    () => diagnoseDimensions(combinedEvidence, leadState),
    [combinedEvidence, leadState]
  );

  const missingDimension = dimensions.find((item) => item.status === "Gap / Unknown")?.dimension ?? "Readiness";
  const refinedAction = refined
    ? ({
        Relevance: "Pastikan buyer yang sedang dilayan benar-benar sepadan dengan offer sebelum meneruskan.",
        Need: "Kembalikan conversation kepada masalah atau outcome buyer sebelum menambah penerangan tentang produk.",
        Readiness: "Tentukan timing keputusan dan next step yang realistik. Jangan menganggap silence sebagai rejection.",
        Fit: "Semak fit antara buyer, scope, offer dan bajet sebelum cuba memujuk atau memberi diskaun.",
        Access: "Kenal pasti siapa yang membuat keputusan dan apa yang diperlukan untuk membawa decision-maker masuk.",
        Engagement: "Gunakan respons terakhir sebagai signal untuk menentukan follow-up seterusnya, bukan sekadar menghantar mesej berulang."
      } as Record<Dimension, string>)[missingDimension]
    : result.action;

  const recommendedAction = refined ? ({
    Relevance: "Qualify", Need: "Clarify", Readiness: "Follow Up",
    Fit: "Qualify", Access: "Qualify", Engagement: "Follow Up"
  } as Record<Dimension, string>)[missingDimension] : result.recommendedAction;

  const caseState: CaseState = {
    situation, evidence, channel, leadState, leadSource, stage: primary,
    missingDimension, refined, actionType, timing, actionDone, outcome,
    createdAt: new Date().toISOString()
  };

  function saveCase(overrides: Partial<CaseState> = {}) {
    try {
      const nextCase = { ...caseState, ...overrides, createdAt: new Date().toISOString() };
      window.localStorage.setItem("bros_sell_current_case", JSON.stringify(nextCase));
      setSavedCase(nextCase);
    } catch {}
  }

  function resetExecution() {
    setActionDone(false);
    setOutcome("");
    setNextRoute(null);
  }

  function analyze(event: React.FormEvent) {
    event.preventDefault();
    if (!situation.trim()) return;
    setAnalyzed(true);
    setRefined(false);
    setEvidence("");
    resetExecution();
    saveCase({ refined: false, evidence: "", outcome: "", actionDone: false });
  }

  function refine(event: React.FormEvent) {
    event.preventDefault();
    if (!evidence.trim()) return;
    setRefined(true);
    resetExecution();
    saveCase({ refined: true, evidence, outcome: "", actionDone: false });
  }

  function markActionDone() {
    setActionDone(true);
    saveCase({ actionDone: true });
  }

  function handleOutcome(value: string) {
    setOutcome(value);
    saveCase({ outcome: value, actionDone: true });
    if (value) setNextRoute(outcomeRoute(value));
  }

  function loadSavedCase() {
    if (!savedCase) return;
    setSituation(savedCase.situation);
    setEvidence(savedCase.evidence);
    setChannel(savedCase.channel);
    setLeadState(savedCase.leadState);
    setLeadSource(savedCase.leadSource);
    setAnalyzed(true);
    setRefined(savedCase.refined);
    setActionType(savedCase.actionType);
    setTiming(savedCase.timing);
    setActionDone(savedCase.actionDone);
    setOutcome(savedCase.outcome);
    setNextRoute(savedCase.outcome ? outcomeRoute(savedCase.outcome) : null);
  }

  function clearCase() {
    window.localStorage.removeItem("bros_sell_current_case");
    setSavedCase(null);
    setSituation("");
    setEvidence("");
    setAnalyzed(false);
    setRefined(false);
    resetExecution();
  }

  const actionMismatch = actionType !== recommendedAction;
  const routingBasis = [
    `stage: ${primary}`,
    `lead state: ${leadState}`,
    `channel: ${channel}`,
    `source: ${leadSource}`,
    `missing: ${missingDimension}`
  ].join(" · ");

  return (
    <section className="analyzer">
      {savedCase && !analyzed && (
        <div className="card case-resume">
          <div>
            <div className="eyebrow">CURRENT CASE</div>
            <strong>{savedCase.stage} · {savedCase.actionType}</strong>
            <p className="muted">{savedCase.situation}</p>
          </div>
          <div className="case-actions">
            <button className="btn" type="button" onClick={loadSavedCase}>Continue Case</button>
            <button className="btn secondary" type="button" onClick={clearCase}>Start New</button>
          </div>
        </div>
      )}

      <div className="analyzer-grid">
        <div className="card analyzer-input">
          <div className="eyebrow">WORKFLOW 01</div>
          <h2>Situasi Jualan</h2>
          <p className="muted">Mulakan dengan apa yang berlaku. Jangan mulakan dengan diagnosis anda sendiri.</p>

          <form onSubmit={analyze} style={{display:"grid",gap:14}}>
            <label className="field-label">
              <span>What happened?</span>
              <textarea
                className="input textarea"
                value={situation}
                onChange={(e) => { setSituation(e.target.value); setAnalyzed(false); }}
                placeholder="Contoh: Customer tanya harga RM300. Saya bagi harga, lepas tu dia tak reply."
                rows={5}
              />
            </label>

            <p className="field-note">
              Evidence = apa buyer sebenar cakap atau buat. Assumption seperti “dia tak reply sebab mahal” perlu dibuktikan dahulu.
            </p>

            <div className="form-grid">
              <label><span>Interaction Channel</span><select className="input" value={channel} onChange={(e) => setChannel(e.target.value)}>{channelOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
              <label><span>Lead State</span><select className="input" value={leadState} onChange={(e) => setLeadState(e.target.value)}><option>Unknown</option>{stateOptions.map((state) => <option key={state}>{state}</option>)}</select></label>
              <label><span>Lead Source</span><select className="input" value={leadSource} onChange={(e) => setLeadSource(e.target.value)}>{leadSourceOptions.map((source) => <option key={source}>{source}</option>)}</select></label>
            </div>

            <button className="btn" type="submit" disabled={!situation.trim()}>Diagnose Situation</button>
          </form>
        </div>

        <div className="card analyzer-result">
          <div className="eyebrow">DIAGNOSIS LOOP</div>
          {!analyzed ? (
            <>
              <h2>Context → Evidence → Diagnosis → Action → Outcome</h2>
              <p className="muted">Web OS tidak menganggap anda sudah tahu puncanya. Ia mencari maklumat yang masih diperlukan sebelum tindakan.</p>
              <div className="decision-flow">
                <span>context</span><b>→</b><span>evidence</span><b>→</b><span>missing info</span><b>→</b><span>decision</span><b>→</b><span>outcome</span>
              </div>
            </>
          ) : (
            <>
              <div className="result-stage">{primary}</div>
              <p>{result.diagnosis}</p>

              <div className="result-block">
                <small className="muted">INITIAL NEXT ACTION</small>
                <strong>{result.action}</strong>
              </div>

              <div className="result-block">
                <small className="muted">EVIDENCE CHECK</small>
                <strong>Apakah buyer sebenar cakap atau buat yang menyokong diagnosis ini?</strong>
                <textarea
                  className="input textarea compact"
                  value={evidence}
                  onChange={(e) => setEvidence(e.target.value)}
                  placeholder="Contoh: Buyer jawab “Saya tengah compare 2 seller lain.”"
                  rows={4}
                />
                <p className="field-note">Jika anda belum tahu, tulis “belum tahu”. Sistem akan treat perkara itu sebagai Gap / Unknown.</p>
                <button className="btn" type="button" disabled={!evidence.trim()} onClick={() => { setRefined(true); resetExecution(); saveCase({ refined: true, evidence, outcome: "", actionDone: false }); }}>
                  Refine Diagnosis
                </button>
              </div>

              <div className="result-block">
                <small className="muted">ROUTED RESOURCE</small>
                <strong>{resourceMap[primary].asset}</strong>
                <p className="field-note">{resourceMap[primary].chapter} · Customer Package → 04_TOOLKIT → {resourceMap[primary].file}</p>
                <p className="field-note">Path C — EXECUTE: gunakan asset pada situasi sebenar, kemudian kembali ke Web OS untuk outcome.</p>
              </div>

              {refined && (
                <>
                  <div className="result-block refined">
                    <small className="muted">REFINED NEXT ACTION</small>
                    <strong>{refinedAction}</strong>
                    <p className="field-note">Diagnosis ini menggunakan evidence tambahan. Jika evidence bercanggah dengan andaian awal, ikut evidence.</p>
                  </div>

                  <div className="result-block">
                    <small className="muted">ACTION EXECUTION</small>
                    <strong>Recommended action: {recommendedAction}</strong>
                    <div className="form-grid execution-grid">
                      <label><span>Action Type</span><select className="input" value={actionType} onChange={(e) => { setActionType(e.target.value); setActionDone(false); setOutcome(""); setNextRoute(null); }}>{actionOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
                      <label><span>Timing</span><select className="input" value={timing} onChange={(e) => { setTiming(e.target.value); setActionDone(false); setOutcome(""); setNextRoute(null); }}>{timingOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
                    </div>

                    {actionMismatch && (
                      <div className="decision-warning">
                        <strong>You selected {actionType}, but the current diagnosis recommends {recommendedAction}.</strong>
                        <span>Proceeding is allowed. The difference is shown so the seller can make the decision consciously.</span>
                      </div>
                    )}

                    <p className="field-note">{channelGuidance(channel, actionType)}</p>
                    <button className="btn" type="button" onClick={markActionDone}>{actionDone ? "Action Marked Done" : "Mark Action Done"}</button>

                    {actionDone && (
                      <div className="execution-outcome">
                        <label>
                          <span>Observed outcome</span>
                          <select className="input" value={outcome} onChange={(e) => handleOutcome(e.target.value)}>
                            <option value="">Pilih outcome selepas tindakan...</option>
                            {outcomeOptions.map((option) => <option key={option}>{option}</option>)}
                          </select>
                        </label>
                        <p className="field-note">Outcome ialah evidence baharu. Ia menentukan routing seterusnya; ia bukan sekadar log aktiviti.</p>
                      </div>
                    )}
                  </div>

                  {nextRoute && (
                    <div className="result-block next-route">
                      <small className="muted">NEXT DIAGNOSIS ROUTE</small>
                      <div className="result-stage">{nextRoute.stage}</div>
                      <strong>{nextRoute.message}</strong>
                      <p className="field-note">Suggested action: {nextRoute.action}. Gunakan outcome ini sebagai evidence baharu sebelum membuat keputusan seterusnya.</p>
                    </div>
                  )}
                </>
              )}

              <div className="result-block">
                <small className="muted">ROUTING BASIS</small>
                <strong>{routingBasis}</strong>
                <p className="field-note">Stage ialah cadangan berdasarkan signal, bukan keputusan muktamad. “Gap / Unknown” bermaksud maklumat belum cukup.</p>
              </div>

              <div className="result-block">
                <small className="muted">LEAD QUALITY LENS</small>
                <div className="dimension-grid">
                  {dimensions.map(({ dimension, status }) => (
                    <div key={dimension} className={status === "Signal" ? "dimension signal" : "dimension"}>
                      <span>{dimension}</span><small>{status}</small>
                    </div>
                  ))}
                </div>
              </div>

              <div className="meta-row">
                <span>Channel: <b>{channel}</b></span>
                <span>Lead State: <b>{leadState}</b></span>
                <span>Lead Source: <b>{leadSource}</b></span>
              </div>

              <p className="disclaimer">Web OS membantu menjelaskan keputusan; ia tidak menjamin sales, revenue atau conversion. Semak konteks sebenar sebelum bertindak.</p>
            </>
          )}
        </div>
      </div>

      {analyzed && (
        <div className="card stage-map">
          <div>
            <div className="eyebrow">OS ROUTING</div>
            <h2>Current system position</h2>
          </div>
          <div className="stage mini">
            {stages.map((stage, index) => (
              <div key={stage} className={stage === primary ? "active-stage" : ""}>
                <small className="muted">{String(index + 1).padStart(2, "0")}</small>
                <div>{stage}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
