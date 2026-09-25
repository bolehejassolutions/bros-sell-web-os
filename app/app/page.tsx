import { createClient } from "@/lib/supabase/server";
import { hasWebOSAccess } from "@/lib/supabase/entitlement";
import { redirect } from "next/navigation";
import SituationAnalyzer from "./situation-analyzer";

const stages=["TARGET","BUYER","OFFER","LEAD","QUALIFY","VALUE","CLOSE","FOLLOW-UP","MULTIPLY","OPERATE"];

const tools = [
  ["/app/target-calculator","Target"],
  ["/app/operator-dashboard","Dashboard"],
  ["/app/buyer-intelligence","Buyer"],
  ["/app/offer-stack","Offer"],
  ["/app/value-bridge","Value"],
  ["/app/lead-state","Lead"],
  ["/app/close-path","Close"],
  ["/app/objection-playbook","Objection"],
  ["/app/whatsapp-scripts","WhatsApp"],
  ["/app/follow-up","Follow-Up"],
  ["/app/customer-multiplication","Multiply"],
  ["/app/implementation-tracker","30-Day"],
];

export default async function AppHome(){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) redirect("/login");
  if(!(await hasWebOSAccess())) redirect("/activate");

  return (
    <main className="container" style={{padding:"28px 0 60px"}}>
      <header className="app-header">
        <div>
          <div className="brand" style={{fontSize:24}}>BROS SELL™</div>
          <div className="muted">Closing OS + Web OS · Customer Hub</div>
        </div>
        <nav className="hub-nav" aria-label="Customer Hub">
          <a className="btn secondary" href="/app">Home</a>
          <a className="btn secondary" href="/app/resources">Resources</a>
          <a className="btn secondary" href="#updates">Updates</a>
          <a className="btn secondary" href="#account">Account</a>
          <a className="btn secondary" href="/auth/signout">Keluar</a>
        </nav>
      </header>

      <section className="hero">
        <p className="muted">LEARN IT. RUN IT. KEEP IT UPDATED.</p>
        <div className="hub-grid">
          <article className="card hub-card">
            <div>
              <div className="eyebrow">WEB OS · EXECUTION</div>
              <h2>Teruskan operasi</h2>
              <p className="muted">Mulakan dengan situasi jualan sebenar dan bergerak melalui diagnosis → action → outcome → next action.</p>
            </div>
            <a className="btn" href="#analyzer">Buka Situation Analyzer</a>
          </article>
          <article className="card hub-card">
            <div>
              <div className="eyebrow">CLOSING OS · KNOWLEDGE</div>
              <h2>Closing OS v2.5</h2>
              <p className="muted">Rujukan metodologi semasa apabila anda perlukan penjelasan lebih mendalam.</p>
            </div>
            <a className="btn" href="/api/customer/closing-os">Download Closing OS v2.5</a>
          </article>
          <article className="card hub-card">
            <div>
              <div className="eyebrow">MY ACCESS</div>
              <h2>BROS SELL™ — Full Early Bird Access</h2>
              <p className="muted">Web OS dan Closing OS berada di bawah satu pengalaman produk.</p>
            </div>
            <span className="status-pill">ACTIVE</span>
          </article>
        </div>
        <h1>Customer Hub</h1>
        <p className="muted hero-copy">Mulakan dengan situasi jualan sebenar. Gunakan sistem untuk menjelaskan keputusan, bukan memujuk.</p>
      </section>

      <section id="analyzer"><SituationAnalyzer /></section>

      <section className="card os-overview">
        <div>
          <div className="eyebrow">THE OPERATING SYSTEM</div>
          <h2>10-stage sales flow</h2>
          <p className="muted">Gunakan stage ini sebagai peta untuk memahami di mana sesuatu masalah berada dalam proses jualan.</p>
        </div>
        <div className="stage">
          {stages.map((s,i)=><div key={s}><small className="muted">{String(i+1).padStart(2,"0")}</small><div style={{marginTop:6,fontWeight:700}}>{s}</div></div>)}
        </div>
      </section>

      <section className="card tool-section">
        <div className="eyebrow">WEB OS · TOOLS</div>
        <h2>Continue with a specific tool</h2>
        <p className="muted">Gunakan tool terus apabila anda sudah tahu stage atau masalah yang sedang dihadapi.</p>
        <div className="tool-grid">
          {tools.map(([href,label])=><a className="btn secondary tool-link" href={href} key={href}>{label}</a>)}
        </div>
      </section>

      <section id="updates" className="card hub-section">
        <div className="eyebrow">UPDATES</div>
        <h2>Product change log</h2>
        <div className="update-item">
          <strong>26 Sep 2026 · Customer Hub UX v1.1</strong>
          <p className="muted">Simplified navigation separates Customer Hub from the Web OS toolset and improves mobile use.</p>
          <div className="update-meta"><span>Affected: all Web OS customers</span><span>Action: none</span></div>
        </div>
        <div className="update-item">
          <strong>25 Sep 2026 · Architecture clarification</strong>
          <p className="muted">BROS SELL™ is one product with two complementary surfaces. Web OS standalone means operational independence, not duplication of the 36-chapter Closing OS.</p>
          <div className="update-meta"><span>Affected: all customers</span><span>Action: none</span></div>
        </div>
        <div className="update-item">
          <strong>25 Sep 2026 · Closing OS v2.5</strong>
          <p className="muted">Current customer reference version.</p>
          <div className="update-meta"><span>Affected: all customers</span><span>Action: use v2.5 as current reference</span></div>
        </div>
      </section>

      <section id="account" className="card hub-section">
        <div className="eyebrow">ACCOUNT</div>
        <h2>My account</h2>
        <p className="muted">{user.email ?? "Signed-in account"}</p>
        <a className="btn secondary" href="/auth/signout">Keluar</a>
      </section>

      <section className="card hub-section">
        <div className="eyebrow">SUPPORT</div>
        <h2>Something unclear or broken?</h2>
        <p className="muted">Gunakan support channel yang diberikan bersama pembelian anda. Sertakan page/resource dan apa yang berlaku.</p>
        <p className="field-note">Tip: sertakan screenshot jika isu berlaku pada skrin tertentu.</p>
      </section>
    </main>
  );
}
