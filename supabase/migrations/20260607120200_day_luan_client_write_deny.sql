-- H4: day_luan_* defense in depth (mirror tieu_van_unlocks pattern).

create policy day_luan_threads_deny_insert
  on public.day_luan_threads
  as restrictive
  for insert
  to authenticated, anon
  with check (false);

create policy day_luan_threads_deny_update
  on public.day_luan_threads
  as restrictive
  for update
  to authenticated, anon
  using (false)
  with check (false);

create policy day_luan_threads_deny_delete
  on public.day_luan_threads
  as restrictive
  for delete
  to authenticated, anon
  using (false);

revoke insert, update, delete on table public.day_luan_threads from anon, authenticated;
grant select on table public.day_luan_threads to authenticated;

create policy day_luan_ask_idempotency_deny_insert
  on public.day_luan_ask_idempotency
  as restrictive
  for insert
  to authenticated, anon
  with check (false);

create policy day_luan_ask_idempotency_deny_update
  on public.day_luan_ask_idempotency
  as restrictive
  for update
  to authenticated, anon
  using (false)
  with check (false);

create policy day_luan_ask_idempotency_deny_delete
  on public.day_luan_ask_idempotency
  as restrictive
  for delete
  to authenticated, anon
  using (false);

revoke all on table public.day_luan_ask_idempotency from anon, authenticated;
