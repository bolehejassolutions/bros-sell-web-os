import { createClient } from "@/lib/supabase/server";
import { hasCoreAccess } from "@/lib/supabase/entitlement";
import { redirect } from "next/navigation";

const stages=["TARGET","BUYER","OFFER","LEAD","QUALIFY","VALUE","CLOSE","FOLLOW-UP","MULTIPLY","OPERATE"];
export default async function AppHome(){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user) redirect("/login");
 if(!(await hasCoreAccess())) redirect("/activate");
 return <main className="container" style={{padding:"28px 0 60px"}}><header style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"center",marginBottom:36}}><div><div className="brand" style={{fontSize:24}}>BROS SELL™</div><div className="muted">Closing OS</div></div><a className="btn secondary" href="/auth/signout">Keluar</a></header><section><p className="muted">Sales is decision clarity.</p><h1>Sales Operating System</h1><p className="muted" style={{maxWidth:650}}>Mulakan dengan situasi jualan sebenar. Gunakan sistem untuk menjelaskan keputusan, bukan memujuk.</p></section><section style={{marginTop:32}}><div className="stage">{stages.map((s,i)=><div key={s}><small className="muted">{String(i+1).padStart(2,"0")}</small><div style={{marginTop:6,fontWeight:700}}>{s}</div></div>)}</div></section></main>
}
