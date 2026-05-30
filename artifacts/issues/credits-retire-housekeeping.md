# Housekeeping: retire credits / lượng (Direction C)

**Date:** 2026-05-31  
**Status:** Runtime retired in app + Edge; DB columns retained for audit.

## Product decision

Direction C is **subscription + luận add-ons** only. The credit/lượng UX and pivot “spend credits when sub expired” window are removed from runtime paths.

## Code removed / simplified

| Area | Change |
|------|--------|
| `app/lib/constants.ts` + test | **Deleted** — unused `FEATURE_KEY_MAP` (no app imports). |
| `app/lib/reading-unlock.ts` | No `credits_balance`, no `dry_run` credit dance. |
| `app/lib/entitlements.ts` | Removed `inPivotCreditTransition`. |
| `supabase/functions/reading-unlock` | Subscription-only unlock; ledger row `delta=0` for idempotency. |
| `supabase/functions/_shared/generate-reading-guards.ts` | No credit balance preflight. |
| `supabase/functions/bat-tu` | No `deduct_credits_atomic` / refund; paid ops → `SUB_EXPIRED` if no sub. |
| `supabase/functions/create-share-token` | Requires active sub; no share_card credit deduct. |
| `supabase/functions/_shared/entitlements.ts` | Removed pivot transition helpers. |

## DB (kept on purpose)

| Object | Note |
|--------|------|
| `profiles.credits_balance` | Column stays; new users get **0** via `handle_new_user`. |
| `credit_ledger` | Historical + unlock idempotency keys (`ai_reading_unlock:*`). |
| `feature_credit_costs` | Still read by `bat-tu` to know which ops are “paid” → require sub (not to deduct). |
| `deduct_credits_atomic` RPC | Unused by app paths; keep for admin/legacy scripts until admin dashboard updated. |
| PayOS `le` SKU | `legacyCheckout`; webhook may still grant credits for old orders. |

**Migration:** `supabase/migrations/20260531210000_retire_credits_runtime.sql`  
- `handle_new_user` → `credits_balance = 0`, no starter ledger  
- `app_config`: `starter_credits=0`, `pivot_transition_until` in the past  

## Duplicate artifacts removed

| File | Action |
|------|--------|
| `artifacts/design/ngaylanhthangtot-vn/uploads/uiux-current-flow.md` | **Deleted** — byte-identical to `artifacts/docs/uiux-current-flow.md`. |

**Not removed (review later):**

- `artifacts/design/.../uploads/frontend-design-guide.md` vs `frontend-design-guide-a4413c11.md` — may differ; manual diff before delete.
- `artifacts/docs/direction-b-screen-audit.md` — historical reference only.

## Still references “lượng” (docs / non-runtime)

- `artifacts/docs/admin-dashboard-context.md` — update in admin pivot pass.
- `artifacts/docs/northstar-ngay-lanh.html`, old build-plan rows — historical.
- `app/lib/api-types.ts`, `database.types.ts` — DB-shaped types (`credits_balance` column exists).

## Deploy checklist

```bash
npx supabase db push   # or apply migration via Dashboard
npx supabase functions deploy bat-tu reading-unlock create-share-token generate-reading-day generate-reading-la-so generate-reading-tieu-van day-luan-chat
```

Vercel: deploy FE from commit with reading-unlock client changes.

## Admin dashboard (next)

See prior summary: rework stats SKU buckets, user entitlement editor, drop credit-first CS flows. Do **after** this housekeeping lands.
