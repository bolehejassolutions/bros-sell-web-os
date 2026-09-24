"use client";

import { useMemo, useState } from "react";

type Stage =
  | "TARGET" | "BUYER" | "OFFER" | "LEAD" | "QUALIFY"
  | "VALUE" | "CLOSE" | "FOLLOW-UP" | "MULTIPLY" | "OPERATE";

const stages: Stage[] = [
  "TARGET","BUYER","OFFER","LEAD","QUALIFY",
  "VALUE","CLOSE","FOLLOW-UP","MULTIPLY","OPERATE"
];

const resourceMap: Record<Stage, { chapter: string; asset: string }> = {
  TARGET: { chapter: "Chapters 2–3", asset: "Sales Target Calculator + Operator Dashboard" },
  BUYER: { chapter: "Chapters 4–6", asset: "Buyer Intelligence Canvas + BROS 5Q Worksheet" },
  OFFER: { chapter: "Chapters 7–9", asset: "Offer Stack Builder" },
  LEAD: { chapter: "Chapters 10–12", asset: "Lead State Classifier + Dashboard" },
  QUALIFY: { chapter: "Chapters 13–15", asset: "Qualification workflow + qualification assets" },
  VALUE: { chapter: "Chapters 16–18", asset: "Value Bridge Worksheet" },
  CLOSE: { chapter: "Chapters 19–21", asset: "Close Path Decision Tree + Objection Playbook" },
  "FOLLOW-UP": { chapter: "Chapters 22–24", asset: "Follow-Up Ladder Library" },
  MULTIPLY: { chapter: "Chapters 31–33", asset: "Customer Multiplication Planner" },
  OPERATE: { chapter: "Chapters 34–36", asset: "Operator Dashboard + 30-Day Implementation Tracker" },
};

