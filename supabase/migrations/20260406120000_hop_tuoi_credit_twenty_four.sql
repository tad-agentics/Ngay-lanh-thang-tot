-- Hợp tuổi: 24 lượng / lần (LLM luận giải dài hơn + tiêu chí đầy đủ).
update public.feature_credit_costs
set
  credit_cost = 24,
  updated_at = now()
where feature_key = 'hop_tuoi';
