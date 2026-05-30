# FE ↔ BE / API Wiring Audit Plan

**Purpose:** Verify that every frontend data-flow connects to the correct backend contract (Supabase DB, RLS policies, Edge Functions, RPC, env vars). This is a functional wiring audit — not a visual/design audit.

**Last updated:** 2026-05-10 (implemented)  
**Status:** All confirmed ❌ gaps fixed. Verification checks remain for manual QA.

---

## How to use this plan

Each group below has:
- **What to check** — the specific wiring contract
- **Files involved** — FE and BE paths to inspect
- **Acceptance** — pass criteria
- **Known risks** — gaps already found during initial investigation

Work groups in order. Mark each item ✅ (pass), ❌ (fail — issue filed), or ⚠️ (minor / non-blocking).

---

## Group 1 — Environment & Runtime Config

### 1.1 Client-side env vars
| Var | Used by | Required? |
|-----|---------|-----------|
| `VITE_SUPABASE_URL` | `app/lib/supabase.ts`, `share-token.ts` | ✅ mandatory |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `app/lib/supabase.ts` | ✅ mandatory |
| `VITE_APP_URL` | `app/routes/app.toi.tsx` (referral link copy) | ✅ mandatory |
| `VITE_VAPID_PUBLIC_KEY` | `app/routes/app.thong-bao-quyen.tsx` (Web Push) | ✅ mandatory for push |

**Check:** `.env.local` (dev) and Vercel project env (prod) contain all four vars.  
**Acceptance:** App loads without white-screen; push permission screen does not error on subscribe.

### 1.2 Edge Function secrets
| Secret | Function | Notes |
|--------|----------|-------|
| `BAT_TU_BASE_URL`, `BAT_TU_API_KEY` | `bat-tu` | Bát Tự upstream |
| `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY` | `payos-create-checkout`, `payos-webhook` | Payment |
| `DEEPSEEK_API_KEY` | `generate-reading-day` / `-la-so` / `-tieu-van` | AI reading |
| `SUPABASE_SERVICE_ROLE_KEY` | most Edge functions | DB mutations |
| `SUPABASE_URL` | most Edge functions | auto-set by Supabase |
| `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | `cron-push-habit` | Web Push |

**Check:** Supabase Dashboard → Project Settings → Edge Function Secrets — all present.  
**Acceptance:** Each Edge function deploys without `SERVER_CONFIG` errors.

---

## Group 2 — Auth Flow

### 2.1 Google OAuth
- **FE:** `dang-nhap.tsx` → `supabase.auth.signInWithOAuth({ provider: "google" })`
- **Callback:** `auth.callback.tsx` reads `#access_token` / exchange code → sets session
- **Acceptance:** After OAuth redirect, user lands in `/app`, `useProfile` returns populated `profile`.

### 2.2 Email / password
- **FE login:** `dang-nhap.email.tsx` → `supabase.auth.signInWithPassword`
- **FE signup:** `dang-ky.tsx` → `supabase.auth.signUp`
- **FE forgot:** `quen-mat-khau.tsx` → `supabase.auth.resetPasswordForEmail`
- **Check:** Confirm `redirect_to` in `resetPasswordForEmail` matches Supabase Auth **Redirect URLs** allow list (exact paths):
  - `{origin}/auth/callback` — OAuth + email confirm
  - `{origin}/dat-lai-mat-khau/recovery` — password reset (`app/lib/auth-password-reset.ts`)
