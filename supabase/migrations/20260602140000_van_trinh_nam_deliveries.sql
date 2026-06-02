-- Purchased Luận giải lưu niên & lưu nguyệt (full) — durable per user + flow year.

create table public.van_trinh_nam_deliveries (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  flow_year         smallint not null check (flow_year >= 2000 and flow_year <= 2100),
  birth_revision    text not null,
  content_version   text not null,
  engine_version    text not null default '',
  luan_context      jsonb not null,
  sections          jsonb not null,
  year_can_chi      text not null default '',
  generated_at      timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (user_id, flow_year)
);

create index idx_van_trinh_nam_deliveries_user_year
  on public.van_trinh_nam_deliveries (user_id, flow_year desc);

alter table public.van_trinh_nam_deliveries enable row level security;

create policy "Users select own van trinh nam when entitled"
  on public.van_trinh_nam_deliveries for select
  using (
    auth.uid() = user_id
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and (
          (
            p.tieu_van_reading_expires_at is not null
            and p.tieu_van_reading_expires_at > now()
          )
          or (
            p.subscription_expires_at is not null
            and p.subscription_expires_at > now()
            and p.subscription_expires_at >= now() + interval '330 days'
          )
        )
    )
  );

comment on table public.van_trinh_nam_deliveries is
  'Full Vận trình năm (lưu niên + lưu nguyệt) per user + year; writes via Edge service_role only.';

revoke insert, update, delete on table public.van_trinh_nam_deliveries from anon, authenticated;
grant select on table public.van_trinh_nam_deliveries to authenticated;
