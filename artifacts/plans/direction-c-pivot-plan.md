# Direction C Pivot — Implementation Plan

> **Status:** Approved design pivot (2026-05-27)  
> **Design source:** `artifacts/design/ngaylanhthangtot-vn/` (FE-HANDOFF.md, Direction C.html, Design System.html)  
> **Replaces:** Direction B build plan waves for UI/IA/billing model  
> **Tech baseline:** React Router v7 · Supabase · PayOS · Bát Tự Edge · Gemini `generate-reading`

---

## Executive summary

Direction C reframes the product from **"AI tool that picks lucky days"** (credit/lượng, 5-tab + FAB) to **"Lịch ngày lành cho riêng bạn"** (subscription calendar, 3-tab, lịch-tờ metaphor).

| Dimension | Direction B (shipped baseline) | Direction C (target) |
|---|---|---|
| Mental model | On-demand tool | Owned annual calendar |
| Home | Pick wedge / Hôm nay horoscope | Forest BG + lịch-tờ "Trang hôm nay" |
| Nav | 5 tabs + FAB | 3 tabs: Lịch · Tra cứu · Tôi |
| Monetization | Lượng + bundles (`le`, `goi_6thang`, `goi_12thang`) | Sub tiers (1/6/12 tháng) + 2 standalone luận add-ons |
| Gating | `feature_credit_costs` + deduct | `subscription_expires_at` + entitlements |
| Default result surface | Phiếu | Lịch-tờ page; phiếu = share/print only |

**Net screens:** ~40 artboards (from 56), ~20 distinct routes (from ~30).

---

## System design

### Architecture (unchanged layers)

```
Browser (JWT + publishable key)
  ├── Supabase Auth + PostgREST (profiles, orders, entitlements)
  ├── Edge: bat-tu (engine proxy + gating)
  ├── Edge: generate-reading (Gemini, subscription/add-on gated)
  ├── Edge: payos-create-checkout + payos-webhook
  └── Edge: share-resolve / share-og (unchanged)
```

### New domain: subscription entitlements

Direction C removes **lượng** from UX. Backend must shift from credit-per-op to **subscription + add-on entitlements**.

#### Proposed schema additions (migration)

```sql
-- profiles: keep subscription_expires_at as primary calendar access
-- New: track standalone luận purchases
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
  bazi_reading_unlocked_at timestamptz,
  tieu_van_reading_expires_at timestamptz;

-- Replace / extend package SKUs
-- payment_orders.package_sku allowlist changes (see PayOS section)
```

#### Entitlement matrix

| Capability | Anonymous | Active sub (any tier) | 1-năm sub | Standalone Bát tự (299k) | Standalone Tiểu Vận (199k) |
|---|---|---|---|---|---|
| Trang hôm nay teaser | ✅ public engine | ✅ personalized | ✅ | ✅ (if sub) | ✅ (if sub) |
| Lịch tháng personalized | ❌ | ✅ | ✅ | ✅ | ✅ |
| Tra cứu ngày tốt | ❌ | ✅ | ✅ | ✅ | ✅ |
| Hợp tuổi | ❌ | ✅ | ✅ | ✅ | ✅ |
| Luận AI streaming (day) | ❌ | ✅ | ✅ | ✅ | ✅ |
| Luận giải Bát tự full | ❌ | ❌ paywall | ✅ included | ✅ | ❌ |
| Luận giải Tiểu Vận | ❌ | ❌ | ✅ included | ❌ | ✅ (1 year) |
| Chuyển lịch | ❌ | ✅ | ✅ | ✅ | ✅ |

**Gating function (Edge + FE):**

```typescript
type Access =
  | { kind: "anonymous" }
  | { kind: "subscribed"; expiresAt: string; tier: "1m" | "6m" | "12m" }
  | { kind: "expired"; expiredAt: string };

function canUseCalendar(access: Access): boolean;
function canUseBaziReading(profile: Profile): boolean; // yearly OR bazi_reading_unlocked_at
function canUseTieuVanReading(profile: Profile): boolean; // yearly OR tieu_van_reading_expires_at > now
```

#### PayOS SKU migration

| Direction C UI | Proposed `package_sku` | VND | Effect |
|---|---|---|---|
| 1 tháng | `goi_1thang` | 49_000 | `subscription_expires_at += 1 month` |
| 6 tháng | `goi_6thang` | 249_000 | `+= 6 months` (replace 789k/6mo SKU) |
| 1 năm (hero) | `goi_12thang` | 449_000 | `+= 12 months` + unlock both luận |
| Luận Bát tự lẻ | `luan_bat_tu` | 299_000 | `bazi_reading_unlocked_at = now()` |
| Luận Tiểu Vận lẻ | `luan_tieu_van` | 199_000 | `tieu_van_reading_expires_at = now() + 1 year` |

**Retire:** `le` (lượng pack) from UI and checkout. Keep `credits_balance` + ledger for legacy users until migration script zeroes display.

**Files to update:**
- `supabase/functions/_shared/payos.ts` — PACKAGES map
- `supabase/functions/payos-create-checkout/index.ts` — allowlist
- `supabase/functions/payos-webhook/index.ts` — entitlement writes (not `add_credits_atomic` for sub SKUs)
- `app/lib/constants.ts` — remove lượng copy keys; add `SUBSCRIPTION_SKUS`, `ADDON_SKUS`

#### bat-tu Edge gating refactor

Replace credit deduction with subscription check for authenticated ops:

