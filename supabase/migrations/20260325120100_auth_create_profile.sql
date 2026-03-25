-- Create profiles row on signup (starter credits from app_config or default 20)
-- SECURITY DEFINER: runs as function owner to bypass RLS on profiles / credit_ledger insert

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  starter integer;
begin
  select value::integer into starter
  from public.app_config
  where config_key = 'starter_credits'
  limit 1;

  starter := coalesce(starter, 20);

  insert into public.profiles (id, email, credits_balance)
  values (new.id, new.email, starter);

  insert into public.credit_ledger (
    user_id,
    delta,
    balance_after,
    reason,
    feature_key,
    metadata
  )
  values (
    new.id,
    starter,
    starter,
    'starter_grant',
    null,
    jsonb_build_object('source', 'auth.users insert')
  );

  return new;
end;
$$;

comment on function public.handle_new_user() is
  'Creates public.profiles + initial credit_ledger row when auth.users row is inserted. Starter amount from app_config.starter_credits or 20.';

-- Idempotent: safe if migration was partially applied or trigger exists from earlier deploy
drop trigger if exists on_auth_user_created on auth.users;

-- Supabase: trigger lives on auth schema
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
