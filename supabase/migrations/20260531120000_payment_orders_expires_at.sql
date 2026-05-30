-- G3 — 5-minute checkout window (align with FE + PayOS expiredAt).

alter table public.payment_orders
  add column if not exists expires_at timestamptz;

update public.payment_orders
set expires_at = created_at + interval '5 minutes'
where expires_at is null
  and status = 'pending';

create index if not exists idx_payment_orders_pending_expires
  on public.payment_orders (expires_at)
  where status = 'pending';
