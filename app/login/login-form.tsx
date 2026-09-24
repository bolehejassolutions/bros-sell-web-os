'use client';
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm(){
  const [email,setEmail]=useState("");
  const [sent,setSent]=useState(false);
  const [error,setError]=useState("");
  async function submit(e:React.FormEvent){
    e.preventDefault(); setError("");
    const supabase=createClient();
    const {error}=await supabase.auth.signInWithOtp({
      email,
      options:{emailRedirectTo:`${window.location.origin}/auth/callback`}
    });
    if(error){setError(error.message);return}
    setSent(true);
  }
  if(sent) return <div><h2>Semak email.</h2><p className="muted">Pautan login telah dihantar. Buka email yang sama pada peranti ini untuk meneruskan.</p></div>;
  return <form onSubmit={submit} style={{display:"grid",gap:14}}><label>Email</label><input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="nama@email.com"/>{error&&<p style={{color:"#ff8a8a"}}>{error}</p>}<button className="btn">Hantar Magic Link</button></form>
}
