-- Referral reward fixes: accurate referee count, reconcile total_vnd, grant idempotency.

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

  select coalesce(sum(reward_vnd), 0)::int
  into summed
  from public.referral_reward_events
  where referrer_profile_id = p_referrer_id;

  update public.profiles
  set referral_reward_total_vnd = summed
  where id = p_referrer_id;

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
  total int;
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
    total := public.reconcile_referral_reward_total(referrer_id);
    return jsonb_build_object(
      'ok', true,
      'reason', 'already_granted',
      'referrer_id', referrer_id,
      'total_reward_vnd', total
    );
  end if;

  update public.profiles
  set referral_reward_total_vnd = referral_reward_total_vnd + reward
  where id = referrer_id;

  total := public.reconcile_referral_reward_total(referrer_id);

  return jsonb_build_object(
    'ok', true,
    'referrer_id', referrer_id,
    'referee_id', o.user_id,
    'reward_vnd', reward,
    'package_sku', o.package_sku,
    'total_reward_vnd', total
  );
end;
$$;
