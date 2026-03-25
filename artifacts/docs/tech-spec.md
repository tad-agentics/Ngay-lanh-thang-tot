# Tech Spec — Ngày Lành Tháng Tốt (ngaylanhthangtot.vn)

**Version:** 1.0  
**Last updated:** 2026-03-25

**Phase 2 note:** `artifacts/docs/screen-specs-*-v1.md` was **not** produced for this run. Screen inventory, routes, and mock shapes are taken from **`src/make-import/`** (`routes.tsx`, `mock-data.ts`, `user-context.tsx`). Formal screen-spec rows are **deferred**; QA should cross-check against Make + this document.

---

## 1. Overview

**Ngày Lành Tháng Tốt** is a Vietnamese B2C PWA that helps spiritually-minded adults pick auspicious dates (khai trương, cưới hỏi, ký hợp đồng, etc.) using **Bát Tự Tứ Trụ** logic, personalized by saved **lá số**. Users consume **credits** or **time-bound bundles** (PayOS); anonymous users get **hôm nay** + **tuần này** free. Core value: **deterministic, Vietnamese explanations**—no generative AI chatbot.

---

## FE–BE Connection — Quick Reference

| Concern | Where |
|---|---|
| Functional requirements | §2 |
| NFRs / scale | §3 |
| TypeScript types | §4 → `app/lib/api-types.ts` |
| Integrations | §5 |
| Data hooks / queries | §9 → `app/lib/data/`, `app/hooks/` |
| Edge contracts | §10 |
| Errors | §10 — Standard error shape |
| Auth & RLS | §11 |
| Env vars | §12 |
| Schema SQL | §8, `supabase/migrations/20260325120000_initial_schema.sql` |
| SEO / PWA | §18 |

---

## 2. Functional Requirements

| # | As a… | I can… | Acceptance signal |
|---|---|---|---|
| FR-01 | Anonymous visitor | See today’s Hoàng/Hắc Đạo + best hours + weekly teaser without logging in | Home loads public data from engine |
| FR-02 | Anonymous visitor | Browse monthly calendar overview (non-personalized) | Calendar grid matches engine `lich-thang` |
| FR-03 | User | Sign up / in with **Google** or **email + password** (Supabase Auth) | Session persists until sign-out |
| FR-04 | New user | Receive **starter credits** on first account (config-driven, default 20) | `credits_balance` matches `app_config.starter_credits` |
| FR-05 | User | Buy credit pack or 6/12-month bundle via **PayOS** | Checkout redirect + webhook increases credits or sets `subscription_expires_at` |
| FR-06 | User | Spend credits per feature; costs read from `feature_credit_costs` | Balance decreases; paywall when insufficient + no active bundle |
| FR-07 | User | Run **chọn ngày** (26 intents), see graded results + detail | Matches Make flows; costs: window 30/60/90 + detail |
| FR-08 | User | Open **lịch** day detail with 26 mục đích scores | `day-detail` + credit gate |
| FR-09 | User | Create locked **lá số** (birth date/time/gender) once; stored in profile | `la_so` JSON populated; birth fields immutable after lock |
| FR-10 | User | View **vận tháng**, **hợp tuổi**, **phong thủy** with personalization when lá số exists | Engine ops `tieu-van`, `hop-tuoi`, `phong-thuy` |
| FR-11 | User | Generate **share card** with token (no birth data in token payload) | Share link opens preview; **1 credit** when applied |
| FR-12 | User | Manage settings, legal pages, notification permission | Screens from Make: Cài đặt, Điều khoản, Privacy |
| FR-13 | Returning user | Receive **seasonal** web push (opt-in after 3rd session pattern) | Subscriptions stored; cron Edge sends |

**Grouping:** Auth+Billing (FR-03–06), Core loop (FR-01–02, FR-07–08), Personalization (FR-09–10), Social (FR-11), Retention (FR-01, FR-13), Compliance UI (FR-12).

---

## 3. Non-Functional Requirements

