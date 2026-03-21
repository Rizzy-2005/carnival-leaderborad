-- Carnival Leaderboard System - Initial Schema
-- This matches the actual database schema

-- Enable extension for UUID generation
create extension if not exists "pgcrypto";

--------------------------------------------------
-- Students
--------------------------------------------------
create table if not exists public.students (
  student_id uuid primary key default gen_random_uuid(),
  username text unique not null,
  phone text unique not null,
  college text,
  total_points integer default 0,
  created_at timestamptz default now()
);

--------------------------------------------------
-- Admins
--------------------------------------------------
create table if not exists public.admins (
  admin_id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password text not null,
  role text check (role in ('ADMIN','SUPER_ADMIN')) default 'ADMIN',
  created_at timestamptz default now()
);

--------------------------------------------------
-- Games
--------------------------------------------------
create table if not exists public.games (
  game_id uuid primary key default gen_random_uuid(),
  game_name text not null,
  status text check (status in ('ACTIVE','INACTIVE')) default 'ACTIVE',
  created_at timestamptz default now()
);

--------------------------------------------------
-- Scores
--------------------------------------------------
create table if not exists public.scores (
  score_id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(student_id) on delete cascade,
  game_id uuid references public.games(game_id),
  points integer check (points > 0),
  created_by uuid references public.admins(admin_id),
  created_at timestamptz default now()
);

--------------------------------------------------
-- Score Logs
--------------------------------------------------
create table if not exists public.score_logs (
  log_id uuid primary key default gen_random_uuid(),
  score_id uuid,
  student_id uuid,
  game_id uuid,
  points integer,
  action_type text check (action_type in ('ADD','DELETE','EDIT')),
  created_by uuid references public.admins(admin_id),
  old_points integer,
  new_points integer,
  created_at timestamptz default now()
);

--------------------------------------------------
-- Realtime
--------------------------------------------------
-- Enable realtime updates for scores table
alter publication supabase_realtime add table public.scores;