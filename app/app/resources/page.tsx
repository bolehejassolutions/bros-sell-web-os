import { redirect } from "next/navigation";
import { hasWebOSAccess } from "@/lib/supabase/entitlement";
import CaseLink from '../case-link';

const nativeTools = [
  ["/app/target-calculator","Sasaran jualan","Kira sasaran dan operating volume."],
  ["/app/buyer-intelligence","Fahami buyer","Fahami problem, impact, outcome dan decision context."],
  ["/app/offer-stack","Jelaskan offer","Susun offer supaya mudah difahami."],
  ["/app/value-bridge","Jelaskan value","Hubungkan problem, outcome, solution dan investment."],
  ["/app/lead-state","Status buyer","Semak state berdasarkan signal sebenar."],
  ["/app/close-path","Laluan keputusan","Tentukan apa yang masih perlu dijelaskan."],
  ["/app/objection-playbook","Fahami objection","Diagnose barrier berdasarkan evidence."],
  ["/app/whatsapp-scripts","Mesej WhatsApp","Adapt pattern conversation ikut context."],
  ["/app/follow-up","Follow-up","Bina follow-up dengan purpose dan stop condition."],
  ["/app/customer-multiplication","Repeat & referral","Rancang repeat, referral atau expansion."],
  ["/app/implementation-tracker","Pelan pelaksanaan","Jalankan implementation cycle dengan evidence."],
  ["/app/operator-dashboard","Advanced insights","Semak cases dan metrik operasi lanjutan."]
] as const;

export default async function ResourcesPage() {
  if (!(await hasWebOSAccess())) redirect("/activate");

  return (
    <main className="container library-page">
      <section className="hero simple-hero">
        <div className="eyebrow">LIBRARY</div>
        <h1>Cari bila perlu. Jangan buka semuanya.</h1>
        <p className="muted hero-copy">Untuk kerja harian, mulakan di Home. Library ialah tempat rujukan, template dan tools apabila anda memang memerlukannya.</p>
      </section>

      <section className="library-intent-grid">
        <article className="card compact-home-card">
          <div>
            <div className="eyebrow">BELAJAR LEBIH MENDALAM</div>
            <h2>Closing OS</h2>
            <p className="muted">Rujukan metodologi untuk memahami logik BROS SELL dengan lebih mendalam.</p>
          </div>
          <a className="btn" href="/api/customer/closing-os">Buka Closing OS</a>
        </article>

        <article className="card compact-home-card">
          <div>
            <div className="eyebrow">PERLU AYAT / TEMPLATE?</div>
            <h2>Scripts & follow-up</h2>
            <p className="muted">Gunakan apabila anda sudah tahu situasi dan perlu melaksanakan next move dengan jelas.</p>
          </div>
          <div className="resource-actions">
            <CaseLink className="btn secondary" href="/app/whatsapp-scripts">WhatsApp</CaseLink>
            <CaseLink className="btn secondary" href="/app/follow-up">Follow-up</CaseLink>
          </div>
        </article>

        <article className="card compact-home-card">
          <div>
            <div className="eyebrow">NAK GUNA TOOL TERTENTU?</div>
            <h2>All Tools</h2>
            <p className="muted">Power users boleh buka capability tertentu secara terus. Kebanyakan masa, Home akan cadangkan tool yang relevan.</p>
          </div>
          <a className="btn secondary" href="#all-tools">Lihat semua tools</a>
        </article>
      </section>

      <details id="all-tools" className="card advanced-details library-all-tools">
        <summary>Semua tools</summary>
        <div className="resource-grid native-tool-grid advanced-details-body">
          {nativeTools.map(([href,title,use])=>(
            <CaseLink className="resource-card tool-card" href={href} key={href}>
              <div><small className="muted">BROS SELL TOOL</small><h2>{title}</h2><p className="muted">{use}</p></div>
              <span className="btn secondary">Buka</span>
            </CaseLink>
          ))}
        </div>
      </details>

      <section className="card quiet-details">
        <div className="eyebrow">PRINSIP</div>
        <h2>Situasi dahulu. Tool kemudian.</h2>
        <p className="muted">Jika anda tidak pasti tool mana yang patut digunakan, kembali ke Home dan mulakan dengan situasi sebenar.</p>
        <CaseLink className="btn" href="/app">Kembali ke Home</CaseLink>
      </section>
    </main>
  );
}
