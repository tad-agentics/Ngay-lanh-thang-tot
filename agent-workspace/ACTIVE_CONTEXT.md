# Active Context
Updated: 2026-03-25

## Current focus
**Wave 2 `core-loop`** — chọn ngày → kết quả (Make + D1 loading), chi tiết ngày `/app/ngay/:ngay`, `bat-tu` ops + credits on `staging`.

## Active workstreams
- —

## Next up
Wave 3 (`personalization`): lá số / vận — see `artifacts/plans/build-plan.md`. Optionally formal **QA PASS** + project-plan update for `auth-profile-billing` (W1) if treating W1 as a gate.

## Blockers
None

## Key decisions since last session
- Foundation commits `9fbdc8d` (SEO/PWA, Edge stubs, Supabase PKCE client) and `799dfa2` (Make UI under `app/components/ui`, northstar §7b landing, Google + email auth, hooks `useAuth` / `useProfile` / `useInstallPrompt` / `useFeatureCosts`).
- `tsconfig.json` excludes `supabase/functions/**` (Deno) and `src/make-import/**` until Make routes are fully merged into the app tree.
