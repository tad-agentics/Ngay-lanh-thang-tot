-- Saved picks: user-owned label metadata (intent, note, source).

alter table public.saved_picks
  add column if not exists intent text,
  add column if not exists note text,
  add column if not exists source text;

create policy "Users can update own saved picks"
  on public.saved_picks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
