-- Meals stored as JSONB alongside the daily log row
alter table daily_logs add column if not exists meals jsonb default '{}';

-- User profile table (weight, height) — one row per user
create table if not exists user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  weight_kg numeric,
  height_cm numeric,
  updated_at timestamptz default now()
);

alter table user_profiles enable row level security;

create policy "Users can manage own profile"
  on user_profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
