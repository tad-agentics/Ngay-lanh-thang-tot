# Active Context
Updated: 2026-03-25

## Current focus
**Foundation complete** — landing `/` pre-rendered, auth routes wired, `/app` shell guarded, PWA static files + Edge stubs on `staging`.

## Active workstreams
- —

## Next up
Wave 1 (`auth-profile-billing`): PayOS checkout + webhook, Welcome / billing screens per `artifacts/plans/build-plan.md`. Run parallel `/feature` workstreams as needed.

## Blockers
None

## Key decisions since last session
- Foundation backend commit `9fbdc8d` (SEO/PWA, Edge stubs, Supabase PKCE client). Frontend commit adds Make UI under `app/components/ui`, northstar §7b landing, Google + email auth, hooks (`useAuth`, `useProfile`, `useInstallPrompt`, `useFeatureCosts`).
- `tsconfig.json` excludes `supabase/functions/**` (Deno) and `src/make-import/**` until Make routes are fully merged into the app tree.
