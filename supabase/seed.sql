-- Dev seed — Ngày Lành Tháng Tốt
-- Apply after migrations. Does not create auth.users (use Supabase Auth UI or signup in app).
--
-- Feature keys here are canonical DB keys. Make mock uses ngay_chi_tiet, la_so, van_thang, chia_se —
-- map to day_detail, tu_tru, tieu_van, share_card in app code (see tech-spec §4).

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
  ('chon_ngay_30', 10, false),
  ('chon_ngay_60', 14, false),
  ('chon_ngay_90', 20, false),
  ('chon_ngay_detail', 4, false),
  ('day_detail', 0, true),
  ('tu_tru', 0, true),
  ('tieu_van', 6, false),
  ('hop_tuoi', 16, false),
  ('phong_thuy', 10, false),
  ('la_so_diengiai', 0, true),
  ('share_card', 2, false)
on conflict (feature_key) do update set
  credit_cost = excluded.credit_cost,
  is_free = excluded.is_free,
  updated_at = now();
