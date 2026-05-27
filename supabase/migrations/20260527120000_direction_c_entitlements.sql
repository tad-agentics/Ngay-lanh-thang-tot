-- Direction C: subscription entitlements + profile recompute / birth-edit limits

alter table public.profiles
  add column if not exists bazi_reading_unlocked_at timestamptz,
  add column if not exists tieu_van_reading_expires_at timestamptz,
  add column if not exists la_so_recompute_status text
    check (la_so_recompute_status is null or la_so_recompute_status in ('pending', 'ready', 'failed')),
  add column if not exists birth_edit_count integer not null default 0,
  add column if not exists birth_edit_window_start timestamptz,
  add column if not exists timezone text not null default 'Asia/Ho_Chi_Minh';

comment on column public.profiles.bazi_reading_unlocked_at is 'Perpetual unlock for Luận giải Bát tự (standalone or yearly bundle).';
comment on column public.profiles.tieu_van_reading_expires_at is 'Expiry for Luận giải Tiểu Vận standalone purchase.';
comment on column public.profiles.la_so_recompute_status is 'pending while lá số recompute runs after birth edit.';

insert into public.app_config (config_key, value)
values
  ('pivot_transition_until', (now() + interval '90 days')::text),
  ('birth_edit_max_per_30d', '2')
on conflict (config_key) do update set value = excluded.value, updated_at = now();
