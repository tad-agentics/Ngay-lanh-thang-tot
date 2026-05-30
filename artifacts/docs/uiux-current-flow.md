# UI/UX — Current Flow & Screen Inventory

> Snapshot of the app **as built today** — for use as the baseline before a UI/UX upgrade.
> All routes are defined in `app/routes.ts`. All paths live under `app/routes/`.

App: **Ngày Lành Tháng Tốt** — Vietnamese B2C PWA for picking auspicious dates personalized via **Bát Tự Tứ Trụ** (lá số). Credits + PayOS, no auto-renew.

---

## 1. Route Map (top level)

```
PUBLIC (no auth required)
├─ /                            Landing page (pre-rendered for SEO)
├─ /chinh-sach-bao-mat          Privacy policy (VN)
├─ /privacy                     Privacy policy (EN mirror)
├─ /dieu-khoan                  Terms (VN)
├─ /terms                       Terms (EN mirror)
└─ /x/:token                    Public share card (resolved via Edge Function)

AUTH
├─ /dang-nhap                   Login chooser (Google OAuth or email)
├─ /dang-nhap/email             Email + password sign-in
├─ /dang-ky                     Sign-up (email + password, can prefill from landing form)
├─ /quen-mat-khau               Forgot password (email link)
├─ /quen-mat-khau/da-gui        Reset email sent confirmation
├─ /dat-lai-mat-khau/recovery   Password reset from email link (Supabase recovery session)
└─ /auth/callback               OAuth + email-confirm redirect handler

APP (auth-guarded — redirects to /dang-nhap if no session)
└─ /app                         Layout: <AppShellLayout> ➜ <ProfileProvider> ➜ <AppMobileShell>
   ├─ index                     Home (calendar + today summary + weekly teaser)
   ├─ /hom-nay                  Today detail
   ├─ /tuan-nay                 Weekly best-days list
   ├─ /chon-ngay                Pick-a-day form
   ├─ /chon-ngay/ket-qua        Pick-a-day results (animated reveal)
   ├─ /lich-thang               Month calendar (raw API view)
   ├─ /ngay/:ngay               Single day detail
   ├─ /la-so                    Lá số tứ trụ — create or summary
   ├─ /la-so/chi-tiet           Lá số — full breakdown by aspect
   ├─ /van-thang                Monthly fortune
   ├─ /hop-tuoi                 Couple compatibility
   ├─ /phong-thuy               Feng shui (direction, color, year flying-stars)
   ├─ /chia-se                  Share card builder
   ├─ /bat-dau                  Onboarding finish gate
   ├─ /mua-luong                Buy credits / packages (PayOS)
   ├─ /mua-luong/thanh-cong     Payment-success polling
   ├─ /cai-dat                  Settings (account + birth + credits + invite)
   ├─ /cai-dat-app              PWA install + privacy contact
   └─ /thong-bao-quyen          Push-notification permission request
```

### Auth & onboarding gate (in `app/routes/app.tsx`)

The `/app` layout enforces three gates in order:

1. **Auth** — `useAuth()` must resolve a `user`; otherwise redirect to `/dang-nhap`.
2. **Profile load** — `useProfile()` must return a row; on error, render an error banner with **Retry / Sign out**.
3. **Onboarding** — if `profile.onboarding_completed_at == null`, redirect to `/app/bat-dau` (with three exempt paths: `/app/bat-dau`, `/app/mua-luong`, `/app/mua-luong/thanh-cong` — so users can buy credits before finishing onboarding).

Once past the gate, every `/app/*` screen renders inside `<AppMobileShell>` (mobile-first viewport with bottom nav + lazy-loaded explore sheet).

---

## 2. Bottom Navigation

`app/components/BottomNav.tsx` + `app/lib/nav-config.ts`.

| Tab | Icon | Route(s) considered active | Notes |
|---|---|---|---|
| **Lịch** | `CalendarDays` | `/app` | Home |
| **Chọn ngày** | `CalendarSearch` | `/app/chon-ngay`, `/app/chon-ngay/ket-qua` | "Core" — bolder styling |
| **Khám phá** | `Compass` | `/app/la-so`, `/app/la-so/chi-tiet`, `/app/van-thang`, `/app/hop-tuoi`, `/app/phong-thuy` | Opens **Explore Sheet Modal**, not a route |
| **Cài đặt** | `Settings2` | `/app/cai-dat` | Settings |