| Category | Requirement | Target |
|---|---|---|
| Performance | LCP (landing) | ≤ 2.5s on 4G (§18) |
| Performance | Bát Tự API | &lt; 500ms p95 (northstar §10) |
| Scale | DAU v1 | ~5k (northstar §10) |
| Scale | Concurrent peak | ~500 |
| Scale | DB | ~100k profiles Y1; plan for query logs if needed |
| Security | RLS | All user tables RLS; service role only in Edge |
| Security | Secrets | Never `VITE_*` except publishable keys |
| A11y | WCAG | AA |
| i18n | Language | Vietnamese only (§17) |

---

## 4. Shared TypeScript Interfaces

Implemented in **`app/lib/api-types.ts`**. Field names match **database snake_case** for entities. UI DTOs may mirror Make **camelCase** at the route layer.

Key types: `Profile`, `LaSoJson`, `FeatureCreditCost`, `CreditLedgerEntry`, `PaymentOrder`, `ShareToken`, `SharePayload`, `CalendarDay`, `ResultDay`, `CreditPackage`, `BatTuOperation`, PayOS request/response types.

**Make → DB feature_key mapping** (replace hardcoded `FEATURE_COSTS` in app with DB):

| Make / mock key | `feature_credit_costs.feature_key` |
|---|---|
| `chon_ngay_30` | `chon_ngay_30` |
| `chon_ngay_60` | `chon_ngay_60` |
| `chon_ngay_90` | `chon_ngay_90` |
| `chon_ngay_detail` | `chon_ngay_detail` |
| `ngay_chi_tiet` | `day_detail` |
| `la_so` | `tu_tru` |
| `van_thang` | `tieu_van` |
| `hop_tuoi` | `hop_tuoi` |
| `phong_thuy` | `phong_thuy` |
| `chia_se` | `share_card` |

---

## 5. External Integrations

| Service | Purpose | Method | Source |
|---|---|---|---|
| **Supabase** | Auth, Postgres, RLS, Edge Functions | `@supabase/supabase-js` | northstar §10 |
| **Bát Tự API** | All calculation endpoints (13 ops) | HTTP + `X-API-Key`; **server-only** | northstar §10; `.env` `BAT_TU_*` |
| **PayOS** | Checkout + webhook | REST + checksum | northstar §11 |
| **Web Push** | PWA push | standard Web Push + VAPID | northstar §10 |
| **OG share image** | Dynamic preview | **Supabase Edge** + `@vercel/og`/satori (Deno bundle) or canvas-backed renderer — **not** Next `/api` | northstar §10 |

**Integration research docs:** `artifacts/integrations/*.md` **not required** for PayOS/Supabase/Bát Tự where northstar lists env vars and behaviors; optional **PayOS** doc can be added later for edge cases.

### Bát Tự API

- **Wrapper:** `supabase/functions/bat-tu/index.ts` (single invoker with `op` + JSON body).
- **Auth:** `BAT_TU_API_KEY` in Edge secrets only.
- **Client:** `supabase.functions.invoke('bat-tu', { body: BatTuRequest })` — never call Bát Tự URL from browser.
- **Credit enforcement:** For paid `op`, Edge Function checks `profiles` + bundle expiry, deducts via **service role** + `credit_ledger` atomically before/upstream of engine call (implementation detail: single transaction strategy in Edge).

### PayOS

- **Checkout creation:** `supabase/functions/payos-create-checkout` — validates `package_sku`, creates `payment_orders` row, returns PayOS URL.
- **Allowed `package_sku` values (must match Make + `PACKAGES`):** `le` (credit pack), `goi_6thang`, `goi_12thang`. Reject unknown SKUs with `422`.
- **Webhook:** `supabase/functions/payos-webhook` — verifies signature (`PAYOS_CHECKSUM_KEY`), idempotent `webhook_events`, updates order + credits + ledger.

---

## 6. Tech Stack

| Layer | Choice |
|---|---|
| Framework | React Router v7 (Vite), SPA + prerender `/` |
| UI | Tailwind v4; Radix primitives from Make |
| Backend | Supabase (Postgres + Auth + RLS + Edge Functions) |
| Payments | **PayOS** (not Stripe) |
| Animation | `motion` + `react-countup` (EDS §6) |
| Deploy | Vercel (static SPA) |

