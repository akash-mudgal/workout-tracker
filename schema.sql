-- ─────────────────────────────────────────────────────────────────────────────
-- Workout Tracker — full schema
-- Run this in Supabase SQL Editor (or any Postgres instance) to bootstrap.
-- Requires the pgcrypto / uuid-ossp extension for gen_random_uuid().
-- Supabase enables this by default; on vanilla Postgres run:
--   CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- ─────────────────────────────────────────────────────────────────────────────

-- ── sessions ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  start_date  date NOT NULL,
  plan_id     text NOT NULL DEFAULT 'ppl',
  total_days  integer NOT NULL DEFAULT 90,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ── daily_logs ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id  uuid REFERENCES sessions(id) ON DELETE CASCADE,
  date        date NOT NULL,
  water       integer NOT NULL DEFAULT 0,
  steps       integer NOT NULL DEFAULT 0,
  protein     integer NOT NULL DEFAULT 0,
  calories    integer NOT NULL DEFAULT 0,
  sleep       numeric(4,1) NOT NULL DEFAULT 0,
  supplements jsonb NOT NULL DEFAULT '{}',
  UNIQUE (user_id, session_id, date)
);

-- ── workout_history ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workout_history (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id   uuid REFERENCES sessions(id) ON DELETE CASCADE,
  date         date NOT NULL,
  workout_id   text NOT NULL,
  workout_name text NOT NULL,
  duration_min integer NOT NULL DEFAULT 0,
  exercises    jsonb NOT NULL DEFAULT '[]',
  UNIQUE (user_id, session_id, date)
);

-- ── body_metrics ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS body_metrics (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE,
  date       date NOT NULL,
  weight     numeric(5,2),
  waist      numeric(5,2),
  notes      text,
  UNIQUE (user_id, session_id, date)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- Each user can only read and write their own rows.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE sessions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_metrics  ENABLE ROW LEVEL SECURITY;

-- sessions
CREATE POLICY "sessions: own rows" ON sessions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- daily_logs
CREATE POLICY "daily_logs: own rows" ON daily_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- workout_history
CREATE POLICY "workout_history: own rows" ON workout_history
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- body_metrics
CREATE POLICY "body_metrics: own rows" ON body_metrics
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Indexes (performance for per-user, per-session queries)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_sessions_user        ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_session   ON daily_logs(user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_workout_history_session ON workout_history(user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_body_metrics_session  ON body_metrics(user_id, session_id);