| `op` | Anonymous | Subscribed |
|---|---|---|
| `ngay-hom-nay` | ✅ no profile | ✅ personalized |
| `weekly-summary` | ✅ | ✅ |
| `lich-thang` | ✅ overview | ✅ personalized grid |
| `chon-ngay` | ❌ 401 | ✅ if `subscription_expires_at > now()` |
| `chon-ngay/detail` | ❌ | ✅ |
| `day-detail` | ❌ | ✅ |
| `hop-tuoi` | ❌ | ✅ |
| `convert-date` | ❌ | ✅ |
| `tu-tru` / `la-so` | ❌ | ✅ (lá số is onboarding output) |
| `tieu-van` | ❌ | ✅ if Tiểu Vận entitlement |
| `phong-thuy` | ❌ | hold — not routed in C v1 |

**New response shape for expired sub:** `{ error: { code: "SUB_EXPIRED", message: "..." } }` → FE renders `CSubExpired` (38).

#### generate-reading Edge

| Context param | Gate |
|---|---|
| `day-YYYY-MM-DD` | Active subscription |
| `bazi-year` | Yearly sub OR `bazi_reading_unlocked_at` |
| `tieu-van-YYYY` | Yearly sub OR `tieu_van_reading_expires_at` |

Remove credit deduction from `generate-reading`; use entitlement checks only.

---

## Route migration map

Current app uses `/app/*`. Direction C uses cleaner paths. **Recommended:** migrate to FE-HANDOFF paths under authenticated layout.

| C # | New path | Current path | Action |
|---|---|---|---|
| 01 | `/splash` bootstrap → branch | — | **Not `/`** — landing stays SEO at `/` |
| 12 | `/lich` | `/app/hom-nay`, `/app/home` | **Replace** Tab 1 default |
| 13 | `/lich/thang` | `/app/thang`, `/app/lich-thang` | Merge — **NavLink** same layout (N3) |
| 14 | `/ngay/:ngay` | `/app/ngay/:ngay` | Move; anon = generic public view (G5) |
| 19 | `/tra-cuu` | `/app/tra-cuu`, `/app/chon-ngay` | Merge pick entry |
| 20 | *(overlay)* `CPickLoading` | — | **No route** — overlay on `/tra-cuu` (G10) |
| 21 | `/tra-cuu/ket-qua` | `/app/chon-ngay/ket-qua` | Move |
| 22 | `/tra-cuu/hop-tuoi` | `/app/hop-tuoi` | Move under tra-cuu |
| 23 | `/tra-cuu/hop-tuoi/ket-qua` | `/app/hop-tuoi` result | Split |
| ~~24~~ | ~~`/tien-ich/chuyen-lich`~~ | ~~`/app/chuyen-lich`~~ | **Dropped** — no chuyển lịch in Direction C |
| 25 | `/dat-lich` | `/app/mua-luong` | **Rename** + new UI |
| 26–27 | `/dat-lich/xac-nhan`, `/thanh-cong` | `/app/mua-luong/thanh-cong` | Rename |
| 28 | `/toi` | `/app/toi` | Move |
| 29 | `/toi/sua-ho-so` | — | **New** (pivot: allows profile edit + lá số recompute) |
| 30 | `/toi/cai-dat` | `/app/cai-dat`, `/app/cai-dat-app` | Merge |
| 15–18 | `/luan-ai/*`, `/toi/la-so`, `/toi/luan-bat-tu` | `/app/la-so/*`, AI routes | Restructure |
| 35–36 | `/luan/mua/*` | — | **New** add-on checkout |
| — | `/share/:token` | `/x/:token` | **Canonical** public share; `/x/` 302 alias (G6) |

**Deprecated routes (remove after migration):**
- `/app/nhip/*`, `/app/so-viec`, `/app/tuan-nay`, `/app/van-thang`, `/app/phong-thuy`, `/app/tieu-van`, `/app/bat-dau`, `/app/mua-luong`, 5-tab shell

**Auth layout:** Single `AuthenticatedLayout` wrapping `/lich`, `/tra-cuu`, `/toi`, etc. with `CBottomNav` on tab routes only.

---

## Screen-by-screen specification

For each screen: **Component** (canvas) → **Route** → **FE data** → **BE wiring** → **Acceptance**.

---

### Band 0 — Strategy (docs only)

| Artboard | Purpose | Engineering |
|---|---|---|
| Brief | Pivot rationale | No code — informs copy audit |
| IA map | 5-tab → 3-tab | Drives route table above |
| Language map | lượng → lịch | Grep repo for forbidden terms |
| Flow map | Auth + pay branches | Drives E2E test scenarios |

---

### Band 1 — Launch & install

#### 01 · CSplash

| | |
|---|---|
| **Route** | `/` or in-app bootstrap |
| **FE** | `useAuth()` + `profile.onboarding_completed_at` |
| **BE** | None (client branch only) |
| **Branch** | !authed → `/dang-nhap`; authed && !onboarded → `/gio-sinh`; else → `/lich` |

#### 02 · CInstallBanner

| | |
|---|---|
| **Route** | Overlay on first visit (iOS) |
| **FE** | `useInstallPrompt` hook (existing) |
| **BE** | None |

---

### Band 2 — Auth (forest)

#### 03 · CAuthChooser → `/dang-nhap`

| | |
|---|---|
| **FE** | Google OAuth + link to email login |
| **BE** | `supabase.auth.signInWithOAuth({ provider: 'google' })` |

#### 04 · CEmailLogin → `/dang-nhap/email`

| | |
|---|---|
| **FE** | Email/password form; inline error on wrong password |
| **BE** | `supabase.auth.signInWithPassword` |

#### 05–06 · CForgotPwReq / CForgotPwSent

| | |
|---|---|
| **BE** | `supabase.auth.resetPasswordForEmail` → `/quen-mat-khau/da-gui` |

#### 07 · COAuthCallback → `/auth/callback`

| | |
|---|---|
| **FE** | Spinner → branch on `is_new` user metadata |
| **BE** | `handle_new_user` trigger creates profile |
| **Branch** | new → `/gio-sinh`; returning → `/lich` |

