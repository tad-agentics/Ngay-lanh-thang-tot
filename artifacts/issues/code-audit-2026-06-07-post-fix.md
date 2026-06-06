# Code Audit — Post-fix 2026-06-07

Scope: verify audit fixes landed in repo; residual gaps; deploy readiness.

**Gate:** `npm test` 463/463 · `npm run build` pass · `npm run check:edge-config` 28/28

**Deploy status:** Migrations + Edge changes **not pushed to production** (local git only).

---

## FIXED (verified in code)

| ID | Fix | Evidence |
|----|-----|----------|
| C1 | Profile entitlement self-grant blocked | `20260607120000_profiles_entitlement_write_deny.sql` |
| C2 | van-trinh-nam in config.toml | `config.toml` L503–508 |
| H3 | bazi RLS 330d + SQL helpers | `20260607120100_entitlement_rls_helpers.sql` |
| H4 | day_luan RESTRICTIVE + REVOKE | `20260607120200_day_luan_client_write_deny.sql` |
| L1 | webhook_events REVOKE | `20260607120300_webhook_events_revoke.sql` |
| H1 | Cron fail-closed (prod) | `_shared/cron-auth.ts` + 3 cron/ops functions |
| H2 | Redis RL fail-closed | `generate-reading-guards.ts` L89–102, `checkout-quote-rate-limit.ts` |
| M3 | prewarm user id | `bazi-reading-prewarm/index.ts` accepts `prewarm_user_id` \| `user_id` |
| P1 | Lapsed calendar teaser | FE `authenticated.tsx` + `nav-config.ts`; BE `bat-tu` `isCalendarTeaserEligible` |
| P2 | Meta InitiateCheckout | `meta-pixel.ts` + xac-nhan routes |
| P3 | Birth edit ADR | `project.mdc` updated |
| CI | Edge config sync | `scripts/ops/verify-edge-config-sync.ts` |

---

## RESIDUAL — HIGH

### R1 — Fixes not live until deploy
All security migrations and Edge deploys pending. **C1 exploit remains on production** until `db push`.

### R2 — Rate limit returns 200 null, not 503
`create-handler.ts` L514–522: `!slot` → `ok(null, null, req)`. Fail-closed for cost, but clients see empty reading not explicit error.

### R3 — Entitlements duplicate (drift risk)
`app/lib/entitlements.ts` vs `supabase/functions/_shared/entitlements.ts` — core logic aligned today; no `shared/` package yet.

---

## RESIDUAL — MEDIUM

### M1 — `profiles` INSERT policy still permissive
Trigger only guards UPDATE. Theoretical client INSERT with entitlement columns before `handle_new_user` — low probability; consider INSERT guard in trigger.

### M2 — Admin rate limit in-memory
`admin-auth.ts` per-isolate 60/min — unchanged.

### M3 — generate-reading legacy endpoints auth uneven
Shared handler: some endpoints (`chon-ngay`, `la-so`, `dai-van`) weaker auth than `la-so-chi-tiet` / `luu-nien`. `generate-reading-tieu-van` uses thin handler — verify entitlement gate in `run-tieu-van.ts`.

### M4 — Lapsed user: Tra cứu still blocked
`bat-tu` tra-cuu pick gate uses `isCalendarTeaserEligible` — **actually fixed** for tra-cuu pick too. Full `/tra-cuu` UI still blocked by `authenticated.tsx` (not in `isCalendarBrowsePath`) — **by design**.

### M5 — Large files unchanged
`la-so-ui.ts` 1208 LOC · `home-bat-tu.ts` 1031 · `bat-tu/index.ts` 1577

### M6 — FE tests import Edge `_shared`
8 test files — boundary smell; no `shared/` package.

---

## RESIDUAL — LOW

- Empty legacy dirs: `cron-push-habit/`, `generate-reading/`, `pin-reading/` (no index.ts; excluded by check script)
- `npm run typecheck` still pre-existing red; build is real gate
- Credits schema legacy (M5 from prior audit) — trigger blocks writes

---

## Lapsed calendar UX (sanity)

| Path | Expected | Code |
|------|----------|------|
| `/lich` lapsed | Browse + blur CTA | `authenticated` exempt + `CHomeScreen` `calendarLocked` |
| `/ngay/*` lapsed | Day detail + engine teaser | `CDayDetailScreen` no CSubExpired; `buildCalendarLockedDayTeaser` |
| `/luan-ai/day-*` lapsed | No free AI luận | `neverSubFreeDayReading` never-sub only; `useInlineDayReading` L111–115 skips gen |
| `/luan-ai/bazi-year` lapsed | Blocked at layout | Not in `isCalendarBrowsePath` → CSubExpired |
| `/toi/luan-bat-tu` lapsed | Renew CTA | Not calendar browse |

---

## Recommended next actions

1. `supabase db push` + deploy Edge (bat-tu, cron-*, bazi-reading-prewarm, van-trinh-nam-*)
2. Pen-test C1 on staging after migration
3. Optional: rate limit → 503 response code
4. Optional: `shared/entitlements-core` extraction
5. Commit + push FE
