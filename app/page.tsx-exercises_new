 "use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function NewExercise(){
 const supabase=createClient(); const router=useRouter(); const params=useSearchParams();
 const [title,setTitle]=useState("");const [statement,setStatement]=useState("");const [context,setContext]=useState("");const [heard,setHeard]=useState("");const [feeling,setFeeling]=useState("");const [need,setNeed]=useState("");const [type,setType]=useState(params.get("type")==="shared"?"shared":"individual");const [busy,setBusy]=useState(false);const [error,setError]=useState("");
 async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setError("");
  const {data:{user}}=await supabase.auth.getUser();if(!user){router.push("/login");return}
  const {data,error}=await supabase.from("exercises").insert({created_by:user.id,title:title.trim()||"A conversation to understand",exercise_type:type,status:"in_progress",statement:statement.trim(),context:context.trim()}).select("id").single();
  if(error){setBusy(false);setError(error.message);return}
  const {error:privateError}=await supabase.from("private_reflections").insert({exercise_id:data.id,user_id:user.id,interpretation:heard.trim(),feelings:feeling.trim(),need_clarity_about:need.trim()});
  setBusy(false);if(privateError){setError("The exercise was created, but your private reflection could not be saved. Check the Supabase schema and try again.");return}router.push(`/exercises/${data.id}`);
 }
 return <main className="shell"><header className="topbar"><Link className="brand" href="/dashboard">between <span>us.</span></Link><Link className="btn secondary" href="/dashboard">Back</Link></header>
 <div className="eyebrow">Start with curiosity</div><h1 className="section-title" style={{fontSize:38}}>What would you like to understand?</h1><p className="small" style={{maxWidth:650}}>You can begin alone or create a shared exercise. Your first answers are private to you until you choose to share them. Keep details general if you prefer.</p>
 <form className="card form" onSubmit={submit} style={{marginTop:24}}>
 <label className="label" htmlFor="type">How would you like to work through this?</label><select id="type" className="select" value={type} onChange={e=>setType(e.target.value)}><option value="individual">Individual reflection</option><option value="shared">Shared exercise — invite my partner</option></select>
 <label className="label" htmlFor="title">Give this moment a short title (optional)</label><input className="input" id="title" value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. What did ‘best friend’ mean?"/>
 <label className="label" htmlFor="statement">What was said or what happened?</label><textarea className="textarea" id="statement" required maxLength={4000} value={statement} onChange={e=>setStatement(e.target.value)} placeholder="Describe the words or situation as accurately as you can."/>
 <label className="label" htmlFor="context">What was the context? (optional)</label><textarea className="textarea" id="context" maxLength={4000} value={context} onChange={e=>setContext(e.target.value)} placeholder="What were you discussing just before this?"/>
 <label className="label" htmlFor="heard">What did you understand it to mean?</label><textarea className="textarea" id="heard" required maxLength={4000} value={heard} onChange={e=>setHeard(e.target.value)} placeholder="Write your interpretation, even if you're unsure."/>
 <label className="label" htmlFor="feeling">How did it make you feel?</label><textarea className="textarea" id="feeling" required maxLength={2000} value={feeling} onChange={e=>setFeeling(e.target.value)} placeholder="Name the feelings without judging them."/>
 <label className="label" htmlFor="need">What do you need clarity or reassurance about?</label><textarea className="textarea" id="need" required maxLength={2000} value={need} onChange={e=>setNeed(e.target.value)} placeholder="What would you like to understand or ask?"/>
 {type==="shared"&&<div className="notice">This creates a shared exercise record. Your answers stay private until you choose to share them. Invite your partner from the exercise page.</div>}
 {error&&<div className="notice error">{error}</div>}<div className="form-actions"><button className="btn" disabled={busy}>{busy?"Saving…":"Save reflection"}</button><Link className="btn secondary" href="/dashboard">Cancel</Link></div>
 </form><p className="footer">You don't need to prove that your interpretation is right or wrong. The goal is to identify what you know, what you feel, and what you still need to ask.</p></main>
}
