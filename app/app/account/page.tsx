import { createClient } from "@/lib/supabase/server";

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="container simple-page">
      <section className="simple-hero compact">
        <div className="eyebrow">ACCOUNT</div>
        <h1>Akaun anda</h1>
        <p className="muted hero-copy">Akses BROS SELL dan identiti akaun yang sedang digunakan.</p>
      </section>
      <section className="card simple-card">
        <small className="muted">EMAIL</small>
        <h2>{user?.email ?? "Signed-in account"}</h2>
        <p className="muted">BROS SELL mengawal akses produk melalui entitlement akaun.</p>
        <a className="btn secondary" href="/auth/signout">Keluar</a>
      </section>
    </main>
  );
}
