-- Atomic credit deduction with row-level locking.
-- Replaces the read-then-write pattern in edge functions that was susceptible
-- to concurrent requests overdrawing the balance.
CREATE OR REPLACE FUNCTION deduct_credits_atomic(
  p_user_id       UUID,
  p_cost          INTEGER,
  p_reason        TEXT,
  p_feature_key   TEXT,
  p_idempotency_key TEXT,
  p_metadata      JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance     INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Lock the profile row so concurrent calls for the same user serialize here.
  SELECT credits_balance
    INTO v_balance
    FROM profiles
   WHERE id = p_user_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', FALSE, 'error_code', 'PROFILE_MISSING');
  END IF;

  IF v_balance < p_cost THEN
    RETURN jsonb_build_object(
      'ok', FALSE,
      'error_code', 'INSUFFICIENT_CREDITS',
      'credits_balance', v_balance
    );
  END IF;

  v_new_balance := v_balance - p_cost;

  UPDATE profiles
     SET credits_balance = v_new_balance
   WHERE id = p_user_id;

  INSERT INTO credit_ledger
    (user_id, delta, balance_after, reason, feature_key, idempotency_key, metadata)
  VALUES
    (p_user_id, -p_cost, v_new_balance, p_reason, p_feature_key, p_idempotency_key, p_metadata)
  ON CONFLICT (idempotency_key) DO NOTHING;

  RETURN jsonb_build_object(
    'ok', TRUE,
    'credits_balance', v_new_balance
  );
END;
$$;

-- Only callable by service role (edge functions); not exposed to anon/authenticated.
REVOKE ALL ON FUNCTION deduct_credits_atomic FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- Atomic credit addition for payment fulfillment.
-- Combines the profile balance update and ledger insert in a single transaction,
-- preventing a partial-success state where credits are added but not recorded.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION add_credits_atomic(
  p_user_id         UUID,
  p_credits_to_add  INTEGER,
  p_idempotency_key TEXT,
  p_order_id        UUID,
  p_package_sku     TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance     INTEGER;
  v_new_balance INTEGER;
BEGIN
  SELECT credits_balance
    INTO v_balance
    FROM profiles
   WHERE id = p_user_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', FALSE, 'error_code', 'PROFILE_MISSING');
  END IF;

  v_new_balance := v_balance + p_credits_to_add;

  UPDATE profiles
     SET credits_balance = v_new_balance
   WHERE id = p_user_id;

  INSERT INTO credit_ledger
    (user_id, delta, balance_after, reason, idempotency_key, metadata)
  VALUES
    (p_user_id, p_credits_to_add, v_new_balance, 'payos_purchase', p_idempotency_key,
     jsonb_build_object('order_id', p_order_id, 'package_sku', p_package_sku))
  ON CONFLICT (idempotency_key) DO NOTHING;

  RETURN jsonb_build_object('ok', TRUE, 'credits_balance', v_new_balance);
END;
$$;

REVOKE ALL ON FUNCTION add_credits_atomic FROM PUBLIC;
