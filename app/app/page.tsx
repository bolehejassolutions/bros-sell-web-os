import { createClient } from "@/lib/supabase/server";
import { hasWebOSAccess } from "@/lib/supabase/entitlement";
import { redirect } from "next/navigation";
import SituationAnalyzer from "./situation-analyzer";

const stages=["TARGET","BUYER","OFFER","LEAD","QUALIFY","VALUE","CLOSE","FOLLOW-UP","MULTIPLY","OPERATE"];

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
          <div className="muted">Closing OS</div>
        </div>
        <div style={{display:"flex",gap:8}}><a className="btn secondary" href="/app/resources">Resources</a><a className="btn secondary" href="/app/target-calculator">Target</a><a className="btn secondary" href="/app/buyer-intelligence">Buyer</a><a className="btn secondary" href="/app/offer-stack">Offer</a><a className="btn secondary" href="/app/value-bridge">Value</a><a className="btn secondary" href="/app/lead-state">Lead</a><a className="btn secondary" href="/app/close-path">Close</a><a className="btn secondary" href="/auth/signout">Keluar</a></div>
      </header>

      <section className="hero">
        <p className="muted">Sales is decision clarity.</p>
        <h1>Sales Operating System</h1>
        <p className="muted hero-copy">
          Mulakan dengan situasi jualan sebenar. Gunakan sistem untuk menjelaskan keputusan, bukan memujuk.
        </p>
      </section>

      <SituationAnalyzer />

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
    </main>
  );
}
