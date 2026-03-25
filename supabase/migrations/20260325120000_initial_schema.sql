-- Initial schema — Ngày Lành Tháng Tốt
-- Source of truth: artifacts/docs/tech-spec.md

-- ─── profiles (1:1 with auth.users) ─────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  ngay_sinh date,
  gio_sinh time,
  gioi_tinh text check (gioi_tinh in ('nam', 'nu')),
  la_so jsonb,
  credits_balance integer not null default 0 check (credits_balance >= 0),
  subscription_expires_at timestamptz,
  birth_data_locked_at timestamptz,
  onboarding_completed_at timestamptz,
  push_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_profiles_email on public.profiles (email);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Insert own row after signup (auth trigger typically handles — policy allows insert self)
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ─── feature credit costs (public read) ──────────────────────────────────
create table public.feature_credit_costs (
  feature_key text primary key,
  credit_cost integer not null default 0,
  is_free boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.feature_credit_costs enable row level security;

create policy "Anyone can read feature costs"
  on public.feature_credit_costs for select
  using (true);

-- ─── app config (public read for non-secret keys) ────────────────────────
create table public.app_config (
  config_key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table public.app_config enable row level security;

create policy "Anyone can read app config"
  on public.app_config for select
  using (true);

-- ─── credit ledger ───────────────────────────────────────────────────────
create table public.credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  delta integer not null,
  balance_after integer not null,
  reason text not null,
  feature_key text references public.feature_credit_costs (feature_key),
  idempotency_key text unique,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_credit_ledger_user_id on public.credit_ledger (user_id);
create index idx_credit_ledger_created_at on public.credit_ledger (created_at desc);

alter table public.credit_ledger enable row level security;

create policy "Users can read own credit ledger"
  on public.credit_ledger for select
  using (auth.uid() = user_id);

-- Writes only via service_role (Edge Functions) — no insert/update policies for authenticated

-- ─── PayOS payment orders ────────────────────────────────────────────────
create table public.payment_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null default 'payos',
  provider_order_code text unique,
  status text not null default 'pending' check (status in ('pending', 'paid', 'cancelled', 'failed')),
  package_sku text not null,
  credits_to_add integer,
  subscription_months integer,
  amount_vnd integer,
  checkout_url text,
  raw_request jsonb,
  raw_webhook jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_payment_orders_user_id on public.payment_orders (user_id);
create index idx_payment_orders_status on public.payment_orders (status);

alter table public.payment_orders enable row level security;

create policy "Users can read own payment orders"
  on public.payment_orders for select
  using (auth.uid() = user_id);

-- Inserts/updates from Edge Functions (service role)

-- ─── Webhook idempotency ───────────────────────────────────────────────────
create table public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_id text not null,
  processed_at timestamptz not null default now(),
  unique (provider, event_id)
);

alter table public.webhook_events enable row level security;

-- No user policies — service_role only

-- ─── Share tokens (public resolve + own) ──────────────────────────────────
create table public.share_tokens (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  user_id uuid references auth.users (id) on delete set null,
  result_type text not null,
  payload jsonb not null default '{}'::jsonb,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_share_tokens_user_id on public.share_tokens (user_id);

alter table public.share_tokens enable row level security;

-- Public resolution: Edge Function `resolve-share` / OG renderer uses service_role only.
create policy "Users can read own share tokens"
  on public.share_tokens for select
  using (auth.uid() = user_id);

create policy "Users can insert own share tokens"
  on public.share_tokens for insert
  with check (auth.uid() = user_id);

-- ─── Web Push subscriptions ──────────────────────────────────────────────
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

create index idx_push_subscriptions_user_id on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

create policy "Users manage own push subscriptions"
  on public.push_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── updated_at trigger ────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger payment_orders_updated_at
  before update on public.payment_orders
  for each row execute function public.set_updated_at();
