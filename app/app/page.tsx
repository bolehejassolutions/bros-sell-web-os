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
      <section className="hero simple-hero">
        <div className="eyebrow">BROS SELL™ · SALES DECISION CLARITY</div>
        <h1>Jelaskan situasi. Tentukan langkah seterusnya.</h1>
        <p className="muted hero-copy">Tak perlu pilih framework atau tool dahulu. Mulakan dengan apa yang sedang berlaku dalam jualan anda.</p>
      </section>

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
            <p className="muted">Akses, case dan simpanan anda berkait dengan akaun ini.</p>
          </div>
          <a className="btn secondary" href="/auth/signout">Keluar</a>
        </article>
      </section>

      <details className="card quiet-details">
        <summary>Product updates & support</summary>
        <div className="quiet-details-body">
          <p><strong>Perlu bantuan?</strong> Gunakan support channel yang diberikan bersama pembelian dan sertakan page atau case yang terlibat.</p>
          <p className="muted">BROS SELL™ ialah satu sistem: Closing OS untuk belajar dan rujukan, Web OS untuk menjalankan situasi jualan sebenar.</p>
        </div>
      </details>
    </main>
  );
}
