import { createClient } from "@/lib/supabase/server";
export default async function ActivatePage(){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 return <main className="container" style={{paddingTop:80,maxWidth:680}}><div className="card"><div className="brand">BROS SELL™</div><h1>Akses belum aktif</h1><p className="muted">Akaun ini berjaya login, tetapi belum mempunyai entitlement aktif untuk BROS SELL™ Web OS.</p><p className="muted">Jika pembelian telah dibuat, gunakan email yang sama seperti semasa checkout atau hubungi sokongan untuk pengaktifan.</p><p className="muted">Signed in as: {user?.email}</p><a className="btn secondary" href="/auth/signout">Keluar</a></div></main>
}
