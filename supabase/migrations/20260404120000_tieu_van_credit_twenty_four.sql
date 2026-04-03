-- Vận tháng (tieu_van): 24 lượng / lần mở khóa.
update public.feature_credit_costs
set
  credit_cost = 24,
  updated_at = now()
where feature_key = 'tieu_van';
