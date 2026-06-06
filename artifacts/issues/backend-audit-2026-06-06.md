# Backend Audit — 2026-06-06

Scope: migrations/RLS, Edge Functions, `_shared/`, webhooks/cron, LLM pipeline, van-trinh-nam, entitlements.

**Status (2026-06-07):** C1, C2, H1–H4, L1, M3 fixed in repo. M1 partial (`check:edge-config` script). M2 admin Redis RL deferred. Deploy pending: `db push` + Edge functions.

---

## CRITICAL

### C1 — Client can self-grant entitlements on `profiles`
`profiles_enforce_update_rules()` blocks `credits_balance`, referral fields, `la_so`, birth — but **not** `subscription_expires_at`, `bazi_reading_unlocked_at`, `tieu_van_reading_expires_at`.

- Trigger: `supabase/migrations/20260531160000_referral_cash_rewards.sql` L266–308
- Update policy: `supabase/migrations/20260325120000_initial_schema.sql` L30–33

Any authenticated user can `UPDATE profiles SET subscription_expires_at = …` via publishable key → bypasses PayOS and unlocks calendar + delivery RLS.

**Fix:** Extend trigger to reject client changes to entitlement columns (mirror credits/referral block).

### C2 — Missing `verify_jwt` entries for new van-trinh-nam functions
`generate-reading-van-trinh-nam` and `van-trinh-nam-delivery` exist but are **absent** from `supabase/config.toml`. If hosted default is `verify_jwt=true`, production calls 401 before handler auth runs.

- Functions: `supabase/functions/generate-reading-van-trinh-nam/index.ts`, `van-trinh-nam-delivery/index.ts`
- Config ends at L501 without these entries.

---

## HIGH

### H1 — Cron / ops endpoints fail-open without `CRON_SECRET`
`verifyCronAuth()` returns `true` when secret unset (`cron-payos-expire-orphans/index.ts` L18–24, `cron-reading-cache-purge/index.ts` L17–23, `payos-config-health/index.ts` L15–21). Unauthenticated callers can expire orders, purge cache, probe secret flags.

### H2 — LLM rate limit fails open when Redis unavailable
`acquireGenerateReadingRateLimit()` (`generate-reading-guards.ts` L96–99): if `redisSetNxEx` fails and key absent, returns `true`. Redis outage removes 10s/user cap → cost/abuse risk.

### H3 — `bazi_reading_deliveries` RLS looser than Edge gating
RLS (`20260531130000_bazi_reading_deliveries.sql` L24–40): any active `subscription_expires_at > now()`. Edge `canUseBaziReading()` (`entitlements.ts` L40–52) requires **11+ months** OR `bazi_reading_unlocked_at`. Short-sub users could read rows if present (e.g. after C1 self-grant).

### H4 — `day_luan_threads` / `day_luan_ask_idempotency` lack write hardening
RLS enabled + SELECT-only on threads (`20260531180000_day_luan_threads.sql`); ask table has no policies (`20260531180100_day_luan_ask_idempotency.sql`). Relies on deny-by-default — no `REVOKE`/`RESTRICTIVE` pattern used on `tieu_van_unlocks` (`20260530120000`).

---

## MEDIUM

### M1 — All Edge Functions use `verify_jwt = false`
Documented in `config.toml` L408–501 with in-handler `getUser()` / HMAC / service-role checks. Correct pattern but **single point of failure** — any handler missing auth is fully public at gateway.

### M2 — In-memory admin rate limit not durable
`admin-auth.ts` L35–52: per-isolate 60 req/min. Resets on cold start; not shared across instances.

### M3 — `prewarm_user_id` helper unused
`internal-service-auth.ts` L8–15 exports `prewarmUserIdFromBody`; `bazi-reading-prewarm` uses `user_id` (L48–49). Naming drift.

### M4 — `feature_credit_costs` / `app_config` public SELECT `using (true)`
Intentional (`initial_schema.sql` L50–52, L63–65). Ensure no secrets in `app_config` values.

