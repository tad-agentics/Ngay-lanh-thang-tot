-- Global day-luan follow-up quota: 10 asks / user / VN calendar day (shared pool).

create table public.day_luan_daily_usage (
  user_id   uuid not null references auth.users (id) on delete cascade,
  vn_date   date not null,
  count     int not null default 0 check (count >= 0 and count <= 10),
  primary key (user_id, vn_date)
);

create index idx_day_luan_daily_usage_vn_date
  on public.day_luan_daily_usage (vn_date);

alter table public.day_luan_daily_usage enable row level security;

comment on table public.day_luan_daily_usage is
  'Shared follow-up quota counter per user per Asia/Ho_Chi_Minh calendar day; Edge service_role only.';

revoke all on table public.day_luan_daily_usage from anon, authenticated;

create or replace function public.increment_day_luan_daily(
  p_user uuid,
  p_vn_date date
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  max_count constant int := 10;
  row_count int;
begin
  insert into public.day_luan_daily_usage as u (user_id, vn_date, count)
  values (p_user, p_vn_date, 0)
  on conflict (user_id, vn_date) do nothing;

  update public.day_luan_daily_usage
  set count = count + 1
  where user_id = p_user
    and vn_date = p_vn_date
    and count < max_count
  returning count into row_count;

  if row_count is null then
    select u.count into row_count
    from public.day_luan_daily_usage u
    where u.user_id = p_user and u.vn_date = p_vn_date;
    return jsonb_build_object(
      'count', coalesce(row_count, 0),
      'limited', true
    );
  end if;

  return jsonb_build_object('count', row_count, 'limited', false);
end;
$$;

revoke all on function public.increment_day_luan_daily(uuid, date) from public;
grant execute on function public.increment_day_luan_daily(uuid, date) to service_role;

create or replace function public.get_day_luan_daily_count(
  p_user uuid,
  p_vn_date date
)
returns int
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select count from public.day_luan_daily_usage
     where user_id = p_user and vn_date = p_vn_date),
    0
  );
$$;

revoke all on function public.get_day_luan_daily_count(uuid, date) from public;
grant execute on function public.get_day_luan_daily_count(uuid, date) to service_role;
