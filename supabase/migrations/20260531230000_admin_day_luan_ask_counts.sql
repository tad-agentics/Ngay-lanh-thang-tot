-- Admin aggregate: follow-up AI asks in "luận giải ngày" (day-luan-chat ask, status=done).

create or replace function public.admin_day_luan_ask_counts(p_user_ids uuid[])
returns table(user_id uuid, ask_count bigint)
language sql
security definer
set search_path = public
as $$
  select
    t.user_id,
    count(*)::bigint as ask_count
  from public.day_luan_ask_idempotency i
  inner join public.day_luan_threads t on t.id = i.thread_id
  where t.user_id = any (p_user_ids)
    and i.status = 'done'
  group by t.user_id;
$$;

revoke all on function public.admin_day_luan_ask_counts(uuid[]) from public;
revoke all on function public.admin_day_luan_ask_counts(uuid[]) from anon;
revoke all on function public.admin_day_luan_ask_counts(uuid[]) from authenticated;
grant execute on function public.admin_day_luan_ask_counts(uuid[]) to service_role;

comment on function public.admin_day_luan_ask_counts is
  'Admin-only (service_role): total completed day-luan AI follow-up asks per user.';
