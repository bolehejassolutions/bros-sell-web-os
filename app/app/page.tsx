import { createClient } from "@/lib/supabase/server";
import { hasWebOSAccess } from "@/lib/supabase/entitlement";
import { redirect } from "next/navigation";
import SalesCaseWorkspace from './sales-case-workspace';
import Link from 'next/link';

export default async function AppHome(){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) redirect("/login");
  if(!(await hasWebOSAccess())) redirect("/activate");

  return (
    <main className="container simplified-home">
      <SalesCaseWorkspace />

      <section className="secondary-home-grid">
        <article className="card compact-home-card">
          <div>
            <div className="eyebrow">NAK FAHAM LEBIH MENDALAM?</div>
            <h2>Closing OS</h2>
            <p className="muted">Gunakan rujukan metodologi apabila anda perlukan penjelasan lebih mendalam. Untuk kerja harian, teruskan di Web OS.</p>
          </div>
          <Link className="btn secondary" href="/app/resources">Buka Library</Link>
        </article>

        <article id="account" className="card compact-home-card">
          <div>
            <div className="eyebrow">ACCOUNT</div>
            <h2>{user.email ?? "Signed-in account"}</h2>
            <p className="muted">Akses BROS SELL aktif. Case dan simpanan anda berkait dengan akaun ini.</p>
            <p className="field-note">Closing OS semasa: v2.5 · Web OS: aktif</p>
          </div>
          <div className="resource-actions">
            <a className="btn secondary" href="mailto:brossell@bolehejas.com?subject=BROS%20SELL%20support">Hubungi support</a>
            <a className="btn secondary" href="/auth/signout">Keluar</a>
          </div>
        </article>
      </section>

      <details className="card quiet-details">
        <summary>Product updates & support</summary>
        <div className="quiet-details-body">
          <p><strong>Status akses:</strong> aktif untuk akaun ini.</p>
          <p><strong>Closing OS:</strong> versi pelanggan semasa ialah v2.5.</p>
          <p><strong>Web OS:</strong> aliran berpandu Situation → Evidence → Diagnosis → Action → Outcome → Next Action sedang aktif.</p>
          <p><strong>Perlu bantuan atau mahu beri feedback?</strong> Email <a href="mailto:brossell@bolehejas.com?subject=BROS%20SELL%20support">brossell@bolehejas.com</a> dan sertakan page atau case yang terlibat. Jangan hantar password, OTP atau maklumat kad.</p>
          <p className="muted">BROS SELL™ ialah satu Sales Operating System: Closing OS untuk belajar dan rujukan, Web OS untuk menjalankan situasi jualan sebenar.</p>
        </div>
      </details>
    </main>
  );
}
