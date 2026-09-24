"use client";

import { useMemo, useState } from "react";

type Stage =
  | "TARGET" | "BUYER" | "OFFER" | "LEAD" | "QUALIFY"
  | "VALUE" | "CLOSE" | "FOLLOW-UP" | "MULTIPLY" | "OPERATE";

const stages: Stage[] = [
  "TARGET","BUYER","OFFER","LEAD","QUALIFY",
  "VALUE","CLOSE","FOLLOW-UP","MULTIPLY","OPERATE"
];

const rules: Record<Stage, { keywords: string[]; diagnosis: string; action: string; question: string }> = {
  TARGET: {
    keywords: ["target", "audience", "sasaran", "orang yang betul", "customer mana", "siapa nak jual"],
    diagnosis: "Semak sama ada masalah bermula sebelum conversation — seller mungkin belum cukup jelas tentang siapa yang patut dilayan.",
    action: "Nyatakan buyer yang paling relevan untuk situasi ini dan siapa yang patut ditapis keluar.",
    question: "Siapa yang paling relevan untuk offer ini, dan apa yang menjadikan mereka sesuai?"
  },
  BUYER: {
    keywords: ["buyer", "customer", "faham customer", "keperluan", "masalah customer", "nak apa", "need"],
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
    () => diagnoseDimensions(situation, leadState),
    [situation, leadState]
  );

  const primary = ranked[0]?.stage ?? "LEAD";
  const result = rules[primary];

  function analyze(event: React.FormEvent) {
    event.preventDefault();
    setAnalyzed(Boolean(situation.trim()));
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
                <small className="muted">CHECK THIS</small>
                <strong>{result.question}</strong>
              </div>

              <div className="result-block">
                <small className="muted">LEAD QUALITY LENS</small>
                <div className="dimension-grid">
                  {dimensions.map(({ dimension, status }) => (
                    <div className={status === "Signal" ? "dimension signal" : "dimension"}>
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
