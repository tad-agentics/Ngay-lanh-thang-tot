-- W3 personalization: lá số + birth lock — clients cannot mutate protected columns;
-- Edge (service_role) may update la_so, birth_data_locked_at, and birth fields on first commit.

create or replace function public.profiles_enforce_update_rules()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') = 'service_role' then
    return NEW;
  end if;

  if tg_op = 'UPDATE' then
    -- Only service_role may change lá số / lock timestamp
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

  return new;
end;
$$;

drop trigger if exists profiles_enforce_update_rules_trigger on public.profiles;

create trigger profiles_enforce_update_rules_trigger
  before update on public.profiles
  for each row
  execute function public.profiles_enforce_update_rules();
