 "use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
export default function JoinPage(){const {code}=useParams<{code:string}>();const [message,setMessage]=useState("Checking invitation…");
 useEffect(()=>{(async()=>{const supabase=createClient();const {data:{user}}=await supabase.auth.getUser();if(!user){window.location.href=`/login?next=/join/${code}`;return}
 const {data,error}=await supabase.rpc("join_exercise_by_code",{invite_code_input:code});
 if(error){setMessage("This invitation could not be accepted. Ask your partner to create a new link, and check that you are signed in.");return}
 window.location.href=`/exercises/${data}`;
 })()},[code]);
 return <main className="auth"><section className="card auth-card"><div className="brand">between <span>us.</span></div><h1>Joining your shared conversation</h1><p>{message}</p></section></main>}
