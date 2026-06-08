-- Dashboard snapshot: drop deprecated tiểu vận KPI + luan_tieu_van bucket.

create or replace function public.admin_dashboard_stats_snapshot()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  now_ts timestamptz := now();
  thirty_ago timestamptz := now_ts - interval '30 days';
  sixty_ago timestamptz := now_ts - interval '60 days';
  month_start timestamptz := date_trunc('month', now_ts);
  prev_month_start timestamptz := month_start - interval '1 month';
  profile_row record;
  paid_total bigint;
  paid_count bigint;
  rev_this bigint;
  rev_prev bigint;
  ord_this int;
  ord_prev int;
  bucket_json jsonb;
  sku_json jsonb;
  monthly_json jsonb;
  max_stack numeric;
  trial_max int;
  onboarding_trial_active int;
  onboarding_trial_exhausted int;
  tra_cuu_threads_30 int;
  tra_cuu_anchors_30 int;
begin
  select coalesce(
    (select value::integer from public.app_config where config_key = 'onboarding_trial_questions_max'),
    5
  ) into trial_max;
  if trial_max < 1 then
    trial_max := 5;
  end if;

  select
    count(*)::int as cnt,
    count(*) filter (where subscription_expires_at > now_ts)::int as active_sub,
    count(*) filter (
      where subscription_expires_at is not null
        and subscription_expires_at <= now_ts
    )::int as expired_sub,
    count(*) filter (where subscription_expires_at is null)::int as never_sub,
    count(*) filter (where bazi_reading_unlocked_at is not null)::int as bazi_unlocked,
    count(*) filter (where created_at >= thirty_ago)::int as new_30,
    count(*) filter (
      where created_at >= sixty_ago and created_at < thirty_ago
    )::int as new_prev_30,
    count(*) filter (
      where subscription_expires_at is null
        and onboarding_trial_questions_used < trial_max
    )::int as trial_active,
    count(*) filter (
      where subscription_expires_at is null
        and onboarding_trial_questions_used >= trial_max
    )::int as trial_exhausted
  into profile_row
  from public.profiles;

  onboarding_trial_active := profile_row.trial_active;
  onboarding_trial_exhausted := profile_row.trial_exhausted;

  select
    coalesce(sum(amount_vnd), 0)::bigint,
    count(*)::int
  into paid_total, paid_count
  from public.payment_orders
  where status = 'paid';

  select coalesce(sum(amount_vnd), 0)::bigint, count(*)::int
  into rev_this, ord_this
  from public.payment_orders
  where status = 'paid' and created_at >= month_start;

  select coalesce(sum(amount_vnd), 0)::bigint, count(*)::int
  into rev_prev, ord_prev
  from public.payment_orders
  where status = 'paid'
    and created_at >= prev_month_start
    and created_at < month_start;

  select coalesce(
    jsonb_object_agg(bucket, revenue),
    '{"subscription":0,"addon":0,"legacy":0}'::jsonb
  )
  into bucket_json
  from (
    select
      case
        when package_sku in ('goi_1thang', 'goi_6thang', 'goi_12thang') then 'subscription'
        when package_sku = 'luan_bat_tu' then 'addon'
        else 'legacy'
      end as bucket,
      coalesce(sum(amount_vnd), 0)::bigint as revenue
    from public.payment_orders
    where status = 'paid'
    group by 1
  ) b;

  select coalesce(jsonb_object_agg(package_sku, cnt), '{}'::jsonb)
  into sku_json
  from (
    select package_sku, count(*)::int as cnt
    from public.payment_orders
    where status = 'paid'
    group by package_sku
  ) s;

  with month_series as (
    select generate_series(
      date_trunc('month', now_ts) - interval '11 months',
      date_trunc('month', now_ts),
      interval '1 month'
    )::date as month_start
  ),
  bucketed as (
    select
      date_trunc('month', created_at)::date as month_start,
      case
        when package_sku in ('goi_1thang', 'goi_6thang', 'goi_12thang') then 'subscription'
        when package_sku = 'luan_bat_tu' then 'addon'
        else 'legacy'
      end as bucket,
      coalesce(sum(amount_vnd), 0)::bigint as revenue
    from public.payment_orders
    where status = 'paid'
      and created_at >= date_trunc('month', now_ts) - interval '11 months'
    group by 1, 2
  ),
  pivoted as (
    select
      b.month_start,
      coalesce(sum(b.revenue) filter (where b.bucket = 'subscription'), 0)::bigint as sub_rev,
      coalesce(sum(b.revenue) filter (where b.bucket = 'addon'), 0)::bigint as addon_rev,
      coalesce(sum(b.revenue) filter (where b.bucket = 'legacy'), 0)::bigint as legacy_rev
    from bucketed b
    group by b.month_start
  ),
  monthly_rows as (
    select
      to_char(ms.month_start, 'YYYY-MM') as key,
      upper(to_char(ms.month_start, 'Mon')) as label,
      coalesce(p.sub_rev, 0)::bigint as subscription_revenue_vnd,
      coalesce(p.addon_rev, 0)::bigint as addon_revenue_vnd,
      coalesce(p.legacy_rev, 0)::bigint as legacy_revenue_vnd
    from month_series ms
    left join pivoted p on p.month_start = ms.month_start
  )
  select
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'key', mr.key,
            'label', mr.label,
            'subscriptionRevenueVnd', mr.subscription_revenue_vnd,
            'addonRevenueVnd', mr.addon_revenue_vnd,
            'legacyRevenueVnd', mr.legacy_revenue_vnd,
            'subscriptionM', mr.subscription_revenue_vnd::numeric / 1000000.0,
            'addonM', mr.addon_revenue_vnd::numeric / 1000000.0,
            'legacyM', mr.legacy_revenue_vnd::numeric / 1000000.0,
            'leRevenueVnd', mr.legacy_revenue_vnd,
            'leM', mr.legacy_revenue_vnd::numeric / 1000000.0
          )
          order by mr.key
        )
        from monthly_rows mr
      ),
      '[]'::jsonb
    ),
    coalesce(
      (
        select greatest(
          max(
            (mr.subscription_revenue_vnd + mr.addon_revenue_vnd + mr.legacy_revenue_vnd)::numeric
            / 1000000.0
          ),
          0.000001
        )
        from monthly_rows mr
      ),
      0.000001
    )
  into monthly_json, max_stack;

  select
    count(*)::int,
    count(*) filter (where length(trim(anchor_intro)) > 0)::int
  into tra_cuu_threads_30, tra_cuu_anchors_30
  from public.tra_cuu_results_threads
  where created_at >= thirty_ago;

  return jsonb_build_object(
    'profilesCount', profile_row.cnt,
    'activeSubscribers', profile_row.active_sub,
    'expiredSubscribers', profile_row.expired_sub,
    'neverSubscribed', profile_row.never_sub,
    'baziReadingUnlocked', profile_row.bazi_unlocked,
    'newProfilesLast30Days', profile_row.new_30,
    'newProfilesPrev30', profile_row.new_prev_30,
    'onboardingTrialActive', onboarding_trial_active,
    'onboardingTrialExhausted', onboarding_trial_exhausted,
    'traCuuThreadsLast30d', tra_cuu_threads_30,
    'traCuuAnchorsLast30d', tra_cuu_anchors_30,
    'totalRevenueVnd', paid_total,
    'paidOrdersCount', paid_count,
    'revenueByBucketVnd', bucket_json,
    'ordersBySku', sku_json,
    'revenueThisMonth', rev_this,
    'revenuePrevMonth', rev_prev,
    'ordersThisMonth', ord_this,
    'ordersPrevMonth', ord_prev,
    'monthly', monthly_json,
    'chartScaleMaxM', greatest(max_stack, 0.000001)
  );
end;
$$;

comment on function public.admin_dashboard_stats_snapshot is
  'Admin-only (service_role): dashboard KPIs incl. trial + tra cứu (30d) + 12-month revenue.';
