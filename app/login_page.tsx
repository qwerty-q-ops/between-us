 "use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();
  const [mode, setMode] = useState<"signin"|"signup">("signin");
  const [email,setEmail] = useState(""); const [password,setPassword] = useState("");
  const [message,setMessage] = useState(""); const [busy,setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMessage("");
    const result = mode === "signin"
      ? await supabase.auth.signInWithPassword({email,password})
      : await supabase.auth.signUp({email,password,options:{emailRedirectTo: `${window.location.origin}/auth/callback`}});
    setBusy(false);
    if (result.error) setMessage(result.error.message);
    else if (mode === "signup") setMessage("Account created. If email confirmation is enabled, check your inbox before signing in.");
    else window.location.href = "/dashboard";
  }
  return <main className="auth"><section className="card auth-card">
    <div className="brand">between <span>us.</span></div><div className="eyebrow" style={{marginTop:28}}>A shared space for understanding</div>
    <h1>{mode==="signin"?"Welcome back.":"Start your shared space."}</h1>
    <p>Small conversations can create more understanding, one step at a time.</p>
    <form onSubmit={submit}>
      <label className="label" htmlFor="email">Email</label><input id="email" className="input" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)}/>
      <label className="label" htmlFor="password">Password</label><input id="password" className="input" type="password" minLength={8} autoComplete={mode==="signin"?"current-password":"new-password"} required value={password} onChange={e=>setPassword(e.target.value)}/>
      {message&&<div className={`notice ${message.toLowerCase().includes("error")?"error":""}`}>{message}</div>}
      <button className="btn" style={{width:"100%",marginTop:22}} disabled={busy}>{busy?"Please wait…":mode==="signin"?"Sign in":"Create account"}</button>
    </form>
    <p className="small" style={{marginTop:22}}>{mode==="signin"?"New to Between Us?":"Already have an account?"} <button className="btn ghost" onClick={()=>{setMode(mode==="signin"?"signup":"signin");setMessage("")}}>{mode==="signin"?"Create an account":"Sign in"}</button></p>
    <div className="notice">Your private reflections are separate from shared exercises. Only share what you choose to share.</div>
  </section></main>;
}
