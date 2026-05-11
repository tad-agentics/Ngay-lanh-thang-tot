-- Wave 7: daily open streaks + check-ins + RPC to record visits idempotently.

-- ─── daily_check_ins ────────────────────────────────────────────────────────
create table if not exists public.daily_check_ins (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  day_iso    text not null,
  opened_at  timestamptz not null default now(),

  constraint daily_check_ins_user_day unique (user_id, day_iso)
);

create index idx_daily_check_ins_user_day
  on public.daily_check_ins (user_id, day_iso);

alter table public.daily_check_ins enable row level security;

create policy "Users can select own check-ins"
  on public.daily_check_ins for select
  using (auth.uid() = user_id);

create policy "Users can insert own check-ins"
  on public.daily_check_ins for insert
  with check (auth.uid() = user_id);

-- ─── streaks ────────────────────────────────────────────────────────────────
create table if not exists public.streaks (
  user_id       uuid primary key references auth.users (id) on delete cascade,
  current_count int not null default 0,
  longest_count int not null default 0,
  last_check_in text,
  started_at    date,
  updated_at    timestamptz not null default now()
);

alter table public.streaks enable row level security;

create policy "Users can select own streak"
  on public.streaks for select
  using (auth.uid() = user_id);

create policy "Users can upsert own streak"
  on public.streaks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own streak"
  on public.streaks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── record_daily_visit ───────────────────────────────────────────────────────
-- SECURITY DEFINER: updates streaks under RLS as owner. Callers must match JWT.
create or replace function public.record_daily_visit(
  p_user_id uuid,
  p_day_iso text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inserted bigint;
  v_day        date;
  r            public.streaks%rowtype;
begin
  if p_user_id is distinct from auth.uid() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  v_day := p_day_iso::date;

  insert into public.daily_check_ins (user_id, day_iso)
  values (p_user_id, p_day_iso)
  on conflict (user_id, day_iso) do nothing;

  get diagnostics v_inserted = row_count;

  if v_inserted = 0 then
    return (
      select row_to_json(s.*)::json
      from public.streaks s
      where s.user_id = p_user_id
    );
  end if;

  insert into public.streaks (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  select *
    into r
    from public.streaks
   where user_id = p_user_id
   for update;

  if not found then
    raise exception 'streak row missing after upsert';
  end if;

  if r.last_check_in is not null and r.last_check_in = p_day_iso then
    return row_to_json(r.*)::json;
  end if;

  if r.last_check_in is null then
    update public.streaks
       set current_count = 1,
           longest_count = greatest(longest_count, 1),
           last_check_in = p_day_iso,
           started_at    = v_day,
           updated_at    = now()
     where user_id = p_user_id
     returning * into r;
    return row_to_json(r.*)::json;
  end if;

  if (r.last_check_in::date + 1) = v_day then
    update public.streaks
       set current_count = r.current_count + 1,
           longest_count = greatest(r.longest_count, r.current_count + 1),
           last_check_in = p_day_iso,
           updated_at    = now()
     where user_id = p_user_id
     returning * into r;
    return row_to_json(r.*)::json;
  end if;

  update public.streaks
     set current_count = 1,
         last_check_in = p_day_iso,
         started_at    = v_day,
         updated_at    = now()
   where user_id = p_user_id
   returning * into r;

  return row_to_json(r.*)::json;
end;
$$;

revoke all on function public.record_daily_visit(uuid, text) from public;
grant execute on function public.record_daily_visit(uuid, text) to authenticated;
