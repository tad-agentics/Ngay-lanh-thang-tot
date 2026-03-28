-- Vận tháng (tieu_van): 16 lượng / lần mở khóa (chỉnh giá theo vận hành + LLM).
update public.feature_credit_costs
set
  credit_cost = 16,
  updated_at = now()
where feature_key = 'tieu_van';
