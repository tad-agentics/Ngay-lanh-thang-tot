-- Wave 5: AI reading bulk-unlock + pinned_readings
-- Must land before the AR-04 / AR-05 frontend ships.

-- ─── 1. ai_reading_bulk_unlock credit cost (3× single-section cost) ──────────
-- Current single-section cost = ai_reading_unlock = 1 credit.
-- Bulk = 3 × 1 = 3 credits. Hard-coded here for transparency; if the single
-- price changes in the future, create a new migration.
insert into public.feature_credit_costs (feature_key, credit_cost, is_free)
values ('ai_reading_bulk_unlock', 3, false)
on conflict (feature_key) do update set
  credit_cost = excluded.credit_cost,
  is_free     = excluded.is_free,
  updated_at  = now();

-- ─── 2. pinned_readings table ────────────────────────────────────────────────
create table if not exists public.pinned_readings (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  -- Opaque reference stored as-is — the frontend passes (scope, day_iso, section).
  scope       text not null,
  day_iso     date not null,
  section     text not null default 'all',
  -- Snapshot of the reading text at pin time (optional — useful for offline).
  reading_snapshot text,
  pinned_at   timestamptz not null default now(),

  unique (user_id, scope, day_iso, section)
);

create index idx_pinned_readings_user_id on public.pinned_readings (user_id);

alter table public.pinned_readings enable row level security;

create policy "Users can read own pinned readings"
  on public.pinned_readings for select
  using (auth.uid() = user_id);

create policy "Users can insert own pinned readings"
  on public.pinned_readings for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own pinned readings"
  on public.pinned_readings for delete
  using (auth.uid() = user_id);
