import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/sign-out-button";

export default async function Dashboard() {
  const supabase = await createClient();
  const {data:{user}} = await supabase.auth.getUser();
  if(!user) redirect("/login");
  const {data: exercises} = await supabase.from("exercises").select("id,title,status,created_at,exercise_type").order("created_at",{ascending:false}).limit(8);
  return <main className="shell">
    <header className="topbar"><Link href="/dashboard" className="brand">between <span>us.</span></Link><div className="row"><span className="small">{user.email}</span><SignOutButton/></div></header>
    <section className="hero"><div className="eyebrow">A little more understanding</div><h1>There is more to a conversation than words.</h1><p>A private space for both of you to explore what you meant, what you heard, and how to meet each other with curiosity instead of assumptions.</p><div className="row" style={{marginTop:22}}><Link className="btn" href="/exercises/new">＋ Start a conversation</Link><Link className="btn secondary" href="/guide">How it works</Link></div></section>
    <div className="grid">
      <Link href="/exercises/new" className="card"><div className="iconbox">✧</div><h2>Understand a moment</h2><p>Explore a confusing or meaningful statement without assuming you already know what it meant.</p><span className="eyebrow">Start individually</span></Link>
      <Link href="/exercises/new?type=shared" className="card"><div className="iconbox">♡</div><h2>Bridge the gap</h2><p>Both partners share their perspective separately, then review the differences together.</p><span className="eyebrow">Do it together</span></Link>
      <Link href="/guide" className="card"><div className="iconbox">↗</div><h2>Say what you need</h2><p>Turn a difficult feeling into a clear, kind question or message.</p><span className="eyebrow">Communicate clearly</span></Link>
      <div className="card"><div className="iconbox">◌</div><h2>A shared principle</h2><p>Intent and impact can be different. Understanding one doesn't erase the other.</p><span className="eyebrow">No blame, no mind-reading</span></div>
    </div>
    <section style={{marginTop:42}}><div className="row between"><h2 className="section-title">Recent conversations</h2><Link className="btn ghost" href="/exercises/new">＋ New</Link></div>
      {exercises?.length ? <div className="list">{exercises.map((x:any)=><Link key={x.id} className="listitem" href={`/exercises/${x.id}`}><div><strong>{x.title}</strong><div className="small" style={{marginTop:5}}>{new Date(x.created_at).toLocaleDateString()} · {x.exercise_type==="shared"?"Together":"Individual reflection"}</div></div><span className={`pill ${x.status==="complete"?"open":""}`}>{x.status==="complete"?"Ready to review":x.status==="waiting"?"Waiting for partner":"In progress"}</span></Link>)}</div>:<div className="empty">No conversations yet. When you're ready, start with one moment you'd like to understand better.</div>}
    </section>
    <p className="footer">Between Us is a communication aid, not a therapist or a source of certainty about another person's intentions. You remain the experts on your own experiences.</p>
  </main>;
}
