-- Paywalled structured lá số narrative (+ GET /v1/la-so via bat-tu op la-so)
insert into public.feature_credit_costs (feature_key, credit_cost, is_free) values
  ('la_so_diengiai', 5, false)
on conflict (feature_key) do update set
  credit_cost = excluded.credit_cost,
  is_free = excluded.is_free,
  updated_at = now();
