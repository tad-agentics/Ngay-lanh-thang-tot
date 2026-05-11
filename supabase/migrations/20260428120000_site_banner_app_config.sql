-- Sticky site banner (JSON in app_config). Public read via RLS; writes via service_role (admin-site-banner EF).
insert into public.app_config (config_key, value) values
  (
    'site_banner',
    '{"enabled":false,"message":"","href":null}'
  )
on conflict (config_key) do nothing;
