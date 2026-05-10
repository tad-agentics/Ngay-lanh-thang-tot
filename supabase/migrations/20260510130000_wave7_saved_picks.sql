-- Wave 7: saved picks — bookmark Bát Tự result snapshots per user.

create table if not exists public.saved_picks (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  saved_at         timestamptz not null default now(),
  source_endpoint  text not null,
  payload          jsonb not null,
  label            text,
  day_iso          text,
  score            numeric
);

create index idx_saved_picks_user_id
  on public.saved_picks (user_id);

create index idx_saved_picks_saved_at
  on public.saved_picks (user_id, saved_at desc);

alter table public.saved_picks enable row level security;

create policy "Users can select own saved picks"
  on public.saved_picks for select
  using (auth.uid() = user_id);

create policy "Users can insert own saved picks"
  on public.saved_picks for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own saved picks"
  on public.saved_picks for delete
  using (auth.uid() = user_id);
