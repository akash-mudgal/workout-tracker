-- Reminders never worked when the app was closed. They were scheduled with
-- setTimeout inside the page (src/utils/notifications.js), so the timers died
-- with the tab and a reminder only arrived if the PWA happened to be left open
-- past the trigger time. There was no Web Push, no VAPID and no server
-- component anywhere, despite a commit claiming "push notifications".
--
-- Real push needs three things in the database: somewhere to keep the browser's
-- subscription, preferences a *server* can read (they were in localStorage,
-- invisible to any backend), and a record of what was already sent so a
-- 15-minute cron can't send the same nudge twice.
--
-- Re-running this file is safe.

-- ── push_subscriptions ────────────────────────────────────────────────────────
-- One row per browser/device. The endpoint is the natural key: the push service
-- issues a new one whenever it rotates, and the old row should be replaced.
create table if not exists public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  endpoint   text not null,
  p256dh     text not null,
  auth       text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  constraint push_subscriptions_endpoint_key unique (endpoint)
);

-- Leading user_id covers the foreign key for cascade deletes, and serves the
-- only read the sender makes: every subscription for one user.
create index if not exists idx_push_subscriptions_user
  on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "push_subscriptions: own rows" on public.push_subscriptions;
create policy "push_subscriptions: own rows" on public.push_subscriptions
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ── notification_prefs ───────────────────────────────────────────────────────
-- timezone is the point of this table. The database runs in UTC and the user is
-- in IST, so "remind me at 18:00" is meaningless without knowing whose 18:00.
create table if not exists public.notification_prefs (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  enabled       boolean not null default false,
  remind_hour   smallint not null default 18 check (remind_hour between 0 and 23),
  remind_minute smallint not null default 0  check (remind_minute between 0 and 59),
  last_call_hour smallint not null default 21 check (last_call_hour between 0 and 23),
  last_call_enabled boolean not null default true,
  weekly_digest boolean not null default true,
  timezone      text not null default 'UTC',
  updated_at    timestamptz not null default now()
);

alter table public.notification_prefs enable row level security;

drop policy if exists "notification_prefs: own rows" on public.notification_prefs;
create policy "notification_prefs: own rows" on public.notification_prefs
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ── notification_log ─────────────────────────────────────────────────────────
-- The sender runs every 15 minutes, so it needs to know what it already sent.
-- Keyed by the user's LOCAL date, not UTC, so "once a day" means once a day
-- where the user actually is.
create table if not exists public.notification_log (
  user_id    uuid not null references auth.users(id) on delete cascade,
  kind       text not null check (kind in ('daily', 'last_call', 'weekly')),
  local_date date not null,
  sent_at    timestamptz not null default now(),
  primary key (user_id, kind, local_date)
);

alter table public.notification_log enable row level security;

-- Written only by the sender using the service role, which bypasses RLS. The
-- user can read their own history; no client-side write policy is granted.
drop policy if exists "notification_log: read own" on public.notification_log;
create policy "notification_log: read own" on public.notification_log
  for select
  to authenticated
  using ((select auth.uid()) = user_id);