#### 08 · CSignup → `/dang-ky`

| | |
|---|---|
| **FE** | Name, email, password; `?ref=` referral prefills |
| **BE** | `signUp` + referral metadata; **remove starter credits UX** |

---

### Band 3 — First-run onboarding (forest)

#### 09 · CBirthTime → `/gio-sinh`

| | |
|---|---|
| **FE** | Birth date + 12-canh giờ selector |
| **BE** | PATCH `profiles.gio_sinh` (ngày sinh đã ghi ở `/dang-ky`); preview trụ giờ qua `bat-tu` op `tu-tru-preview` |

#### 10 · CBuildingCalendar → `/dang-dung-lich`

| | |
|---|---|
| **FE** | Animated progress (4 phases) |
| **BE** | `bat-tu` op `profile` sync + `tu-tru` compute; store `la_so` JSON on profile |

#### 11 · CReveal → `/lich-da-mo`

| | |
|---|---|
| **FE** | Ceremonial first lịch-tờ reveal; CTA → `/lich` |
| **BE** | SET `onboarding_completed_at = now()` |

---

### Band 4 — Tab 1 · Lịch (daily loop)

> **Canonical UI:** `artifacts/design/ngaylanhthangtot-vn/FE-HANDOFF.md` — C12/C13/C14 paper-default; inline `<CTodayReasoning>` on C12 + C14; C15/C16 merged per FE-HANDOFF §6.

#### 12 · CHomePage → `/lich` [Hôm nay]

| | |
|---|---|
| **FE** | **Paper-default** BG; lịch-tờ white card; `CLichSegmentedNav`; inline `<CTodayReasoning>` (typed reveal + CTA → `/luan-ai/day-:iso`); `CBottomNav active=0` |
| **BE** | `bat-tu` op `ngay-hom-nay` with profile birth payload |
| **Response** | `{ solar, lunar, canChi, score, verdict, nen, tranh, gioTot[] }` — score from engine when present |
| **Sub gate** | If expired → overlay `CSubExpired` (38) |
| **Offline** | `useOfflineCalendar` + `readTodayHomeSession` / `writeTodayHomeSession` (sessionStorage) + `COfflineBanner` |

#### 13 · CMonthSpread → `/lich/thang`

| | |
|---|---|
| **FE** | Month grid; lunar day from `lich-thang` payload (`CalendarDay.lunarDay`); score dot from engine score or dayType fallback; tap day → `/ngay/:ngay` |
| **BE** | `bat-tu` op `lich-thang` `{ birth_*, month: "YYYY-MM" }` |
| **Nav** | `CBottomNav active=0` |

#### 14 · CDayDetail → `/ngay/:ngay` (public — G5)

| | |
|---|---|
| **FE** | Paper surface; lịch-tờ anatomy; collapsible **"Cách tính điểm"**; inline `<CTodayReasoning>` when personalized; anon generic view + login CTA |
| **BE** | `bat-tu` op `day-detail` — `{ date }` anon generic; `{ date, birth_* }` personalized |
| **Nav** | `BackBar` only (no bottom nav) |

#### 15 · CAITyped → `/luan-ai/:context` (+ `/day-du` sectioned)

| | |
|---|---|
| **FE** | Typed streaming reveal (interval cursor); sectioned full view on `/day-du` |
| **BE** | `generate-reading` Edge `{ context: "day-2026-06-17" }` |
| **Gate** | Active subscription / reading-unlock |

#### 17 · CLaSoFull → `/toi/la-so`

| | |
|---|---|
| **FE** | Tứ trụ deep view from profile `la_so` |
| **BE** | `bat-tu` op `tu-tru` (or read cached `profiles.la_so`) |

#### 18 · CBaziReadingFull → `/toi/luan-bat-tu`

| | |
|---|---|
| **FE** | Full year Bát tự luận; or `CBaziLocked` (33) |
| **BE** | `generate-reading` `{ context: "bazi-year" }` |
| **Gate** | Yearly sub OR `bazi_reading_unlocked_at` |

---

### Band 5 — Tab 2 · Tra cứu

#### 19 · CSearchEntry → `/tra-cuu`

| | |
|---|---|
| **FE** | Intent picker (26 việc) + date range; `CSegmented` [Ngày tốt\|Hợp tuổi]; `CBottomNav active=1` |
| **BE** | None until submit |

#### 20 · CPickLoading → overlay on `/tra-cuu` (G10)

| | |
|---|---|
| **FE** | Full-screen overlay on same route; min 800ms display; cancel after 8s |
| **BE** | `bat-tu` op `chon-ngay` `{ intent, from, to }` — **no credit deduct**; then navigate `/tra-cuu/ket-qua` |

#### 21 · CSearchResult → `/tra-cuu/ket-qua`

| | |
|---|---|
| **FE** | Ranked day list; methodology collapsible; empty → `CNoDatesFound` (32) |
| **BE** | Response from op 20; tap row → `/ngay/:ngay` or detail fetch |

#### 22 · CHopTuoi → `/tra-cuu/hop-tuoi`

| | |
|---|---|
| **FE** | Two birth profiles (self + partner); segmented toggle |
| **BE** | `bat-tu` op `hop-tuoi` |

#### 23 · CHopTuoiResult → `/tra-cuu/hop-tuoi/ket-qua`

| | |
|---|---|
| **FE** | Verdict + explanation |
| **BE** | Same op result payload |

---

### Band 6 — Commerce

#### 25 · CPricing → `/dat-lich`

| | |
|---|---|
| **FE** | 3 sub tiers (1 năm hero) + 2 add-on cards; copy from `c-screens-b.jsx` |
| **BE** | Read `profiles.subscription_expires_at` for status line |

#### 26 · CPayConfirm → `/dat-lich/xac-nhan`

