-- Lưu kết quả GET /v1/tieu-van đã mở khóa (trả lượng 1 lần / user / tháng / cùng dữ liệu sinh).

create table public.tieu_van_unlocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  year_month text not null,
  identity_key text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  constraint tieu_van_unlocks_year_month_format check (
    year_month ~ '^\d{4}-\d{2}$'
  ),
  constraint tieu_van_unlocks_user_month_identity unique (
    user_id,
    year_month,
    identity_key
  )
);

create index idx_tieu_van_unlocks_user_identity
  on public.tieu_van_unlocks (user_id, identity_key);

comment on table public.tieu_van_unlocks is
  'Tiểu vận đã mở khóa — payload từ Bát Tự; tránh trừ lượng lặp cho cùng tháng và cùng birth query.';

alter table public.tieu_van_unlocks enable row level security;

create policy "tieu_van_unlocks_select_own"
  on public.tieu_van_unlocks
  for select
  to authenticated
  using (auth.uid() = user_id);
