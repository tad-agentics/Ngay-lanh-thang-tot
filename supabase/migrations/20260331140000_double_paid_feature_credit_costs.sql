-- Nhân đôi lượng cho mọi feature có phí (đã gated qua feature_credit_costs).
update public.feature_credit_costs
set
  credit_cost = credit_cost * 2,
  updated_at = now()
where is_free = false and credit_cost > 0;
