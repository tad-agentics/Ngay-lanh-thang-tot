# Active Context
Updated: 2026-03-25

## Current focus
**W4 `social-specialty`** shipped on `staging`: `/app/hop-tuoi` (D3 count-up), `/app/phong-thuy`, `/app/chia-se` + public `/x/:token`; Edge `create-share-token` / `share-resolve` / `share-og`; `/app/thong-bao-quyen` + Cài đặt push summary.

## Active wave
**Cross-cutting `legal-settings`** — dispatch per `artifacts/plans/build-plan.md`.

## Next up
`/feature legal-settings` (hoặc `/wave legal`); deploy Edge secrets `SITE_URL` cho `share-og`.

## Blockers
None

## Key decisions since last session
- Foundation commits `9fbdc8d` (SEO/PWA, Edge stubs, Supabase PKCE client) and `799dfa2` (Make UI under `app/components/ui`, northstar §7b landing, Google + email auth, hooks `useAuth` / `useProfile` / `useInstallPrompt` / `useFeatureCosts`).
- `tsconfig.json` excludes `supabase/functions/**` (Deno) and `src/make-import/**` until Make routes are fully merged into the app tree.
