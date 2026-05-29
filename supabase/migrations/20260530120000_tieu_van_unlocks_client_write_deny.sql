-- tieu_van_unlocks: client may SELECT own rows only; writes via bat-tu Edge (service_role).
-- Defense in depth: RESTRICTIVE deny policies + table privilege revoke so a future
-- misconfigured permissive RLS policy cannot grant authenticated/anon INSERT/UPDATE/DELETE.

comment on table public.tieu_van_unlocks is
  'Tiểu vận đã mở khóa — payload từ Bát Tự. SELECT own rows (authenticated). Writes: bat-tu Edge (service_role) only.';

-- RESTRICTIVE policies AND with permissive grants — blocks writes even if a permissive allow is added later.
create policy tieu_van_unlocks_deny_insert
  on public.tieu_van_unlocks
  as restrictive
  for insert
  to authenticated, anon
  with check (false);

create policy tieu_van_unlocks_deny_update
  on public.tieu_van_unlocks
  as restrictive
  for update
  to authenticated, anon
  using (false)
  with check (false);

create policy tieu_van_unlocks_deny_delete
  on public.tieu_van_unlocks
  as restrictive
  for delete
  to authenticated, anon
  using (false);

revoke insert, update, delete on table public.tieu_van_unlocks from anon, authenticated;

grant select on table public.tieu_van_unlocks to authenticated;
