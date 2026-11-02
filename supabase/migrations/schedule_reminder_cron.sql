-- Schedules the `send-reminders` Edge Function. Run this AFTER deploying the
-- function and setting its secrets, otherwise every tick will 404.
--
-- Prerequisites, done once by hand:
--   1. Set CRON_SECRET as an Edge Function secret (any random string).
--   2. Store the SAME value in Vault:
--        select vault.create_secret('<the value>', 'cron_secret', 'kinetiq reminder cron');
--
-- A purpose-made token is used rather than the service role key. The cron only
-- needs to prove it may trigger reminders; a service key additionally bypasses
-- RLS on every table, so if the job definition ever leaked the blast radius
-- would be the whole database instead of a notification.
--
-- The token lives in Vault rather than inline, because cron.job is readable by
-- anyone with database access and the job body would otherwise hold a
-- credential in plain text.
--
-- Re-running this file is safe.

create extension if not exists pg_cron;

-- pg_net must be given a schema explicitly. Without the clause it registers
-- into `public`, which the Supabase linter flags (extension_in_public), and it
-- does not support ALTER EXTENSION ... SET SCHEMA afterwards — the only fix is
-- to drop and recreate it. Its functions live in `net` either way.
create extension if not exists pg_net with schema extensions;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'kinetiq-send-reminders') then
    perform cron.unschedule('kinetiq-send-reminders');
  end if;
end $$;

-- Every 15 minutes. The function itself decides what is actually due, because
-- that depends on each user's timezone and on whether they already logged — so
-- the schedule stays dumb and the decision stays in one place.
select cron.schedule(
  'kinetiq-send-reminders',
  '*/15 * * * *',
  $job$
  select net.http_post(
    url := 'https://kilerejglanqlvyinhbv.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret'
      )
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  $job$
);

-- Useful afterwards:
--   select jobid, jobname, schedule, active from cron.job;
--   select * from cron.job_run_details order by start_time desc limit 20;
--
-- Force a test push immediately, without waiting for the schedule and without
-- the token ever leaving the database:
--   select net.http_post(
--     url := 'https://kilerejglanqlvyinhbv.supabase.co/functions/v1/send-reminders',
--     headers := jsonb_build_object('Content-Type','application/json',
--       'Authorization','Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name='cron_secret')),
--     body := '{"test": true}'::jsonb);
--   -- then read the reply:
--   select id, status_code, content from net._http_response order by id desc limit 1;
