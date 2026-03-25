# Active Context
Updated: 2026-03-25

## Current focus
**Cross-cutting `legal-settings`** complete: public `/chinh-sach-bao-mat`, `/dieu-khoan`; aliases `/privacy`, `/terms`; `/app/cai-dat-app` (PWA + data-request mailto); Cài đặt + landing footer legal links.

## Active wave
**Post-wave** — visual audit, pre-handoff QA, deploy polish.

## Next up
Visual audit (staging vs Make); pre-handoff `/review`; deploy Edge `SITE_URL` cho `share-og` if not set.

## Blockers
None

## Key decisions since last session
- Foundation commits `9fbdc8d` (SEO/PWA, Edge stubs, Supabase PKCE client) and `799dfa2` (Make UI under `app/components/ui`, northstar §7b landing, Google + email auth, hooks `useAuth` / `useProfile` / `useInstallPrompt` / `useFeatureCosts`).
- `tsconfig.json` excludes `supabase/functions/**` (Deno) and `src/make-import/**` until Make routes are fully merged into the app tree.