const rules: Record<Stage, { keywords: string[]; diagnosis: string; action: string; question: string }> = {
  TARGET: {
    keywords: ["target", "audience", "sasaran", "orang yang betul", "customer mana", "siapa nak jual"],
    diagnosis: "Semak sama ada masalah bermula sebelum conversation — seller mungkin belum cukup jelas tentang siapa yang patut dilayan.",
    action: "Nyatakan buyer yang paling relevan untuk situasi ini dan siapa yang patut ditapis keluar.",
    question: "Siapa yang paling relevan untuk offer ini, dan apa yang menjadikan mereka sesuai?"
  },
  BUYER: {
    keywords: ["buyer", "faham customer", "keperluan", "masalah customer", "nak apa", "need"],
    diagnosis: "Isu mungkin berkait dengan pemahaman buyer: konteks, masalah atau outcome yang mereka cari belum cukup jelas.",
    action: "Kenal pasti konteks buyer, masalah utama dan outcome yang mereka mahu sebelum menerangkan offer.",
    question: "Apa yang buyer cuba selesaikan, dan apa outcome yang mereka mahu?"
  },
  OFFER: {
    keywords: ["offer", "pakej", "package", "quotation", "sebut harga", "scope", "harga"],
    diagnosis: "Isu mungkin berada pada kejelasan offer — buyer mungkin belum nampak dengan tepat apa yang ditawarkan dan untuk siapa ia sesuai.",
    action: "Perjelas scope, deliverable dan fit offer sebelum cuba mengatasi bantahan harga.",
    question: "Adakah buyer jelas apa yang mereka dapat, untuk situasi apa, dan apa yang tidak termasuk?"
  },
  LEAD: {
    keywords: ["enquiry", "inquiry", "lead", "tanya", "masuk whatsapp", "prospek"],
    diagnosis: "Enquiry belum semestinya peluang yang sama nilainya. Lead state perlu dikenal pasti sebelum proses diteruskan.",
    action: "Klasifikasikan lead sebagai Aware, Engaged, Qualified, Active atau Decision berdasarkan bukti yang ada.",
    question: "Apa signal yang menunjukkan lead ini sedang berada pada state yang mana?"
  },
  QUALIFY: {
    keywords: ["serius", "sesuai", "bajet", "budget", "fit", "layak", "qualified", "qualify"],
    diagnosis: "Masalah mungkin bukan kekurangan leads tetapi kekurangan maklumat untuk menentukan fit dan readiness.",
    action: "Semak Relevance, Need, Readiness, Fit, Access dan Engagement. Jangan terus mengejar sebelum gap maklumat jelas.",
    question: "Apa yang masih belum diketahui untuk menentukan sama ada prospect ini patut diteruskan?"
  },
  VALUE: {
    keywords: ["mahal", "murah", "nilai", "worth", "benefit", "hasil", "result", "value"],
    diagnosis: "Buyer mungkin melihat harga sebelum cukup jelas tentang nilai, outcome atau kaitannya dengan masalah mereka.",
    action: "Sambungkan offer kepada konteks, masalah dan outcome buyer. Jangan sekadar menambah hujah.",
    question: "Adakah buyer nampak hubungan antara masalah mereka, outcome yang dicari dan offer?"
  },
  CLOSE: {
    keywords: ["confirm", "booking", "book", "beli", "proceed", "bayar", "payment", "close"],
    diagnosis: "Decision path mungkin belum cukup jelas walaupun buyer sudah mempunyai maklumat yang diperlukan.",
    action: "Nyatakan next step yang spesifik supaya buyer tahu apa yang perlu dibuat untuk meneruskan keputusan.",
    question: "Apakah satu next step yang jelas dan munasabah untuk buyer sekarang?"
  },
  "FOLLOW-UP": {
    keywords: ["senyap", "tak reply", "tak balas", "follow up", "follow-up", "ghost", "diam"],
    diagnosis: "Follow-up mungkin sedang menjadi aktiviti mengejar, bukan proses yang mempunyai sebab, timing dan structure.",
    action: "Tentukan sebab follow-up, timing yang sesuai dan maklumat baharu atau keputusan yang perlu dijelaskan.",
    question: "Kenapa follow-up ini perlu dibuat sekarang, dan apa yang berubah atau perlu dijelaskan?"
  },
  MULTIPLY: {
    keywords: ["ulang", "repeat", "referral", "rujuk", "boleh ulang", "repeatable"],
    diagnosis: "Apa yang berjaya mungkin belum diterjemahkan menjadi behaviour atau proses yang boleh diulang.",
    action: "Dokumentasikan pattern yang berjaya dan tentukan apa yang perlu dibuat secara konsisten.",
    question: "Apa yang berlaku dalam sale yang berjaya ini yang boleh diulang tanpa bergantung pada improvisasi?"
  },
  OPERATE: {
    keywords: ["sistem", "process", "proses", "team", "konsisten", "consistent", "dashboard", "operate"],
    diagnosis: "Masalah mungkin sudah berada pada tahap operasi: proses perlu dipantau dan diperbaiki sebagai satu sistem.",
    action: "Tetapkan process, owner, signal dan ukuran yang boleh digunakan untuk memantau prestasi.",
    question: "Apa yang perlu dipantau supaya proses ini boleh beroperasi secara konsisten?"
  }
};

const stateOptions = ["Aware", "Engaged", "Qualified", "Active", "Decision"];

function scoreStage(text: string, stage: Stage, leadState: string) {
  const normalized = text.toLowerCase();
  let score = rules[stage].keywords.reduce((total, keyword) => total + (normalized.includes(keyword) ? 1 : 0), 0);

  // High-signal selling moments should outrank generic words such as "customer".
  const highSignalWeights: Partial<Record<Stage, { phrases: string[]; weight: number }[]>> = {
    "FOLLOW-UP": [
      { phrases: ["tak reply", "tak balas", "senyap", "ghost", "diam"], weight: 3 },
    ],
    OFFER: [
      { phrases: ["harga", "quotation", "sebut harga", "pakej", "package", "scope"], weight: 2 },
    ],
    LEAD: [
      { phrases: ["tanya", "enquiry", "inquiry", "masuk whatsapp", "prospek"], weight: 2 },
    ],
  };

  for (const signal of highSignalWeights[stage] ?? []) {
    if (signal.phrases.some((phrase) => normalized.includes(phrase))) score += signal.weight;
  }

  const stateWeights: Record<string, Partial<Record<Stage, number>>> = {
    Aware: { TARGET: 2, BUYER: 1, LEAD: 2 },
    Engaged: { BUYER: 1, LEAD: 2, QUALIFY: 2 },
    Qualified: { QUALIFY: 2, VALUE: 2, CLOSE: 1 },
    Active: { VALUE: 1, CLOSE: 2, "FOLLOW-UP": 1 },
    Decision: { CLOSE: 3, "FOLLOW-UP": 2 },
  };

  score += stateWeights[leadState]?.[stage] ?? 0;
  return score;
}

