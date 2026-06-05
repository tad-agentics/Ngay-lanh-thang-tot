# Deprecated — deploy from admin repo

**Canonical source:** `admin-ngaylanhthangtot/supabase/functions/admin-dashboard-stats/`

Deploy **only** from the admin repo (includes 60s in-memory cache for dashboard KPIs):

```bash
cd admin-ngaylanhthangtot
supabase functions deploy admin-dashboard-stats --project-ref hptovpbiwvtngorhdhhm
```

Do **not** deploy this copy from the app repo — it will overwrite the cached version on Supabase.

The RPC `admin_dashboard_stats_snapshot()` lives in **app repo migrations** (`supabase/migrations/`). Edge Function code lives in **admin repo**.
