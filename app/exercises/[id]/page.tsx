 "use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Exercise = {id:string;title:string;created_by:string;exercise_type:string;status:string;statement:string;context:string|null;my_interpretation:string;my_feelings:string;my_need:string;analysis:any;invite_code:string|null};
type ResponseRow = {id:string;user_id:string;intended_meaning:string;feelings:string;what_i_want_understood:string;submitted_at:string|null};
export default function ExercisePage(){
 const {id}=useParams<{id:string}>();const supabase=createClient();
 const [exercise,setExercise]=useState<Exercise|null>(null);const [responses,setResponses]=useState<ResponseRow[]>([]);const [privateReflection,setPrivateReflection]=useState<{interpretation:string;feelings:string;need_clarity_about:string}|null>(null);const [userId,setUserId]=useState("");const [myResponse,setMyResponse]=useState({intended_meaning:"",feelings:"",what_i_want_understood:""});const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");const [loading,setLoading]=useState(true);
 async function load(){const {data:{user}}=await supabase.auth.getUser();if(!user){window.location.href="/login";return}setUserId(user.id);
  const {data:ex,error}=await supabase.from("exercises").select("*").eq("id",id).single();if(error){setMessage(error.message);setLoading(false);return}setExercise(ex as Exercise);
  const {data:privateRow}=await supabase.from("private_reflections").select("interpretation,feelings,need_clarity_about").eq("exercise_id",id).maybeSingle();setPrivateReflection(privateRow);
  const {data:rows}=await supabase.from("exercise_responses").select("*").eq("exercise_id",id);setResponses((rows||[]) as ResponseRow[]);
  const mine=(rows||[]).find((r:any)=>r.user_id===user.id);if(mine)setMyResponse({intended_meaning:mine.intended_meaning||"",feelings:mine.feelings||"",what_i_want_understood:mine.what_i_want_understood||""});
  setLoading(false);
 }
 useEffect(()=>{load()},[id]);
 const mine=responses.find(r=>r.user_id===userId);const partner=responses.find(r=>r.user_id!==userId);
 async function saveResponse(e:React.FormEvent){e.preventDefault();setBusy(true);setMessage("");
  const {error}=await supabase.from("exercise_responses").upsert({exercise_id:id,user_id:userId,...myResponse,submitted_at:new Date().toISOString()},{onConflict:"exercise_id,user_id"});
  setBusy(false);if(error){setMessage(error.message);return}setMessage("Your response is saved. It remains private from your partner until the shared analysis is generated.");await load();
 }
 async function generate(){setBusy(true);setMessage("");const res=await fetch("/api/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({exerciseId:id})});const data=await res.json();setBusy(false);if(!res.ok){setMessage(data.error||"Could not generate analysis.");return}setMessage("The shared analysis is ready.");await load()}
 async function invite(){if(!exercise)return;const url=`${window.location.origin}/join/${exercise.invite_code}`;await navigator.clipboard.writeText(url);setMessage("Invite link copied. Send it to your partner. Anyone with this link must still sign in, and it only grants access to this exercise.");}
 if(loading)return <main className="shell">Loading your conversation…</main>;
 if(!exercise)return <main className="shell"><div className="notice error">{message||"Conversation not found or you do not have access."}</div><Link href="/dashboard">Return to dashboard</Link></main>;
 const analysis=exercise.analysis;
 return <main className="shell"><header className="topbar"><Link className="brand" href="/dashboard">between <span>us.</span></Link><Link className="btn secondary" href="/dashboard">Dashboard</Link></header>
 <div className="eyebrow">{exercise.exercise_type==="shared"?"Shared conversation":"Individual reflection"}</div><h1 className="section-title" style={{fontSize:38}}>{exercise.title}</h1>
 <div className="card"><div className="eyebrow">The moment</div><p style={{whiteSpace:"pre-wrap",lineHeight:1.75}}>{exercise.statement}</p>{exercise.context&&<><div className="eyebrow">Context</div><p style={{whiteSpace:"pre-wrap"}}>{exercise.context}</p></>}
 </div>{privateReflection&&<div className="card" style={{marginTop:14}}><div className="eyebrow">Your private reflection — only visible to you</div><div className="eyebrow" style={{marginTop:14}}>Your interpretation</div><p style={{whiteSpace:"pre-wrap"}}>{privateReflection.interpretation}</p><div className="eyebrow">Your feelings</div><p style={{whiteSpace:"pre-wrap"}}>{privateReflection.feelings}</p><div className="eyebrow">What you need clarity about</div><p style={{whiteSpace:"pre-wrap"}}>{privateReflection.need_clarity_about}</p></div>}
 {exercise.exercise_type==="shared"&&<section style={{marginTop:26}}><h2 className="section-title">Share both perspectives</h2><p className="small">Your answers are not shown to your partner through this page. The shared analysis is created only after both people submit a response. Be honest, and share only what you are comfortable sharing.</p>
 <form className="card form" onSubmit={saveResponse}>
 <label className="label">What were you trying to communicate?</label><textarea className="textarea" required maxLength={4000} value={myResponse.intended_meaning} onChange={e=>setMyResponse({...myResponse,intended_meaning:e.target.value})} placeholder="What did you mean, or what do you think was important?"/>
 <label className="label">What were you feeling?</label><textarea className="textarea" required maxLength={2000} value={myResponse.feelings} onChange={e=>setMyResponse({...myResponse,feelings:e.target.value})} placeholder="Describe your experience without assigning blame."/>
 <label className="label">What do you want your partner to understand?</label><textarea className="textarea" required maxLength={2000} value={myResponse.what_i_want_understood} onChange={e=>setMyResponse({...myResponse,what_i_want_understood:e.target.value})} placeholder="What matters most to you?"/>
 <button className="btn" disabled={busy} style={{marginTop:20}}>{busy?"Saving…":"Submit my perspective"}</button></form>
 <div className="row" style={{marginTop:14}}><span className="pill">{mine?.submitted_at?"Your response submitted":"Your response not submitted"}</span><span className="pill">{partner?.submitted_at?"Partner response submitted":"Waiting for partner"}</span></div>
 <div className="row" style={{marginTop:16}}><button className="btn secondary" onClick={invite}>Copy partner invite</button><button className="btn" disabled={busy||!mine?.submitted_at||!partner?.submitted_at} onClick={generate}>{busy?"Working…":"Create shared analysis"}</button></div>
 </section>}
 {analysis&&<section style={{marginTop:30}}><div className="eyebrow">A shared view — not a verdict</div><h2 className="section-title">What might be happening between you</h2>
 {Object.entries(analysis).map(([key,value])=><div className="result-section" key={key}><h3>{key.replaceAll("_"," ").replace(/^\w/,c=>c.toUpperCase())}</h3>{Array.isArray(value)?<ul>{value.map((v:any,i)=><li key={i}>{String(v)}</li>)}</ul>:<p style={{whiteSpace:"pre-wrap"}}>{String(value)}</p>}</div>)}
 </section>}
 {message&&<div className="notice" style={{marginTop:20}}>{message}</div>}
 <p className="footer">The AI can suggest possibilities, but it cannot know what either of you intended. Use the analysis as a starting point for a conversation, not as a verdict.</p></main>
}
