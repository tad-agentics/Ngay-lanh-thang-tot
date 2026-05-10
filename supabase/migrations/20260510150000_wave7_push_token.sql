-- Wave 7: profile push token + notification opt-in (cron-push-habit).

alter table public.profiles
  add column if not exists push_token text;

alter table public.profiles
  add column if not exists push_notifications_enabled boolean not null default false;

create index if not exists idx_profiles_push_token
  on public.profiles (push_token)
  where push_token is not null;
