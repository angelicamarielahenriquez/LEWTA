-- OPTIONAL — NOT applied automatically.
-- Creates a table for the "Let your comments here" button on the welcome screen,
-- so comments from any device reach the Teacher Dashboard.
--
-- What it changes: adds ONE new table. It does not touch profiles, player_progress
-- or student_sessions, and it does not change any student data.
-- Security: anyone can SEND a comment (insert only). Nobody can read comments from the
-- browser; only the Teacher Dashboard server (secret key) can read them.

create table if not exists public.visitor_comments (
  id bigint generated always as identity primary key,
  name text not null default 'Anonymous' check (char_length(name) <= 60),
  message text not null check (char_length(message) between 1 and 1000),
  created_at timestamptz not null default now()
);

alter table public.visitor_comments enable row level security;
revoke all on public.visitor_comments from anon, authenticated;
grant insert (name, message) on public.visitor_comments to anon, authenticated;

drop policy if exists "Anyone can leave a comment" on public.visitor_comments;
create policy "Anyone can leave a comment"
  on public.visitor_comments for insert to anon, authenticated
  with check (true);
