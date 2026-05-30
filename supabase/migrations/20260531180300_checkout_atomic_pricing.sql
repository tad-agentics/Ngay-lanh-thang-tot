-- Atomic checkout: lock coupon row, re-validate discounts, insert pending order in one transaction.

create or replace function public.checkout_coupon_discount_vnd(
  p_list integer,
  p_kind text,
  p_value integer
)
returns integer
language sql
immutable
as $$
  select case
    when p_kind = 'percent' then least(p_list, (p_list * p_value) / 100)
    else least(p_list, p_value)
  end;
$$;

create or replace function public.checkout_coupon_valid_row(
  p_coupon public.discount_coupons,
  p_now timestamptz
)
returns boolean
language sql
stable
as $$
  select
    p_coupon.active
    and (p_coupon.valid_from is null or p_coupon.valid_from <= p_now)
    and (p_coupon.valid_until is null or p_coupon.valid_until >= p_now)
    and (
      p_coupon.max_redemptions is null
      or p_coupon.redemption_count < p_coupon.max_redemptions
    );
$$;

create or replace function public.create_checkout_payment_order(
  p_user_id uuid,
  p_package_sku text,
  p_list_amount_vnd integer,
  p_credits_to_add integer,
  p_subscription_months integer,
  p_coupon_code text,
  p_referral_code text,
  p_provider_order_code text,
  p_expires_at timestamptz,
  p_raw_request jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_coupon public.discount_coupons%rowtype;
  v_coupon_norm text;
  v_referral_norm text;
  v_buyer_referral text;
  v_referrer_id uuid;
  v_referral_pct integer := 0;
  v_coupon_discount integer := 0;
  v_referral_discount integer := 0;
  v_after_coupon integer;
  v_amount integer;
  v_used_count bigint;
  v_order public.payment_orders%rowtype;
  v_breakdown jsonb;
begin
  if p_list_amount_vnd is null or p_list_amount_vnd < 1000 then
    return jsonb_build_object(
      'ok', false,
      'code', 'INVALID_LIST_AMOUNT',
      'message', 'Giá gói không hợp lệ.'
    );
  end if;

  v_coupon_norm := nullif(upper(trim(coalesce(p_coupon_code, ''))), '');
  v_referral_norm := nullif(upper(trim(coalesce(p_referral_code, ''))), '');

  select referral_code into v_buyer_referral
  from public.profiles
  where id = p_user_id;

  if v_coupon_norm is not null then
    select * into v_coupon
    from public.discount_coupons
    where upper(code) = v_coupon_norm
    for update;

    if not found then
      return jsonb_build_object(
        'ok', false,
        'code', 'INVALID_COUPON',
        'message', 'Mã giảm giá không hợp lệ hoặc đã hết hạn.'
      );
    end if;

    if not public.checkout_coupon_valid_row(v_coupon, v_now) then
      return jsonb_build_object(
        'ok', false,
        'code', 'INVALID_COUPON',
        'message', 'Mã giảm giá không hợp lệ hoặc đã hết hạn.'
      );
    end if;

    select count(*) into v_used_count
    from public.payment_orders
    where user_id = p_user_id
      and upper(trim(coupon_code)) = v_coupon_norm
      and (
        status = 'paid'
        or (status = 'pending' and expires_at > v_now)
      );

    if v_used_count > 0 then
      return jsonb_build_object(
        'ok', false,
        'code', 'COUPON_ALREADY_USED',
        'message', 'Bạn đã dùng mã giảm giá này rồi.'
      );
    end if;

    if v_coupon.allowed_package_skus is not null
      and cardinality(v_coupon.allowed_package_skus) > 0
      and not (p_package_sku = any (v_coupon.allowed_package_skus)) then
      return jsonb_build_object(
        'ok', false,
        'code', 'COUPON_NOT_APPLICABLE',
        'message', 'Mã giảm giá không áp dụng cho gói này.'
      );
    end if;

    v_coupon_discount := public.checkout_coupon_discount_vnd(
      p_list_amount_vnd,
      v_coupon.discount_kind,
      v_coupon.discount_value
    );
  elsif p_coupon_code is not null and length(trim(p_coupon_code)) > 0 then
    return jsonb_build_object(
      'ok', false,
      'code', 'INVALID_COUPON',
      'message', 'Mã giảm giá không hợp lệ hoặc đã hết hạn.'
    );
  end if;

  v_after_coupon := p_list_amount_vnd - v_coupon_discount;

  if v_referral_norm is not null then
    if v_buyer_referral is not null
      and upper(trim(v_buyer_referral)) = v_referral_norm then
      return jsonb_build_object(
        'ok', false,
        'code', 'REFERRAL_SELF',
        'message', 'Không thể dùng mã giới thiệu của chính bạn.'
      );
    end if;

    select id into v_referrer_id
    from public.profiles
    where upper(referral_code) = v_referral_norm;

    if v_referrer_id is null then
      return jsonb_build_object(
        'ok', false,
        'code', 'INVALID_REFERRAL',
        'message', 'Mã giới thiệu không tồn tại.'
      );
    end if;

    if v_referrer_id = p_user_id then
      return jsonb_build_object(
        'ok', false,
        'code', 'REFERRAL_SELF',
        'message', 'Không thể dùng mã giới thiệu của chính bạn.'
      );
    end if;

    select coalesce(
      nullif(trim(value), '')::integer,
      0
    ) into v_referral_pct
    from public.app_config
    where config_key = 'checkout_referral_discount_percent';

    v_referral_pct := least(100, greatest(0, coalesce(v_referral_pct, 0)));

    if v_referral_pct > 0 then
      v_referral_discount := (v_after_coupon * v_referral_pct) / 100;
    end if;
  else
    v_referrer_id := null;
  end if;

  v_amount := v_after_coupon - v_referral_discount;
  if v_amount < 1000 then
    v_amount := 1000;
  end if;
  if v_amount > p_list_amount_vnd then
    v_amount := p_list_amount_vnd;
  end if;

  v_breakdown := jsonb_build_object(
    'list_amount_vnd', p_list_amount_vnd,
    'coupon_discount_vnd', v_coupon_discount,
    'referral_discount_vnd', v_referral_discount,
    'amount_vnd', v_amount,
    'coupon_code', v_coupon_norm,
    'checkout_referral_code', v_referral_norm
  );

  insert into public.payment_orders (
    user_id,
    provider,
    provider_order_code,
    status,
    package_sku,
    credits_to_add,
    subscription_months,
    list_amount_vnd,
    amount_vnd,
    coupon_code,
    checkout_referral_code,
    referrer_profile_id,
    discount_breakdown,
    expires_at,
    raw_request
  )
  values (
    p_user_id,
    'payos',
    p_provider_order_code,
    'pending',
    p_package_sku,
    p_credits_to_add,
    p_subscription_months,
    p_list_amount_vnd,
    v_amount,
    v_coupon_norm,
    v_referral_norm,
    v_referrer_id,
    v_breakdown,
    p_expires_at,
    p_raw_request
  )
  returning * into v_order;

  return jsonb_build_object(
    'ok', true,
    'order_id', v_order.id,
    'amount_vnd', v_amount,
    'breakdown', v_breakdown,
    'referrer_profile_id', v_referrer_id
  );
exception
  when unique_violation then
    return jsonb_build_object(
      'ok', false,
      'code', 'COUPON_IN_USE',
      'message',
      'Mã giảm giá đang được dùng trong một đơn thanh toán khác hoặc đã dùng rồi.'
    );
end;
$$;

revoke all on function public.create_checkout_payment_order(
  uuid, text, integer, integer, integer, text, text, text, timestamptz, jsonb
) from public;
grant execute on function public.create_checkout_payment_order(
  uuid, text, integer, integer, integer, text, text, text, timestamptz, jsonb
) to service_role;

-- Re-validate coupon under row lock before marking paid + incrementing global counter.
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
  v_coupon public.discount_coupons%rowtype;
  v_now timestamptz := now();
  v_stored_amount integer;
  v_inc integer;
begin
  select * into v_order
  from public.payment_orders
  where id = p_order_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_claimable');
  end if;

  if v_order.status = 'paid' then
    return jsonb_build_object(
      'ok', true,
      'reason', 'already_processed',
      'order', to_jsonb(v_order)
    );
  end if;

  if v_order.status not in ('pending', 'expired') then
    return jsonb_build_object('ok', false, 'reason', 'not_claimable');
  end if;

  if v_order.discount_breakdown is not null then
    v_stored_amount := nullif(v_order.discount_breakdown->>'amount_vnd', '')::integer;
    if v_stored_amount is not null and v_stored_amount is distinct from v_order.amount_vnd then
      return jsonb_build_object('ok', false, 'reason', 'amount_mismatch');
    end if;
  end if;

  if v_order.coupon_code is not null and length(trim(v_order.coupon_code)) > 0 then
    select * into v_coupon
    from public.discount_coupons
    where upper(code) = upper(trim(v_order.coupon_code))
    for update;

    if not found then
      return jsonb_build_object('ok', false, 'reason', 'coupon_missing_at_payment');
    end if;

    if not public.checkout_coupon_valid_row(v_coupon, v_now) then
      return jsonb_build_object('ok', false, 'reason', 'coupon_invalid_at_payment');
    end if;
  end if;

  update public.payment_orders
  set
    status = 'paid',
    raw_webhook = p_raw_webhook,
    updated_at = v_now
  where id = p_order_id
    and status in ('pending', 'expired')
  returning * into v_order;

  if not found then
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

    get diagnostics v_inc = row_count;

    if v_inc = 0 then
      raise exception using
        errcode = 'P0001',
        message = 'coupon_exhausted_at_payment';
    end if;
  end if;

  return jsonb_build_object(
    'ok', true,
    'reason', 'claimed',
    'order', to_jsonb(v_order)
  );
exception
  when unique_violation then
    return jsonb_build_object('ok', false, 'reason', 'coupon_already_used');
  when sqlstate 'P0001' then
    return jsonb_build_object('ok', false, 'reason', 'coupon_invalid_at_payment');
end;
$$;
