import { createClient } from "@/lib/supabase/server";
import { hasWebOSAccess } from "@/lib/supabase/entitlement";
import { redirect } from "next/navigation";
import SalesCaseWorkspace from './sales-case-workspace';
import Link from 'next/link';
import { CUSTOMER_RELEASE } from "@/lib/bros-sell/customer-release";

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
            <p className="field-note">Pakej pelanggan: {CUSTOMER_RELEASE.packageVersion} · Buku: {CUSTOMER_RELEASE.bookVersion} · Web OS: aktif</p>
          </div>
          <div className="resource-actions">
            <Link className="btn secondary" href="/app/hub">Akses & bantuan</Link>
            <a className="btn secondary" href="/auth/signout">Keluar</a>
          </div>
        </article>
      </section>

      <details className="card quiet-details">
        <summary>Kemas kini produk & sokongan</summary>
        <div className="quiet-details-body">
          <p><strong>Status akses:</strong> aktif untuk akaun ini.</p>
          <p><strong>Pakej pelanggan:</strong> {CUSTOMER_RELEASE.packageVersion}; buku rujukan kekal {CUSTOMER_RELEASE.bookVersion}.</p>
          <p><strong>Web OS:</strong> aliran berpandu Situation → Evidence → Diagnosis → Action → Outcome → Next Action sedang aktif.</p>
          <p><strong>Perlu bantuan atau mahu beri maklum balas?</strong> Buka <Link href="/app/hub">Customer Hub</Link> untuk status akses, nota perubahan dan sokongan. Jangan hantar kata laluan, OTP atau butiran kad.</p>
          <p className="muted">BROS SELL™ ialah satu Sales Operating System: Closing OS untuk belajar dan rujukan, Web OS untuk menjalankan situasi jualan sebenar.</p>
        </div>
      </details>
    </main>
  );
}
