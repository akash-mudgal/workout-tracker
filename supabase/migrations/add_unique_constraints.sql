-- Required for upsert onConflict to work correctly across all three tables.
-- Run this in the Supabase SQL editor if you haven't already.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'daily_logs_user_session_date_key'
  ) THEN
    ALTER TABLE daily_logs
      ADD CONSTRAINT daily_logs_user_session_date_key UNIQUE (user_id, session_id, date);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'workout_history_user_session_date_key'
  ) THEN
    ALTER TABLE workout_history
      ADD CONSTRAINT workout_history_user_session_date_key UNIQUE (user_id, session_id, date);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'body_metrics_user_session_date_key'
  ) THEN
    ALTER TABLE body_metrics
      ADD CONSTRAINT body_metrics_user_session_date_key UNIQUE (user_id, session_id, date);
  END IF;
END $$;
