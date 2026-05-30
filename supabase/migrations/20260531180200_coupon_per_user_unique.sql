-- One coupon per buyer: at most one pending checkout and one paid order per (user, code).

drop index if exists public.idx_payment_orders_user_coupon;

create unique index idx_payment_orders_user_coupon_paid
  on public.payment_orders (user_id, (upper(trim(coupon_code))))
  where status = 'paid' and coupon_code is not null;

create unique index idx_payment_orders_user_coupon_pending
  on public.payment_orders (user_id, (upper(trim(coupon_code))))
  where status = 'pending' and coupon_code is not null;

comment on index public.idx_payment_orders_user_coupon_paid is
  'Prevents paying twice with the same coupon (webhook claim + DB backstop).';

comment on index public.idx_payment_orders_user_coupon_pending is
  'Prevents parallel checkouts both quoting the same coupon before pay.';

-- Atomic paid claim + global redemption increment (same transaction).
create or replace function public.claim_payment_order_paid(
  p_order_id uuid,
  p_raw_webhook jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.payment_orders%rowtype;
begin
  update public.payment_orders
  set
    status = 'paid',
    raw_webhook = p_raw_webhook,
    updated_at = now()
  where id = p_order_id
    and status in ('pending', 'expired')
  returning * into v_order;

  if not found then
    select * into v_order
    from public.payment_orders
    where id = p_order_id;

    if found and v_order.status = 'paid' then
      return jsonb_build_object(
        'ok', true,
        'reason', 'already_processed',
        'order', to_jsonb(v_order)
      );
    end if;

    return jsonb_build_object('ok', false, 'reason', 'not_claimable');
  end if;

  if v_order.coupon_code is not null and length(trim(v_order.coupon_code)) > 0 then
    update public.discount_coupons
    set redemption_count = redemption_count + 1
    where upper(code) = upper(trim(v_order.coupon_code))
      and (
        max_redemptions is null
        or redemption_count < max_redemptions
      );
  end if;

  return jsonb_build_object(
    'ok', true,
    'reason', 'claimed',
    'order', to_jsonb(v_order)
  );
exception
  when unique_violation then
    return jsonb_build_object('ok', false, 'reason', 'coupon_already_used');
end;
$$;

revoke all on function public.claim_payment_order_paid(uuid, jsonb) from public;
grant execute on function public.claim_payment_order_paid(uuid, jsonb) to service_role;

-- Safer global counter when called directly (webhook uses claim_payment_order_paid).
create or replace function public.increment_coupon_redemption(p_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.discount_coupons
  set redemption_count = redemption_count + 1
  where upper(code) = upper(trim(p_code))
    and (
      max_redemptions is null
      or redemption_count < max_redemptions
    );
end;
$$;
