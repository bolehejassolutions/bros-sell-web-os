import { redirect } from "next/navigation";
import { hasWebOSAccess } from "@/lib/supabase/entitlement";

const nativeTools = [
  ["/app/target-calculator","Target Calculator","Tetapkan sasaran dan kira operating volume."],
  ["/app/operator-dashboard","Insights","Semak operasi, target dan bottleneck dengan lebih mendalam."],
  ["/app/buyer-intelligence","Buyer Intelligence","Fahami buyer, problem, impact, outcome dan decision context."],
  ["/app/offer-stack","Offer Stack Builder","Bina offer yang jelas dan mudah difahami."],
  ["/app/value-bridge","Value Bridge","Hubungkan problem → outcome → solution → investment."],
  ["/app/lead-state","Lead State Classifier","Klasifikasikan lead berdasarkan signal sebenar."],
  ["/app/close-path","Close Path","Tentukan apa yang perlu dijelaskan sebelum decision."],
  ["/app/objection-playbook","Objection Playbook","Diagnose dan jawab barrier berdasarkan evidence."],
  ["/app/whatsapp-scripts","WhatsApp Script Vault","Adapt pattern conversation ikut context."],
  ["/app/follow-up","Follow-Up Ladder","Bina follow-up dengan purpose, signal dan stop condition."],
  ["/app/customer-multiplication","Repeat & Referral","Gunakan hasil sebenar untuk repeat, referral atau expansion."],
  ["/app/implementation-tracker","30-Day Implementation","Jalankan implementation cycle dengan evidence dan audit."],
] as const;

export default async function ResourcesPage() {
  if (!(await hasWebOSAccess())) redirect("/activate");

  return (
    <main className="container simple-page">
      <section className="simple-hero compact">
        <div className="eyebrow">LIBRARY</div>
        <h1>Cari apa yang anda perlukan.</h1>
        <p className="muted hero-copy">Tak perlu buka semua resource. Mulakan dengan tujuan anda sekarang.</p>
      </section>

      <section className="library-intents">
        <article className="card library-card">
          <div>
            <div className="eyebrow">PANDUAN</div>
            <h2>Saya perlukan penjelasan lebih mendalam</h2>
            <p className="muted">Gunakan Closing OS sebagai rujukan metodologi apabila anda mahu memahami sebab di sebalik sesuatu keputusan.</p>
          </div>
          <a className="btn" href="/api/customer/closing-os">Buka Closing OS</a>
        </article>

        <article className="card library-card">
          <div>
            <div className="eyebrow">SCRIPTS & TEMPLATES</div>
            <h2>Saya mahu sediakan mesej atau follow-up</h2>
            <p className="muted">Gunakan pattern conversation apabila konteks buyer sudah cukup jelas.</p>
          </div>
          <div className="case-actions">
            <a className="btn secondary" href="/app/whatsapp-scripts">WhatsApp scripts</a>
            <a className="btn secondary" href="/app/follow-up">Follow-up</a>
          </div>
        </article>

        <article className="card library-card">
          <div>
            <div className="eyebrow">SISTEM PENUH</div>
            <h2>Saya mahu lihat semua tools</h2>
            <p className="muted">Gunakan ini bila anda memang tahu tool yang diperlukan. Untuk situasi biasa, mulakan dari Home.</p>
          </div>
          <details className="library-tools">
            <summary>Lihat semua tools</summary>
            <div className="resource-grid native-tool-grid">
              {nativeTools.map(([href,title,use]) => (
                <a className="resource-card tool-card" href={href} key={href}>
                  <div>
                    <small className="muted">WEB OS TOOL</small>
                    <h2>{title}</h2>
                    <p className="muted">{use}</p>
                  </div>
                  <span className="btn secondary">Buka</span>
                </a>
              ))}
            </div>
          </details>
        </article>

        <article className="card library-card">
          <div>
            <div className="eyebrow">WHAT'S NEW</div>
            <h2>Apa yang berubah?</h2>
            <p className="muted">Perubahan produk penting akan diringkaskan di sini. Gunakan versi Closing OS semasa yang tersedia melalui Library.</p>
          </div>
        </article>
      </section>

      <section className="card library-rule">
        <div className="eyebrow">RULE</div>
        <h2>Situasi dulu. Tool kemudian.</h2>
        <p className="muted">Home → fahami situasi → tentukan next move → gunakan tool yang relevan → rekod apa yang berlaku.</p>
      </section>
    </main>
  );
}
