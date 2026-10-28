-- LEWTA Supabase schema
-- Run this whole file in Supabase Dashboard -> SQL Editor -> New query.
-- This schema stores authenticated student profiles, persistent game progress,
-- and activity session snapshots. Guest mode intentionally remains local-only.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  first_name text not null default '',
  last_name text not null default '',
  username text not null default '',
  promotion text not null default '2026',
  role text not null default 'student' check (role in ('student', 'teacher')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_username_idx on public.profiles (lower(username));
create index if not exists profiles_last_name_idx on public.profiles (lower(last_name));

create table if not exists public.player_progress (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  progress jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.student_sessions (
  session_id uuid primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  student_type text not null default 'Account' check (student_type = 'Account'),
  first_name text not null default '',
  last_name text not null default '',
  username text not null default '',
  promotion text not null default '2026',
  session_start timestamptz not null default now(),
  session_end timestamptz,
  cities_visited text[] not null default array[]::text[],
  rounds_played jsonb not null default '[]'::jsonb,
  questions_completed integer not null default 0 check (questions_completed >= 0),
  question_attempts integer not null default 0 check (question_attempts >= 0),
  correct_answers integer not null default 0 check (correct_answers >= 0),
  incorrect_answers integer not null default 0 check (incorrect_answers >= 0),
  scores jsonb not null default '[]'::jsonb,
  events jsonb not null default '[]'::jsonb,
  game_progress jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists student_sessions_user_start_idx
  on public.student_sessions (user_id, session_start desc);

-- New accounts get a profile automatically. Role is always forced to student;
-- user-supplied signup metadata cannot grant teacher privileges.
create or replace function public.lewta_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, last_name, username, promotion, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    coalesce(new.raw_user_meta_data ->> 'username', split_part(coalesce(new.email, ''), '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'promotion', '2026'),
    'student'
  )
  on conflict (id) do update set
    email = excluded.email,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    username = excluded.username,
    promotion = excluded.promotion,
    updated_at = now();
  return new;
end;
$$;

revoke all on function public.lewta_handle_new_user() from public, anon, authenticated;

drop trigger if exists lewta_on_auth_user_created on auth.users;
create trigger lewta_on_auth_user_created
after insert on auth.users
for each row execute procedure public.lewta_handle_new_user();

-- Backfill auth users that may have been created before this SQL was run.
insert into public.profiles (id, email, first_name, last_name, username, promotion, role)
select
  users.id,
  users.email,
  coalesce(users.raw_user_meta_data ->> 'first_name', ''),
  coalesce(users.raw_user_meta_data ->> 'last_name', ''),
  coalesce(users.raw_user_meta_data ->> 'username', split_part(coalesce(users.email, ''), '@', 1)),
  coalesce(users.raw_user_meta_data ->> 'promotion', '2026'),
  'student'
from auth.users as users
on conflict (id) do nothing;

alter table public.profiles enable row level security;
alter table public.player_progress enable row level security;
alter table public.student_sessions enable row level security;

-- The client can read its own profile only. It cannot insert profiles or change
-- its role; the trusted auth trigger above creates profiles as students.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
drop policy if exists "LEWTA users can read their own profile" on public.profiles;
create policy "LEWTA users can read their own profile"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

revoke all on public.player_progress from anon, authenticated;
grant select, insert, update on public.player_progress to authenticated;
drop policy if exists "LEWTA users read own progress" on public.player_progress;
drop policy if exists "LEWTA users insert own progress" on public.player_progress;
drop policy if exists "LEWTA users update own progress" on public.player_progress;
create policy "LEWTA users read own progress"
  on public.player_progress for select to authenticated
  using (user_id = (select auth.uid()));
create policy "LEWTA users insert own progress"
  on public.player_progress for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "LEWTA users update own progress"
  on public.player_progress for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

revoke all on public.student_sessions from anon, authenticated;
grant select, insert, update on public.student_sessions to authenticated;
drop policy if exists "LEWTA users read own sessions" on public.student_sessions;
drop policy if exists "LEWTA users insert own sessions" on public.student_sessions;
drop policy if exists "LEWTA users update own sessions" on public.student_sessions;
create policy "LEWTA users read own sessions"
  on public.student_sessions for select to authenticated
  using (user_id = (select auth.uid()));
create policy "LEWTA users insert own sessions"
  on public.student_sessions for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "LEWTA users update own sessions"
  on public.student_sessions for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Only the server-side teacher API uses the Supabase secret key to read class-wide
-- data; that secret is never exposed to the browser. Guest records are not stored here.
