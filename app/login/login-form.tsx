'use client';

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Mode = "google" | "password" | "magic";

export default function LoginForm() {
  const [mode, setMode] = useState<Mode>("google");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sent, setSent] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function googleLogin() {
    setError("");
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
      setBusy(false);
    }
  }

  async function passwordLogin() {
    setError("");
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    window.location.assign("/app");
  }

  async function passwordSignUp() {
    setError("");
    setBusy(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    if (data.session) {
      window.location.assign("/app");
      return;
    }
    setAccountCreated(true);
    setBusy(false);
  }

  async function magicLink() {
    setError("");
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    setSent(true);
    setBusy(false);
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError("");
    setSent(false);
    setAccountCreated(false);
  }

  if (sent) {
    return (
      <div style={{ display: "grid", gap: 12 }}>
        <h2>Semak email.</h2>
        <p className="muted">Pautan login telah dihantar. Buka email yang sama untuk meneruskan.</p>
        <button type="button" className="btn secondary" onClick={() => switchMode("magic")}>Guna kaedah lain</button>
      </div>
    );
  }

  if (accountCreated) {
    return (
      <div style={{ display: "grid", gap: 12 }}>
        <h2>Akaun dicipta.</h2>
        <p className="muted">Semak email anda untuk mengesahkan akaun sebelum log masuk.</p>
        <button type="button" className="btn secondary" onClick={() => switchMode("password")}>Kembali ke login</button>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <button type="button" className="btn" onClick={googleLogin} disabled={busy}>
        Continue with Google
      </button>
      <div className="muted" style={{ textAlign: "center", fontSize: 13 }}>OR</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" className={`btn ${mode === "password" ? "" : "secondary"}`} onClick={() => switchMode("password")}>Email + Password</button>
        <button type="button" className={`btn ${mode === "magic" ? "" : "secondary"}`} onClick={() => switchMode("magic")}>Magic Link</button>
      </div>
      <div className="card" style={{ padding: 18 }}>
        <p className="muted" style={{ marginTop: 0, marginBottom: 14 }}>
          {mode === "password" ? "Log masuk dengan email dan password." : "Log masuk tanpa mengingati password."}
        </p>
        <div style={{ display: "grid", gap: 12 }}>
          <label>Email</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="nama@email.com" autoComplete="email" />
          {mode === "password" && (
            <>
              <label>Password</label>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="Sekurang-kurangnya 6 aksara" autoComplete="current-password" />
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button type="button" className="btn" disabled={busy} onClick={passwordLogin}>Log Masuk</button>
                <button type="button" className="btn secondary" disabled={busy} onClick={passwordSignUp}>Cipta Akaun</button>
              </div>
            </>
          )}
          {mode === "magic" && (
            <button type="button" className="btn" disabled={busy} onClick={magicLink}>Hantar Magic Link</button>
          )}
          {error && <p style={{ color: "#ff8a8a", margin: 0 }}>{error}</p>}
          <p className="muted" style={{ margin: 0, fontSize: 12 }}>Pembelian dan akses Web OS dikawal berasingan melalui entitlement akaun.</p>
        </div>
      </div>
    </div>
  );
}
