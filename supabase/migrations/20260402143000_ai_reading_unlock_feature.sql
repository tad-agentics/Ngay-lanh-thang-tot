-- Luận giải LLM (mở khóa) trên Home và chi tiết ngày — một dòng giá, trừ qua Edge `reading-unlock`.
insert into public.feature_credit_costs (feature_key, credit_cost, is_free) values
  ('ai_reading_unlock', 1, false)
on conflict (feature_key) do update set
  credit_cost = excluded.credit_cost,
  is_free = excluded.is_free,
  updated_at = now();