---

## 7. Architecture Overview

```
Browser (VITE_ + JWT) ──► Supabase PostgREST / Auth
                      └──► Edge Functions (service role)
                                └──► Bát Tự API (secret)
                                └──► PayOS API (secret)
```

- No Node server in the frontend repo.
- Bát Tự and PayOS secrets **only** in Edge env.

---

## 8. Database Schema

**Migrations:**  
- `supabase/migrations/20260325120000_initial_schema.sql` — tables + RLS  
- `supabase/migrations/20260325120100_auth_create_profile.sql` — after insert on `auth.users`, creates `public.profiles` and a `credit_ledger` row with reason `starter_grant`; reads `app_config.starter_credits` or defaults **20**

**Seed:** `supabase/seed.sql`

### `profiles`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | `auth.users.id` |
| email | text | sync from auth optional |
| display_name | text | |
| ngay_sinh | date | immutable after lock |
| gio_sinh | time | |
| gioi_tinh | text | `nam` / `nu` |
| la_so | jsonb | full Tứ Trụ payload |
| credits_balance | int | ≥ 0 |
| subscription_expires_at | timestamptz | null = credit mode |
| birth_data_locked_at | timestamptz | set on first lá số commit |
| push_enabled | bool | |

**RLS:** `auth.uid() = id` for select/insert/update.

### `feature_credit_costs`

PK `feature_key`, `credit_cost`, `is_free`. **Public SELECT.**

### `app_config`

KV for `starter_credits`, etc. **Public SELECT** (no secrets).

### `credit_ledger`

Append-only ledger; **SELECT own**; **INSERT** via service role only.

### `payment_orders`

PayOS lifecycle. **SELECT own**.

### `webhook_events`

Idempotency store. **No user policies** (service role only).

### `share_tokens`

`token` unique; `payload` without PII. **SELECT own**; public resolution via Edge.

### `push_subscriptions`

Web push endpoints per user; **full CRUD own**.

---

## 9. Data Access Layer

| Hook / function | Returns | Screens |
|---|---|---|
| `useAuth` / `AuthProvider` | session | all |
| `useProfile` | `Profile` | Home, settings, gates |
| `getFeatureCosts` | `FeatureCreditCost[]` | paywall, Mua lượng |
| `invokeBatTu(op, body)` | typed DTO | feature screens |
| `createPayosCheckout(...)` | checkout URL | MuaLuong |

*Implementations added in Foundation / features per build plan.*

---

## 10. API Contracts (Edge Functions)

### Standard error JSON

```json
{
  "error": {
    "code": "INSUFFICIENT_CREDITS",
    "message": "Không đủ lượng để dùng tính năng này."
  }
}
```

### `bat-tu`

- **Invoke:** authenticated JWT (optional for whitelisted free `op` list: `ngay-hom-nay`, `weekly-summary`, `convert-date`, `lich-thang` overview only — exact allowlist TBD with engine).
- **Body:** `{ "op": string, "body": object }`
- **200:** `{ "data": unknown }`
- **402:** insufficient credits  
- **401:** auth required for paid/personalized ops  

### `payos-create-checkout`

- **Auth:** required  
- **Body:** `CreatePayosCheckoutRequest`  
- **200:** `CreatePayosCheckoutResponse`  

### `payos-webhook`

- **Auth:** PayOS signature header  
- **200:** OK after idempotent process  

### `share-resolve` (public)

- **GET/POST** with `token`  
- **200:** sanitized payload for public preview page + crawler  

### `share-og`

- **GET** — renders OG PNG for Zalo/FB (uses `share-resolve` data + Vietnamese font)  

### `push-register` / cron push jobs

- Register subscription (auth).  
- `cron-push-seasonal` — `CRON_SECRET` or Supabase **pg_cron** + internal auth header.

---

## 11. Auth & Security Model

Per **northstar §9** (overrides W1 table typo “Phone OTP”):