| | |
|---|---|
| **FE** | PayOS QR / redirect sheet |
| **BE** | `payos-create-checkout` `{ package_sku }` → `{ checkoutUrl, orderId }` |

#### 27 · CPaySuccess → `/thanh-cong`

| | |
|---|---|
| **FE** | `{ plan_name, amount_vnd, expires_at }` only — **no webhook dump** |
| **BE** | Poll `payment_orders.status` or redirect after webhook; auto → `/lich` in 3s |

#### 35–36 · Standalone luận checkout

| | |
|---|---|
| **Routes** | `/luan/mua/xac-nhan`, `/luan/mua/thanh-cong` |
| **BE** | `package_sku`: `luan_bat_tu` or `luan_tieu_van` |

#### 37 · CPayFailure

| | |
|---|---|
| **FE** | Inline sheet at 26/35 — retry + alt method |
| **BE** | Same checkout endpoint |

---

### Band 7 — Tab 3 · Tôi

#### 28 · CMe → `/toi`

| | |
|---|---|
| **FE** | Lá số card; "Lịch dùng đến DD.MM.YYYY"; Tiện ích rows; `CMeLocked` (34) for Bát tự tile if non-yearly |
| **BE** | `profiles` + `subscription_expires_at` + entitlements |
| **Nav** | `CBottomNav active=2` |

#### 29 · CEditProfile → `/toi/sua-ho-so`

| | |
|---|---|
| **FE** | Edit name, birth date, giờ → triggers recompute |
| **BE** | PATCH profile + async `bat-tu` `profile` + `tu-tru`; **changelog ADR:** overrides prior "no birth edit" rule |

#### 30 · CSettings → `/toi/cai-dat`

| | |
|---|---|
| **FE** | Notifications, account, đăng xuất → `CConfirmDialog` (39) |
| **BE** | `push_subscriptions`; `signOut` |

#### ~~24 · CChuyenLich~~ — **Dropped**

Chuyển lịch âm ↔ dương **không ship** Direction C (2026-05-27). Legacy `/app/chuyen-lich` → redirect `/toi`. Edge op `convert-date` vẫn dùng nội bộ (vd. Tiểu vận labels) — không có route user-facing.

**Not routed in C v1:** `CPhongThuy`, `CTieuVan`, ~~`CChuyenLich`~~ — keep in codebase, no nav links.

---

### Band 8 — Edge states

| # | Component | Trigger | FE | BE |
|---|---|---|---|---|
| 31 | CNotifPerm | First load post-onboarding | Sheet → browser prompt | `push_subscriptions` insert |
| 32 | CNoDatesFound | Empty search | Inline at 21 | — |
| 33 | CBaziLocked | No entitlement | Inline at 18 | — |
| 34 | CMeLocked | Non-yearly | Tile variant at 28 | — |
| 38 | CSubExpired | `SUB_EXPIRED` or `expires_at < now()` | Blocker overlay | — |
| 39 | CConfirmDialog | Logout etc. | Bottom sheet | — |
| 40 | COfflineHome | `navigator.onLine === false` | Tab 1 banner + cached lịch | IndexedDB cache |

---

### Band 9 — Landing (marketing)

**Source:** `c-landing.jsx` → `app/routes/landing.tsx`

| Section | Purpose |
|---|---|
| LHero + LHeroStack | 6 layered lịch-tờ pages |
| LRitual | Daily-flip strip |
| LPersonal | Same day, different mệnh |
| LYearSpread | 12-month dot grid |
| LPricing | Mirrors `/dat-lich` tiers |
| LFAQ · LCTA · LFooter | SEO + conversion |
| LStickyMobileCTA | Mobile only |

**BE:** Static prerender; CTA → `/dang-ky` or `/lich` if session.

---

## Implementation waves (ship order — G8 v2)

Sequential: Backend → Frontend → QA per wave. **Commerce (W8) after Daily + Luận + Picks + Tools.**

| Wave | Canvas band | Screens | Est. |
|---|---|---|---|
| **W0** | Foundation | tokens, hooks, entitlements migration, bat-tu SUB_EXPIRED | 3d |
| **W1** | LAUNCH 01–02 | `/splash`, install banner (N7) | 0.5d |
| **W2** | AUTH 03–08 | auth routes, `return_to` (G5), `/quen-mat-khau/da-gui` | 1.5d |
| **W3** | FIRST RUN 09–11 | onboarding → `/lich-da-mo` | 1.5d |
| **W4** | DAILY 12–14 | `/lich`, `/lich/thang`, `/ngay/:ngay`, `useOfflineCalendar` | 2.5d |
| **W5** | LUẬN 15–18 | AI routes, generate-reading refactor | 3d |
| **W6** | PICKS 19–21 | `/tra-cuu`, overlay loading (G10), `/tra-cuu/ket-qua` | 1.5d |
| **W7** | TOOLS 22–23 | hợp tuổi (24 chuyển lịch dropped) | 1d |
| **W8** | COMMERCE 25–27 | `/dat-lich`, PayOS webhook (G3), addon BE | 2.5d |
| **W9** | ACCOUNT 28–29 | `/toi`, `/toi/sua-ho-so`, G1 recompute | 2d |
| **W10** | EDGE 30–40 | settings, share (G6), notif (G7), G2 banners | 3.5d |
| **W11** | LANDING | `c-landing.jsx`, pricing copy N1 | 2d |
| **Cleanup** | — | 302 redirects N6, retire B routes, grep N5 | 1.5d |

**W4–W7 QA:** use dev sub-seed in `seed.sql` until W8 PayOS live.

### Per-wave checklist (abbrev.)

**W0:** theme.css C tokens · CBottomNav/CSegmented · `useSubscription`/`useEntitlements` · `_shared/entitlements.ts` · bat-tu no credit fallback · `pivot_transition_until` · N5 grep CI

