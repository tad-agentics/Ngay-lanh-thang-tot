-- Vận tháng: cố định 16 lượng (chỉnh từ 17 nếu migration trước đã chạy).
update public.feature_credit_costs
set
  credit_cost = 16,
  updated_at = now()
where feature_key = 'tieu_van';
