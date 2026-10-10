import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasWebOSAccess } from "@/lib/supabase/entitlement";
import { CUSTOMER_RELEASE as release } from "@/lib/bros-sell/customer-release";

const supportEmail = "brossell@bolehejas.com";
const supportLink = (subject: string) => `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}`;

export default async function CustomerHubPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!(await hasWebOSAccess(supabase))) redirect("/activate");

  return (
    <main className="container library-page" aria-label="BROS SELL Customer Hub">
      <section className="hero simple-hero">
        <div className="eyebrow">CUSTOMER HUB</div>
        <h1>Semua akses dan rujukan anda, di satu tempat.</h1>
        <p className="muted hero-copy">BROS SELL™ — Panduan & Alat Jualan Praktikal. Sistem ini membantu anda menyusun cara menjual: belajar melalui bahan muat turun, kemudian gunakan Web OS untuk situasi sebenar.</p>
      </section>

      <section className="hub-grid" aria-label="Akses dan bahan anda">
        <article className="card hub-card">
          <div>
            <div className="eyebrow">AKSES ANDA</div>
            <span className="status-pill">Aktif untuk akaun ini</span>
            <h2>Web OS</h2>
            <p className="muted">Teruskan kerja jualan: situasi, bukti, tindakan, hasil dan langkah seterusnya.</p>
          </div>
          <Link className="btn" href="/app">Teruskan di Web OS</Link>
        </article>
        <article className="card hub-card">
          <div>
            <div className="eyebrow">PAKEJ PELANGGAN</div>
            <h2>{release.packageVersion}</h2>
            <p className="muted">Pakej lengkap untuk kegunaan offline: buku, peta visual, panduan dan workbook. Fail ZIP diterima secara berasingan melalui pembelian HitPay.</p>
          </div>
          <div className="resource-actions">
            <a className="btn secondary" href="/api/customer/closing-os">Buka buku PDF</a>
            <a className="btn secondary" href={supportLink("BROS SELL - bantuan pakej v2.6.1")}>Bantuan ZIP</a>
          </div>
        </article>
        <article className="card hub-card">
          <div>
            <div className="eyebrow">AKAUN</div>
            <h2>Maklumat akses</h2>
            <p className="muted">Log masuk sebagai <strong>{user.email ?? "akaun berdaftar"}</strong>.</p>
            <p className="field-note">Akses Web OS disahkan untuk sesi ini. Pemulihan dikaitkan dengan emel pembelian.</p>
          </div>
          <div className="resource-actions">
            <a className="btn secondary" href={supportLink("BROS SELL - semakan akses")}>Bantuan akses</a>
            <a className="btn secondary" href="/auth/signout">Keluar</a>
          </div>
        </article>
      </section>

      <section className="card hub-section" aria-label="Kandungan pakej">
        <div className="eyebrow">APA YANG ANDA TERIMA</div>
        <h2>Pakej {release.packageVersion} bukan versi buku {release.bookVersion}</h2>
        <p className="muted">Nombor versi pakej merujuk kepada keseluruhan ZIP; buku utama kekal pada versi tersendiri.</p>
        <div className="package-list">
          <div className="package-item"><div><strong>Buku Closing OS {release.bookVersion}</strong><span className="muted">{release.bookPages} halaman · {release.bookChapters} bab</span></div><a className="btn secondary" href="/api/customer/closing-os">Buka PDF</a></div>
          <div className="package-item"><div><strong>Quick Start Guide {release.quickStartVersion}</strong><span className="muted">Panduan langkah pertama dalam ZIP pelanggan</span></div></div>
          <div className="package-item"><div><strong>Implementation Playbook {release.playbookVersion}</strong><span className="muted">Pelaksanaan dan Scenario Launch Cards dalam ZIP</span></div></div>
          <div className="package-item"><div><strong>{release.mapCount} Visual System Maps dan {release.workbookCount} workbook XLSX</strong><span className="muted">Bahan rujukan dan alat kerja offline</span></div></div>
        </div>
        <p className="field-note">ZIP lengkap tidak disimpan dalam Web OS buat masa ini. Gunakan fail yang diterima melalui HitPay; jangan berkongsi pautan atau fail berbayar secara terbuka.</p>
      </section>

      <section className="card hub-section" aria-label="Kemas kini produk">
        <div className="eyebrow">KEMAS KINI TERKINI</div>
        <h2>Apa yang berubah?</h2>
        <div className="update-item">
          <strong>{release.packageVersion} — {release.updateTitle}</strong>
          <p className="muted">Diselaraskan pada <time dateTime={release.publishedDate}>10 Oktober 2026</time>. Pembetulan disiapkan pada 9 Oktober 2026.</p>
          <p>{release.updateSummary}</p>
          <p><strong>Untuk siapa:</strong> {release.affectedAudience}</p>
          <p><strong>Perlu buat apa:</strong> {release.actionRequired}</p>
        </div>
      </section>

      <section className="card hub-section" aria-label="Sokongan pelanggan">
        <div className="eyebrow">SOKONGAN & MAKLUM BALAS</div>
        <h2>Ada masalah atau cadangan?</h2>
        <p className="muted">Sertakan halaman atau nama fail terlibat, keterangan ringkas dan rujukan pesanan jika berkaitan. Gunakan emel pembelian untuk semakan akses. Jangan hantar kata laluan, OTP atau maklumat kad.</p>
        <div className="resource-actions">
          <a className="btn secondary" href={supportLink("BROS SELL - laporan isu")}>Laporkan isu</a>
          <a className="btn secondary" href={supportLink("BROS SELL - pertanyaan produk")}>Tanya soalan</a>
          <a className="btn secondary" href={supportLink("BROS SELL - maklum balas pelanggan")}>Beri maklum balas</a>
        </div>
        <p className="field-note">Sokongan: <a href={supportLink("BROS SELL - sokongan")}>{supportEmail}</a>. Web OS ialah companion dalam talian; fail yang telah dimuat turun boleh terus digunakan secara offline.</p>
      </section>
    </main>
  );
}