Only the tab roots show the bottom nav (see `NAV_PATHS` in `nav-config.ts`). Detail screens like `/app/ngay/:ngay`, `/app/mua-luong`, `/app/chia-se`, `/app/bat-dau` hide it.

### Explore Sheet (`ExploreSheetModal.tsx`)

A bottom sheet with 4 entry cards:

| Card | Route | Requires lá số? |
|---|---|---|
| Lá số tứ trụ | `/app/la-so` | No |
| Vận tháng | `/app/van-thang` | **Yes** |
| Hợp tuổi | `/app/hop-tuoi` | **Yes** |
| Phong thủy | `/app/phong-thuy` | **Yes** |

Cards that require a lá số render dim + a chip "Cần lá số trước".

---

## 3. End-to-End User Journeys

### 3.1. First-time user (anonymous → installed)

```
/                          (landing — sees value prop, fills "lá số" CTA form: name, dob, hour, gender)
  ↓ submit form
/dang-ky?name=…&dob=…      (sign-up form pre-banner shows the prefill)
  ↓ create email+password account
/auth/callback             (only for OAuth/email-confirm path)
  ↓ session established
/app/bat-dau               (welcome card — shows credit balance / sub status)
  ↓ "Vào trang chủ app"  → writes `onboarding_completed_at`
/app                       (home)
  ↓ "Lập lá số ngay" CTA
/app/la-so                 (3 phases inline: form → confirm → loading → revealing → done)
  ↓ animated LasoRevealSequence
/app                       (home now shows today/weekly cards keyed to lá số)
```

### 3.2. Returning user — daily check-in

```
/app  (home)
  ├─ TodaySummaryCard      (good/bad/neutral pill, lunar+solar date, AI luận giải behind a 1-credit unlock)
  ├─ BestHourCard          (best hour range)
  ├─ WeeklyTeaserCard      (count of good days this week → links to /tuan-nay)
  └─ CalendarGrid          (current month, tap a day → /app/ngay/:ngay)
```

### 3.3. Core loop — picking an auspicious day

```
/app/chon-ngay
  ├─ Select event (26 intent options, "Khai trương", "Cưới hỏi", "Nhập trạch" …)
  ├─ Choose range: 30 / 60 / 90 days  →  feature key  →  credit cost shown
  ├─ Methodology collapsible
  └─ <CreditGate>: button "Tìm ngày phù hợp — N lượng"
        ↓ invokes Edge Function `bat-tu` op `chon-ngay`
        ↓ navigate("/app/chon-ngay/ket-qua", { state: payload })
/app/chon-ngay/ket-qua
  ├─ <ChonNgayLoadingPanel>     (4 phase animation, ~4.6s)
  ├─ AI luận giải (overview)
  ├─ ResultDayCard × N          (grade chip, date, lunar, truc, best hour, AI "day reading")
  ├─ Bulk-detail unlock          (4 lượng × N → reveals "lý do" lines per day)
  └─ "Chia sẻ ngày lành"         (→ /app/chia-se with day payload)
```

### 3.4. Discovery (lá số required)

