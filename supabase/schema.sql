-- ====================================================================
-- SPEAKUP — SUPABASE DATABASE SCHEMA & STORAGE CONFIGURATION
-- ====================================================================
-- Run this script in your Supabase SQL Editor:
-- (Supabase Dashboard -> SQL Editor -> New Query -> Paste & Run)
-- ====================================================================

-- 1. Create Practice Sessions Table
create table if not exists public.practice_sessions (
  id text primary key,
  user_id text not null default 'guest',
  mode text not null,
  topic_title text not null,
  topic_category text,
  topic_question text,
  topic_data jsonb,
  status text default 'completed',
  started_at timestamptz default now(),
  completed_at timestamptz,
  speaking_duration_sec integer default 0,
  original_transcript text,
  audio_blob_url text,
  evaluation jsonb,
  transcript_score integer default 0,
  performance_level text,
  created_at timestamptz default now()
);

-- Index for fast user history queries
create index if not exists idx_practice_sessions_user_id 
  on public.practice_sessions(user_id, started_at desc);

-- 2. Create User Progress Aggregate Table
create table if not exists public.user_progress (
  user_id text primary key default 'guest',
  total_sessions integer default 0,
  total_speaking_time_sec integer default 0,
  current_streak_days integer default 1,
  average_score integer default 0,
  score_trend jsonb default '[]'::jsonb,
  category_breakdown jsonb default '{}'::jsonb,
  updated_at timestamptz default now()
);

-- 3. Enable Row Level Security (RLS)
alter table public.practice_sessions enable row level security;
alter table public.user_progress enable row level security;

-- Public / Anonymous access policies (permits guest mode usage)
-- If you connect Supabase Auth, you can replace 'true' with '(auth.uid() = user_id)'
create policy "Allow all operations for practice_sessions"
  on public.practice_sessions for all
  using (true)
  with check (true);

create policy "Allow all operations for user_progress"
  on public.user_progress for all
  using (true)
  with check (true);

-- 4. Create Storage Bucket for Audio Recordings
insert into storage.buckets (id, name, public)
values ('speakup-audio', 'speakup-audio', true)
on conflict (id) do nothing;

-- Storage policies for the speakup-audio bucket
create policy "Public Access to SpeakUp Audio"
  on storage.objects for select
  using (bucket_id = 'speakup-audio');

create policy "Allow Audio Uploads to SpeakUp Audio"
  on storage.objects for insert
  with check (bucket_id = 'speakup-audio');

create policy "Allow Audio Deletes to SpeakUp Audio"
  on storage.objects for delete
  using (bucket_id = 'speakup-audio');
