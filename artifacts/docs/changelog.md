# Changelog — Ngày Lành Tháng Tốt

## Planning notes

| Area | Note | Blocking? |
|------|------|----------|
| Workflow | Figma Make prototype treated as **pre-delivered** for this test run — no in-Make build step; integrate via `src/make-import/` then Phase 4+. | No |
| Make import | Exported **`Ngaylanhthangtot.vn.zip`** into **`src/make-import/`** (~112 files): screens, `app/components/ui`, mock data, styles. TSX animation imports use **`motion/react`** (not `framer-motion` dependency). | No |
| Phase 4 | **`tech-spec.md`** + **`supabase/migrations/20260325120000_initial_schema.sql`** + **`seed.sql`** + **`app/lib/api-types.ts`**. Screen-specs file absent — documented deviation; Make routes/mock-data are stand-in. | No |
| Auth bootstrap | Migration **`20260325120100_auth_create_profile.sql`** — `handle_new_user` on `auth.users` inserts **`profiles`** + **`credit_ledger`** (`starter_grant`); starter from **`app_config.starter_credits`** or **20**. Spec §17 W3 vs v1 clarified; PayOS **`package_sku`** allowlist documented (`le`, `goi_6thang`, `goi_12thang`). | No |

## How to use

- Add one row per deviation discovered during build — takes 30 seconds
- Do NOT edit specs mid-build — log the deviation here instead
- BLOCKING = can't continue the current feature without resolving this → fix before marking the feature complete
- NON-BLOCKING = log and continue → batch-fix before pre-handoff review (after all features pass QA)
- Move to RESOLVED when fixed, including the commit hash

## Active

| Feature | What changed | Blocking? | Fixed? | Commit |
|---|---|---|---|---|

## Resolved

| Feature | What changed | Resolved | Commit |
|---|---|---|---|