| Screen | Purpose | Output |
|---|---|---|
| `/app/la-so` | Build/show lá số tứ trụ — **first one is free** | Nhật Chủ, Hành, Mệnh, Dụng Thần, Kỵ Thần, Đại Vận card + AI luận giải |
| `/app/la-so/chi-tiet` | Full reading by aspect | 5 accordion sections: Tính cách / Sự nghiệp / Tài vận / Sức khỏe / Tình duyên + Tổng hợp |
| `/app/van-thang` | Vận tháng | Month picker + qualitative cards + AI per section |
| `/app/hop-tuoi` | Compatibility | Form (other person's dob/hour/gender + relationship) → result panel + share CTA |
| `/app/phong-thuy` | Feng shui | Direction, color, lucky numbers, yearly flying-stars, purpose-specific advice |

### 3.5. Payments

```
/app/mua-luong
  ├─ 3 packages: Mua lẻ (100 lượng / 99k), Gói 6 tháng (789k), Gói 12 tháng (989k)
  └─ "Thanh toán" → Edge Function `payos-create-checkout`
        ↓ <PayCheckoutSheet> with QR/MoMo/VietQR
        ↓ user completes payment in PayOS
        ↓ webhook updates Supabase
/app/mua-luong/thanh-cong?order_id=…
  └─ <usePollPaymentOrderPaid>  (polls for paid status, then refreshes profile)
```

### 3.6. Sharing

```
/app/chia-se   (state: { resultType, suKien, day, grade })
  ├─ ShareCardCanvas             (renders styled card)
  └─ createShareToken()          → Edge Function `create-share-token`
        ↓ public URL: /x/:token
/x/:token       (anonymous-friendly)
  └─ fetchShareResolve()         → Edge Function `share-resolve`
```

---

## 4. Per-Screen Breakdown

> "Components" lists the most distinctive UI building blocks; nearly every screen also uses `ScreenHeader`, `Button`, `ErrorBanner`, `CreditsHeaderChip`, and one or more skeleton states.

### 4.1. Public

#### `/` — Landing (`landing.tsx`)

- **Purpose:** Sole pre-rendered, SEO-targeted page. Convert anonymous visitors to sign-up.
- **Sections (top → bottom):**
  1. Sticky nav (logo, Đăng nhập, install/CTA button — "Mở ứng dụng" if standalone, else anchor to `#main-form`)
  2. **Hero** — kicker, h1 "Chọn ngày đúng / mệnh của bạn. / Chừng nửa phút.", value bullets, **CTAForm** (name, dob, gio, gender) — submits to `/dang-ky` with prefill, or directly applies to profile if user is already logged in.
  3. **Pains** — 4 negative-state cards ("Lịch vạn niên số hóa", "Kết quả không cá nhân hóa", "Không giải thích lý do", "Tìm thầy vừa tốn vừa đắt").
  4. **How it works** — 3 numbered steps.
  5. **Offerings** — 6 feature cells with credit cost or "Miễn phí" badge.
  6. **Pricing** — 3 packages (Mua lẻ / 6 tháng / 12 tháng — last is "hot").
  7. **FAQ** — 6 collapsible items.
  8. **Bottom CTA** — second CTAForm.
  9. Footer.
- **Notable:** ships its own CSS (`styles/landing-marketing.css`), Google Fonts (Barlow + Montserrat + Noto Serif SC), JSON-LD with `SoftwareApplication` + `FAQPage`.

#### `/chinh-sach-bao-mat` & `/dieu-khoan` (+ EN mirrors)

Static legal pages.

#### `/x/:token` — Public share card

Resolves the token via Edge Function and renders a single decorative card with grain overlay. Anonymous-friendly (no auth).

---

### 4.2. Auth

#### `/dang-nhap`

Logo, "Đăng nhập" h1, **Tiếp tục với Google** primary, "Đăng nhập bằng email" outline, link to `/dang-ky`. Carries `?ref=` referral code through.

#### `/dang-nhap/email`

Email + password fields, link back to `/dang-nhap`, link forward to `/quen-mat-khau` and `/dang-ky`.

#### `/dang-ky`

- Email + password (≥ 8 chars).
- Two contextual banners:
  - **Referral banner** if `?ref=…` is present.
  - **Prefill banner** showing parsed name/dob/gio/gender from landing form.
- After signup, `applyLandingPrefillToProfile()` writes to the profile if a session exists; otherwise redirects to `/dang-nhap` with email-confirmation toast.

#### `/quen-mat-khau`

Single email input → `supabase.auth.resetPasswordForEmail()` with redirect to `/dat-lai-mat-khau/recovery` (see `app/lib/auth-password-reset.ts`).

#### `/dat-lai-mat-khau/recovery`

- Supabase recovery link opens here; client `getSession()` + `updateUser({ password })`.
- Invalid/expired link → CTA back to `/quen-mat-khau`.

#### `/auth/callback`

- Handles Google OAuth + email confirmation redirects (`redirectTo` / `emailRedirectTo` → `/auth/callback`).
- Branches on `profiles.onboarding_completed_at` → `/gio-sinh` or `/lich`.
- OAuth errors show inline error card; session timeout shows error card (not silent redirect).

---

### 4.3. App shell (auth-guarded)

#### `/app/bat-dau` — Onboarding finish

- BrandLogoMark, h1 "Ngày Lành / Tháng Tốt", subtitle.
- Credit/sub status callout ("Có 20 lượng" / "Gói đang không giới hạn").
- Two buttons: **Vào trang chủ app** (writes `onboarding_completed_at`), **Mua thêm lượng / gói**.
- Footer links to legal pages.

#### `/app` — Home (`app.home.tsx`)

- **Header row:** display-name + mệnh badge (left), `<CreditsHeaderChip>` (right).
- **No-laso path:** banner "Lá số Bát Tự chưa có. Lập ngay…" → CTA to `/app/la-so`.
- **With laso:**
  - `<TodaySummaryCard>` — day-type pill, lunar + solar date, AI luận giải block (locked behind 1-credit unlock if not yet purchased today).
  - `<BestHourCard>` — best hour range.
  - `<WeeklyTeaserCard>` — count of good days, links to `/tuan-nay`.
- `<CalendarGrid>` — month grid with prev/next; tap day → `/app/ngay/:ngay`.

State management: parallel Bát Tự calls (`ngay-hom-nay`, `weekly-summary`, `lich-thang`); per-day cached AI reading via `today-reading-cache.ts` (sessionStorage).

#### `/app/hom-nay`

Same Today + BestHour cards as home, on its own screen. Has explainer text + link to API docs (currently visible to users — likely not intended long-term).

#### `/app/tuan-nay`

- Week range header card.
- Day rows with grade chip (A/B/C/D), one-liner, best hours, score.
- Each row → `/app/ngay/:ngay`.

#### `/app/lich-thang`

Raw month calendar — text input for `YYYY-MM`, dumps API payload. Looks like a developer/debug screen rather than a designed user surface.

#### `/app/ngay/:ngay` — Single day detail

- Header with date label, lunar + solar.
- Profile-paywall card if no birth data.
- Status chip (Hoàng/Hắc đạo) + best-hour summary.
- AI day reading.
- Purpose verdict list — every `intent` with verdict (Nên làm / Không nên / Cân nhắc) and reason lines (unlocked via `chon-ngay/detail`).
- Hắc Đạo explainer when applicable.

#### `/app/chon-ngay` — Pick-a-day form

- h1 "Chọn Ngày Lành" + credits chip.
- Sự kiện select (25 events, "Mặc định" hidden).
- Range segmented control: 30 / 60 / 90 ngày.
- Methodology collapsible.
- `<CreditGate>` wrapping submit button — disabled when balance < cost.

#### `/app/chon-ngay/ket-qua` — Pick-a-day results

- Header with intent label + range.
- 4-phase loading panel (~4.6s).
- AI overview luận giải.
- Result day cards (animated, staggered).
- Bulk detail unlock card (4 lượng × N).
- "Chia sẻ ngày lành" → `/app/chia-se` with payload.

#### `/app/la-so` — Lá số builder/summary

State machine: `form` → `confirm` → `loading` → `revealing` → `done`.

- **Form phase:** dob (DD/MM/YYYY auto-format), gio (12-option select), gender pill switch.
- **Confirm phase:** locked-info notice, summary card, "Xác nhận — lập lá số".
- **Loading phase:** monospace "Đang lập lá số…".
- **Revealing phase:** animated `<LasoRevealSequence>` (lazy-loaded).
- **Done phase:** Nhật Chủ + Mệnh + Dụng/Kỵ Thần + Đại Vận card (forest theme + grain overlay), AI luận giải, "Xem lá số đầy đủ" → chi-tiet.

#### `/app/la-so/chi-tiet`

- Ngũ hành bar chart.
- Accordion of 5 aspects (Tính cách / Sự nghiệp / Tài vận / Sức khỏe / Tình duyên) + Tổng hợp.
- Each section AI-generated (cached in sessionStorage).

#### `/app/van-thang`

- Month picker (next 12 months).
- Tổng quan card with monospace kicker.
- Multiple `<QualitativeCard>` blocks (tài vận, sự nghiệp, tình duyên, sức khỏe, đại vận context).

#### `/app/hop-tuoi`

- Form: other person's dob, gio (default Ngọ), gender, relationship type.
- Animated result panel: grade letter, harmony score, AI luận giải, share CTA.
- Auto-redirects to `/app/la-so` if user has no laso.

#### `/app/phong-thuy`

- Form: purpose, year, dob (for unattached birth-info users).
- Result with: hướng tốt/xấu, mau hợp/kỵ, số tốt/kỵ, phi tinh năm, gợi ý hóa giải, AI advice.

#### `/app/chia-se`

- Receives `state` from caller.
- Renders `<ShareCardCanvas>` with day + grade + reasons.
- Calls `createShareToken()` once, displays public URL `/x/:token`.

#### `/app/mua-luong`

- 3 packages with title/subtitle/price + "Thanh toán" button.
- Submitting opens `<PayCheckoutSheet>` with PayOS QR/checkout.
- Header chip shows current balance + footnote (sub status, expiry).

#### `/app/mua-luong/thanh-cong`

- "Cảm ơn bạn" + order id + balance card.
- Polls payment status (`usePollPaymentOrderPaid`); on paid → refreshes profile + toast.
- Long-wait hint with PayOS webhook setup info (developer-facing — likely should be cleaned up in upgrade).

#### `/app/cai-dat` — Settings

Long screen, in this order:

1. **Tài khoản** — email + provider badge (Google/Email).
2. **Ngày sinh** — display + lock notice.
3. **Lá số tứ trụ** link card — "Xem lá số" or "Chưa có — lập ngay".
4. **Số dư lượng** — headline + footnote + "Mua thêm lượng".
5. **Mời bạn** — referral code, copy code, copy invite URL.
6. **Thông báo** — push toggle (opens permission flow).
7. **Cập nhật ngày giờ sinh** (if not locked) — collapsible form.
8. **Pháp lý + ứng dụng** — links to `/cai-dat-app`, privacy, terms, support email.
9. **Đăng xuất** button.

#### `/app/cai-dat-app`

- PWA install card (state: unknown / installable / installed / iOS).
- iOS share-sheet instructions when `isIos()` is true.
- Privacy contact (mailto).

#### `/app/thong-bao-quyen`

- Bell icon, explanation, **Cho phép thông báo** button.
- States: idle / granted / denied.
- On grant → calls `pushManager.subscribe()` and upserts to `push_subscriptions`.

---

## 5. Cross-Cutting UI Patterns

| Pattern | Where | Notes |
|---|---|---|
| **`<ScreenHeader>`** | every `/app/*` detail screen | Title, optional subtitle, back button, end-adornment slot for `<CreditsHeaderChip>`. Home & Cài đặt use a custom title row instead. |
| **`<CreditsHeaderChip>`** | many headers | Compact balance pill that links to `/app/mua-luong`. |
| **`<CreditGate>`** | `chon-ngay`, `hop-tuoi`, `phong-thuy`, `chia-se` | Wraps a primary CTA; on insufficient balance, swaps in "Mua thêm lượng". |
| **`<AiReadingBlock>`** | every result-style screen | Title + body + loading state; supports `variant="on-card"` for nested usage. |
| **`<GrainOverlay>`** | premium/result cards | Adds film-grain texture for "premium feel". |
| **Animated reveals** | `LasoRevealSequence`, `ChonNgayLoadingPanel`, `ResultDayCard` stagger, share cards | Heavy use of motion as dopamine moments (per EDS). |
| **Sonner toasts** | every mutating action | Success/error feedback. |
| **Locked-state explainer** | `/app/la-so`, `/app/cai-dat`, day detail | Lock icon + copy explaining why birth data is immutable. |
| **Methodology collapsibles** | `chon-ngay`, results | "Cách chúng tôi chọn ngày cho bạn" — opens explanation panel. |

---

## 6. Loading / Error / Empty State Coverage

| Screen | Loading | Error | Empty / Missing data |
|---|---|---|---|
| Home | Skeleton TodayCard + month-loading text | `<ErrorBanner>` for summary + calendar | "Chưa có lá số" CTA card |
| Hôm nay | Skeleton cards | `<ErrorBanner>` | Settings deep-link if no birth date |
| Tuần này | 3 skeleton rows | `<ErrorBanner>` | "Chưa có danh sách…" text |
| Chọn ngày | n/a (form only) | `<ErrorBanner>` after submit | Settings deep-link if no birth date |
| Kết quả | 4-phase animated panel | Inline raw-JSON dump (debug-style!) | Empty days array → JSON dump |
| Lá số | "Đang lập lá số…" | toast | n/a |
| Lá số chi tiết | per-section spinners | toast | Section-level fallbacks |
| Vận tháng | spinner | toast | n/a |
| Hợp tuổi | result panel skeleton | inline alert | redirects if no laso |
| Phong thủy | spinner | toast | embedded form for unfilled birth info |
| Mua lượng | "Đang tải…" | toast | n/a |
| Thanh công | polling spinner | "long-wait hint" | "Không có mã đơn" warn |
| Cài đặt | "Đang tải…" | "Chưa đọc được hồ sơ" | n/a |

> The result-screen "JSON dump" fallback (`app.chon-ngay.ket-qua.tsx` and `/app/lich-thang`) is **developer-facing** and should be replaced with proper empty/error UI in the upgrade.

---

## 7. Known UX Hot-Spots for the Upgrade

These are observations from the audit — flagged for the redesign brief, not bugs.

1. **Onboarding split** — There's both `/app/bat-dau` (purchase nudge after signup) and `/app/la-so` (build laso) as separate flows. New users have to go: signup → bat-dau → home → "Lập lá số" CTA → la-so. Consider a single onboarding stream that builds the laso before showing the home.

2. **Home density** — The `/app` home crams display name, mệnh, credits, today summary, AI reading, best hour, weekly teaser, **and** a full calendar grid into one scroll. Information hierarchy could be revisited.

3. **AI unlock UX** — Today's AI luận giải requires a separate 1-credit unlock _per day_, even after the user has paid. The "locked → unlock → reading appears" flow happens in two places (home + `/hom-nay`) with similar but duplicated logic. Worth consolidating.

4. **Navigation gaps** — `/app/hom-nay`, `/app/tuan-nay`, `/app/lich-thang` are reachable mainly via deep links from cards on home; they don't appear in the bottom nav or explore sheet. `/app/lich-thang` in particular looks like a developer view.

5. **API-doc links visible in production UI** — `/app/hom-nay` and `/app/tuan-nay` include literal "Tài liệu API" links to `https://tu-tru-api.fly.dev/docs`. Not user-facing copy.

6. **Mixed iconography weights** — Some icons are `strokeWidth={1.5}`, others are default `2`. Not consistent.

7. **Two long settings screens** — `/cai-dat` is a vertical list of ~9 sections; `/cai-dat-app` is split off but reachable only from inside `/cai-dat`. Could merge or restructure.

8. **Payment success page leaks ops detail** — The "long wait" branch tells end users about `payos-webhook` deployment. Should be replaced with user-facing copy.

9. **Empty-state JSON dumps** — When the chọn ngày API returns an unparseable shape, the screen renders the raw JSON. Should be a designed empty/error state.

10. **Result-card density** — `<ResultDayCard>` carries grade, date, lunar, truc, best hour, slots, AI reading, reasons (when unlocked) — all stacked. With 5 cards on screen, the page gets long. Worth exploring summarized + tappable detail patterns.

11. **No persistent global header / brand presence inside `/app/*`** — Each screen renders its own `<ScreenHeader>` (or not). A shared top-bar with credits + brand could be more cohesive.

12. **Modals vs routes inconsistency** — "Khám phá" is a bottom sheet, but the destinations it links to are full routes. Onboarding steps are routes, not modals. PayOS checkout is a sheet. Worth picking a consistent rule.

---

## 8. Reference Files

| Topic | File |
|---|---|
| Route table | `app/routes.ts` |
| Auth + onboarding gate | `app/routes/app.tsx` |
| Mobile shell | `app/components/AppMobileShell.tsx` |
| Bottom nav config | `app/lib/nav-config.ts`, `app/components/BottomNav.tsx` |
| Explore sheet | `app/components/ExploreSheetModal.tsx` |
| Auth lib | `app/lib/auth.tsx`, `app/lib/supabase.ts` |
| Profile context | `app/lib/profile-context.tsx`, `app/hooks/useProfile.ts` |
| Feature costs | `app/hooks/useFeatureCosts.ts` |
| Bát Tự bridge | `app/lib/bat-tu.ts`, `app/lib/bat-tu-birth.ts` |
| Reading unlock | `app/lib/reading-unlock.ts`, `app/lib/today-reading-cache.ts` |
| AI reading | `app/lib/generate-reading.ts` |
| PayOS | `app/lib/payos.ts`, `app/components/PayCheckoutSheet.tsx` |
| Share | `app/lib/share-token.ts` |
| Brand tokens | `app/theme.css`, `app/app.css` |
| Tech spec | `artifacts/docs/tech-spec.md` |
| Build plan | `artifacts/plans/build-plan.md` |
| Emotional design system | `artifacts/docs/emotional-design-system.md` |
| Design system spec | `artifacts/docs/design-system-spec.md` |

---

_Generated as a baseline snapshot; keep this doc up to date when routes or major screens change._
