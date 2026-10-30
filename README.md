# Between Us — couples communication companion

A mobile-friendly Next.js starter for two partners to reflect individually and explore communication differences together. Designed for Vercel + Supabase.

## What is included

- Email/password sign-in and account creation
- Personal dashboard and recent exercises
- Individual reflection form
- Shared exercise flow with partner invite link
- Separate partner response form
- AI analysis API endpoint (OpenAI-compatible OpenAI SDK)
- Fallback analysis if no AI key is configured
- Supabase schema with Row Level Security policies
- Warm, responsive UI and a communication guide

## Important: MVP starter, not a security-audited production platform

Private reflections are stored separately with Row Level Security. Partner responses are hidden from normal client queries, and a narrowly scoped database function returns submitted response fields only to a participant when the shared analysis API needs them. Still, test access control with two accounts before entering sensitive conversations, and complete the production checklist below.

## 1. Prerequisites

- Node.js 20 or newer
- A Supabase account/project
- A Vercel account
- Optional: OpenAI API key to enable personalised analysis

## 2. Install locally

```bash
npm install
cp .env.example .env.local
```

Fill `.env.local` with the Supabase Project URL and anon/public key. Add `OPENAI_API_KEY` and `OPENAI_MODEL` if you want AI analysis.

On Windows PowerShell, copy the example with:

```powershell
Copy-Item .env.example .env.local
```

## 3. Set up Supabase

1. Create a new Supabase project.
2. Open **SQL Editor**.
3. Run the complete `supabase/schema.sql` file.
4. In **Authentication → URL Configuration**, add your local URL `http://localhost:3000` and your deployed Vercel URL to the allowed redirect URLs.
5. For email/password auth, decide whether to require email confirmation. If enabled, configure the email provider and confirmation redirect URL.
6. Copy the Project URL and anon/public key into `.env.local`.

Do not use the Supabase service-role key as a `NEXT_PUBLIC_` variable or expose it in browser code.

## 4. Run

```bash
npm run dev
```

Open `http://localhost:3000`.

## 5. Deploy to Vercel

1. Push this project to a private GitHub repository.
2. In Vercel, import that repository.
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Optionally add `OPENAI_API_KEY` and `OPENAI_MODEL`.
5. Deploy.
6. Add the Vercel deployment URL to Supabase Auth's allowed redirect URLs.

## 6. Couple setup

1. Both partners create their own accounts.
2. One partner creates a **Shared exercise**.
3. On the exercise page, choose **Copy partner invite** and send the link to the other partner.
4. The invited partner signs in and joins the exercise.
5. Both submit their perspective before generating the shared analysis.

The shared exercise invite is a bearer link: anyone who obtains it while signed in may attempt to join if the exercise has no partner yet. Share it privately and consider adding expiry/revocation before production.

## 7. AI behaviour

The system prompt asks the AI to:
- distinguish what was said from possible interpretations;
- respect each person's feelings;
- label uncertain meanings as possibilities;
- avoid diagnosing or assigning blame;
- propose open questions and a concrete next step;
- avoid pressuring reconciliation or minimising repeated harm.

The AI is not a therapist and cannot know what either partner intended.

## 8. Before production use — checklist

- [ ] Independently audit the server-side response retrieval function and all RLS policies.
- [ ] Add an explicit preview/consent step before sharing any response or analysis.
- [ ] Add an explicit preview/consent step before sharing any response or analysis.
- [ ] Add invitation expiry, revocation, and rate limiting.
- [ ] Add account deletion and data export flows.
- [ ] Add request validation and rate limits to AI routes.
- [ ] Add a retention policy and clear explanation of what is sent to the AI provider.
- [ ] Test access control with two separate accounts, including attempts to read each other's response.
- [ ] Add automated tests and run a security review before real private data is entered.

## Folder layout

```text
app/
  api/analyze/route.ts
  auth/callback/route.ts
  dashboard/page.tsx
  exercises/new/page.tsx
  exercises/[id]/page.tsx
  join/[code]/page.tsx
  login/page.tsx
  guide/page.tsx
components/sign-out-button.tsx
lib/supabase/client.ts
lib/supabase/server.ts
supabase/schema.sql
```
