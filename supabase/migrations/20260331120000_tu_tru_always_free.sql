-- Lập / lưu lá số tứ trụ (op tu-tru) không trừ lượng — bảng giá canonical.
update public.feature_credit_costs
set credit_cost = 0, is_free = true
where feature_key = 'tu_tru';
