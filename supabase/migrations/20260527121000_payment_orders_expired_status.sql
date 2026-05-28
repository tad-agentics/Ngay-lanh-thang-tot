-- G3 orphan orders: allow marking stale pending PayOS orders as expired (cron-payos-expire-orphans).

alter table public.payment_orders
  drop constraint if exists payment_orders_status_check;

alter table public.payment_orders
  add constraint payment_orders_status_check
  check (status in ('pending', 'paid', 'cancelled', 'failed', 'expired'));

create index if not exists idx_payment_orders_pending_created
  on public.payment_orders (created_at)
  where status = 'pending';
