import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {data:{user}} = await supabase.auth.getUser();
    if (!user) return NextResponse.json({error:"Please sign in first."},{status:401});
    const body = await request.json();
    const exerciseId = String(body.exerciseId || "");
    if (!exerciseId) return NextResponse.json({error:"Missing conversation ID."},{status:400});
    const {data:exercise,error:exerciseError} = await supabase.from("exercises").select("*").eq("id",exerciseId).single();
    if (exerciseError || !exercise) return NextResponse.json({error:"Conversation not found or access denied."},{status:404});
    if (exercise.exercise_type !== "shared") return NextResponse.json({error:"Shared analysis is available for shared exercises."},{status:400});
    const {data:responses,error} = await supabase.rpc("get_submitted_responses_for_analysis",{exercise_id_input:exerciseId});
    if (error) return NextResponse.json({error:"Could not load responses. Check the database setup and access rules."},{status:500});
    const submitted = (responses||[]).filter((r:any)=>r.submitted_at);
    if (submitted.length < 2) return NextResponse.json({error:"Both partners need to submit their perspectives before creating a shared analysis."},{status:400});
    if (!submitted.some((r:any)=>r.user_id===user.id)) return NextResponse.json({error:"Submit your own perspective before generating the analysis."},{status:403});

    const promptData = {
      moment: exercise.statement, context: exercise.context,
      partner_perspectives: submitted.map((r:any,i:number)=>({perspective:`Partner ${i+1}`,intended_meaning:r.intended_meaning,feelings:r.feelings,what_they_want_understood:r.what_i_want_understood}))
    };
    let analysis:any;
    if (process.env.OPENAI_API_KEY) {
      const client = new OpenAI({apiKey:process.env.OPENAI_API_KEY});
      const completion = await client.chat.completions.create({
        model:process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature:0.35,
        response_format:{type:"json_object"},
        messages:[
          {role:"system",content:`You are a balanced couples communication facilitator, not a therapist or judge. Return valid JSON with these keys: "shared_ground", "where_meanings_may_differ", "possible_feelings_and_needs", "what_is_unknown", "questions_to_ask_each_other", "a_gentle_next_step", "important_note". Use plain language. Do not diagnose, assign blame, infer intentions as facts, or assume both perspectives are equally reasonable in every situation. Clearly label hypotheses as possibilities. Respect each person's feelings while distinguishing feelings from evidence about intent. Do not pressure reconciliation or minimise repeated harm. Suggest 2-4 specific open questions. Keep the response concise and actionable.`},
          {role:"user",content:JSON.stringify(promptData)}
        ]
      });
      const content = completion.choices[0]?.message?.content;
      if(!content) throw new Error("The AI returned an empty response.");
      analysis=JSON.parse(content);
    } else {
      analysis = {
        shared_ground:["Both perspectives deserve to be heard before deciding what the conversation meant."],
        where_meanings_may_differ:["The same words can carry different meanings for each person. The available information is not enough to establish the speaker's intention."],
        possible_feelings_and_needs:["One person may be seeking clarity or reassurance; the other may be trying to express something different. Ask rather than assume."],
        what_is_unknown:["What each person intended beyond what they explicitly wrote.","Whether this is a one-time wording difference or part of a recurring pattern."],
        questions_to_ask_each_other:["When you said that, what did you most want me to understand?","I heard it as ____. Is that what you meant, or did you mean something different?","What would help each of us feel understood next time?"],
        a_gentle_next_step:"Take turns reflecting back what you heard before responding. Each person can correct the summary without debating the other's feelings.",
        important_note:"AI analysis is not configured yet, so this is a starter reflection. Add OPENAI_API_KEY to enable personalised analysis."
      };
    }
    const {error:updateError}=await supabase.from("exercises").update({analysis,status:"complete"}).eq("id",exerciseId);
    if(updateError) return NextResponse.json({error:"Analysis was created but could not be saved. Check database policies."},{status:500});
    return NextResponse.json({analysis});
  } catch (e:any) {
    console.error("Analysis error:",e?.message||"unknown");
    return NextResponse.json({error:"Could not create the analysis. Check the AI API key/model and server logs, then try again."},{status:500});
  }
}
