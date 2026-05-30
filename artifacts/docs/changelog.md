# Changelog — Ngày Lành Tháng Tốt

## Planning notes

| Area | Note | Blocking? |
|------|------|----------|
| Workflow | Figma Make prototype treated as **pre-delivered** for this test run — no in-Make build step; integrate via `src/make-import/` then Phase 4+. | No |
| Make import | Exported **`Ngaylanhthangtot.vn.zip`** into **`src/make-import/`** (~112 files): screens, `app/components/ui`, mock data, styles. TSX animation imports use **`motion/react`** (not `framer-motion` dependency). | No |
| Phase 4 | **`tech-spec.md`** + **`supabase/migrations/20260325120000_initial_schema.sql`** + **`seed.sql`** + **`app/lib/api-types.ts`**. Screen-specs file absent — documented deviation; Make routes/mock-data are stand-in. | No |
| Auth bootstrap | Migration **`20260325120100_auth_create_profile.sql`** — `handle_new_user` on `auth.users` inserts **`profiles`** + **`credit_ledger`** (`starter_grant`); starter from **`app_config.starter_credits`** or **20**. Spec §17 W3 vs v1 clarified; PayOS **`package_sku`** allowlist documented (`le`, `goi_6thang`, `goi_12thang`). | No |
| Setup | **`build-plan.md`**, **`project.mdc`**, Radix/lucide/Make UI deps in root **`package.json`**. No `screen-specs-*` — graph uses Make + tech-spec. PayOS: Edge HTTP only (no PayOS MCP). | No |

## How to use

- Add one row per deviation discovered during build — takes 30 seconds
- Do NOT edit specs mid-build — log the deviation here instead
- BLOCKING = can't continue the current feature without resolving this → fix before marking the feature complete
- NON-BLOCKING = log and continue → batch-fix before pre-handoff review (after all features pass QA)
- Move to RESOLVED when fixed, including the commit hash

## Active

| Feature | What changed | Blocking? | Fixed? | Commit |
|---|---|---|---|---|
| Day luận chat (B) | Server thread `day_luan_threads` + Edge `day-luan-chat` (`open`/`ask`); idempotency `day_luan_ask_idempotency`; FE `/luan-ai` follow-up; deprecated `generate-reading-day` with `question`. Deploy: `db push` + `functions deploy day-luan-chat`. | No | Yes | — |
| Day luận follow-up today-only | `ask` returns `FOLLOW_UP_TODAY_ONLY` when `thread.day_iso` ≠ today (VN). Other days: anchor + read-only thread via `open`; max 10 FU on today. Shared `dayLuanFollowUpAllowed` in `_shared/day-luan-thread.ts`. Deploy: `functions deploy day-luan-chat` + FE. | No | Yes | — |
| Coupon replay | Unique `(user_id, coupon)` on `payment_orders` pending + paid; `claim_payment_order_paid` RPC (claim + `increment` in one txn); quote blocks active pending; checkout `COUPON_IN_USE` on `23505`. | No | Yes | — |
| Quote→pay race | `create_checkout_payment_order` RPC locks coupon + re-prices atomically; webhook re-validates coupon at claim; `CPayConfirmSheet` re-quotes before Pay. | No | Yes | — |
| Admin dashboard stats | `admin-dashboard-stats`: revenue buckets subscription / add-on / legacy; KPI subs + luận; handoff doc Direction C. Deploy EF only. | No | Yes | 23825d3 |
| Admin CS APIs | `admin-users`, `admin-user-entitlements`, `admin-orders` + `_shared/admin-auth.ts`; handoff doc (repo admin = UI only). Deploy 3 EF. | No | Yes | — |
| Direction C pivot | Wave 0–11 scaffold: `authenticated` layout, `/lich` `/tra-cuu` `/toi`, entitlements migration, `SUB_EXPIRED` in bat-tu, PayOS SKUs, `/splash` PWA entry, legacy `/app/*` redirects. Full C visual reskin of screens still incremental on top of ported routes. | No | Partial | — |
| Web Push v1 | Retired: `push_subscriptions`, `push_enabled`, `CNotifPerm`, section Thông báo on `/toi/cai-dat`. Make `CSettings` still shows notif rows — FE omits; subtitle `/toi` updated. Migration `20260527150000`. | No | Yes | — |
| `/toi/cai-dat` UI | Align Direction C: `--display-2` typography, legal picker (Điều khoản + Bảo mật), FAQ → `/#hoi-dap`, remove duplicate PWA block + back link, logout text-only. | No | Yes | — |
| Birth-data edit | Direction C `/toi/sua-ho-so` (`CEditProfile`) allows birth edit + lá số recompute — contradicts prior "no self-serve birth edit" rule. Logged as ADR-2026-05-27 in pivot plan. | No | No | — |
| Luận giải LLM | Retired Edge `generate-reading` (Gemini monolith). Prod uses `generate-reading-{day,la-so,tieu-van}` + DeepSeek only. | No | Yes | — |
| Credits / lượng (runtime) | Retired pivot credit window + `deduct_credits` on `bat-tu`, `reading-unlock`, `create-share-token`, `generate-reading-guards`. New signups `credits_balance=0`. Removed dead `app/lib/constants.ts`. Migration `20260531210000`. Deploy: `db push` + deploy `bat-tu`, `reading-unlock`, `create-share-token`, `generate-reading-*`, `day-luan-chat`. | No | Yes | — |

## Resolved

| Feature | What changed | Resolved | Commit |
|---|---|---|---|
| Referral + lượng | `profiles.referral_code` / `referred_by`, `app_config.referral_bonus_credits`, `apply_referral_pair`, `handle_new_user` metadata `referral_code`/`ref`, Edge `referral-claim`, Cài đặt copy mã/link, `sessionStorage` OAuth + email đăng nhập, trigger chặn PATCH credits/referral từ client | 2026-04-01 | _(ghi hash sau commit)_ |
