-- Diễn giải chi tiết lá số (op bat-tu `la-so`) không trừ lượng.
update public.feature_credit_costs
set credit_cost = 0, is_free = true
where feature_key = 'la_so_diengiai';
