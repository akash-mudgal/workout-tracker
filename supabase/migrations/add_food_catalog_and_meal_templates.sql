-- Food logging was the slowest thing in the app: anything outside the 12
-- hardcoded quick-add items had to be retyped (name, protein, calories) every
-- single day, and there was no way to grow or search the list.
--
-- `foods` is the user's own catalog, so a dish is typed once and tapped after
-- that, ranked by how often they actually eat it. `meal_templates` turns a
-- repeated combination ("my usual breakfast") into one tap.
--
-- Re-running this file is safe.

-- ── foods ─────────────────────────────────────────────────────────────────────
create table if not exists public.foods (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  protein_g    numeric(6,2) not null default 0 check (protein_g >= 0),
  kcal         numeric(7,2) not null default 0 check (kcal >= 0),
  use_count    integer not null default 0 check (use_count >= 0),
  last_used_at timestamptz,
  created_at   timestamptz not null default now(),
  constraint foods_user_name_key unique (user_id, name)
);

-- Serves the only query this table has — the user's catalog, most-used first.
-- Its leading user_id column also covers the foreign key for cascade deletes.
create index if not exists idx_foods_user_rank
  on public.foods (user_id, use_count desc, last_used_at desc nulls last);

alter table public.foods enable row level security;

-- auth.uid() is wrapped in a subselect so it is evaluated once per statement
-- rather than once per row.
drop policy if exists "foods: own rows" on public.foods;
create policy "foods: own rows" on public.foods
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ── meal_templates ────────────────────────────────────────────────────────────
create table if not exists public.meal_templates (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  slot       text,
  items      jsonb not null default '[]'::jsonb check (jsonb_typeof(items) = 'array'),
  created_at timestamptz not null default now(),
  -- The leading user_id also covers the foreign key for cascade deletes.
  constraint meal_templates_user_name_key unique (user_id, name)
);

alter table public.meal_templates enable row level security;

drop policy if exists "meal_templates: own rows" on public.meal_templates;
create policy "meal_templates: own rows" on public.meal_templates
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
