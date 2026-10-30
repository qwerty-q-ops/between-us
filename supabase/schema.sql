-- Between Us database schema
-- Run in Supabase SQL Editor after creating a project.
create extension if not exists pgcrypto;

create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete cascade,
  partner_id uuid references auth.users(id) on delete set null,
  title text not null default 'A conversation to understand',
  exercise_type text not null check (exercise_type in ('individual','shared')),
  status text not null default 'in_progress' check (status in ('in_progress','waiting','complete')),
  statement text not null,
  context text,
  my_interpretation text not null,
  my_feelings text not null,
  my_need text not null,
  analysis jsonb,
  invite_code text unique default encode(gen_random_bytes(18),'hex'),
  created_at timestamptz not null default now()
);

create table if not exists public.private_reflections (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null unique references public.exercises(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  interpretation text not null,
  feelings text not null,
  need_clarity_about text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.exercise_responses (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  intended_meaning text not null default '',
  feelings text not null default '',
  what_i_want_understood text not null default '',
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (exercise_id,user_id)
);

create index if not exists exercises_created_by_idx on public.exercises(created_by,created_at desc);
create index if not exists exercise_responses_exercise_idx on public.exercise_responses(exercise_id);

alter table public.exercises enable row level security;
alter table public.private_reflections enable row level security;
alter table public.exercise_responses enable row level security;

drop policy if exists "read own private reflection" on public.private_reflections;
create policy "read own private reflection" on public.private_reflections for select to authenticated
using (user_id = auth.uid());
drop policy if exists "insert own private reflection" on public.private_reflections;
create policy "insert own private reflection" on public.private_reflections for insert to authenticated
with check (user_id = auth.uid() and exists (
  select 1 from public.exercises e where e.id = exercise_id and e.created_by = auth.uid()
));
drop policy if exists "update own private reflection" on public.private_reflections;
create policy "update own private reflection" on public.private_reflections for update to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

-- A creator can access their exercises; a joined partner can access a shared exercise.
drop policy if exists "read own or joined exercises" on public.exercises;
create policy "read own or joined exercises" on public.exercises for select to authenticated
using (created_by = auth.uid() or partner_id = auth.uid());

drop policy if exists "create own exercises" on public.exercises;
create policy "create own exercises" on public.exercises for insert to authenticated
with check (created_by = auth.uid());

drop policy if exists "update own or joined exercises" on public.exercises;
create policy "update own or joined exercises" on public.exercises for update to authenticated
using (created_by = auth.uid() or partner_id = auth.uid())
with check (created_by = auth.uid() or partner_id = auth.uid());

drop policy if exists "delete own exercises" on public.exercises;
create policy "delete own exercises" on public.exercises for delete to authenticated
using (created_by = auth.uid());

-- Responses are visible only to their author. Shared analysis is saved to exercises
-- after both submit; the API route checks both submissions before calling the AI.
drop policy if exists "read own response" on public.exercise_responses;
create policy "read own response" on public.exercise_responses for select to authenticated
using (user_id = auth.uid());

drop policy if exists "insert own response for accessible exercise" on public.exercise_responses;
create policy "insert own response for accessible exercise" on public.exercise_responses for insert to authenticated
with check (user_id = auth.uid() and exists (
  select 1 from public.exercises e where e.id = exercise_id and (e.created_by = auth.uid() or e.partner_id = auth.uid()) and e.exercise_type = 'shared'
));

drop policy if exists "update own response" on public.exercise_responses;
create policy "update own response" on public.exercise_responses for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid() and exists (
  select 1 from public.exercises e where e.id = exercise_id and (e.created_by = auth.uid() or e.partner_id = auth.uid()) and e.exercise_type = 'shared'
));

drop policy if exists "delete own response" on public.exercise_responses;
create policy "delete own response" on public.exercise_responses for delete to authenticated
using (user_id = auth.uid());

-- Secure invite joining: only authenticated users can join an existing shared exercise.
create or replace function public.join_exercise_by_code(invite_code_input text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare found_id uuid;
declare owner_id uuid;
declare existing_partner uuid;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  select id, created_by, partner_id into found_id, owner_id, existing_partner
    from public.exercises where invite_code = invite_code_input and exercise_type = 'shared';
  if found_id is null then raise exception 'Invitation not found'; end if;
  if owner_id = auth.uid() then return found_id; end if;
  if existing_partner is not null and existing_partner <> auth.uid() then raise exception 'This invitation is already connected to another partner'; end if;
  update public.exercises set partner_id = auth.uid(), status = 'waiting' where id = found_id;
  return found_id;
end;
$$;
revoke all on function public.join_exercise_by_code(text) from public;
grant execute on function public.join_exercise_by_code(text) to authenticated;

-- Narrowly scoped function: returns submitted response fields only, and only to a participant
-- of this shared exercise. It does not expose responses through normal client queries.
create or replace function public.get_submitted_responses_for_analysis(exercise_id_input uuid)
returns table (user_id uuid, intended_meaning text, feelings text, what_i_want_understood text, submitted_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  if not exists (
    select 1 from public.exercises e
    where e.id = exercise_id_input and e.exercise_type = 'shared'
      and (e.created_by = auth.uid() or e.partner_id = auth.uid())
  ) then raise exception 'Not a participant in this exercise'; end if;
  return query
    select r.user_id, r.intended_meaning, r.feelings, r.what_i_want_understood, r.submitted_at
    from public.exercise_responses r
    where r.exercise_id = exercise_id_input and r.submitted_at is not null;
end;
$$;
revoke all on function public.get_submitted_responses_for_analysis(uuid) from public;
grant execute on function public.get_submitted_responses_for_analysis(uuid) to authenticated;
