-- Fix: handle_new_user must generate referral_code (NOT NULL).
-- 20260531210000_retire_credits_runtime.sql simplified the trigger and dropped
-- referral_code generation, but profiles.referral_code is NOT NULL (set in
-- 20260429120000_referral.sql). Every signup since then fails with:
--   "null value in column referral_code violates not-null constraint"
-- which Supabase reports as "Database error saving new user".

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_code text;
  incoming text;
  referrer_id uuid;
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i int;
  j int;
  tries int;
begin
  -- Generate unique referral_code (required NOT NULL).
  tries := 0;
  loop
    new_code := '';
    for i in 1..8 loop
      j := 1 + floor(random() * length(alphabet))::int;
      new_code := new_code || substr(alphabet, j, 1);
    end loop;
    exit when not exists (
      select 1 from public.profiles p where p.referral_code = new_code
    );
    tries := tries + 1;
    if tries > 200 then
      raise exception 'handle_new_user: could not generate unique referral_code';
    end if;
  end loop;

  insert into public.profiles (id, email, credits_balance, referral_code)
  values (new.id, new.email, 0, new_code);

  -- Apply referral if signup carried a referral code in metadata.
  incoming := null;
  if new.raw_user_meta_data is not null then
    incoming := new.raw_user_meta_data->>'referral_code';
    if incoming is null or trim(incoming) = '' then
      incoming := new.raw_user_meta_data->>'ref';
    end if;
  end if;

  if incoming is not null and trim(incoming) != '' then
    select id into referrer_id
    from public.profiles
    where upper(referral_code) = upper(trim(incoming))
      and id != new.id
    limit 1;
    if referrer_id is not null then
      perform public.apply_referral_pair(new.id, referrer_id);
    end if;
  end if;

  return new;
end;
$$;

comment on function public.handle_new_user() is
  'Creates public.profiles on auth.users insert. Generates unique referral_code (NOT NULL). credits_balance=0 (subscription-only product). Applies referral from raw_user_meta_data if present.';