- **Prod ops (Dashboard only — MCP cannot set):** [URL Configuration](https://supabase.com/dashboard/project/hptovpbiwvtngorhdhhm/auth/url-configuration) — add `https://ngaylanhthangtot.vn/auth/callback` and `https://ngaylanhthangtot.vn/dat-lai-mat-khau/recovery`; local: `supabase/config.toml` `[auth]` block.
- **Acceptance:** Login, signup, and password-reset emails arrive; sessions persist on reload.

### 2.3 Profile auto-creation
- **Migration:** `20260325120100_auth_create_profile.sql` — trigger `on_auth_user_created` inserts into `profiles`.
- **FE:** `app/lib/profile-context.tsx` queries `profiles.select("*")` for the signed-in user.
- **Check:** After first login, a row exists in `profiles` with `credits_balance = <starter ledger>`.
- **Acceptance:** `useProfile().profile` is non-null immediately after OAuth/email sign-in.

### 2.4 Auth guard layout
- **FE:** `app/routes/_app/layout.tsx` — redirects unauthenticated users to `/dang-nhap`.
- **Check:** Direct-navigate to `/app` while logged out → redirects to `/dang-nhap`.

---

## Group 3 — Profile & Lá Số Wiring

### 3.1 Profile read
- **FE:** `profile-context.tsx` → `supabase.from("profiles").select("*").eq("id", userId)`
- **RLS check:** `profiles` RLS policy allows `SELECT` for own user.
- **Acceptance:** `profile.credits_balance`, `profile.la_so`, `profile.subscription_expires_at` all visible.

### 3.2 Profile write (onboarding / bat-dau)
- **FE:** `app/routes/app.bat-dau.tsx` → `supabase.from("profiles").update({ ngay_sinh, gio_sinh, gioi_tinh, onboarding_completed_at })`
- **RLS check:** `profiles` RLS allows `UPDATE` for own user.
- **Migration:** `20260325210000_personalization_profile_protection.sql` — `birth_data_locked_at` enforcement.
- **Check:** After saving birth data, `profile.ngay_sinh` is set and `profile.birth_data_locked_at` is populated (prevents re-edit).
- **Acceptance:** Cannot re-submit birth data once locked; `bat-dau` screen shows locked state.

### 3.3 Lá số fetch (bat-tu `tu-tru` op)
- **FE:** `app/routes/app.la-so.tsx` → `invokeBatTu({ op: "tu-tru", ... })` → stores result in `profiles.la_so` via upsert.
- **Edge:** `bat-tu` op `tu-tru` — requires JWT + birth data; returns pillar JSON.
- **Check:** After calling `tu-tru`, `profile.la_so` is non-null; `nhat_chu`, `hanh`, `menh` fields present.
- **Acceptance:** `app.la-so.tsx` displays `nhat_chu` and `hanh`; `app.toi.tsx` shows lá số summary.

### 3.4 Lá số chi tiết (bat-tu `la-so` op + generate-reading)
- **FE:** `app/routes/app.la-so.chi-tiet.tsx` → `invokeBatTu({ op: "la-so", ... })` then `invokeGenerateReading({ endpoint: "la-so", ... })`
- **Edge:** `bat-tu la-so` is billing-exempt (`featureKeyForBilling = null`); `generate-reading` uses `la_so_diengiai` feature key (free per migration).
- **Check:** Reading generates without credit deduction; `sections` array renders in accordion UI.
- **Acceptance:** Chi tiết screen shows structured sections; no credit warning modal shown.

---

## Group 4 — Bát Tự Proxy (bat-tu Edge)

All 12 ops used by FE vs the 14 accepted ops:

| Op | FE file | Auth required | Feature key |
|----|---------|---------------|-------------|
| `ngay-hom-nay` | `app._index` | No | `ngay_hom_nay` |
| `weekly-summary` | `app._index`, `app.thang` | No | `weekly_summary` |
| `lich-thang` | `app.thang` | No | `lich_thang_overview` |
| `convert-date` | `app.chuyen-lich`, `app.tieu-van` | No | `convert_date` |
| `chon-ngay` | `app.chon-ngay` | Yes | `chon_ngay_*` |
| `chon-ngay/detail` | `app.chon-ngay.ket-qua` | Yes | `chon_ngay_detail` |
| `day-detail` | `app.ngay.$ngay` | Yes | `day_detail` |
| `tu-tru` | `app.la-so` | Yes | `tu_tru` |
| `hop-tuoi` | `app.hop-tuoi` | Yes | `hop_tuoi` |
| `phong-thuy` | `app.phong-thuy` | Yes | `phong_thuy` |
| `tieu-van` | `app.tieu-van` | Yes | `tieu_van` |
| `la-so` | `app.la-so.chi-tiet` | Yes | billing-exempt |

**Not used via `invokeBatTu`:** `profile` (may be for admin/internal), `share` (share-resolve handles share flow differently).

### 4.1 Per-op request shape validation
For each op, verify the payload built by the FE (see `bat-tu-birth.ts`, `tu-tru-intents.ts`, `chon-ngay-flow.ts`, etc.) matches what the `bat-tu` Edge expects:

- **`ngay-hom-nay` / `weekly-summary`:** No birth data required. `day_iso` (YYYY-MM-DD). ✅ Low risk.
- **`chon-ngay`:** `intent` (purpose string), `duration_days` (30/60/90), birth data (if profile has it). Check `mapChonNgayPayloadToResultDays` handles null profile gracefully.
- **`chon-ngay/detail`:** Requires `days` array from prior `chon-ngay` result; cached in session/state.
- **`day-detail`:** `day_iso` + birth data. Verify `profileToBatTuPersonQuery` outputs correct field names for upstream.
- **`tieu-van`:** Birth data required; `convert-date` op also called inside this screen.
- **`hop-tuoi` / `phong-thuy`:** Input forms — verify field names map to Edge expectations.

### 4.2 Anonymous op gating
**Check:** Logged-out user can load `/` (home), `app.thang`, `app.chuyen-lich` without 401 — these ops allow anonymous.  
**Acceptance:** No error toast for anonymous `ngay-hom-nay`, `weekly-summary`, `lich-thang`, `convert-date`.

### 4.3 Rate-limit error handling
- **Edge** returns `{ error: { code: "RATE_LIMITED", reset_at: <unix> } }`.
- **FE** `invokeBatTu` propagates `reset_at`; UI should show cooldown timer.
- **Check:** Simulate rate-limit response; verify UI shows countdown instead of generic error.

---

## Group 5 — Feature Costs & Credit Gating

### 5.1 Feature costs loading
- **FE:** `FeatureCostsProvider` wraps `/app/*` layout → `fetchFeatureCreditCosts` → `feature_credit_costs` table.
- **RLS check:** `feature_credit_costs` is publicly readable (no auth filter).
- **Acceptance:** `useFeatureCosts()` returns non-empty map on any screen.

### 5.2 Feature key mapping
- **`app/lib/constants.ts`** exports `FEATURE_KEY_MAP` (e.g. `la_so → tu_tru`).
- **Check:** Every UI feature that charges credits references a key present in the DB seed (`20260327120000_seed_feature_costs_and_app_config.sql` + later migrations).
- **Known keys to verify:**

| UI label | DB `feature_key` | free? |
|----------|-----------------|-------|
| Hôm nay reading | `ngay_hom_nay` | check costs table |
| Weekly summary | `weekly_summary` | check |
| Day detail | `day_detail` | free per migration `20260328130000` |
| Chọn ngày 30/60/90 | `chon_ngay_30`, `chon_ngay_60`, `chon_ngay_90` | check |
| Chọn ngày detail | `chon_ngay_detail` | check |
| Tứ Trụ (lá số) | `tu_tru` | check |
| Tiểu Vận | `tieu_van` | check (migrations 20260402, 20260403, 20260404) |
| Hợp Tuổi | `hop_tuoi` | check (migration 20260406) |
| Phong Thủy | `phong_thuy` | check |
| Chia sẻ | `share_card` | check |
| Lá số diễn giải | `la_so_diengiai` | free (migration 20260401) |
| AI reading unlock | `ai_reading_unlock` | check (migration 20260402143000) |
| AI reading bulk | `ai_reading_bulk_unlock` | check (migration 20260510120000) |

### 5.3 CreditGate component
- **Check:** Screens with paid features show `CreditGate` paywall when `credits_balance < cost && !subscriptionActive`.
- **Acceptance:** Clicking "Mua lượng" inside paywall navigates to `/app/mua-luong`.

### 5.4 Credits balance refresh after Edge charges
- **Risk:** `bat-tu`, `reading-unlock`, `create-share-token` all deduct credits server-side. FE must reload profile after each call.
- **Check:** After a chargeable op, `useProfile().refresh()` or navigation causes `profile.credits_balance` to update in the UI.
- **Acceptance:** `CreditsHeaderChip` shows updated balance within 1–2 seconds of a paid action.

---

## Group 6 — AI Reading (generate-reading + reading-unlock)

### 6.1 Home screen reading (scope: `home`)
- **FE:** `app._index.tsx` → `invokeReadingUnlock({ scope: "home", day_iso })` then `invokeGenerateReading({ endpoint: "home", ... })`
- **Session cache:** `today-reading-cache.ts` — reading cached to sessionStorage so re-render doesn't re-invoke.
- **Check:** Second mount of home screen does NOT call Edge again (cached).
- **Acceptance:** Home reading appears; no duplicate charges on page reload.

### 6.2 Day detail reading (scope: `day_detail`)
- **FE:** `app.ngay.$ngay.tsx` → `invokeReadingUnlock({ scope: "day_detail", day_iso })` then `invokeGenerateReading({ endpoint: "day-detail", ... })`
- **Edge `reading-unlock`:** Checks `ai_reading_unlock` feature cost; `already_unlocked` returns true on revisit.
- **Acceptance:** Revisiting a paid day-detail screen does NOT charge again.

### 6.3 Chọn ngày result reading
- **FE:** `app.chon-ngay.ket-qua.tsx` → `invokeGenerateReading({ endpoint: "chon-ngay-cards", ... })`
- **Response field:** `dayReadings` (Record<ISO, string>) — verify FE maps this to individual day cards.
- **Check:** `ResultDayCard` receives non-null `aiText` for each returned day.

### 6.4 Bulk unlock (NOT YET WIRED — known gap)
- **Edge:** `reading-unlock` supports `la_so_chi_tiet_bulk` scope + `ai_reading_bulk_unlock` feature key.
- **FE:** `ReadingUnlockScope` type only has `"home" | "day_detail"` — bulk never invoked.
- **Status:** ⚠️ Backend ready; FE wiring incomplete. File issue if bulk unlock is in roadmap.

---

## Group 7 — Pin Reading (UNFINISHED — known gap)

- **Edge:** `pin-reading` function exists with full pin/unpin contract (scope, day_iso, section, reading_snapshot, action).
- **DB:** `pinned_readings` table + RLS exist (`wave5_ai_reading_bulk_pinned.sql`).
- **FE:** `AiReadingBlock` component accepts `onPin` prop; **no `supabase.functions.invoke("pin-reading", …)` found anywhere in `app/`**.
- **Status:** ❌ Backend complete; FE invoke is missing. This feature is not wired end-to-end.
- **Action required:** Implement `invokePin` in `app/lib/` and connect it to `AiReadingBlock.onPin`.

---

## Group 8 — PayOS Billing Flow

### 8.1 Checkout initiation
- **FE:** `app.mua-luong.tsx` → `createPayosCheckout({ sku, return_url, cancel_url })` from `~/lib/payos.ts`
- **Edge:** `payos-create-checkout` validates SKU (`le` | `goi_6thang` | `goi_12thang`), creates `payment_orders`, calls PayOS API.
- **Check:** Each `UI_PACKAGES` entry in `app/lib/packages.ts` has a `sku` matching one of the three valid SKUs.
- **Acceptance:** Checkout sheet opens with QR code or checkout URL; no `INVALID_SKU` error.

### 8.2 Payment order polling
- **FE:** `usePollPaymentOrderPaid` → polls `payment_orders.select("*").eq("id", orderId)` for `status = "paid"`.
- **RLS check:** `payment_orders` allows `SELECT` for own user.
- **Acceptance:** After PayOS webhook fires, poll detects paid status and redirects to `/app/mua-luong/thanh-cong`.

### 8.3 Webhook → profile update
- **Edge:** `payos-webhook` verifies HMAC signature, marks order paid, updates `profiles.credits_balance` and/or `profiles.subscription_expires_at`.
- **Check:** In PayOS dashboard, configure webhook URL to `<SUPABASE_URL>/functions/v1/payos-webhook`.
- **Acceptance:** After payment confirmed, `profile.subscription_expires_at` is set (for subscription SKUs) or `credits_balance` increased.

### 8.4 Subscription active check
- **FE:** `subscriptionActive(profile.subscription_expires_at)` from `app/lib/subscription.ts`.
- **Check:** Subscription-gated features (e.g. `share_card` if subscribed) bypass credit deduction.
- **Acceptance:** `CreditsHeaderChip` shows "Không giới hạn" label for active subscriber.

### 8.5 `return_url` / `cancel_url` construction
- **FE:** `mua-luong.tsx` builds these from `window.location.origin`.
- **Edge:** validates URLs allow `http://localhost` and `127.0.0.1` for dev; requires `https` for prod.
- **Check:** In production, `return_url` uses `https://` scheme.

---

## Group 9 — Share Card Flow

### 9.1 Token creation
- **FE:** `app.chia-se.tsx` → `createShareToken({ result_type, payload })` from `~/lib/share-token.ts`
- **Edge:** `create-share-token` requires auth; deducts `share_card` credit (unless subscribed); inserts into `share_tokens`.
- **Check:** After share, token is returned and QR/link displayed.
- **Acceptance:** `share_card` credit cost deducted; profile balance refreshed.

### 9.2 Token resolution (public)
- **FE:** `x.$token.tsx` → `fetchShareResolve(token)` → GET `share-resolve?token=…`
- **Edge:** `share-resolve` is public (no JWT); returns sanitized payload.
- **Check:** Public URL `ngaylanhthangtot.vn/x/<token>` loads card without login.
- **Acceptance:** Shared card renders with correct event data, no 401 errors.

### 9.3 OG meta (crawler)
- **Edge:** `share-og` returns HTML `<meta>` tags for the token.
- **Check:** `<head>` of `/x/<token>` includes `og:title`, `og:description`, `og:image` pointing to share-og function.
- **Acceptance:** Link preview in messaging apps shows card thumbnail.

---

## Group 10 — Streak & Daily Check-in

### 10.1 `record_daily_visit` RPC
- **FE:** `useStreak.ts` → `supabase.rpc("record_daily_visit", { p_user_id, p_day_iso })` throttled to once-per-day via localStorage.
- **Migration:** `20260510140000_wave7_streaks.sql` — RPC is `SECURITY DEFINER`.
- **Acceptance:** After first app open of the day, `streaks.current_count` increments; `daily_check_ins` gains a row.

### 10.2 Check-in history
- **FE:** `app.nhip.lich-su.tsx` → `supabase.from("daily_check_ins").select("day_iso").eq("user_id", userId)`
- **RLS check:** `daily_check_ins` RLS allows SELECT for own user.
- **Acceptance:** 30-day grid shows checked/unchecked correctly for past days.

### 10.3 Streak modals
- **FE:** `app._index.tsx` reads `useStreak()` → shows Day-7 modal when `current_count === 7` (or milestone), Restart modal when streak breaks.
- **Acceptance:** Modal fires exactly once per milestone, dismissed to localStorage.

---

## Group 11 — Push Notifications

### 11.1 Permission + subscribe
- **FE:** `app.thong-bao-quyen.tsx` → `Notification.requestPermission()` → `navigator.serviceWorker.ready` → `pushManager.subscribe({ applicationServerKey: VITE_VAPID_PUBLIC_KEY })` → `supabase.from("push_subscriptions").upsert({ user_id, endpoint, p256dh, auth, user_agent }, { onConflict: "user_id,endpoint" })`.
- **RLS check:** `push_subscriptions` allows INSERT/UPDATE for own user.
- **Acceptance:** After granting permission, a row appears in `push_subscriptions` with `endpoint`, `p256dh`, `auth`.

### 11.2 Toggle (cài đặt nhịp)
- **FE:** `app.nhip.cai-dat.tsx` → toggle → `supabase.from("profiles").update({ push_enabled })`.
- **Check:** `profiles.push_enabled` flips correctly.
- **Acceptance:** Toggle persists across reload; profile row reflects new value.

### 11.3 Cron push — push_token disconnect ❌ BROKEN WIRING
- **What the plan originally said:** cron pages `push_subscriptions` and filters `push_enabled`.
- **What the code actually does:** `cron-push-habit` queries **`profiles WHERE push_token IS NOT NULL`** — it does **not** read `push_subscriptions` at all.
- **Critical gap:** `profiles.push_token` is **never written by the FE**. All FE subscription data lands in the `push_subscriptions` table (endpoint + p256dh + auth). The `wave7_push_token` migration adds `profiles.push_token` and `push_notifications_enabled` columns but no FE code populates them.
- **Result:** The cron job will find zero candidates and send no pushes.
- **Status:** ❌ End-to-end push delivery is broken. One of these must be fixed:
  - Option A: Make `cron-push-habit` join `push_subscriptions` instead of reading `push_token`.
  - Option B: Add FE logic to also write a token to `profiles.push_token` after subscribe.
- **Action:** File an issue; align cron query with the actual subscription storage strategy.

---

## Group 12 — Saved Picks

### 12.1 Save / unsave
- **FE:** `useSavedPicks.ts` → `supabase.from("saved_picks").insert({ user_id?, source_endpoint, payload, label, day_iso, score })` / `.delete().eq("id", id)`
- **RLS check:** `saved_picks` migration has `WITH CHECK (auth.uid() = user_id)` — requires `user_id` in the inserted row. PostgREST does **not** auto-fill `user_id`.
- **❌ Likely broken insert:** Verify that `useSavedPicks` explicitly includes `user_id: user.id` in the insert payload. If it does not, all saves will be rejected by RLS. Confirm the actual object passed to `.insert()`.
- **TypeScript note:** `insert()` uses `as never` workaround — verify DB types include `saved_picks` or regenerate with `supabase gen types`.
- **Acceptance:** Pick saved to DB; reloading tra-cứu screen shows saved pick.

### 12.2 List display
- **FE:** `app.tra-cuu.tsx` loads saved picks via `useSavedPicks`.
- **Acceptance:** Saved picks appear in the Đã lưu tab; tap navigates to source screen.

---

## Group 13 — Tiểu Vận Unlocks

### 13.1 Unlock check + deduction
- **FE:** `app.tieu-van.tsx` → queries `tieu_van_unlocks` for existing unlock (SELECT), then if absent, invokes bat-tu `tieu-van` op which handles billing and writes the unlock row server-side via service role.
- **Migration:** `20260405120000_tieu_van_unlocks.sql` — `tieu_van_unlocks` table.
- **RLS check:** `tieu_van_unlocks` has **SELECT-only** client RLS (`auth.uid() = user_id`). Writes come through Edge (service role) — FE does not INSERT directly.
- **Check:** After first `tieu-van` call, a row exists in `tieu_van_unlocks`; subsequent calls skip billing.
- **Acceptance:** First visit deducts credits; revisit is free.

---

## Group 14 — Referral

### 14.1 Referral stash (landing / signup)
- **FE:** `app/lib/pending-referral.ts` — reads `ref` or `referral` query param from URL → stores in `sessionStorage` key `ngaytot_pending_referral`.
- **Check:** Landing page or sign-up URL with `?ref=<code>` triggers `stash(code)`.

### 14.2 Referral claim on sign-in
- **FE:** `profile-context.tsx` calls `tryConsumePendingReferralClaim()` (via `app/lib/referral-claim.ts`) immediately after session loads → reads pending code → clears sessionStorage → `supabase.functions.invoke("referral-claim", { body: { code }, headers: Bearer session.access_token })`.
- **Edge:** `referral-claim` calls `apply_referral_pair` RPC (service role) — credits referrer + referee via `add_credits_atomic`; `profiles.referral_*` columns protected by trigger (`profiles_enforce_update_rules`) — clients cannot tamper.
- **Check:** `referral-claim.ts` dispatches `ngaytot:profile-refresh` event after success so `useProfile` reloads balance.
- **Acceptance:** After signing up with referral link, both users receive bonus credits; `profile.credits_balance` updates within seconds.

---

## Group 15 — Direct DB Reads (RLS Verification Matrix)

Verify each table has correct RLS policies for FE direct access:

| Table | FE access | Required RLS | Notes |
|-------|-----------|-------------|-------|
| `profiles` | SELECT + UPDATE own | `auth.uid() = id` | Update blocked for credit/referral fields by trigger |
| `feature_credit_costs` | SELECT all | Public read | — |
| `app_config` | SELECT `site_banner` | Public read | — |
| `payment_orders` | SELECT own | `auth.uid() = user_id` | FE polls for `status = 'paid'` |
| `push_subscriptions` | INSERT/UPDATE/DELETE own | `auth.uid() = user_id` | upsert by `user_id,endpoint` |
| `streaks` | SELECT own (via RPC) | Via SECURITY DEFINER | FE does not query directly |
| `daily_check_ins` | SELECT own | `auth.uid() = user_id` | nhip.lich-su screen |
| `saved_picks` | SELECT/INSERT/DELETE own | `auth.uid() = user_id` | INSERT must include `user_id` explicitly |
| `tieu_van_unlocks` | SELECT own only | `auth.uid() = user_id` | Writes via Edge service role |
| `share_tokens` | None (server only) | N/A | FE uses Edge; public resolution via share-resolve |
| `pinned_readings` | None (server only) | N/A | pin-reading Edge not wired from FE yet |

**Check:** Run `SELECT * FROM pg_policies WHERE tablename = '<table>'` for each, or use Supabase Studio → Table Editor → Policies.

### 15.1 Additional: `deduct_credits_atomic` RPC
- **Access:** `REVOKE ALL FROM PUBLIC` — service role only. FE **never calls it directly**.
- **Callers:** `create-share-token` and `reading-unlock` Edge functions.
- **Idempotency:** `ON CONFLICT (idempotency_key) DO NOTHING` on `credit_ledger`. Retries with the same key are safe.
- **Check:** Confirm FE code never calls `supabase.rpc("deduct_credits_atomic", …)` — only `supabase.rpc("record_daily_visit", …)` is allowed from client.

---

## Group 16 — `supabase gen types` Drift

- **FE type:** `app/lib/database.types.ts` — generated from Supabase schema.
- **Risk:** Migrations since last `gen types` run (`wave7_streaks`, `wave7_saved_picks`, `wave7_push_token`, `deduct_credits_atomic`) may have added tables/columns not reflected in `database.types.ts`.
- **Check:** Run `supabase gen types typescript --project-id <id> > app/lib/database.types.ts` and confirm no type errors in `npx tsc --noEmit`.
- **Known issue:** `useSavedPicks.ts` uses `as never` on `insert()` because `saved_picks` may be absent from current `database.types.ts`.
- **Acceptance:** `npx tsc --noEmit` passes with 0 errors after type regeneration.

---

## Summary of Known Gaps

| # | Area | Status | Severity | Action |
|---|------|--------|----------|--------|
| 1 | `pin-reading` FE invoke missing | ✅ Fixed | Medium | `app/lib/pin-reading.ts` created (`invokePin`, `fetchIsPinned`). Wired into `app.ngay.$ngay.tsx` (day detail) and `app._index.tsx` (home). Pin button renders inline; state loads on unlock. |
| 2 | Push notifications broken: `cron-push-habit` read `profiles.push_token` (never set) | ✅ Fixed | High | Rewrote `cron-push-habit` to query `push_subscriptions` table, filter by `profiles.push_notifications_enabled`, skip checked-in users, send real Web Push via VAPID, and clean up expired (410/404) subscriptions. |
| 3 | `saved_picks` insert missing `user_id` — RLS rejected rows | ✅ Fixed | High | `useSavedPicks.savePick` now calls `supabase.auth.getUser()` and includes `user_id: user.id` in the insert payload. |
| 4 | `database.types.ts` stale — `saved_picks` and `pinned_readings` missing | ✅ Fixed | High | Added `saved_picks` and `pinned_readings` table types. `useSavedPicks` no longer uses `as never`. |
| 5 | `la_so_chi_tiet_bulk` reading-unlock scope unimplemented on FE | ⚠️ | Low | Wire if bulk unlock UX enters roadmap |
| 6 | `bat-tu` ops `profile` + `share` not used via `invokeBatTu` | ⚠️ | None | Intentionally unused; document |
| 7 | `cron-push-habit` Web Push send was stub | ✅ Fixed | Medium | Resolved together with gap #2 — real VAPID send now implemented. Requires `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` secrets. |
| 8 | `VITE_APP_URL` + `VITE_VAPID_PUBLIC_KEY` missing from prod env, `VAPID_SUBJECT` undocumented | ✅ Fixed (doc) | High | `.env.example` updated with `VAPID_SUBJECT` and clear instructions. **Manual step:** add all four `VITE_*` vars in Vercel Dashboard → Project Settings → Environment Variables. |
| 9 | PayOS webhook URL not confirmed registered in PayOS dashboard | ⚠️ Manual | High | **Manual step:** configure `<SUPABASE_URL>/functions/v1/payos-webhook` in PayOS developer portal webhook settings. |

---

## Execution order recommendation

1. **Group 1** (env vars) — prerequisite for everything
2. **Group 16** (DB types) — fixes TypeScript noise before code audits; resolves `as never` workaround
3. **Gaps #2 + #3** (saved_picks user_id + push_token disconnect) — data integrity blockers, fix before testing
4. **Groups 2–3** (Auth + Profile) — identity is prerequisite for credit logic
5. **Group 5** (Feature costs) — prerequisite for Groups 6, 8
6. **Groups 4, 6** (bat-tu + AI reading) — core value loop
7. **Group 8** (PayOS billing + webhook URL) — revenue path
8. **Group 7** (pin-reading — file issue) — unfinished, track separately
9. **Groups 9–15** (remaining flows) — ancillary features
