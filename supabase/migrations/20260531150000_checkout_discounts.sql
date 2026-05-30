-- Checkout coupons + referral discount at payment; order stores final amount.

create table public.discount_coupons (
  code text primary key,
  discount_kind text not null check (discount_kind in ('percent', 'fixed_vnd')),
  discount_value integer not null check (discount_value > 0),
  active boolean not null default true,
  valid_from timestamptz,
  valid_until timestamptz,
  max_redemptions integer,
  redemption_count integer not null default 0 check (redemption_count >= 0),
  allowed_package_skus text[],
  note text,
  created_at timestamptz not null default now(),
  constraint discount_coupons_percent_range check (
    discount_kind <> 'percent' or (discount_value >= 1 and discount_value <= 100)
  )
);

comment on table public.discount_coupons is
  'Admin-managed discount codes; validated at payos-create-checkout (service role).';

alter table public.discount_coupons enable row level security;

alter table public.payment_orders
  add column if not exists list_amount_vnd integer,
  add column if not exists coupon_code text,
  add column if not exists checkout_referral_code text,
  add column if not exists referrer_profile_id uuid references public.profiles (id) on delete set null,
  add column if not exists discount_breakdown jsonb;

comment on column public.payment_orders.list_amount_vnd is 'Catalog price (VND) before discounts.';
comment on column public.payment_orders.amount_vnd is 'Final charged amount sent to PayOS.';
comment on column public.payment_orders.discount_breakdown is
  'JSON: list_amount_vnd, coupon_discount_vnd, referral_discount_vnd, amount_vnd.';

insert into public.app_config (config_key, value)
values
  ('checkout_referral_discount_percent', '0')
on conflict (config_key) do nothing;

create index if not exists idx_payment_orders_user_coupon
  on public.payment_orders (user_id, coupon_code)
  where coupon_code is not null and status = 'paid';

create or replace function public.increment_coupon_redemption(p_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.discount_coupons
  set redemption_count = redemption_count + 1
  where upper(code) = upper(trim(p_code));
end;
$$;

revoke all on function public.increment_coupon_redemption(text) from public;
grant execute on function public.increment_coupon_redemption(text) to service_role;