- **Methods:** Google OAuth (primary), email + password.
- **Anonymous:** today + weekly non-personalized content **without** account.
- **Account trigger:** required when saving **lá số** (unlock `tu_tru` / 15 cr).
- **Birth data:** immutable after confirm; support-assisted reset only.
- **Session:** Supabase persistent JWT.
- **RLS:** strict on all user tables.

---

## 12. Environment Variables

| Variable | Scope |
|---|---|
| `VITE_SUPABASE_URL` | client |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | client |
| `VITE_APP_URL` | client |
| `VITE_VAPID_PUBLIC_KEY` | client |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge secret |
| `BAT_TU_API_URL`, `BAT_TU_API_KEY` | Edge secret |
| `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY` | Edge secret |
| `SHARE_TOKEN_SECRET` | Edge secret (HMAC) |
| `VAPID_PRIVATE_KEY`, `VAPID_PUBLIC_KEY` | Edge |
| `CRON_SECRET` | Edge (if invoking cron via HTTP) |

Update **`/.env.example`** to mirror (no values).

---

## 13–14. LLM / AI Module Inventory

**Omitted.** Generative AI chatbot is **out of scope** (northstar §8). Deterministic engine only.

---

## 15. Scheduled Tasks

| Job | Schedule | Function | Notes |
|---|---|---|---|
| Seasonal push | e.g. weekly in wedding season | `cron-push-seasonal` | northstar §10 triggers |
| Month-start | monthly | `cron-push-month-start` | |
| Tết window | weekly in Chạp | `cron-push-tet` | |

Use **Supabase** scheduling (pg_cron invoking Edge) as primary; `CRON_SECRET` for secured HTTP trigger if needed.

---

## 16. Email Flows

**Omitted** unless product adds Resend later.

---

## 17. Not Building

Copied from northstar §8 (summary — build agents must not implement):

- Chatbot / free-form AI Q&A  
- Raw lịch tables / abbreviations as primary UI  
- Marketplace thầy / booking  
- Community / UGC  
- AI-personalized push (only seasonal cron)  
- Non-Vietnamese locales  
- Admin dashboard (use Supabase + PayOS portals)  
- Credit gifting  
- Full query history / timeline (v1)  
- Offline-first engine   
- Auto-renew subscription billing  
- Self-serve birth data edit  

**Known shortcuts:** Dashboard admin; share OG server-side; seasonal-only push; temporary “other person” input without saving profile.

**Northstar §12 W3 vs v1 scope:** The wave table mentions “Profile gia đình / lưu nhiều người”. **v1 does not** add a `family_profiles` (or equivalent) table. Behavior matches the **known shortcut**: another person’s birth data is **entered per session only** and is **not** persisted—see northstar §8 / shortcuts. Multi-person stored profiles are out of scope until a future version explicitly adds schema + spec.

---

## 18. SEO & PWA

- Pre-render `/` via `react-router.config.ts`.  
- `lang="vi"` on `html`.  
- Landing copy from northstar §7b (headline, FAQ → JSON-LD).  
- `public/manifest.json`, `robots.txt`, `sitemap.xml`, icons, Vietnamese `.woff2`.  
- `vite-plugin-pwa` (already in project).  
- Validate with Facebook Debugger + Zalo debug tools before launch.

---

## Quality Checklist

Self-verified: Overview, FR, NFR, types file, integrations, stack, architecture, schema+migration+seed, DAL table, Edge contracts, auth, env, not building, SEO/PWA, LLM omitted, email omitted, cron covered.

---

## Next Steps

1. Human review + approve this spec.  
2. Run **`/setup`** → build plan.  
3. Regenerate `database.types.ts` after `supabase db push` / `gen types`.

## 19. Foundation checklist (implemented vs deferred)

| Item | Status |
|---|---|
| Auth → `profiles` + starter ledger | **Implemented** in `20260325120100_auth_create_profile.sql` |
| Make → DB `feature_key` map in code | **Deferred** — add `FEATURE_KEY_MAP` in `app/lib/` during port |
| Normalize `la_so` JSON from Bát Tự | **Deferred** — at Edge/API boundary |
| PayOS Edge functions | **Deferred** — Foundation / feature wave |
