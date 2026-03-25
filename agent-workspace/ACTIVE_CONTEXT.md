# Active Context
Updated: 2026-03-25

## Current focus
**W3 `personalization`** closed on `staging`: `/app/la-so` + D2 reveal, `tu-tru` persists `profiles.la_so` + lock; `/app/van-thang` + `tieu-van`; Cài đặt blocks birth when locked; DB trigger protects lá số from client writes.

## Active wave
**Wave 4 `social-specialty`** — hợp tuổi, chia sẻ — see `artifacts/plans/build-plan.md`.

## Next up
Wave 4 / cross-cutting legal — dispatch per build-plan.

## Blockers
None

## Key decisions since last session
- Foundation commits `9fbdc8d` (SEO/PWA, Edge stubs, Supabase PKCE client) and `799dfa2` (Make UI under `app/components/ui`, northstar §7b landing, Google + email auth, hooks `useAuth` / `useProfile` / `useInstallPrompt` / `useFeatureCosts`).
- `tsconfig.json` excludes `supabase/functions/**` (Deno) and `src/make-import/**` until Make routes are fully merged into the app tree.
