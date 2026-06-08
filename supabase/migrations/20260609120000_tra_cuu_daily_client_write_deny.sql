-- Defense in depth for tra_cuu_results_* and day_luan_daily_usage
-- (mirror day_luan_client_write_deny / tieu_van_unlocks pattern).

-- tra_cuu_results_threads: authenticated SELECT own rows; writes via Edge service_role.
create policy tra_cuu_results_threads_deny_insert
  on public.tra_cuu_results_threads
  as restrictive
  for insert
  to authenticated, anon
  with check (false);

create policy tra_cuu_results_threads_deny_update
  on public.tra_cuu_results_threads
  as restrictive
  for update
  to authenticated, anon
  using (false)
  with check (false);

create policy tra_cuu_results_threads_deny_delete
  on public.tra_cuu_results_threads
  as restrictive
  for delete
  to authenticated, anon
  using (false);

revoke insert, update, delete on table public.tra_cuu_results_threads from anon, authenticated;
grant select on table public.tra_cuu_results_threads to authenticated;

-- tra_cuu_results_ask_idempotency: Edge service_role only.
create policy tra_cuu_results_ask_idempotency_deny_insert
  on public.tra_cuu_results_ask_idempotency
  as restrictive
  for insert
  to authenticated, anon
  with check (false);

create policy tra_cuu_results_ask_idempotency_deny_update
  on public.tra_cuu_results_ask_idempotency
  as restrictive
  for update
  to authenticated, anon
  using (false)
  with check (false);

create policy tra_cuu_results_ask_idempotency_deny_delete
  on public.tra_cuu_results_ask_idempotency
  as restrictive
  for delete
  to authenticated, anon
  using (false);

revoke all on table public.tra_cuu_results_ask_idempotency from anon, authenticated;

-- day_luan_daily_usage: Edge service_role only (RPC counters).
create policy day_luan_daily_usage_deny_insert
  on public.day_luan_daily_usage
  as restrictive
  for insert
  to authenticated, anon
  with check (false);

create policy day_luan_daily_usage_deny_update
  on public.day_luan_daily_usage
  as restrictive
  for update
  to authenticated, anon
  using (false)
  with check (false);

create policy day_luan_daily_usage_deny_delete
  on public.day_luan_daily_usage
  as restrictive
  for delete
  to authenticated, anon
  using (false);

revoke all on table public.day_luan_daily_usage from anon, authenticated;
