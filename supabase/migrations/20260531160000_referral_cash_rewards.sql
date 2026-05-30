-- Referral v2: link referee↔referrer at signup/claim (no credit bonus).
-- Cash reward to referrer when referee pays a subscription package (webhook).

create table if not exists public.referral_reward_events (
  id uuid primary key default gen_random_uuid(),
  referrer_profile_id uuid not null references public.profiles (id) on delete cascade,
  referee_profile_id uuid not null references public.profiles (id) on delete cascade,
  payment_order_id uuid not null unique references public.payment_orders (id) on delete restrict,
  package_sku text not null,
  reward_vnd integer not null check (reward_vnd > 0),
  checkout_referral_code text,
  created_at timestamptz not null default now()
);

create index if not exists idx_referral_reward_events_referrer_created
  on public.referral_reward_events (referrer_profile_id, created_at desc);

create index if not exists idx_referral_reward_events_referee
  on public.referral_reward_events (referee_profile_id);

alter table public.profiles
  add column if not exists referral_reward_total_vnd integer not null default 0;

alter table public.profiles
  drop constraint if exists profiles_referral_reward_total_vnd_check;

alter table public.profiles
  add constraint profiles_referral_reward_total_vnd_check
  check (referral_reward_total_vnd >= 0);

comment on column public.profiles.referral_reward_total_vnd is
  'Tổng thưởng giới thiệu (VND) đã ghi nhận — cập nhật bởi grant_referral_subscription_reward.';

alter table public.referral_reward_events enable row level security;

drop policy if exists "Referrers read own reward events" on public.referral_reward_events;
create policy "Referrers read own reward events"
  on public.referral_reward_events for select
  using (auth.uid() = referrer_profile_id);

-- Checkout mã giới thiệu chỉ để ghi nhận referrer, không giảm giá referee.
insert into public.app_config (config_key, value)
values ('checkout_referral_discount_percent', '0')
on conflict (config_key) do update set
  value = excluded.value,
  updated_at = now();

-- Link referee to referrer once (signup / referral-claim). No credit grants.
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
  ref_referred_by uuid;
  ref_code text;
  refrr_code text;
  n int;
begin
  perform pg_advisory_xact_lock(hashtext('referral_pair:' || p_referee_id::text)::bigint);

  if p_referee_id is null or p_referrer_id is null or p_referee_id = p_referrer_id then
    return;
  end if;

  select referred_by, referral_code
    into ref_referred_by, ref_code
  from public.profiles
  where id = p_referee_id
  for update;

  if not found or ref_referred_by is not null then
    return;
  end if;

  select referral_code
    into refrr_code
  from public.profiles
  where id = p_referrer_id
  for update;

  if not found then
    return;
  end if;

  if upper(coalesce(ref_code, '')) = upper(coalesce(refrr_code, '')) then
    return;
  end if;

  update public.profiles
  set referred_by = p_referrer_id
  where id = p_referee_id
    and referred_by is null;

  get diagnostics n = row_count;
  if n = 0 then
    return;
  end if;
end;
$$;

comment on function public.apply_referral_pair(uuid, uuid) is
  'Links referee.referred_by to referrer (idempotent). Cash rewards on subscription purchase via grant_referral_subscription_reward.';

revoke all on function public.apply_referral_pair(uuid, uuid) from public;
grant execute on function public.apply_referral_pair(uuid, uuid) to service_role;

create or replace function public.reconcile_referral_reward_total(p_referrer_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  summed integer;
begin
  if p_referrer_id is null then
    return 0;
  end if;
  select coalesce(sum(reward_vnd), 0)::int into summed
  from public.referral_reward_events
  where referrer_profile_id = p_referrer_id;
  update public.profiles set referral_reward_total_vnd = summed where id = p_referrer_id;
  return summed;
end;
$$;

revoke all on function public.reconcile_referral_reward_total(uuid) from public;
grant execute on function public.reconcile_referral_reward_total(uuid) to service_role;

create or replace function public.count_distinct_referral_referees(p_referrer_id uuid)
returns integer
language sql
security definer
stable
set search_path = public
as $$
  select count(distinct referee_profile_id)::int
  from public.referral_reward_events
  where referrer_profile_id = p_referrer_id;
$$;

revoke all on function public.count_distinct_referral_referees(uuid) from public;
grant execute on function public.count_distinct_referral_referees(uuid) to service_role;

create or replace function public.grant_referral_subscription_reward(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  o record;
  referrer_id uuid;
  reward integer;
  code text;
  n int;
begin
  if p_order_id is null then
    return jsonb_build_object('ok', false, 'reason', 'bad_order_id');
  end if;

  select
    id,
    user_id,
    package_sku,
    status,
    referrer_profile_id,
    checkout_referral_code
  into o
  from public.payment_orders
  where id = p_order_id;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'order_not_found');
  end if;

  if o.status is distinct from 'paid' then
    return jsonb_build_object('ok', false, 'reason', 'order_not_paid');
  end if;

  reward := case o.package_sku
    when 'goi_1thang' then 10000
    when 'goi_6thang' then 30000
    when 'goi_12thang' then 50000
    else null
  end;

  if reward is null then
    return jsonb_build_object('ok', false, 'reason', 'package_not_eligible');
  end if;

  referrer_id := o.referrer_profile_id;

  if referrer_id is null then
    select referred_by into referrer_id
    from public.profiles
    where id = o.user_id;
  end if;

  if referrer_id is null or referrer_id = o.user_id then
    return jsonb_build_object('ok', false, 'reason', 'no_referrer');
  end if;

  if not exists (select 1 from public.profiles where id = referrer_id) then
    return jsonb_build_object('ok', false, 'reason', 'referrer_missing');
  end if;

  -- Backfill link when checkout carried a code but signup did not.
  update public.profiles
  set referred_by = referrer_id
  where id = o.user_id
    and referred_by is null;

  code := nullif(trim(upper(coalesce(o.checkout_referral_code, ''))), '');

  insert into public.referral_reward_events (
    referrer_profile_id,
    referee_profile_id,
    payment_order_id,
    package_sku,
    reward_vnd,
    checkout_referral_code
  ) values (
    referrer_id,
    o.user_id,
    o.id,
    o.package_sku,
    reward,
    code
  )
  on conflict (payment_order_id) do nothing;

  get diagnostics n = row_count;
  if n = 0 then
    perform public.reconcile_referral_reward_total(referrer_id);
    return jsonb_build_object('ok', true, 'reason', 'already_granted');
  end if;

  update public.profiles
  set referral_reward_total_vnd = referral_reward_total_vnd + reward
  where id = referrer_id;

  perform public.reconcile_referral_reward_total(referrer_id);

  return jsonb_build_object(
    'ok', true,
    'referrer_id', referrer_id,
    'referee_id', o.user_id,
    'reward_vnd', reward,
    'package_sku', o.package_sku
  );
end;
$$;

comment on function public.grant_referral_subscription_reward(uuid) is
  'Idempotent cash referral reward after paid subscription order. Service role only.';

revoke all on function public.grant_referral_subscription_reward(uuid) from public;
grant execute on function public.grant_referral_subscription_reward(uuid) to service_role;

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
         or new.referral_reward_total_vnd is distinct from old.referral_reward_total_vnd
       ) then
      raise exception 'Cannot modify credits, referral, or reward balance from this client'
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
