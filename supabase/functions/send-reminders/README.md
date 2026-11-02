# send-reminders

Sends the daily logging reminders as Web Push, so they arrive with the app
closed. Before this existed, reminders were `setTimeout` calls inside the page:
the timers died with the tab, which meant a reminder only ever fired if the PWA
had been left open past the trigger time.

## Deploy

Five steps, in order. Nothing works until all five are done.

**1. Apply the migrations** (SQL editor, or MCP). Order matters only in that the
cron schedule must come last.

```
supabase/migrations/add_push_notifications.sql
supabase/migrations/schedule_reminder_cron.sql   # after the function is deployed
```

**2. Generate VAPID keys** — already done once; the public half is in `.env` as
`VITE_VAPID_PUBLIC_KEY`. To rotate, run this and update both places (every
existing subscription is invalidated by a rotation):

```sh
node scripts/generate-vapid-keys.mjs
```

**3. Set the function secrets.**

```sh
npx supabase secrets set VAPID_KEYS='<the JWK pair from step 2>'
npx supabase secrets set VAPID_CONTACT='mailto:you@example.com'
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected by the platform —
do not set them.

**4. Deploy.**

```sh
npx supabase functions deploy send-reminders
```

`verify_jwt = false` is set in `supabase/config.toml`: the caller is cron, not a
signed-in user, and the function authorises by comparing the bearer token to
`SUPABASE_SERVICE_ROLE_KEY` itself.

**5. Store the service role key in Vault, then schedule the cron.**

```sql
select vault.create_secret('<service-role-key>', 'service_role_key');
```

Then run `supabase/migrations/schedule_reminder_cron.sql`.

## Verify

The only test that counts is a notification arriving with the app fully closed
and the phone locked. Force one immediately, bypassing the schedule:

```sh
curl -X POST 'https://<project>.supabase.co/functions/v1/send-reminders' \
  -H 'Authorization: Bearer <service-role-key>' \
  -H 'Content-Type: application/json' \
  -d '{"test": true}'
```

This sends to every subscription belonging to every user with reminders
enabled, ignoring both the schedule and the already-sent log. If nothing
arrives, check in this order:

```sql
select * from push_subscriptions;                                   -- did the browser subscribe?
select * from notification_prefs;                                   -- enabled, and the right timezone?
select * from cron.job_run_details order by start_time desc limit 10; -- is cron firing?
select * from notification_log order by sent_at desc limit 10;       -- did it think it already sent?
```

Function logs are in the dashboard under Edge Functions → send-reminders.

## How "due" is decided

The schedule is deliberately dumb — every 15 minutes, always. The function
decides what is actually due, because that depends on each user's timezone and
on whether they already logged, and that logic belongs in one place.

- **daily** — at or after the user's `remind_hour:remind_minute` in their own
  timezone, if no workout is logged for their local date.
- **last_call** — same, at or after `last_call_hour`.
- **weekly** — Monday from 09:00 local, with counts from the last 7 days.

`notification_log` is keyed on `(user_id, kind, local_date)`, so each kind sends
at most once per local day. That is what lets the window be generous: a missed
run recovers on the next tick instead of skipping the day, and a run that
overlaps itself can't send twice.

A row is only written once a push actually reached at least one subscription, so
a transient failure is retried rather than silently swallowed.
