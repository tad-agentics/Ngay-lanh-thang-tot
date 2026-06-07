-- New-user onboarding: 5 lifetime free chat turns for never-subscribed users.

alter table public.profiles
  add column if not exists onboarding_trial_questions_used integer not null default 0;

alter table public.profiles
  add constraint profiles_onboarding_trial_questions_used_check
  check (onboarding_trial_questions_used >= 0);

comment on column public.profiles.onboarding_trial_questions_used is
  'Lifetime free chat turns used (never-sub only); max from app_config.onboarding_trial_questions_max (default 5).';

insert into public.app_config (config_key, value)
values ('onboarding_trial_questions_max', '5')
on conflict (config_key) do update set value = excluded.value;

create or replace function public.increment_onboarding_trial_question(p_user uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  max_count int;
  row_used int;
begin
  select coalesce(
    (select value::integer from public.app_config
     where config_key = 'onboarding_trial_questions_max'),
    5
  ) into max_count;

  if max_count < 1 then
    return jsonb_build_object('used', 0, 'remaining', 0, 'limited', true);
  end if;

  update public.profiles
  set onboarding_trial_questions_used = onboarding_trial_questions_used + 1,
      updated_at = now()
  where id = p_user
    and subscription_expires_at is null
    and onboarding_trial_questions_used < max_count
  returning onboarding_trial_questions_used into row_used;

  if row_used is null then
    select p.onboarding_trial_questions_used into row_used
    from public.profiles p
    where p.id = p_user;
    return jsonb_build_object(
      'used', coalesce(row_used, 0),
      'remaining', greatest(0, max_count - coalesce(row_used, 0)),
      'limited', true
    );
  end if;

  return jsonb_build_object(
    'used', row_used,
    'remaining', greatest(0, max_count - row_used),
    'limited', false
  );
end;
$$;

revoke all on function public.increment_onboarding_trial_question(uuid) from public;
grant execute on function public.increment_onboarding_trial_question(uuid) to service_role;

-- Extend entitlement write deny rules for trial counter.
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

  if tg_op = 'INSERT' then
    if auth.uid() is not null
       and auth.uid() = new.id
       and (
         new.subscription_expires_at is not null
         or new.bazi_reading_unlocked_at is not null
         or new.tieu_van_reading_expires_at is not null
         or new.la_so_recompute_status is not null
         or new.birth_edit_count is distinct from 0
         or new.birth_edit_window_start is not null
         or new.bazi_luan_click_count is distinct from 0
         or new.tieu_van_luan_click_count is distinct from 0
         or new.day_luan_follow_up_click_count is distinct from 0
         or new.onboarding_trial_questions_used is distinct from 0
         or new.credits_balance is distinct from 0
         or new.referred_by is not null
         or new.referral_reward_total_vnd is distinct from 0
       ) then
      raise exception 'Cannot set entitlements or server-managed fields on profile insert from this client'
        using errcode = 'check_violation';
    end if;
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

    if new.subscription_expires_at is distinct from old.subscription_expires_at
       or new.bazi_reading_unlocked_at is distinct from old.bazi_reading_unlocked_at
       or new.tieu_van_reading_expires_at is distinct from old.tieu_van_reading_expires_at
       or new.la_so_recompute_status is distinct from old.la_so_recompute_status
       or new.birth_edit_count is distinct from old.birth_edit_count
       or new.birth_edit_window_start is distinct from old.birth_edit_window_start
       or new.bazi_luan_click_count is distinct from old.bazi_luan_click_count
       or new.tieu_van_luan_click_count is distinct from old.tieu_van_luan_click_count
       or new.day_luan_follow_up_click_count is distinct from old.day_luan_follow_up_click_count
       or new.onboarding_trial_questions_used is distinct from old.onboarding_trial_questions_used
    then
      raise exception 'Cannot modify subscription entitlements or server-managed counters from this client'
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
