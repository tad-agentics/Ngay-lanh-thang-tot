-- Referral: unique code per profile, bonus both sides from app_config.referral_bonus_credits
-- handle_new_user applies referral from raw_user_meta_data.referral_code / .ref; Edge invokes apply_referral_pair via service_role.

alter table public.profiles
  add column if not exists referral_code text,
  add column if not exists referred_by uuid references public.profiles (id) on delete set null;

comment on column public.profiles.referral_code is 'Unique invite code (UPPER), generated at signup.';
comment on column public.profiles.referred_by is 'Profile id of referrer if referral bonus was applied.';

create index if not exists idx_profiles_referred_by on public.profiles (referred_by);

insert into public.app_config (config_key, value) values
  ('referral_bonus_credits', '10')
on conflict (config_key) do update set
  value = excluded.value,
  updated_at = now();

do $$
declare
  r record;
  cand text;
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i int;
  j int;
  tries int;
begin
  for r in select id from public.profiles where referral_code is null
  loop
    tries := 0;
    loop
      cand := '';
      for i in 1..8 loop
        j := 1 + floor(random() * length(alphabet))::int;
        cand := cand || substr(alphabet, j, 1);
      end loop;
      exit when not exists (
        select 1 from public.profiles p where p.referral_code = cand
      );
      tries := tries + 1;
      if tries > 200 then
        raise exception 'referral backfill: could not generate unique code for %', r.id;
      end if;
    end loop;
    update public.profiles set referral_code = cand where id = r.id;
  end loop;
end;
$$;

alter table public.profiles
  alter column referral_code set not null;

create unique index if not exists profiles_referral_code_key on public.profiles (referral_code);

create or replace function public.apply_referral_pair(
  p_referee_id uuid,
  p_referrer_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  bonus integer;
  ref_credits integer;
  refrr_credits integer;
  ref_referred_by uuid;
  ref_code text;
  refrr_code text;
  n int;
begin
  perform pg_advisory_xact_lock(hashtext('referral_pair:' || p_referee_id::text)::bigint);

  if p_referee_id is null or p_referrer_id is null or p_referee_id = p_referrer_id then
    return;
  end if;

  select value::integer into bonus
  from public.app_config
  where config_key = 'referral_bonus_credits'
  limit 1;
  bonus := coalesce(bonus, 10);
  if bonus <= 0 then
    return;
  end if;

  if exists (
    select 1 from public.credit_ledger
    where idempotency_key = 'referral_referee:' || p_referee_id::text
  ) then
    return;
  end if;

  select credits_balance, referred_by, referral_code
    into ref_credits, ref_referred_by, ref_code
  from public.profiles
  where id = p_referee_id
  for update;

  if not found or ref_referred_by is not null then
    return;
  end if;

  select credits_balance, referral_code
    into refrr_credits, refrr_code
  from public.profiles
  where id = p_referrer_id
  for update;

  if not found then
    return;
  end if;

  if upper(coalesce(ref_code, '')) = upper(coalesce(refrr_code, '')) then
    return;
  end if;

  ref_credits := ref_credits + bonus;
  refrr_credits := refrr_credits + bonus;

  update public.profiles
  set
    credits_balance = ref_credits,
    referred_by = p_referrer_id
  where id = p_referee_id
    and referred_by is null;

  get diagnostics n = row_count;
  if n = 0 then
    return;
  end if;

  update public.profiles
  set credits_balance = refrr_credits
  where id = p_referrer_id;

  insert into public.credit_ledger (
    user_id,
    delta,
    balance_after,
    reason,
    feature_key,
    idempotency_key,
    metadata
  ) values (
    p_referee_id,
    bonus,
    ref_credits,
    'referral_bonus_referee',
    null,
    'referral_referee:' || p_referee_id::text,
    jsonb_build_object(
      'referrer_id', p_referrer_id,
      'referee_id', p_referee_id,
      'bonus', bonus
    )
  );

  insert into public.credit_ledger (
    user_id,
    delta,
    balance_after,
    reason,
    feature_key,
    idempotency_key,
    metadata
  ) values (
    p_referrer_id,
    bonus,
    refrr_credits,
    'referral_bonus_referrer',
    null,
    'referral_referrer:' || p_referrer_id::text || ':' || p_referee_id::text,
    jsonb_build_object(
      'referrer_id', p_referrer_id,
      'referee_id', p_referee_id,
      'bonus', bonus
    )
  );
end;
$$;

comment on function public.apply_referral_pair(uuid, uuid) is
  'Grants referral bonus to referee and referrer; idempotent. Call via service_role (Edge) or from handle_new_user.';

revoke all on function public.apply_referral_pair(uuid, uuid) from public;
grant execute on function public.apply_referral_pair(uuid, uuid) to service_role;

create or replace function public.profiles_enforce_update_rules()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if coalesce((select auth.jwt() ->> 'role'), '') = 'service_role'
     or coalesce(auth.role(), '') = 'service_role' then
    return NEW;
  end if;

  if tg_op = 'UPDATE' then
    if auth.uid() is not null
       and auth.uid() = new.id
       and (
         new.credits_balance is distinct from old.credits_balance
         or new.referred_by is distinct from old.referred_by
         or new.referral_code is distinct from old.referral_code
       ) then
      raise exception 'Cannot modify credits, referral code, or referrer from this client'
        using errcode = 'check_violation';
    end if;

    if new.la_so is distinct from old.la_so
       or new.birth_data_locked_at is distinct from old.birth_data_locked_at then
      raise exception 'Cannot modify lá số from this client'
        using errcode = 'check_violation';
    end if;

    if old.birth_data_locked_at is not null then
      if new.ngay_sinh is distinct from old.ngay_sinh
         or new.gio_sinh is distinct from old.gio_sinh
         or new.gioi_tinh is distinct from old.gioi_tinh then
        raise exception 'Birth data is locked'
          using errcode = 'check_violation';
      end if;
    end if;
  end if;

  return NEW;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  starter integer;
  ref_code text;
  incoming text;
  referrer_id uuid;
  new_code text;
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i int;
  j int;
  tries int;
begin
  select value::integer into starter
  from public.app_config
  where config_key = 'starter_credits'
  limit 1;
  starter := coalesce(starter, 20);

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
      raise exception 'handle_new_user: could not generate referral_code';
    end if;
  end loop;

  insert into public.profiles (id, email, credits_balance, referral_code)
  values (new.id, new.email, starter, new_code);

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

  incoming := null;
  if new.raw_user_meta_data is not null then
    incoming := new.raw_user_meta_data->>'referral_code';
    if incoming is null or trim(incoming) = '' then
      incoming := new.raw_user_meta_data->>'ref';
    end if;
  end if;

  if incoming is not null and trim(incoming) != '' then
    ref_code := upper(trim(incoming));
    select id into referrer_id
    from public.profiles
    where upper(referral_code) = ref_code
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
  'Creates profile + starter_grant + referral_code; applies referral from raw_user_meta_data.referral_code or .ref.';