**W1:** `/splash` auth FSM · `/` landing untouched · install banner 30d dismiss

**W2:** forest auth reskin · B4 onboarding branch · `sanitizeReturnTo` · password reset routes

**W3:** first-run 3 screens · `onboarding_completed_at` on reveal · bat-tu tu-tru

**W4:** lịch-tờ Hôm nay · NavLink segmented N3 · offline IndexedDB · anon `/ngay` generic G5

**W5:** streaming luận · Bát tự entitlement gate · invalidate policy prep for G1

**W6:** pick overlay G10 · CNoDatesFound · methodology collapsible

**W7:** hợp tuổi segmented · no chuyển lịch · no phong-thuy nav

**W8:** SKU B1 · webhook TX G3 · orphan cron · `/dat-lich?plan=` pre-select G2 · N1 copy verbatim · N2 date format

**W9:** CMe N4 card preview · CEditProfile + G1 full policy · birth edit limit 2/30d

**W10:** CSubExpired · share sender+public G6 · share-og lịch-tờ · daily push G7 · expiry banners G2 · standalone pay 35–36 FE

**W11:** landing sections · sticky mobile CTA · anon teaser B3 only on landing

---

## FE ↔ BE hook reference

| Hook / lib | Backend |
|---|---|
| `useAuth()` | Supabase Auth session |
| `useProfile()` | `profiles` + `la_so` JSON |
| `useSubscription()` | **New** — `subscription_expires_at`, tier, `isExpired` |
| `useEntitlements()` | **New** — bazi/tieu-van unlock flags |
| `invokeBatTu(op, body)` | `supabase.functions.invoke('bat-tu')` |
| `invokeGenerateReading(ctx)` | `supabase.functions.invoke('generate-reading')` |
| `createCheckout(sku)` | `supabase.functions.invoke('payos-create-checkout')` |
| `useOfflineCalendar()` | **New** — IndexedDB cache of `ngay-hom-nay` |

---

## Copy & compliance checklist

- [ ] Zero forbidden terms (N5 grep pass)
- [ ] Sub status: "Lịch của bạn dùng đến **DD.MM.YYYY**" — **N2:** `formatSubscriptionExpiry()`, `Asia/Ho_Chi_Minh`, no time component
- [ ] Pricing savings **498.000đ / 52,6%** — **N1:** verbatim from canvas, not "~53%"
- [ ] Tab labels: **Lịch · Tra cứu · Tôi**
- [ ] Plan names: `1 tháng` · `6 tháng` · `1 năm` (exact casing)
- [ ] Hero: `Lịch ngày lành` + italic *cho riêng bạn.*
- [ ] Tab 1 segmented URL-synced via NavLink (N3)
- [ ] Sample persona §7 FE-HANDOFF for demos

---

## Risks & ADRs

| Risk | Mitigation |
|---|---|
| Existing users with credit balance | **G4:** hide-honor 90d at legacy feature costs; no auto conversion to sub days |
| Old SKU subscribers | **G4:** keep `subscription_expires_at`; calendar copy same; luận NOT included unless purchased |
| PayOS SKU change | New PayOS items; keep old webhook handler for in-flight orders |
| Birth-data edit (C29) vs old spec | **ADR-2026-05-27:** Direction C allows `/toi/sua-ho-so` with lá số recompute |
| Route breaking change | 301 map old `/app/*` → new paths for 30 days |
| Phong thuỷ / Tiểu Vận screens exist | Do not link in nav; ship when content ready |

---

## QA E2E scenarios (from §3.2)

1. **A** — New Google user: full onboarding → `/lich`
2. **B** — Returning Google → `/lich` skip onboarding
3. **C** — Email login returning
4. **D** — Forgot password flow
5. **E** — Search happy path
6. **F** — Month browse → day detail
7. **G** — Day → AI luận → sectioned
8. **H** — Bát tự paywall → standalone purchase
9. **I** — Expired sub blocker → `/dat-lich`
10. **J** — Sub purchase → success → auto redirect

---

## Action items register (review 2026-05-27)

| Pri | ID | Item | Owner | Status / decision |
|---|---|---|---|---|
| 🚨 | **B1** | Entitlement write rules (Bát tự perpetual, Tiểu Vận year scope, sub stacking) | BE arch | **Locked** — see §B1 below |
| 🚨 | **B2** | `/` route — splash vs landing | FE arch | **Locked** — `/` = landing SEO; `/splash` = app bootstrap; PWA `start_url` → `/splash` |
| 🚨 | **B3** | Anonymous teaser location | PM + FE | **Locked** — **landing-only**; anon không vào `/lich`; teaser = LPersonal + LYearSpread trên landing |
| 🚨 | **B4** | `is_new` detection logic | FE | **Locked** — see §B4 below |
| ⚠️ | **G1** | Lá số recompute → cache invalidation | BE | **Locked** — see §G1 below |
| ⚠️ | **G2** | Sub expiry reminders + grace period | PM | **Locked** — **hard cutoff**; `CSubExpired` ngay khi `subscription_expires_at < now()`; push reminder T-7d/T-1d (opt-in only) |
| ⚠️ | **G3** | Webhook idempotency pseudocode | BE | **Locked** — see §G3 below |
| ⚠️ | **G4** | Legacy user migration (credits) | PM | **Locked** — **hide-honor** 90 ngày: UI zero lượng; bat-tu vẫn deduct credits nếu không có sub (transition only) |
| ✅ | **G5** | Anonymous deep links + `return_to` | FE | `sanitizeReturnTo` + session stash; consume sau auth/onboarding |
| ⚠️ | **G6** | Share / phiếu routes | FE + BE | **Locked** — full share Wave 10; `/share/:token` canonical |
| ⚠️ | **G7** | Daily notification cron | BE | **Locked** — Wave 10 required; 06:00 local, quiet hours |
| ⚠️ | **G8** | Wave reorder | PM | **Locked (v2)** — W4→W5→W6→W7→**W8 Commerce**→W9 (after Picks/Tools) |
| ⚠️ | **G9** | `weekly-summary` op | BE + FE | **Locked** — retired from app UI |
| ⚠️ | **G10** | CPickLoading | FE | **Locked** — overlay on `/tra-cuu`, no separate route |
| 💡 | **N1–N7** | Copy, dates, nav, redirects, PWA | FE | **Locked** — see §Nits |
| 💡 | **N5** | Forbidden-terms grep | FE | **Expanded** — see §N5 |
| 💡 | **N8** | Effort estimate | PM | **18–22 dev-days** (revised) |

