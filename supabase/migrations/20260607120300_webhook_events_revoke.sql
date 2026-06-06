-- L1: Explicit revoke — service_role only (no user policies).

revoke all on table public.webhook_events from anon, authenticated;

comment on table public.webhook_events is
  'PayOS webhook idempotency — service_role writes only.';
