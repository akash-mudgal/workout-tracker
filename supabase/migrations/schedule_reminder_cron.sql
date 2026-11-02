-- Schedules the `send-reminders` Edge Function. Run this AFTER deploying the
-- function and setting its secrets, otherwise every tick will 404.
--
-- Prerequisite, run once by hand with the real key:
--   select vault.create_secret('<service-role-key>', 'service_role_key');
--
-- The key goes in Vault rather than inline in the job body, because cron.job is
-- readable by anyone who can read the database and the job body would otherwise
-- contain a credential in plain text.
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
        select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key'
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