### B1 — Entitlement write rules (webhook + RPC)

**Subscription stacking** (all tiers):

```
base = max(now(), subscription_expires_at ?? now())
subscription_expires_at = base + months_from_sku
```

**Per SKU side effects:**

| SKU | Calendar sub | Bát tự (`bazi_reading_unlocked_at`) | Tiểu Vận (`tieu_van_reading_expires_at`) |
|---|---|---|---|
| `goi_1thang` | +1 mo | — | — |
| `goi_6thang` | +6 mo | — | — |
| `goi_12thang` | +12 mo | Set `now()` if null (**perpetual**, never revoked) | `max(current, now()+1 year)` |
| `luan_bat_tu` | — | Set `now()` (**perpetual**) | — |
| `luan_tieu_van` | — | — | `max(current, now()+1 year)` |

**Access checks:**

- `canUseCalendar` → `subscription_expires_at > now()`
- `canUseBaziReading` → yearly sub active **OR** `bazi_reading_unlocked_at IS NOT NULL`
- `canUseTieuVanReading` → yearly sub active **OR** `tieu_van_reading_expires_at > now()`

Implement in [`supabase/functions/_shared/entitlements.ts`](supabase/functions/_shared/entitlements.ts) + [`payos-webhook`](supabase/functions/payos-webhook/index.ts).

### B2 — Route decision (splash vs landing)

| URL | Role | Auth |
|---|---|---|
| `/` | Marketing landing (`c-landing.jsx`), prerender SEO | Public |
| `/splash` | CSplash auth router (§3.1 FE-HANDOFF) | Optional session read |
| `/dang-nhap` … | Auth band | Public |
| `/lich` … | Authenticated app | JWT required |

PWA [`manifest.json`](public/manifest.json): `start_url: "/splash"`. Landing CTAs → `/dang-ky` or `/dang-nhap`, **not** `/lich`.

### B3 — Anonymous teaser (landing-only)

- **Không** route public `/lich` cho anon
- Landing sections **LPersonal** (same day, different mệnh) + **LYearSpread** (dot grid demo) = teaser
- Optional: landing embed `bat-tu` `ngay-hom-nay` **non-personalized** via Edge public op (no profile) — cache aggressively
- Post-signup first personalized view = Wave 3 reveal → Wave 4 `/lich`

### B4 — `is_new` / post-auth routing

**Source of truth:** `profiles.onboarding_completed_at` (not Auth metadata alone).

```typescript
// After session established (OAuth callback, email login, splash)
const profile = await fetchProfile(user.id);

if (profile.onboarding_completed_at == null) {
  navigate("/gio-sinh"); // new OR incomplete onboarding
} else {
  navigate("/lich");    // returning
}
```

| Flow | Route after auth |
|---|---|
| Google OAuth new | `/auth/callback` → `/gio-sinh` |
| Google OAuth returning | `/auth/callback` → `/lich` |
| Email signup (08) | `/dang-ky` success → `/gio-sinh` |
| Email login (04) | `/dang-nhap/email` → `/lich` (or `/gio-sinh` if onboarding null) |
| Splash (01) | Same branch as above |

Replace current [`auth.callback.tsx`](app/routes/auth.callback.tsx) blind `navigate("/app")`.

### G1 — Lá số recompute cache invalidation (Wave 9)

**Policy (handoff-required):** *Đổi ngày/giờ sinh → xoá toàn bộ readings cache, recompute background, skeleton ở `/lich` cho đến sync xong.*

| Asset | On recompute | Rationale |
|---|---|---|
| `profiles.la_so` | Replace JSON from `bat-tu` `tu-tru` | Source of truth |
| `ai_readings` / reading cache rows | **DELETE all** for `user_id` (day-*, bazi-year, tieu-van-*) | Rendered from old lá số — **must not reuse** |
| `generate-reading` in-flight | Cancel / ignore stale responses client-side | Race with new profile hash |
| Lịch tháng scores (React Query `lich-thang:*`) | **Invalidate all months** for user | Scores tied to mệnh |
| IndexedDB offline snapshot | **Clear** | Stale lịch-tờ |
| `share_tokens` | **Keep** (historical shares OK) | Already minted |

**UX flow:**

1. User saves `CEditProfile` → set `profiles.la_so_recompute_status = 'pending'` (new column or JSON flag)
2. Edge RPC `recompute_la_so` runs `profile` + `tu-tru` (service_role — bypasses birth lock)
3. On success: delete reading caches, set status `'ready'`, clear flag
4. FE `/lich` + `/lich/thang`: show **full-page skeleton** (lịch-tờ shape) while `pending`; poll profile every 2s max 60s

**Anti-abuse:**

- Max **2** birth edits per rolling **30 days** per user (DB counter `birth_edit_count` + `birth_edit_window_start`)
- 3rd attempt → inline error: *"Liên hệ hỗ trợ nếu cần sửa thêm"* (no self-serve)
- Log each edit to `credit_ledger` or audit table with reason `birth_edit`

### G2 — Expiry reminders + renewal flow (hard cutoff)

