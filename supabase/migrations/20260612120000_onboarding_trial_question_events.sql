-- Per-user audit log when onboarding free chat trial is consumed.

create table if not exists public.onboarding_trial_question_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  source text not null,
  context jsonb,
  turn_number integer not null check (turn_number >= 1),
  created_at timestamptz not null default now()
);

create index if not exists onboarding_trial_question_events_user_created_idx
  on public.onboarding_trial_question_events (user_id, created_at desc);

comment on table public.onboarding_trial_question_events is
  'Append-only log of successful onboarding trial chat consumes (never-sub free chat).';

alter table public.onboarding_trial_question_events enable row level security;

drop function if exists public.increment_onboarding_trial_question(uuid);

create or replace function public.increment_onboarding_trial_question(
  p_user uuid,
  p_source text default null,
  p_context jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  max_count int;
  row_used int;
  event_source text;
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

  event_source := nullif(trim(coalesce(p_source, '')), '');
  if event_source is not null then
    insert into public.onboarding_trial_question_events (
      user_id,
      source,
      context,
      turn_number
    ) values (
      p_user,
      event_source,
      p_context,
      row_used
    );
  end if;

  return jsonb_build_object(
    'used', row_used,
    'remaining', greatest(0, max_count - row_used),
    'limited', false
  );
end;
$$;

revoke all on function public.increment_onboarding_trial_question(uuid, text, jsonb) from public;
grant execute on function public.increment_onboarding_trial_question(uuid, text, jsonb) to service_role;
