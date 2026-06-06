-- C1: Block client UPDATE of entitlement and server-managed profile columns.

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

    if new.subscription_expires_at is distinct from old.subscription_expires_at
       or new.bazi_reading_unlocked_at is distinct from old.bazi_reading_unlocked_at
       or new.tieu_van_reading_expires_at is distinct from old.tieu_van_reading_expires_at
       or new.la_so_recompute_status is distinct from old.la_so_recompute_status
       or new.birth_edit_count is distinct from old.birth_edit_count
       or new.birth_edit_window_start is distinct from old.birth_edit_window_start
       or new.bazi_luan_click_count is distinct from old.bazi_luan_click_count
       or new.tieu_van_luan_click_count is distinct from old.tieu_van_luan_click_count
       or new.day_luan_follow_up_click_count is distinct from old.day_luan_follow_up_click_count
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

comment on function public.profiles_enforce_update_rules is
  'Blocks client writes to credits, referral, entitlements, lá số, birth lock, and engagement counters.';
