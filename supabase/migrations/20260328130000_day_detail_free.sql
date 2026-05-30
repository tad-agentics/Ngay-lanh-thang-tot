-- Chi tiết ngày từ lịch: không trừ lượng từng lần xem; một rào chắn hồ sơ ở client.
UPDATE public.feature_credit_costs
SET
  credit_cost = 0,
  is_free = TRUE
WHERE feature_key = 'day_detail';
