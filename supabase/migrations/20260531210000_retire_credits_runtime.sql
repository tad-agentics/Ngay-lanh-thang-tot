-- Direction C: retire starter credits for new signups (subscription-only product).
-- Existing profiles.credits_balance / credit_ledger rows are kept for audit.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, credits_balance)
  values (new.id, new.email, 0);

  return new;
end;
$$;

comment on function public.handle_new_user() is
  'Creates public.profiles on auth.users insert. credits_balance=0 (legacy column; no starter grant).';

insert into public.app_config (config_key, value)
values
  ('starter_credits', '0'),
  ('pivot_transition_until', '1970-01-01T00:00:00Z')
on conflict (config_key) do update set
  value = excluded.value,
  updated_at = now();