| Mechanism | Spec |
|---|---|
| **Grace period** | **0 ngày** — `subscription_expires_at < now()` → `SUB_EXPIRED` blocker immediately |
| **In-app banner `/lich`** | T-7d: amber banner *"Lịch sắp hết hạn · còn N ngày"* + CTA `/dat-lich`; T-1d: stronger copy |
| **Tab 3 expiry line** | Same DD.MM.YYYY; amber at T-7d |
| **Push** (opt-in only) | T-7d + T-1d via `cron-push-sub-reminder`; deep link `/dat-lich` |
| **`CSubExpired` → renew** | Navigate `/dat-lich?plan={last_package_sku}` — pre-select last paid tier if known from `payment_orders` WHERE status=paid ORDER BY created_at DESC; default hero **`goi_12thang`** if none |

Push quiet hours: see G7 (no reminder push 22:00–07:00 local).

### G3 — PayOS webhook idempotency + race + orphans

**Idempotent guard** (already partial in code — formalize):

```
on webhook(payload):
  verify signature
  order = SELECT * FROM payment_orders WHERE provider_order_code = ?

  if order.status === 'paid':
    return 200 { already_processed: true }   // PayOS retry safe

  BEGIN;
    claimed = UPDATE payment_orders SET status='paid', raw_webhook=?
              WHERE id=order.id AND status='pending'
              RETURNING *;
    if !claimed: ROLLBACK; return 200 { already_processed: true };

    apply_entitlements(claimed);  // B1 rules — same TX
    INSERT webhook_events(event_id) ON CONFLICT DO NOTHING;
  COMMIT;
  return 200 { fulfilled: true };
```

**Race `/thanh-cong` polling vs webhook:**

- FE polls `payment_orders.status` every 2s; either path wins — both idempotent
- Success screen reads `subscription_expires_at` from **profile reload**, not webhook payload dump

**Orphan orders:**

- Cron daily: `UPDATE payment_orders SET status='expired' WHERE status='pending' AND created_at < now() - interval '24 hours'`
- User on `/dat-lich/xac-nhan` >15 min without pay → show `CPayFailure` with "Tạo lệnh mới"

### G4 — Legacy user migration (explicit policy)

**No `LEGACY_USER_MODE` FE flag** — single Direction C UI for all users; backend dual-path only during transition.

| Legacy state | Calendar display | Luận giải | Credits |
|---|---|---|---|
| `subscription_expires_at > now()` from **old SKU** (`goi_6thang` 789k / `goi_12thang` 989k) | Show *"Lịch dùng đến DD.MM.YYYY"* — **same copy as new users** | **NOT included** unless `bazi_reading_unlocked_at` / `tieu_van_reading_expires_at` set separately | Hidden |
| `subscription_expires_at > now()` from **new SKU** post-pivot | Full entitlements per B1 | Per B1 | Hidden |
| `credits_balance > 0`, no active sub | `SUB_EXPIRED` on calendar ops **unless** transition window | N/A | **Honor at existing `feature_credit_costs` rates** for 90 days — **no conversion** (1 lượng ≠ 1 ngày sub) |
| After `pivot_transition_until` | Sub only | Per B1 | Credits ignored |

**No mass email conversion** in v1 — support handles edge cases manually. Document in FAQ.

**Old SKU orders:** keep historical `payment_orders.package_sku`; do not re-price retroactively.

### G5 — Anonymous deep links + `return_to`

| Scenario | Behavior |
|---|---|
| Anon hits `/lich` (bookmark, bad CTA) | `Navigate /dang-nhap?return_to=/lich` (whitelist: `/lich`, `/tra-cuu`, `/ngay/:ngay`) |
| After auth + onboarding | `return_to` if valid → else `/lich` |
| Anon `/ngay/:ngay` from share | **Public non-personalized** day page: engine `day-detail` without profile (generic scores + "Đăng nhập để xem cho mệnh bạn"); **not** 401 |
| Anon `/share/:token` or `/x/:token` | Public resolve — no auth |
| Landing CTA | `/dang-ky` or `/dang-nhap?return_to=/lich` — **never** direct anon `/lich` with data |

Implement `sanitizeReturnTo()` — reject external URLs, max length 200.

### G6 — Share & phiếu (Wave 10 — full band)

| Piece | Route / trigger | Notes |
|---|---|---|
| **CShareSender** | Overlay from **CDayDetail (14)** + **CSearchResult (21)** — button *"Chia sẻ"* | `bat-tu` op `share` → `share_tokens`; requires active sub |
| **CSharePublic** | **`/share/:token`** canonical; **`/x/:token`** 302 alias (keep OG links working) | Ticket phiếu shape — **only** share/print surface |
| **share-og Edge** | Update template → **lịch-tờ visual** (not old phiếu-only) | Reuse Edge; new OG dimensions |
| **share-resolve** | Unchanged contract | No birth data in token |

**Not in v1:** `CSoList`, `CEmptySo` (màn sổ đầy đủ) — v1 chỉ preview **「Ngày sắp tới · đã đánh dấu」** trên `/toi` (màn 28); đánh dấu từ `/ngay/:ngay`.

### G7 — Daily notification flow (retention-critical)

**Ship in Wave 10** — không optional. Pivot mất ~50% retention nếu thiếu daily nudge.

| Param | Value |
|---|---|
| Default send | **06:00** local user time |
| Timezone | Store `profiles.timezone` or `push_subscriptions.tz` — default `Asia/Ho_Chi_Minh` |
| Cron | `cron-push-daily-lich` — hourly tick, send if user's local hour == 6 AND minute < 15 |
| Quiet hours | **22:00–07:00 local** — skip (except T-1 expiry reminder at 08:00) |
| Payload | *"Trang lịch hôm nay đã mở 🌿"* → `/lich` |
| Audience | `push_enabled=true` + active sub + `push_subscriptions` row |
| Opt-out | `/toi/cai-dat` toggle → `profiles.push_enabled=false` |
| Replace | Retire `cron-push-habit` habit/streak copy |

