import { createClient } from "@/lib/supabase/server";
import { hasWebOSAccess } from "@/lib/supabase/entitlement";
import { redirect } from "next/navigation";
import SalesCaseWorkspace from "./sales-case-workspace";

export default async function AppHome() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!(await hasWebOSAccess())) redirect("/activate");

  return (
    <main className="container simple-home">
      <section className="simple-hero">
        <div className="eyebrow">BROS SELL™</div>
        <h1>Apa yang sedang berlaku dalam jualan anda sekarang?</h1>
        <p className="muted hero-copy">
          Ceritakan satu situasi sebenar. BROS SELL akan bantu susun bukti, diagnosis dan langkah seterusnya
          berdasarkan maklumat yang anda rekodkan.
        </p>
      </section>
      <SalesCaseWorkspace />
    </main>
  );
}
