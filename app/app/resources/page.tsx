import { redirect } from "next/navigation";
import { hasWebOSAccess } from "@/lib/supabase/entitlement";

const nativeTools = [
  ["/app/target-calculator","Target Calculator","Tetapkan sasaran dan kira operating volume."],
  ["/app/operator-dashboard","Operator Dashboard","Pantau target, actual, variance dan bottleneck."],
  ["/app/buyer-intelligence","Buyer Intelligence","Fahami buyer, problem, impact, outcome dan decision context."],
  ["/app/offer-stack","Offer Stack Builder","Bina offer yang jelas dan mudah difahami."],
  ["/app/value-bridge","Value Bridge","Hubungkan problem → outcome → solution → investment."],
  ["/app/lead-state","Lead State Classifier","Klasifikasikan lead berdasarkan signal sebenar."],
  ["/app/close-path","Close Path","Tentukan apa yang perlu dijelaskan sebelum decision."],
  ["/app/objection-playbook","Objection Playbook","Diagnose dan jawab barrier berdasarkan evidence."],
  ["/app/whatsapp-scripts","WhatsApp Script Vault","Adapt pattern conversation ikut context."],
  ["/app/follow-up","Follow-Up Ladder","Bina follow-up dengan purpose, signal dan stop condition."],
  ["/app/customer-multiplication","Customer Multiplication","Tukar result sebenar kepada repeat, referral atau expansion."],
  ["/app/implementation-tracker","30-Day Implementation","Jalankan implementation cycle dengan evidence dan audit."]
] as const;

const packageResources = [
  ["START HERE","Quick Start Guide","Orientasi dan cara menggunakan BROS SELL™."],
  ["IMPLEMENTATION","Implementation Playbook + Scenario Launch Cards","Terjemahkan sistem kepada rutin dan situasi jualan sebenar."],
  ["VISUAL SYSTEM","Visual System V01–V12","Peta visual untuk melihat hubungan antara komponen sistem."],
  ["TOOLKIT","Sales Target Calculator + Operator Dashboard","Fail spreadsheet untuk sasaran dan operasi."],
  ["TOOLKIT","Visual System Index","Indeks pantas untuk sistem visual."],
  ["TOOLKIT","Buyer Intelligence Canvas","Fahami konteks, masalah dan outcome buyer."],
  ["TOOLKIT","BROS 5Q Worksheet","Soalan teras untuk mendapatkan maklumat yang diperlukan."],
  ["TOOLKIT","Offer Stack Builder","Worksheet untuk membina offer."],
  ["TOOLKIT","Value Bridge Worksheet","Worksheet untuk menghubungkan problem kepada value."],
  ["TOOLKIT","Lead State Classifier","Spreadsheet klasifikasi lead."],
  ["TOOLKIT","Close Path Decision Tree","Decision tree untuk laluan close."],
  ["TOOLKIT","Objection Playbook","Rujukan untuk barrier dan objection."],
  ["TOOLKIT","WhatsApp Script Vault","Rujukan pattern conversation WhatsApp."],
  ["TOOLKIT","Follow-Up Ladder Library","Library follow-up berdasarkan sebab dan timing."],
  ["TOOLKIT","Customer Multiplication Planner","Planner untuk repeat, referral dan expansion."],
  ["TOOLKIT","30-Day Implementation Tracker","Tracker pelaksanaan 30 hari."]
] as const;

export default async function ResourcesPage() {
  if (!(await hasWebOSAccess())) redirect("/activate");

  return (
    <main className="container" style={{padding:"28px 0 60px"}}>
      <section className="hero">
        <p className="muted">THINK → SEE → USE → DO</p>
        <h1>Resources</h1>
        <p className="muted hero-copy">Gunakan resource berdasarkan masalah yang sedang berlaku. Anda tidak perlu membuka semuanya.</p>
      </section>

      <section className="card resource-section">
        <div className="eyebrow">START HERE</div>
        <h2>Mulakan dengan satu situasi.</h2>
        <p className="muted">Situation Analyzer membantu anda menentukan stage dan next action sebelum anda memilih tool lain.</p>
        <div className="resource-actions">
          <a className="btn" href="/app">Buka Situation Analyzer</a>
          <a className="btn secondary" href="/app/implementation-tracker">Mulakan 30-Day Implementation</a>
        </div>
      </section>

      <section className="card resource-section">
        <div className="eyebrow">WEB OS · NATIVE TOOLS</div>
        <h2>Run the system</h2>
        <p className="muted">Tool interaktif ini ialah execution layer. Pilih berdasarkan stage atau masalah anda.</p>
        <div className="resource-grid native-tool-grid">
          {nativeTools.map(([href,title,use])=>(
            <a className="resource-card tool-card" href={href} key={href}>
              <div><small className="muted">WEB OS TOOL</small><h2>{title}</h2><p className="muted">{use}</p></div>
              <span className="btn secondary">Buka tool</span>
            </a>
          ))}
        </div>
      </section>

      <section className="card resource-section compact-resource">
        <div>
          <div className="eyebrow">CLOSING OS · KNOWLEDGE</div>
          <h2>Closing OS v2.5</h2>
          <p className="muted">Rujukan metodologi apabila anda perlukan penjelasan yang lebih mendalam.</p>
        </div>
        <a className="btn" href="/api/customer/closing-os">Download Closing OS v2.5</a>
      </section>

      <details className="card resource-section package-details">
        <summary>
          <span><strong>Customer Package resources</strong><small>Quick Start, Implementation, Visual System & Toolkit files</small></span>
          <span className="details-toggle">View files</span>
        </summary>
        <div className="package-list">
          {packageResources.map(([area,title,use])=>(
            <div className="package-item" key={area+title}>
              <div><small className="muted">{area}</small><strong>{title}</strong><span className="muted">{use}</span></div>
              <span className="field-note">Included in Customer Package v2.5</span>
            </div>
          ))}
        </div>
      </details>

      <section className="card resource-section">
        <div className="eyebrow">RULE</div>
        <h2>Jangan buka semua resource serentak.</h2>
        <p className="muted">Situation → Diagnose → Tool → Action → Outcome → Next Action.</p>
      </section>
    </main>
  );
}
