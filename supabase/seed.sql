-- Dev seed — Ngày Lành Tháng Tốt
-- Apply after migrations. Does not create auth.users (use Supabase Auth UI or signup in app).

-- App config
insert into public.app_config (config_key, value) values
  ('starter_credits', '20'),
  ('credit_expiry_months', '12')
on conflict (config_key) do update set value = excluded.value, updated_at = now();

-- Feature costs — align with Make `FEATURE_COSTS` + northstar §11 (single DB source; UI loads via query)
insert into public.feature_credit_costs (feature_key, credit_cost, is_free) values
  ('ngay_hom_nay', 0, true),
  ('weekly_summary', 0, true),
  ('convert_date', 0, true),
  ('lich_thang_overview', 0, true),
  ('chon_ngay_30', 5, false),
  ('chon_ngay_60', 7, false),
  ('chon_ngay_90', 10, false),
  ('chon_ngay_detail', 2, false),
  ('day_detail', 2, false),
  ('tu_tru', 15, false),
  ('tieu_van', 3, false),
  ('hop_tuoi', 8, false),
  ('phong_thuy', 5, false),
  ('share_card', 1, false)
on conflict (feature_key) do update set
  credit_cost = excluded.credit_cost,
  is_free = excluded.is_free,
  updated_at = now();
