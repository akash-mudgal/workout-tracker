# send-reminders

Sends the daily logging reminders as Web Push, so they arrive with the app
closed. Before this existed, reminders were `setTimeout` calls inside the page:
the timers died with the tab, which meant a reminder only ever fired if the PWA
had been left open past the trigger time.

## Deployed state

All of this is live on project `kilerejglanqlvyinhbv`:

- Tables from `add_push_notifications.sql`, RLS verified enforced.
- Function deployed with `verify_jwt = false` (the caller is cron, not a
  signed-in user; the function authorises itself — see below).
- `pg_cron` and `pg_net` installed, `pg_net` in the `extensions` schema.
- Cron job `kinetiq-send-reminders` active on `*/15 * * * *`.

## Authorisation

The cron presents a `CRON_SECRET`: a purpose-made random token, set as an Edge
Function secret and stored in Vault under `cron_secret`. Both halves must match.

A service role key was deliberately **not** used. The cron only needs to prove
it may trigger reminders, whereas a service key also bypasses RLS on every
table — so a leak would expose the database rather than a notification.

Note that Vault is not optional. The cron runs inside Postgres and Edge
Function secrets are not visible there; the two stores are separate, so each
end needs its own copy of the shared token.

The function also accepts a service key as a fallback, and uses
`SUPABASE_SECRET_KEYS` — not the deprecated `SUPABASE_SERVICE_ROLE_KEY` — for
its own PostgREST calls, so it keeps working when the legacy JWT is disabled.

## Secrets

Set at **Edge Functions → Secrets**:

| Name | Value |
|---|---|
| `VAPID_KEYS` | JWK pair from `node scripts/generate-vapid-keys.mjs` |
| `VAPID_CONTACT` | `mailto:…`, required by RFC 8292 |
| `CRON_SECRET` | any random string, also stored in Vault as `cron_secret` |

`SUPABASE_URL`, `SUPABASE_SECRET_KEYS` and `SUPABASE_SERVICE_ROLE_KEY` are
injected by the platform. Do not set them; names starting `SUPABASE_` are
rejected anyway.

The matching **public** key goes in `.env` and in Vercel as
`VITE_VAPID_PUBLIC_KEY`. It must be exposed to the browser — it is passed to
`pushManager.subscribe()` as `applicationServerKey`. Rotating the pair
invalidates every existing subscription, so rotate before devices subscribe,
and redeploy the frontend before subscribing or the browser will bind to the
old key and every push will be rejected.

## Verify

Force a push immediately, without waiting for the schedule and without the
token leaving the database:

```sql
select net.http_post(
  url := 'https://kilerejglanqlvyinhbv.supabase.co/functions/v1/send-reminders',
  headers := jsonb_build_object('Content-Type','application/json',
    'Authorization','Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name='cron_secret')),
  body := '{"test": true}'::jsonb);

select id, status_code, content from net._http_response order by id desc limit 1;
```

A `200` with `{"ok":true,...}` proves the token matches, the function is
reachable, and `VAPID_KEYS` parses — that last one is only checked at runtime,
after authorisation, so this call is the only way to confirm it.

`"users": 0` means no one has reminders enabled yet. `"sent": {}` with users > 0
means nothing was due.

If a notification still doesn't arrive, check in this order:

```sql
select count(*) from push_subscriptions;                              -- did the browser subscribe?
select enabled, timezone, remind_hour from notification_prefs;        -- enabled, right timezone?
select * from cron.job_run_details order by start_time desc limit 10; -- is cron firing?
select * from notification_log order by sent_at desc limit 10;        -- did it think it already sent?
```

Function logs are in the dashboard under Edge Functions → send-reminders. A
boot line reports which key sources are present, by name and count only, never
values.

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
