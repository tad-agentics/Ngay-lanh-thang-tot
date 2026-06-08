-- Refund a reserved daily ask when rate-limit or LLM fails after increment.

create or replace function public.decrement_day_luan_daily(
  p_user uuid,
  p_vn_date date
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  row_count int;
begin
  update public.day_luan_daily_usage
  set count = count - 1
  where user_id = p_user
    and vn_date = p_vn_date
    and count > 0
  returning count into row_count;

  if row_count is not null then
    return row_count;
  end if;

  return coalesce(
    (select u.count from public.day_luan_daily_usage u
     where u.user_id = p_user and u.vn_date = p_vn_date),
    0
  );
end;
$$;

revoke all on function public.decrement_day_luan_daily(uuid, date) from public;
grant execute on function public.decrement_day_luan_daily(uuid, date) to service_role;
