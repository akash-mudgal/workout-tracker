-- Fix: deleting a user from the Supabase dashboard failed with HTTP 500
--   ERROR: update or delete on table "users" violates foreign key constraint
--          "daily_logs_user_id_fkey" on table "daily_logs" (SQLSTATE 23503)
--
-- Cause: schema.sql declares `user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE`,
-- but it creates tables with CREATE TABLE IF NOT EXISTS. These four tables already
-- existed in the live project, so CREATE was skipped and the ON DELETE CASCADE clause
-- never applied. The constraints were left at the Postgres default, NO ACTION, which
-- blocks any delete of the parent auth.users row.
--
-- user_profiles was unaffected: it was genuinely created by add_meals_and_user_profile.sql,
-- so its CASCADE did take effect.
--
-- Re-running this file is safe.

ALTER TABLE public.sessions
  DROP CONSTRAINT IF EXISTS sessions_user_id_fkey,
  ADD  CONSTRAINT sessions_user_id_fkey
       FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.daily_logs
  DROP CONSTRAINT IF EXISTS daily_logs_user_id_fkey,
  ADD  CONSTRAINT daily_logs_user_id_fkey
       FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.workout_history
  DROP CONSTRAINT IF EXISTS workout_history_user_id_fkey,
  ADD  CONSTRAINT workout_history_user_id_fkey
       FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.body_metrics
  DROP CONSTRAINT IF EXISTS body_metrics_user_id_fkey,
  ADD  CONSTRAINT body_metrics_user_id_fkey
       FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- public.user_settings (user_id, start_date) is dead: nothing in src/ reads or writes it,
-- and sessions.start_date superseded it. It was also blocking user deletes.
-- Its FK has already been set to CASCADE in the live project as a stopgap; this drops it.
DROP TABLE IF EXISTS public.user_settings;