type Dimension = "Relevance" | "Need" | "Readiness" | "Fit" | "Access" | "Engagement";

const dimensionRules: Record<Dimension, string[]> = {
  Relevance: ["sesuai", "relevan", "target", "sasaran", "siapa", "fit"],
  Need: ["perlu", "masalah", "problem", "need", "nak", "perlukan", "sakit"],
  Readiness: ["serius", "sekarang", "bila", "proceed", "confirm", "booking", "bayar", "decision"],
  Fit: ["sesuai", "bajet", "budget", "scope", "package", "pakej", "fit"],
  Access: ["owner", "decision maker", "bos", "pengurus", "approval", "approve", "team"],
  Engagement: ["reply", "balas", "tanya", "respond", "engaged", "follow up", "follow-up", "meeting", "call"],
};

function diagnoseDimensions(text: string, leadState: string) {
  const normalized = text.toLowerCase();

  return (Object.keys(dimensionRules) as Dimension[]).map((dimension) => {
    const signal = dimensionRules[dimension].some((keyword) => normalized.includes(keyword));
    const stateSignal =
      (dimension === "Engagement" && leadState !== "Unknown") ||
      (dimension === "Readiness" && ["Qualified", "Active", "Decision"].includes(leadState)) ||
      (dimension === "Relevance" && ["Aware", "Engaged", "Qualified", "Active", "Decision"].includes(leadState));

    return {
      dimension,
      status: signal || stateSignal ? "Signal" : "Gap / Unknown",
    };
  });
}

