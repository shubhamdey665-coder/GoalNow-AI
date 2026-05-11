-- GoalNow-AI Supabase goals table
-- This table stores normal and complex goal trackers for authenticated users.

create extension if not exists "pgcrypto";

create table if not exists public.goals (
  id text primary key default gen_random_uuid()::text,

  user_id uuid not null references auth.users(id) on delete cascade,

  name text not null,
  category text not null,
  tracker_type text not null,

  duration text,
  priority text,

  target_date text,
  daily_time text,
  current_level text,
  target_result text,

  normal_target text,
  normal_frequency text,

  normal_check_ins jsonb not null default '[]'::jsonb,
  complex_plan_days jsonb not null default '[]'::jsonb,
  mentor_messages jsonb not null default '[]'::jsonb,

  active_day_number integer,

  latest_test_result jsonb,
  latest_test_date text,

  status text not null default 'active',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.goals enable row level security;

drop policy if exists "Users can read their own goals" on public.goals;
drop policy if exists "Users can create their own goals" on public.goals;
drop policy if exists "Users can update their own goals" on public.goals;
drop policy if exists "Users can delete their own goals" on public.goals;

create policy "Users can read their own goals"
on public.goals
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can create their own goals"
on public.goals
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own goals"
on public.goals
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own goals"
on public.goals
for delete
to authenticated
using (auth.uid() = user_id);

create index if not exists goals_user_id_idx
on public.goals(user_id);

create index if not exists goals_created_at_idx
on public.goals(created_at desc);

create index if not exists goals_status_idx
on public.goals(status);

create index if not exists goals_tracker_type_idx
on public.goals(tracker_type);