# Active Context
Updated: 2026-03-25

## Current focus
**W1 `auth-profile-billing`** closed on `staging`: onboarding gate → `/app/bat-dau`, PayOS + `CreditGate` + Cài đặt / Mua lượng; `FEATURE_KEY_MAP` aligned with seed.

## Active wave
**Wave 2 `core-loop`** — chọn ngày flow, `bat-tu`, etc.

## Next up
Wave 3 (`personalization`): lá số / vận — see `artifacts/plans/build-plan.md`.

## Blockers
None

## Key decisions since last session
- Foundation commits `9fbdc8d` (SEO/PWA, Edge stubs, Supabase PKCE client) and `799dfa2` (Make UI under `app/components/ui`, northstar §7b landing, Google + email auth, hooks `useAuth` / `useProfile` / `useInstallPrompt` / `useFeatureCosts`).
- `tsconfig.json` excludes `supabase/functions/**` (Deno) and `src/make-import/**` until Make routes are fully merged into the app tree.