### G8 — Wave dependency order (v2 — locked)

**Ship order** (supersedes prior "commerce after First Run"):

```
W0 Foundation → W1 Launch → W2 Auth → W3 First Run
→ W4 Daily Loop (+ useOfflineCalendar)
→ W5 Luận Giải
→ W6 Picks (+ CPickLoading overlay)
→ W7 Tools
→ W8 Commerce          ← after user sees value in Tab 1–2
→ W9 Account (+ CEditProfile / G1)
→ W10 Edge + Share + Notifications (G2 banners, G6, G7)
→ W11 Landing
→ Cross-cleanup
```

| Dependency | Owner wave | Notes |
|---|---|---|
| `useSubscription()` | **W0** | W1 splash + W2 auth exempt paths use it |
| `useOfflineCalendar()` | **W4** | Not a separate wave |
| `useEntitlements()` | **W0** | W5 Bát tự gate |
| Commerce live PayOS | **W8** | W4–W7 QA uses **dev sub-seed** (`subscription_expires_at` in seed.sql) |

### G9 — `weekly-summary` bat-tu op

- **Retired** from app: no `/tuan-nay`, no Tab 1 weekly view in Direction C canvas
- Engine op `weekly-summary` **kept** for optional landing teaser widget only (non-blocking)
- Remove [`app/routes/app.tuan-nay.tsx`](app/routes/app.tuan-nay.tsx) in cleanup

### G10 — CPickLoading — overlay, not route

- **Remove** route `/tra-cuu/dang-tim` from plan
- On submit at `/tra-cuu`: show **full-screen overlay** `CPickLoading` (min display **800ms** to avoid flash)
- If Edge > **8s**: show *"Vẫn đang tìm…"* + cancel → back to form
- On complete: navigate `/tra-cuu/ket-qua` with state or search params (`?job=id`)
- Rationale: `chon-ngay` often <1s — separate route causes flash

### Nits (N1–N7)

| ID | Rule |
|---|---|
| **N1** | Pricing copy **verbatim** from canvas — tiết kiệm **498.000đ** / **52,6%** (not "~53%"); QA grep `947.000` baseline |
| **N2** | `formatSubscriptionExpiry(iso)` → **`DD.MM.YYYY`** only, `Asia/Ho_Chi_Minh`, **no time**; add to FE-HANDOFF §11 checklist |
| **N3** | Tab 1 segmented: shared layout route `lich.tsx` + child routes `/lich` + `/lich/thang` via **`<NavLink>`** — URL-synced, no local-only state |
| **N4** | `/toi` lá số card + `/toi/la-so` full view = **same** `profiles.la_so` JSON; card = truncated 4-pillar preview + link |
| **N5** | Extended forbidden grep — see below |
| **N6** | Legacy redirects: **302** + `Cache-Control: max-age=2592000` (30d); after T+30 → **301** or **410 Gone** for removed B routes |
| **N7** | Install banner: dismiss → `localStorage` key `install_banner_dismissed_at`; hide 30 days; skip if `display-mode: standalone` |

### N5 — Forbidden-terms grep (expanded)

```bash
rg -i 'lượng|lượt|số lượt|mua lượng|mua thêm|credit|credits_balance|balance|phiếu chọn|mở quẻ|niên giám|ví lượng|FAB|5-tab|starter_credits|feature_credit_costs|\ble\b' \
  app/ supabase/functions/ \
  --glob '!**/share/**' --glob '!**/Ticket.tsx' --glob '!**/changelog.md'
```

Also scan: `CreditGate`, `useFeatureCosts`, `useCredits`, `mua-luong`, `app/lib/constants.ts` FEATURE_KEY_MAP labels in UI.

Allowlist: `Ticket.tsx`, `/share/*`, `/x/*`, transition comments, `app_config` migration scripts.

### N8 — Effort estimate (revised)

| Wave | Estimate (1 FE + 1 BE) |
|---|---|
| W0 Foundation + migration + backfill test | **3d** |
| W1–W3 Launch / Auth / First run | **4d** |
| W4 Daily + offline | **2.5d** |
| W5 Luận (streaming UX edge cases) | **3d** |
| W6 Picks + W7 Tools | **3d** |
| W8 Commerce + webhook hardening | **2.5d** |
| W9 Account + G1 recompute | **2d** |
| W10 Edge + Share + Notif + G2/G6/G7 | **3.5d** |
| W11 Landing | **2d** |
| Cleanup + docs | **1.5d** |
| **Total** | **~18–22 dev-days** (+ QA gate per wave) |

Prior "~23d" was optimistic on streaming + migration; **+30% buffer already baked in** above.

---

## Document index

| Doc | Path |
|---|---|
| FE Handoff (canonical) | `artifacts/design/ngaylanhthangtot-vn/FE-HANDOFF.md` |
| FE Handoff (index) | `artifacts/docs/fe-handoff-direction-c.md` |
| Design System HTML | `artifacts/design/ngaylanhthangtot-vn/Design System.html` |
| Design System spec | `artifacts/docs/design-system-spec.md` |
| Canvas | `artifacts/design/ngaylanhthangtot-vn/Direction C.html` |
| Landing canvas | `artifacts/design/ngaylanhthangtot-vn/Landing C.html` |
| Retired B | `artifacts/design/ngaylanhthangtot-vn/retired-direction-b/` |
| Tech spec (needs update) | `artifacts/docs/tech-spec.md` |
| **tu-tru-api Direction C reqs** | `artifacts/integrations/tu-tru-api-direction-c-requirements.md` |
