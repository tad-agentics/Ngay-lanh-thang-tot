# Performance audit remediation — 2026-06-07

## Status: remediated (audit fix pass)

All BLOCKER → LOW findings from the post-implementation audit are addressed in this pass.

| Finding | Severity | Status | Fix |
|---------|----------|--------|-----|
| Prewarm Redis lock never released | BLOCKER | **Fixed** | `try/finally` + `redisDelKey` in `bazi-reading-prewarm/run.ts` |
| Partial prewarm persisted as complete | BLOCKER | **Fixed** | Upsert only when `bundle.complete`; partial → `{ ok: false, reason: "partial" }` |
| Untracked core modules | BLOCKER | **Staged** | Shared + Edge modules added to git index |
| Bundle trait ids hardcoded | HIGH | **Fixed** | `shared/bazi-reading-trait-ids.ts` + gap-fill in generate-bundle |
| No phong-thuy gap-fill / generate retry | HIGH | **Fixed** | Phong retry when only phong blocks completeness; `invokeGenerateWithRetry` (503/504) |
| `useBatTuQuery` dead / duplicate bat-tu calls | HIGH | **Fixed** | `useTodayLichData`, `CDayDetailScreen`, `useDayLuanReading` wired; session `getSession` dedupe |
| Cache v1/v2 invalidation + recompute body | HIGH | **Fixed** | DEL both `v1`/`v2`; recompute invalidates with profile birth + `year`/`purpose`/`detail` |
| L2 half-done | HIGH | **Fixed** | L2 read before Postgres; `persistReadingCache` syncs L2 on all generator writes |
| Prewarm scope too broad | MEDIUM | **Fixed** | `routeUsesBaziPrewarm` → luận routes only |
| Orphan `SavedPicksGate` | MEDIUM | **Fixed** | Deleted; `SavedPicksRouteGate` remains |
| Lazy reading screens | MEDIUM | **Fixed** | `luan-ai.$context.tsx`, `toi.luan-tieu-van.tsx` lazy |
| Montserrat Google Fonts | MEDIUM | **Fixed** | Self-hosted woff2 (600/700/800, vi+latin) in `public/fonts/` + `theme.css` |
| Sentry in main chunk | MEDIUM | **Fixed** | Dynamic import in `DirectionCScreenBoundary` + root `ErrorBoundary` |

## Wave 1 (backend P0)

- Shared `bazi-reading-generate-bundle.ts` — parallel facts + LLM waves + gap-fill (parity client)
- Shared `shared/bazi-reading-delivery-complete.ts` — unified completeness check
- `bazi-reading-prewarm/run.ts` — Redis lock acquire/release, shared bundle, complete-only persist
- `bat-tu` cache policy — `shared/bat-tu-cache-policy.ts`; gate-before-read; v1+v2 invalidation; recompute enrich

## Wave 2 (FE core)

- `getAppQueryClient()` singleton
- `useBatTuQuery` + `queryKeys.batTu*` — used by home, day detail, day luận
- `/lich` `clientLoader` hydrates `todayLich` + hook reads bootstrap from session/query cache
- `invalidateLaSoRecomputeCaches` → `batTuRoot`

## Wave 3 (FE overhead)

- `ReadingPrewarmGate` — `/toi/luan-bat-tu`, `/toi/luan-tieu-van`, `/luan/*` only
- `SavedPicksRouteGate` — `/toi`, `/ngay/*`, `/tra-cuu/hop-tuoi/ket-qua`
- Payment recovery exempt — `/lich`, `/tra-cuu`, `/ngay/*`
- Lazy luận routes; dynamic Sentry init + boundary lazy capture

## Wave 4 (partial)

- `reading-cache-l2.ts` — L2 read + write via `persistReadingCache` / `tryReadingCacheHit`
- `bat-tu/cache.ts` extracted; full monolith split deferred

## Tests

- `shared/bat-tu-cache-policy.test.ts`
- `shared/bazi-reading-trait-ids.test.ts`
- `npm test` — 463+ app tests + shared policy tests
- `npm run build` — OK

## Env

- `BAT_TU_AUTH_CACHE=1` — enable authenticated Redis cache write
- `BAT_TU_CACHE_TTL_SEC` — unchanged (default 3600)

## Rollback

- Set `BAT_TU_AUTH_CACHE=0` or unset
- Redeploy prior `bat-tu`, `bazi-reading-prewarm`, `generate-reading-*` Edge bundles