### M5 — Credits runtime retired but schema remains
`credits_balance`, `credit_ledger`, atomic RPCs still present; trigger blocks client credit writes. Legacy surface area.

---

## LOW

### L1 — `webhook_events` RLS, no policies
`initial_schema.sql` L129–131 — service_role only by default. Fine; add explicit `REVOKE` for clarity.

### L2 — `share_tokens` user INSERT allowed
`initial_schema.sql` L153–155 — users can create tokens; resolve via service_role with trimmed payload (`share-resolve/index.ts` L8–18). OK by design.

### L3 — context-mode MCP broken locally
`better-sqlite3` bindings missing — audit used direct file reads.

---

## Working well

| Area | Notes |
|------|-------|
| **PayOS webhook** | HMAC verify (`payos-webhook/index.ts` L58–66), SKU/amount validation L94–118, atomic `claim_payment_order_paid` RPC L122–128 |
| **Prewarm internal auth** | `bazi-reading-prewarm` requires service-role bearer (`L31–33`, `internal-service-auth.ts` L2–6) |
| **tieu_van_unlocks** | RESTRICTIVE deny + `REVOKE` (`20260530120000`) — exemplar defense-in-depth |
| **van_trinh_nam_deliveries** | Entitlement-gated SELECT + write revoke (`20260602140000`, fix `20260602150000`) |
| **reading_cache** | No user policies; daily purge cron (`20260329120000`, `cron-reading-cache-purge`) |
| **Admin RPCs** | `REVOKE` from anon/authenticated (`admin_dashboard_stats`, referral functions) |
| **generate-reading** | Shared `create-handler.ts`, per-endpoint split, Upstash rate limit, `reading_cache` + version keys, edge budget 52s |
| **Referral RPC** | `apply_referral_pair` revoked from client (`20260527140000`) |
| **Entitlements module** | Single source `_shared/entitlements.ts` shared with PayOS fulfillment |

---

## Edge Function inventory (28)

| Function | Auth pattern | config.toml |
|----------|--------------|-------------|
| payos-webhook | PayOS HMAC | ✓ false |
| payos-create-checkout | Bearer+getUser | ✓ |
| reading-unlock | Bearer+getUser | ✓ |
| bat-tu | Mixed free/paid JWT | ✓ |
| generate-reading-{day,la-so,tieu-van,luu-nien} | Bearer+entitlement+Redis RL | ✓ |
| **generate-reading-van-trinh-nam** | Bearer+tieu-van gate | **✗ missing** |
| day-luan-chat | Bearer+preflight | ✓ |
| bazi-reading-{delivery,prewarm} | JWT / service-role | ✓ |
| **van-trinh-nam-delivery** | Bearer+tieu-van gate | **✗ missing** |
| share-{resolve,og} | service_role / public | ✓ |
| referral-{claim,dashboard} | Bearer+getUser | ✓ |
| create-share-token | Bearer+getUser | ✓ |
| admin-* (7) | ADMIN_EMAILS allowlist | ✓ |
| cron-{payos-expire,reading-cache-purge} | CRON_SECRET (optional) | ✓ |
| payos-config-health | CRON_SECRET (optional) | ✓ |

---

## Recommended priority fixes

1. **C1** — Block entitlement column updates in `profiles_enforce_update_rules`
2. **C2** — Add `[functions.generate-reading-van-trinh-nam]` and `[functions.van-trinh-nam-delivery]` to config.toml
3. **H1** — Require `CRON_SECRET` in production (fail closed)
4. **H2** — Fail closed or degrade gracefully when Redis required for paid LLM paths
5. **H3** — Align `bazi_reading_deliveries` RLS with `canUseBaziReading` (330-day sub check)
6. **H4** — Add REVOKE/RESTRICTIVE on day_luan + bazi_reading_deliveries writes
