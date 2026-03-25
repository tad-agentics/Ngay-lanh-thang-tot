# Changelog — Ngày Lành Tháng Tốt

## Planning notes

| Area | Note | Blocking? |
|------|------|----------|
| Workflow | Figma Make prototype treated as **pre-delivered** for this test run — no in-Make build step; integrate via `src/make-import/` then Phase 4+. | No |
| Make import | Exported **`Ngaylanhthangtot.vn.zip`** into **`src/make-import/`** (~112 files): screens, `app/components/ui`, mock data, styles. TSX animation imports use **`motion/react`** (not `framer-motion` dependency). | No |

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
