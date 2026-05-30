-- Direction C: retire Web Push, habit streak loop, and pinned readings.
-- FE push UI + cron-push-habit + pin-reading Edge removed in same pivot.

drop function if exists public.record_daily_visit(uuid, text);

drop table if exists public.pinned_readings;
drop table if exists public.daily_check_ins;
drop table if exists public.streaks;
drop table if exists public.push_subscriptions;

drop index if exists public.idx_profiles_push_token;

alter table public.profiles
  drop column if exists push_token,
  drop column if exists push_notifications_enabled,
  drop column if exists push_enabled;
