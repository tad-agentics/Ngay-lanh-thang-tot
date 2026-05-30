-- Purchased Luận giải Bát Tự (full) — durable per user + flow year (not TTL reading_cache).

create table public.bazi_reading_deliveries (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  flow_year         smallint not null check (flow_year >= 2000 and flow_year <= 2100),
  birth_revision    text not null,
  content_version   text not null,
  sections          jsonb not null,
  la_so_display     jsonb,
  luu_nien_facts    jsonb,
  phong_thuy_facts  jsonb,
  year_can_chi      text not null default '',
  generated_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, flow_year)
);

create index idx_bazi_reading_deliveries_user_year
  on public.bazi_reading_deliveries (user_id, flow_year desc);

alter table public.bazi_reading_deliveries enable row level security;

create policy "Users select own bazi reading deliveries when entitled"
  on public.bazi_reading_deliveries for select
  using (
    auth.uid() = user_id
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and (
          p.bazi_reading_unlocked_at is not null
          or (
            p.subscription_expires_at is not null
            and p.subscription_expires_at > now()
          )
        )
    )
  );

comment on table public.bazi_reading_deliveries is
  'Full Bát Tự luận giải per user + lưu niên year; writes via Edge service_role only.';