export default function SituationAnalyzer() {
  const [situation, setSituation] = useState("");
  const [channel, setChannel] = useState("WhatsApp");

  const channelOptions = [
    "WhatsApp",
    "Phone",
    "Instagram DM",
    "Facebook Messenger",
    "TikTok DM",
    "Marketplace Chat",
    "Email",
    "Website / Form",
    "In-person",
    "SMS",
    "Other",
  ];
  const [leadState, setLeadState] = useState("Unknown");
  const [leadSource, setLeadSource] = useState("Unknown");
  const [answer, setAnswer] = useState("");
  const [refined, setRefined] = useState(false);

  const leadSourceOptions = [
    "Unknown",
    "Organic Social",
    "Paid Ads",
    "Search / Google",
    "Referral",
    "Existing Customer",
    "Marketplace",
    "Website / Form",
    "Walk-in",
    "Outbound",
    "Networking / Event",
    "Other",
  ];
  const [analyzed, setAnalyzed] = useState(false);

  const ranked = useMemo(() => {
    if (!situation.trim()) return [];
    return stages
      .map((stage) => ({ stage, score: scoreStage(situation, stage, leadState) }))
      .sort((a, b) => b.score - a.score);
  }, [situation, leadState]);

  const dimensions = useMemo(
    () => diagnoseDimensions(situation + " " + answer, leadState),
    [situation, answer, leadState]
  );

  const missingDimension = dimensions.find((item) => item.status === "Gap / Unknown")?.dimension ?? "Readiness";

  const diagnosticQuestions: Record<Dimension, string> = {
    Relevance: "Siapa buyer ini, dan apa yang menjadikan situasi atau offer ini relevan kepada mereka?",
    Need: "Masalah atau keperluan apa yang buyer sendiri nyatakan atau tunjukkan?",
    Readiness: "Apakah signal bahawa buyer mahu membuat keputusan sekarang, kemudian, atau belum bersedia?",
    Fit: "Adakah offer, scope dan bajet sesuai dengan situasi buyer?",
    Access: "Adakah orang yang kita sedang berurusan mempunyai kuasa atau akses untuk membuat keputusan?",
    Engagement: "Apakah tindakan atau respons terakhir buyer yang menunjukkan tahap engagement mereka?"
  };

  const followUpQuestion = diagnosticQuestions[missingDimension];

  const primary = ranked[0]?.stage ?? "LEAD";
  const result = rules[primary];

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

  const actionOptions = [
    "Clarify",
    "Qualify",
    "Explain Value",
    "Close",
    "Follow Up",
    "Stop & Reassess",
  ];
  const timingOptions = ["Now", "Today", "24 hours", "2–3 days", "Later"];
  const outcomeOptions = [
    "No response",
    "Replied",
    "Qualified",
    "Offer sent",
    "Closed",
    "Not fit",
    "Other",
  ];

  const [actionType, setActionType] = useState("Clarify");
  const [timing, setTiming] = useState("Now");
  const [actionDone, setActionDone] = useState(false);
  const [outcome, setOutcome] = useState("");

  function resetExecution() {
    setActionDone(false);
    setOutcome("");
  }

  function analyze(event: React.FormEvent) {
    event.preventDefault();
    setAnalyzed(Boolean(situation.trim()));
    setRefined(false);
    setAnswer("");
    resetExecution();
  }

  function refine(event: React.FormEvent) {
    event.preventDefault();
    if (!answer.trim()) return;
    setRefined(true);
    resetExecution();
  }

  return (
    <section className="analyzer">
      <div className="analyzer-grid">
        <div className="card analyzer-input">
          <div className="eyebrow">WORKFLOW 01</div>
          <h2>Situasi Jualan</h2>
          <p className="muted">
            Masukkan situasi sebenar. Contoh: “Customer tanya harga, lepas tu senyap.”
          </p>

          <form onSubmit={analyze} style={{display:"grid",gap:14}}>
            <textarea
              className="input textarea"
              value={situation}
              onChange={(e) => { setSituation(e.target.value); setAnalyzed(false); }}
              placeholder="Apa yang berlaku?"
              rows={6}
            />

            <p className="field-note">
              Channel = tempat interaction berlaku. Lead Source = bagaimana prospect mula datang kepada business.
            </p>

            <div className="form-grid">
              <label>
                <span>Interaction Channel</span>
                <select className="input" value={channel} onChange={(e) => setChannel(e.target.value)}>
                  {channelOptions.map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>
              <label>
                <span>Lead State</span>
                <select className="input" value={leadState} onChange={(e) => setLeadState(e.target.value)}>
                  <option>Unknown</option>
                  {stateOptions.map((state) => <option key={state}>{state}</option>)}
                </select>
              </label>
              <label>
                <span>Lead Source</span>
                <select className="input" value={leadSource} onChange={(e) => setLeadSource(e.target.value)}>
                  {leadSourceOptions.map((source) => <option key={source}>{source}</option>)}
                </select>
              </label>
            </div>

            <button className="btn" type="submit" disabled={!situation.trim()}>
              Diagnose Situation
            </button>
          </form>
        </div>

        <div className="card analyzer-result">
          <div className="eyebrow">DIAGNOSIS</div>
          {!analyzed ? (
            <>
              <h2>Mulakan dengan situasi sebenar.</h2>
              <p className="muted">
                Sistem akan gunakan signal daripada situasi untuk mencadangkan bahagian OS yang perlu disemak.
              </p>
              <div className="decision-flow">
                <span>context</span><b>→</b><span>problem</span><b>→</b><span>value</span><b>→</b><span>barrier</span><b>→</b><span>next step</span>
              </div>
            </>
          ) : (
            <>
              <div className="result-stage">{primary}</div>
              <p>{result.diagnosis}</p>

              <div className="result-block">
                <small className="muted">NEXT ACTION</small>
                <strong>{result.action}</strong>
              </div>

              <div className="result-block">
                <small className="muted">INITIAL CHECK</small>
                <strong>{result.question}</strong>
              </div>

              <div className="result-block">
                <small className="muted">ROUTED RESOURCE</small>
                <strong>{resourceMap[primary].asset}</strong>
                <p className="field-note">{resourceMap[primary].chapter} · Gunakan resource ini selepas diagnosis untuk bergerak daripada masalah kepada tindakan.</p>
              </div>

              {!refined ? (
                <div className="result-block">
                  <small className="muted">ONE MISSING PIECE</small>
                  <strong>{followUpQuestion}</strong>
                  <form onSubmit={refine} style={{display:"grid",gap:10,marginTop:10}}>
                    <textarea
                      className="input textarea compact"
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="Jawapan berdasarkan apa yang buyer sebenar cakap / buat..."
                      rows={4}
                    />
                    <button className="btn" type="submit" disabled={!answer.trim()}>
                      Refine Diagnosis
                    </button>
                  </form>
                </div>
              ) : (
                <>
                  <div className="result-block refined">
                    <small className="muted">REFINED NEXT ACTION</small>
                    <strong>{refinedAction}</strong>
                    <p className="field-note">Diagnosis diperhalusi berdasarkan jawapan tambahan. Jika maklumat masih tidak lengkap, kembali kepada soalan yang belum terjawab.</p>
                  </div>

                  <div className="result-block">
                  <small className="muted">NEXT MOVE</small>
                  <strong>{refinedAction}</strong>
                  <div className="form-grid execution-grid">
                    <label>
                      <span>Action Type</span>
                      <select className="input" value={actionType} onChange={(e) => { setActionType(e.target.value); setActionDone(false); setOutcome(""); }}>
                        {actionOptions.map((option) => <option key={option}>{option}</option>)}
                      </select>
                    </label>
                    <label>
                      <span>Timing</span>
                      <select className="input" value={timing} onChange={(e) => { setTiming(e.target.value); setActionDone(false); setOutcome(""); }}>
                        {timingOptions.map((option) => <option key={option}>{option}</option>)}
                      </select>
                    </label>
                  </div>
                  <p className="field-note">Jalankan satu tindakan yang paling dekat dengan diagnosis. Jangan menambah aktiviti hanya untuk nampak sibuk.</p>
                  <button className="btn" type="button" onClick={() => setActionDone(true)}>
                    {actionDone ? "Action Marked Done" : "Mark Action Done"}
                  </button>

                  {actionDone && (
                    <div className="execution-outcome">
                      <label>
                        <span>Outcome</span>
                        <select className="input" value={outcome} onChange={(e) => setOutcome(e.target.value)}>
                          <option value="">Pilih outcome selepas tindakan...</option>
                          {outcomeOptions.map((option) => <option key={option}>{option}</option>)}
                        </select>
                      </label>
                      {outcome && (
                        <p className="field-note">
                          Outcome direkod secara sementara dalam sesi ini. Gunakan hasil sebenar untuk menentukan langkah seterusnya.
                        </p>
                      )}
                    </div>
                    )}
                  </div>
                </>
              )}

              <div className="result-block">
                <small className="muted">ROUTING BASIS</small>
                <strong>
                  Stage ini dicadangkan berdasarkan signal dalam situasi, Lead State dan maklumat tambahan yang tersedia. Ia bukan keputusan muktamad.
                </strong>
              </div>

              <div className="result-block">
                <small className="muted">LEAD QUALITY LENS</small>
                <div className="dimension-grid">
                  {dimensions.map(({ dimension, status }) => (
                    <div key={dimension} className={status === "Signal" ? "dimension signal" : "dimension"}>
                      <span>{dimension}</span>
                      <small>{status}</small>
                    </div>
                  ))}
                </div>
              </div>

              <div className="meta-row">
                <span>Channel: <b>{channel}</b></span>
                <span>Lead State: <b>{leadState}</b></span>
                <span>Lead Source: <b>{leadSource}</b></span>
              </div>

              <p className="disclaimer">
                Diagnosis ini menggunakan signal yang tersedia. “Gap / Unknown” bermaksud maklumat belum cukup, bukan bahawa prospek itu tidak berkualiti. Semak konteks sebenar sebelum membuat keputusan.
              </p>
            </>
          )}
        </div>
      </div>

      {analyzed && (
        <div className="card stage-map">
          <div>
            <div className="eyebrow">OS ROUTING</div>
            <h2>Di mana masalah ini mungkin berada?</h2>
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
