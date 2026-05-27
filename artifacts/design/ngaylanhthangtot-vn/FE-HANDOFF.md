# Ngày Lành Tháng Tốt — FE Handoff

> **Direction C is the spec.** Reposition from "AI tool that picks lucky days" → **"Lịch ngày lành cho riêng bạn"** — a year-long personalised lunar calendar you own. 40 artboards across 9 production bands + 4 strategy docs. Direction B is retired; do not implement from B unless explicitly noted in §11.

---

## 0. TL;DR for the dev

- **Review** Direction C in `Direction C.html` (canvas) and `Landing C.html` (marketing site). These are the canonical visual specs.
- **Implement** from the `c-*.jsx` source modules listed in §1 — *not* from the HTML files.
- The product is a **subscription calendar**, not a credit/lượng tool. Pricing is `1 tháng / 6 tháng / 1 năm` + two standalone luận-giải add-ons. No "lượng," no FAB, no pick-wedge home.
- IA collapsed from **5 tabs + FAB** to **3 tabs + segmented controls** (Lịch · Tra cứu · Tôi).
- Existing tokens in `app/theme.css` stay (paper / forest / gold / cream / Lora / Barlow Condensed / IBM Plex Mono / Noto Serif SC). The visual system is **the lịch-tờ (tear-off calendar page)**, not the phiếu.
- Ship C as **default**. Do not feature-flag B vs C.

---

## 1. Files in this project

```
Direction C.html              ← canvas entry for the app (open in browser to review)
Landing C.html                ← marketing site
Direction B.html              ← retired (kept for archaeology only)
Direction B (bundled).html    ← retired
FE-HANDOFF.md                 ← this file

────── Production C modules ──────
b-shared.jsx                  Tokens, Logo, LogoMark, Ticket, Stamp, Kanji, Mono,
                              Phone (iOS frame), StatusBar, HomeIndicator, BackBar
                              (still used; not renamed to c-shared)
c-screens-a.jsx               CT tokens, PROFILE, CTopStrip, CSegmented,
                              CBottomNav (3-tab), icons, scoreDot, CSplash,
                              CHomePage (12), CMonthSpread (13),
                              **CTodayReasoning** — shared inline LLM typed-reveal
                              block, reused by CDayDetail
c-screens-b.jsx               CSearchEntry (19), CSearchResult (21), CHopTuoi (22),
                              CMe (28), CPricing (25)
c-screens-c.jsx               CBackBar, CAuthChooser (03), CSignup (08),
                              CBirthTime (09), CBuildingCalendar (10), CReveal (11),
                              CDayDetail (14) — uses CTodayReasoning,
                              CEmptySo, CPayConfirm (26), CPaySuccess (27),
                              CSharePublic
c-screens-d.jsx               CInstallBanner (02), CEmailLogin (04),
                              CForgotPwReq (05), CForgotPwSent (06),
                              COAuthCallback (07)
c-screens-e.jsx               CPickLoading (20), CShareSender, CSoList,
                              CHopTuoiResult (23)
c-screens-f.jsx               CPhongThuy, CTieuVan, CChuyenLich (24),
                              CEditProfile (29)
c-screens-g.jsx               CAITyped (15 — merged 15+16: thread + sectioned + chat),
                              CAISectioned (deprecated, no route),
                              CLaSoFull (17), CBaziReadingFull (18)
c-screens-h.jsx               CSettings (30), CNotifPerm (31), CNoDatesFound (32),
                              CPayFailure (37), CSubExpired (38),
                              CConfirmDialog (39), COfflineHome (40)
c-screens-i.jsx               CBaziLocked (33), CPayConfirmStandalone (35),
                              CPaySuccessStandalone (36), CMeLocked (34)
c-landing.jsx                 Landing site — Hero · Ritual · Personal · YearSpread ·
                              Pricing · FAQ · CTA · Footer · sticky-mobile CTA
c-canvas.jsx                  Canvas assembly + 4 strategy artboards
                              (Brief, IA map, Language map, Flow map)

────── Shared chrome ──────
design-canvas.jsx             DesignCanvas / DCSection / DCArtboard
ios-frame.jsx                 Phone bezel
tweaks-panel.jsx              Canvas controls

────── Retired (do not port) ──────
b-app.jsx, b-screens.jsx, b-refresh.jsx, b-tabs.jsx,
b-flow2.jsx, b-flow3.jsx, b-flow-complete.jsx,
b-ai-reading.jsx, b-extras.jsx, b-landing-v2.jsx,
surfaces2.jsx, surfaces3.jsx

assets/logo-mark.svg
assets/logo-mark-reversed.svg
```

The `.jsx` files use React 18 + Babel-standalone for the canvas. **Port the markup into real components** in the React Router app — don't copy these files in as-is.

---

## 2. Strategy — what reposition means in code

The four artboards at the top of `Direction C.html` (Brief · IA map · Language map · Flow map) are the strategic spec. Internalise them before writing routes.

### 2.1 Pivot brief — three pillars

1. **Mental model already exists.** Every Vietnamese household has a tear-off lịch on the wall. Don't teach a new concept — personalise that existing object.
2. **Annual purchase is a ritual.** Buying a calendar at year-end is muscle memory. Year-subscription = familiar mental model; "buying software" is not.
3. **LTV.** A tool used on-demand churns. "My calendar" is a daily ritual surface with built-in retention.

### 2.2 What changed vs Direction B

| Axis | B (retired) | C (ship) |
|---|---|---|
| Centre of gravity | Pick wedge (FAB) | "Trang lịch hôm nay" (Tab 1) |
| Home tab | "Hôm nay" daily horoscope | Tear-off lịch page user "flips" each morning |
| BottomNav | 5 tabs + FAB | 3 tabs, no FAB |
| Tools | Tab 4 with 4 separate utilities | Tab 2 hub (Pick + Hợp tuổi); rest in Tab 3 |
| Pricing | Lượng micro-tx (49k / 89k / 749k) | Subscription (49k / 249k / 449k) + add-ons |
| Onboarding | 3 screens + auth gate | Same 3 screens — justified, we need lá số |
| Phiếu | Default result surface | Only when share/print; not centerpiece |

### 2.3 Re-language — every copy string says "lịch"

The user does not "use the app." They **open their calendar**. Audit every string against this list:

| Old (B) | New (C) |
|---|---|
| Mở quẻ — 30 giây | Lập lịch của bạn |
| Niên giám điện tử | Lịch riêng cho mệnh của bạn |
| Phiếu chọn ngày | Trang lịch · ngày bạn chọn |
| Hôm nay (Tab 1) | Trang hôm nay |
| Mua lượng | Đặt lịch năm / 6 tháng / tháng |
| Bạn còn 47 lượng | Lịch của bạn dùng đến 30.04.2027 |
| Lập lá số | Lập lịch (gồm nhập ngày giờ sinh) |
| Pick wedge | Tra cứu ngày tốt cho việc... |

One-line gut check: *"Lịch của tôi — của riêng tôi, dùng cả năm."* Use **"lịch"** (not "quyển lịch").

---

## 3. Wiring — routes, branches, and the auth state machine

> Canvas reads linearly 01 → 40 because it has to. Real users skip whole bands. This section is the source of truth for routes; the canvas is the visual spec for each screen.

### 3.0 Route table

Canvas numbers in the **#** column are the artboard labels from `c-canvas.jsx`.

| # | Path | Screen | Component | Notes |
|---|---|---|---|---|
| 01 | `/` | Splash | `CSplash` | Resolves auth + onboarding, branches per §3.1 |
| 02 | `/install` | Install banner | `CInstallBanner` | iOS A2HS overlay; not navigable in code |
| 03 | `/dang-nhap` | Chooser | `CAuthChooser` | Google + email |
| 04 | `/dang-nhap/email` | Email login | `CEmailLogin` | Returning email user |
| 05 | `/quen-mat-khau` | Quên mật khẩu | `CForgotPwReq` | Email input → POST reset-request |
| 06 | `/quen-mat-khau/da-gui` | Đã gửi link | `CForgotPwSent` | Confirmation, 30s resend throttle |
| 07 | `/auth/callback` | OAuth callback | `COAuthCallback` | Handles Google return; branches on `is_new` |
| 08 | `/dang-ky` | Lập lịch · b1 (signup) | `CSignup` | Form; prefills referral from `?ref=` |
| 09 | `/gio-sinh` | Lập lịch · b2 (giờ sinh) | `CBirthTime` | 12-canh selector |
| 10 | `/dang-dung-lich` | Đang dựng lịch | `CBuildingCalendar` | Animated progress, lá số computing |
| 11 | `/lich-da-mo` | Lịch đã mở — trang đầu | `CReveal` | First-page reveal (forest, ceremonial) |
| 12 | `/lich` | Tab 1 · Lịch · [Hôm nay] | `CHomePage` | **Tab 1 default**. Lịch-tờ home (paper, white card) · **luận giải LLM streaming inline** (typed reveal + nguồn) |
| 13 | `/lich/thang` | Tab 1 · Lịch · [Tháng] | `CMonthSpread` | Inline segmented control toggles 12 ↔ 13 |
| 14 | `/ngay/:ngay` | Chi tiết một ngày | `CDayDetail` | Reached from month grid. `:ngay = YYYY-MM-DD`. **Same inline luận giải block as C12** (`<CTodayReasoning>` with day-specific text + sources + CTA → chat thread on C15) |
| 15 | `/luan-ai/:context` | Luận AI · thread + phân tích | `CAITyped` | Merged 15+16. Anchor turn = typed answer + sectioned breakdown + nguồn; follow-ups append voice-only. Scope-locked + 10 câu/ngày — see §Phase 8 spec |
| ~~16~~ | ~~`/luan-ai/:context/day-du`~~ | **Merged into 15** | — | `CAISectioned` left in source for now; delete after confirm |
| 17 | `/toi/la-so` | Lá số chi tiết | `CLaSoFull` | Tứ trụ deep view |
| 18 | `/toi/luan-bat-tu` | Luận giải Bát tự năm | `CBaziReadingFull` | Standalone luận; paywalled if not yearly |
| 19 | `/tra-cuu` | Tab 2 · Tra cứu · entry | `CSearchEntry` | **Tab 2 default**. Pick wedge lives here |
| 20 | `/tra-cuu/dang-tim` | Đang tìm ngày tốt | `CPickLoading` | 4-phase progress |
| 21 | `/tra-cuu/ket-qua` | Tra cứu · kết quả | `CSearchResult` | Ranked day list |
| 22 | `/tra-cuu/hop-tuoi` | Tab 2 · [Hợp tuổi] | `CHopTuoi` | Segmented control toggles 19 ↔ 22 |
| 23 | `/tra-cuu/hop-tuoi/ket-qua` | Hợp tuổi · kết quả | `CHopTuoiResult` | Verdict for 2 birth profiles |
| 24 | `/tien-ich/chuyen-lich` | Chuyển lịch âm ↔ dương | `CChuyenLich` | Tab 3 → Tiện ích entry |
| 25 | `/dat-lich` | Đặt lịch (pricing) | `CPricing` | 3 tiers · 1-năm is hero · 2 add-ons |
| 26 | `/dat-lich/xac-nhan` | Xác nhận thanh toán | `CPayConfirm` | PayOS QR sheet |
| 27 | `/thanh-cong` | Đặt lịch thành công | `CPaySuccess` | Reveals expiry date |
| 28 | `/toi` | Tab 3 · Tôi | `CMe` | **Tab 3 default**. Lá số + Lịch hạn dùng + Tiện ích |
| 29 | `/toi/sua-ho-so` | Sửa hồ sơ | `CEditProfile` | Triggers lá số recompute |
| 30 | `/toi/cai-dat` | Cài đặt | `CSettings` | Notif, language, account, đăng xuất |
| 31 | (overlay) | Xin quyền thông báo | `CNotifPerm` | Pre-prompt sheet before browser-native |
| 32 | (inline 21) | NO_DATES_FOUND | `CNoDatesFound` | Empty state for search result |
| 33 | (locked 18) | Bát tự · LOCKED | `CBaziLocked` | Paywall when no yearly sub |
| 34 | (locked 28) | Tôi · Bát tự khóa | `CMeLocked` | Tab 3 variant for non-yearly subs |
| 35 | `/luan/mua/xac-nhan` | XN TT · mua lẻ Bát tự | `CPayConfirmStandalone` | Add-on purchase confirm |
| 36 | `/luan/mua/thanh-cong` | TT thành công · Bát tự | `CPaySuccessStandalone` | Add-on success |
| 37 | (inline 26/35) | Thanh toán thất bại | `CPayFailure` | Recovery: retry + alt method |
| 38 | (inline 12) | Lịch hết hạn | `CSubExpired` | Subscription expired blocker |
| 39 | (overlay) | Confirm dialog | `CConfirmDialog` | Bottom-sheet (e.g. đăng xuất) |
| 40 | (offline state) | Hôm nay · offline | `COfflineHome` | Top banner + cached lịch |

### 3.1 Auth state machine

Splash runs this on mount; everywhere else trusts auth has resolved.

```
on splash mount:
  if not authed         → /dang-nhap
  if authed && !onboarded → /gio-sinh   (signup already captured email at 08)
  if authed &&  onboarded → /lich
```

`onboarded = true` is set when `CReveal` (11) commits.
`authed` = valid JWT in cookie.

### 3.2 Branches (what linear order hides)

**A. New Google user.** splash → chooser → Google → /auth/callback (07) → `is_new=true` → /gio-sinh (09) → /dang-dung-lich (10) → /lich-da-mo (11) → /lich (12).

**B. Returning Google user.** splash → chooser → Google → /auth/callback → `is_new=false` → /lich.

**C. Returning email user.** splash → chooser → "Đăng nhập email" → /dang-nhap/email (04) → POST → /lich. (Skips onboarding.)

**D. Forgot password.** /dang-nhap/email → "Quên mật khẩu" → /quen-mat-khau (05) → POST → /quen-mat-khau/da-gui (06) → (out-of-band email link → /dat-lai-mat-khau/:token → /lich).

**E. Search happy path.** /lich (12) → tap Tra cứu tab → /tra-cuu (19) → choose việc + range → /tra-cuu/dang-tim (20) → /tra-cuu/ket-qua (21).

**F. Browsing the month.** /lich (12) → tap [Tháng] segmented → /lich/thang (13) → tap a day → /ngay/2026-06-17 (14).

**G. Sub-day → AI luận.** /ngay/:ngay (14) → tap "Luận chi tiết" → /luan-ai/day-:ngay (15) → tap "Xem trích dẫn" → /luan-ai/day-:ngay/day-du (16).

**H. Paywall — Bát tự.** /toi (28) → tap "Luận giải Bát tự" → if yearly sub → /toi/luan-bat-tu (18); if not → `CBaziLocked` (33) → tap "Mua lẻ 299k" → /luan/mua/xac-nhan (35) → /luan/mua/thanh-cong (36) → /toi/luan-bat-tu.

**I. Subscription expired.** Any authed route hits `sub_expired=true` from API → render `CSubExpired` (38) over the route → CTA → /dat-lich (25).

**J. Pay-success terminal.** /dat-lich (25) → /dat-lich/xac-nhan (26) → PayOS webhook → /thanh-cong (27) → auto-redirect to /lich after 3s.

**K. Edit profile.** /toi → "Sửa" → /toi/sua-ho-so (29) → save → background recompute lá số → return /toi.

### 3.3 Edge states — modals & inline, never routes

Handled inline at the route where they arise.

| State | Where | Shape |
|---|---|---|
| Auth failed (wrong password) | 04 | Inline error below password — `text-red`, mono kicker "Sai mật khẩu" |
| OAuth denied | 07 | Replace spinner with error card → "Quay lại đăng nhập" |
| Session expired | Any authed | Redirect to /dang-nhap with `?reason=expired` toast |
| PayOS error / timeout | 26 or 35 | Sheet: `CPayFailure` (37) — retry + alt method |
| Network offline | 12 + any read | Top banner + render `COfflineHome` (40) for the home tab |
| Logout confirm | 30 | `CConfirmDialog` (39) bottom-sheet |
| Notif permission | First load post-onboarding | `CNotifPerm` (31) pre-prompt → browser-native |
| iOS install instructions | 02 overlay | Static "tap Share → Add to Home Screen" diagram |
| NO_DATES_FOUND | 21 | `CNoDatesFound` (32) instead of day list |
| Bát tự locked | 18 | `CBaziLocked` (33) replaces page body |
| Tôi · Bát tự locked card | 28 | `CMeLocked` (34) — replaces the Bát tự CTA tile only |

### 3.4 Tab nav presence rule

`<CBottomNav active={0|1|2}>` renders on tab destinations and their internal segmented children. Detail / modal / auth / payment screens hide nav and show `<BackBar>` (from `b-shared.jsx`).

| Screen # | Nav? | `active=` |
|---|---|---|
| 12 Hôm nay | ✅ | `0` (Lịch) |
| 13 Tháng | ✅ | `0` (Lịch) |
| 14 Day detail | ❌ | — |
| 19 Tra cứu | ✅ | `1` (Tra cứu) |
| 20 Loading, 21 Result | ❌ | — |
| 22 Hợp tuổi | ✅ | `1` (Tra cứu) |
| 23 Hợp tuổi result | ❌ | — |
| 24 Chuyển lịch | ❌ | — (deep tool from Tab 3) |
| 28 Tôi | ✅ | `2` (Tôi) |
| 29 Sửa hồ sơ, 30 Cài đặt | ❌ | — |
| 15–18 AI / Lá số / Bát tự | ❌ | — |
| 25–27, 35–37 Commerce | ❌ | — |
| 01–11 Launch / auth / first run | ❌ | — |

---

## 4. Design system — what to lift verbatim

### 4.1 Tokens (`b-shared.jsx` → `TOK`, `c-screens-a.jsx` → `CT`)

`CT` is the C-direction palette, slightly tighter than B's. Align `app/theme.css` to these values:

| Token | Value | Use |
|---|---|---|
| `--paper` | `#f0ece2` | App default surface |
| `--paper-warm` | `#ede7d3` | Section breaks, ticket fill |
| `--cream` | `#ede7d3` | Forest-mode text |
| `--ink` | `#18150e` | Body text on paper (was `#1a1a1a` in B) |
| `--ink-2` | `#3a3220` | Secondary text on paper |
| `--muted` | `#7a7050` | Mono labels (passes AA on paper) |
| `--forest` | `#1d3129` | Ceremony surface |
| `--forest-deep` | `#0e1c14` | Forest accents (deeper than B's `#15241e`) |
| `--gold` | `#c5a55a` | Accent on forest only — never text on paper |
| `--gold-deep` | `#9a7c22` | Accent text on paper (passes AA) |
| `--green-mute` | `#7a9a80` | Score chip when ≥85 (landing site) |
| `--border` | `rgba(154,124,34,0.18)` | Hairlines on paper |

### 4.2 Type stack

```css
--display:   'Barlow Condensed', sans;   /* Headlines — was Noto Serif SC in B */
--display-2: 'Barlow Condensed', sans;   /* Kickers, labels */
--serif:     'Lora', serif;              /* Body, italic accents */
--mono:      'IBM Plex Mono', monospace; /* Kickers, dates, labels */
--hanzi:     'Noto Serif SC', serif;     /* Decorative watermarks only */
```

Headline pattern (used on landing, brief, pricing): UPPERCASE Barlow Condensed 800 with `letter-spacing: -0.01em` to `-0.015em` + italic Lora accent word in `--gold-deep` (e.g. `Lịch ngày lành cho riêng bạn.` — italic on "cho riêng bạn"). This is **the** brand voice — preserve it everywhere.

### 4.3 Primitives to port

| Component | Source | Notes |
|---|---|---|
| `<Logo size dark showUrl />` | `b-shared.jsx` | Full lockup. Splash, landing, footer only. |
| `<LogoMark size dark />` | `b-shared.jsx` | Mark only. Use in app chrome. |
| `<Ticket variant>` | `b-shared.jsx` | **Demoted in C** — used only for share artefact + print. Not default result surface. |
| `<Stamp value /100>` | `b-shared.jsx` | Forest disc with gold ring. |
| `<Kanji ch size drift>` | `b-shared.jsx` | Watermark. |
| `<Mono>` | `b-shared.jsx` | Uppercase Plex Mono kicker. |
| `<BackBar dark>` | `b-shared.jsx` | Top-aligned chevron for every detail screen. |
| `<CBottomNav active dark>` | `c-screens-a.jsx` | **3-tab** floating pill: Lịch · Tra cứu · Tôi. Replaces B's 5-tab + FAB. |
| `<CSegmented options active onChange dark>` | `c-screens-a.jsx` | Pill segmented control. Use inside Tab 1 ([Hôm nay | Tháng]) and Tab 2 ([Ngày tốt cho việc | Hợp tuổi]). |
| `<CTopStrip dark right>` | `c-screens-a.jsx` | Quieter identity strip — small logo + tight line. |
| `<Phone dark>` | `ios-frame.jsx` | iOS bezel for canvas only. |

---

## 5. Implementation roadmap

Ship in this order. Each phase is independently deployable.

### Phase 1 — Tokens + primitives (½ day)
- Update `app/theme.css` to C values (§4.1). Diffs from B: `--ink`, `--ink-2`, `--muted`, `--forest-deep`, `--gold-deep`, `--border`.
- Port `Logo`, `LogoMark`, `BackBar`, `Mono`, `Stamp`, `Kanji` from `b-shared.jsx`.
- Port `CBottomNav` (3-tab) and `CSegmented` from `c-screens-a.jsx`. **Delete any B-era 5-tab nav.**

### Phase 2 — Landing v3 (1–2 days)
- Source: `c-landing.jsx` → `CLanding`.
- Target: `app/routes/landing.tsx`.
- Sections in order: `LHeader` · `LHero` (with `LHeroStack` — 6 layered lịch-tờ pages peeking at angles) · `LRitual` (daily-flip strip) · `LPersonal` (same day, different mệnh, different verdict) · `LYearSpread` (12 month grids dot-coloured by score) · `LPricing` · `LFAQ` · `LCTA` · `LFooter` · `LStickyMobileCTA`.
- Mobile gets the sticky bottom CTA bar; desktop does not.

### Phase 3 — Auth band (½ day)
- Source: `c-screens-c.jsx` (chooser/signup/birth-time/building/reveal) + `c-screens-d.jsx` (install banner, email login, forgot-password req/sent, OAuth callback).
- Targets: `/dang-nhap`, `/dang-nhap/email`, `/dang-ky`, `/quen-mat-khau`, `/quen-mat-khau/da-gui`, `/auth/callback`, `/gio-sinh`, `/dang-dung-lich`, `/lich-da-mo`.
- Branches A–D in §3.2 must work end-to-end.

### Phase 4 — Daily loop (Tab 1) (1–2 days)
- Source: `c-screens-a.jsx` → `CHomePage` (12), `CMonthSpread` (13), **`CTodayReasoning`** (shared inline luận giải component); `c-screens-c.jsx` → `CDayDetail` (14).
- Target: `app/routes/lich.tsx` with `<CSegmented>` switching `[Hôm nay | Tháng]` and a sub-route `/ngay/:ngay`.
- Hôm nay is paper-default — the lịch-tờ is a white card on warm paper with a subtle shadow. **Don't flip to forest** — forest is reserved for ceremonial-only surfaces (§6). Daily-use surfaces stay paper for readability + continuity with C13/C14.
- **Both C12 (Hôm nay) and C14 (ngày khác) embed `<CTodayReasoning text=… sources=… ctaLabel=… />`** — typed-reveal luận giải inline, gold-deep CTA opens C15 thread with this day's anchor question. Same component, different props; do not fork.

### Phase 5 — Pricing v3 (1 day)
- Source: `c-screens-b.jsx` → `CPricing`.
- Target: `app/routes/dat-lich.tsx`.
- Three subscription tiers:
  - **1 tháng** — *Chỉ lịch · dùng thử* — 49.000 đ / tháng
  - **6 tháng** — *Chỉ lịch · người mới quen* — 249.000 đ (baseline 294.000, tiết kiệm 15%)
  - **1 năm** — *Lịch + cả 2 luận giải* — 449.000 đ (baseline 947.000, tiết kiệm 498.000) — **HERO**
- Two standalone add-ons:
  - **Luận giải Bát tự** — mệnh · tính cách · quý nhân · suốt đời — **299.000** (một lần)
  - **Luận giải Tiểu Vận** — vận năm Bính Ngọ 2026 + phong thuỷ năm — **199.000** (1 năm)
- PayOS failure path → `CPayFailure` (37) with retry + alt method.

### Phase 6 — Search band (Tab 2) (1 day)
- Source: `c-screens-b.jsx` → `CSearchEntry`, `CSearchResult`, `CHopTuoi`; `c-screens-e.jsx` → `CPickLoading`, `CHopTuoiResult`.
- Target: `app/routes/tra-cuu.tsx` with `<CSegmented>` toggling `[Ngày tốt cho việc | Hợp tuổi]`.
- Empty result → `CNoDatesFound` (32). Copy: "Khoảng này không có ngày hợp. Thử mở rộng phạm vi hoặc bỏ một số tiêu chí khắt khe."

### Phase 7 — Account band (Tab 3) (½ day)
- Source: `c-screens-b.jsx` → `CMe`; `c-screens-f.jsx` → `CEditProfile`; `c-screens-h.jsx` → `CSettings`; `c-screens-i.jsx` → `CMeLocked`.
- Targets: `/toi`, `/toi/sua-ho-so`, `/toi/cai-dat`.
- Tab 3 holds lá số card + "Lịch hạn dùng đến DD.MM.YYYY" + Tiện ích (Bát tự + Chuyển lịch entry) + Cài đặt.

### Phase 8 — AI Luận Giải + Lá số (1–2 days)
- Source: `c-screens-g.jsx` → `CAITyped` (merged 15+16: typed voice + sectioned breakdown + nguồn + threaded chat), `CLaSoFull`, `CBaziReadingFull`.
- Targets: `/luan-ai/:context`, `/toi/la-so`, `/toi/luan-bat-tu`.
- `CAISectioned` remains in source for now but has no route — its logic is folded into `CAITyped`. Delete after confirming no regressions.
- Bát tự route paywalled — non-yearly subs see `CBaziLocked` (33) → `/luan/mua/xac-nhan` (35) → `/luan/mua/thanh-cong` (36).

---

#### Screen 15 spec — `CAITyped` (Luận giải · ngày `:ngay`)

The single screen for every LLM interaction about a day. **Threaded conversation**, not single-shot — Q&A pairs append below previous turns.

**Anatomy** (top → bottom, single scroll region between BackBar and Input):

```
StatusBar
BackBar "Luận giải · ngày DD.MM"  ·  right kicker "AI · có nguồn"
┌─ scroll region ─────────────────────────────────┐
│ [Anchor Q]   pinned · gold-deep left-border     │  ← from CHomePage tap or auto-injected
│ [Anchor A]   avatar + typed reveal (cursor)     │
│ ───────────                                     │
│ [Sectioned breakdown · 4 yếu tố]                │  ← anchor turn ONLY
│   per row: Mono(title) · score chip (+N)        │
│            display(verdict) · serif(body) · [n] │
│ [Tổng điểm 76/100]   2px black top border       │
│ [Nguồn đối chiếu]    [1]–[4] expanded list      │
│ ───────────                                     │
│ [Q2]  user-asked follow-up                      │  ← repeats per turn
│ [A2]  voice-only, ~2–3 sentences + [n]          │
│ ───────────                                     │
│ [Q3 / A3 …]                                     │
│ ───────────                                     │
│ [Hỏi tiếp gợi ý] · remaining chips only         │
└─────────────────────────────────────────────────┘
[Input pill + send] · placeholder "Hỏi tiếp về ngày DD.MM…"
[scope hint italic]    [quota mono "còn N/10 câu hôm nay"]
HomeIndicator
```

**Anchor turn** (first turn on the screen, always):
- Question comes from the calling context — `CHomePage` tap on "Hỏi tiếp ›" sends "Tại sao hôm nay được {score} điểm với mệnh của tôi?"; `CDayDetail` sends the same with the day's score.
- Answer is typed with `setTimeout` at 18–22 ms/char (one char per tick). Cursor span blinks via `b-cursor-blink 1s steps(2) infinite`; hides on completion.
- After typing completes (`n >= fullText.length`), the **sectioned breakdown** fades in: `@keyframes b-fade-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }`, 320 ms ease-out.
- Sectioned breakdown is **deterministic** (from the calendar engine, not the LLM) — it always shows the same 4 yếu tố for that day. The LLM is only responsible for the voice answer + follow-ups.
- Sectioned breakdown shows **only on the anchor turn**. Follow-ups never re-render it.

**Follow-up turns** (Q2, Q3, …):
- Voice-only typed answer, 2–3 sentences, ~120–180 chars.
- Must include at least one `[1]–[4]` citation linking back to the anchor's sources.
- No sectioned breakdown, no separate Total/Sources block.
- Appended below previous turns separated by a `1px solid ${CT.hairline}` top border.
- Auto-scroll the scroll region to the new Q the moment it's submitted (before the typed answer starts).

**Suggested chips** (below the latest turn):
- Three seeded questions at anchor time: `["Giờ nào trong ngày tốt nhất?", "Hôm nay có nên ký hợp đồng không?", "So sánh với ngày mai"]`.
- Filter out any chip whose text has been asked (case-insensitive substring match against thread Q's).
- Hide the whole section when zero chips remain.
- Tapping a chip = same as typing it + send: appends a new follow-up turn, decrements quota.

**Input pill** (always pinned at bottom, never scrolls away):
- Placeholder includes the date — `"Hỏi tiếp về ngày DD.MM…"` — to reinforce scope.
- Below the pill (in the same border-top region), two lines side-by-side:
  - **Left, italic muted serif 10.5px:** `"Chỉ trả lời về ngày này và lá số của bạn"`
  - **Right, mono kicker 9px tabular-nums:** `"còn {10 - used}/10 câu hôm nay"` — the digit is `--gold-deep` weight 700.
- Enter or send button submits.
- When `used >= 10`: pill goes `pointer-events: none`, input greys to `CT.muted`, send button hides, scope hint replaces both lines with single centered: `"Hết câu hôm nay · quay lại sáng mai"`.

**States:**

| State | Trigger | UI |
|---|---|---|
| Anchor loading | Page mount before stream starts | Skeleton: avatar + 3 grey lines (`background: rgba(154,124,34,0.06)`); kicker `"NLTT đang luận…"` |
| Anchor streaming | First token arrived | Typed reveal with cursor; kicker stays `"NLTT đang luận…"` |
| Anchor done | `done === true` | Cursor hides; kicker → `"NLTT luận"`; sectioned breakdown fades in |
| Follow-up loading | User submitted, no token yet | Q rendered immediately; A row shows avatar + cursor only |
| Follow-up streaming | First token | Typed reveal |
| Quota exhausted | `used >= 10` after a turn | Input disabled; quota chip → "Hết câu hôm nay…" |
| Sub expired | `SUB_EXPIRED` from Edge | Replace whole screen body with `CSubExpired` (38) |
| LLM error | Edge 5xx or timeout > 15s | Inline error card under the failed turn: `"Không kết nối được. Thử lại ›"` — retry stays in-place, doesn't decrement quota |
| Off-topic refusal | Model returns `{refused: true}` | Render answer as muted serif "Câu này ngoài phạm vi ngày {DD.MM}. Bạn có thể: …" with 2 redirect chips. **Does NOT count against quota.** |

**Backend contract — `generate-reading` Edge:**

Request:
```json
{
  "context": "day-2026-05-26",
  "mode": "anchor" | "follow-up",
  "question": "Tại sao hôm nay…",
  "thread_id": "uuid",        // null on anchor; reused on follow-ups
  "thread_history": [          // sent only on follow-up; max last 4 turns
    {"role": "user", "content": "…"},
    {"role": "assistant", "content": "…"}
  ]
}
```

Response (SSE stream):
```
event: token   data: {"text": "Hôm"}
event: token   data: {"text": " nay"}
…
event: done    data: {"thread_id": "uuid", "tokens_used": 142, "quota_remaining": 7, "refused": false}
```

Error envelope (non-stream):
```json
{ "error": { "code": "SUB_EXPIRED" | "QUOTA_EXCEEDED" | "OFF_TOPIC" | "RATE_LIMITED" | "INTERNAL", "message": "…" } }
```

**Chat policy — enforced by Edge, mirrored in UI:**

| Constraint | Server enforcement | UI affordance |
|---|---|---|
| **Scope-locked** | System prompt injects `{day, la_so, 4_sources}` and instructs refusal on off-topic. Post-process classifier flags `refused: true` if model strays. | Placeholder `"Hỏi tiếp về ngày DD.MM…"`; italic hint `"Chỉ trả lời về ngày này và lá số của bạn"` |
| **Rate-limited** | `profiles.daily_chat_used_count` + `daily_chat_reset_at`. Atomic increment per non-refused turn. Reset 0h Asia/Ho_Chi_Minh by cron. Returns `QUOTA_EXCEEDED` past 10. | Quota chip `"còn N/10"`; disabled state at 0 |
| **Length-bounded** | `max_tokens: 200` on the LLM call. | If response ends mid-sentence with "…", show inline "Tóm tắt thêm" button → resubmits with `mode: 'continue'` (does NOT count against quota) |
| **Citation-only** | Post-process regex: every claim sentence must contain `[1]`–`[4]` or be a connective. Strip uncited claims before returning. | Citations rendered as `--gold-deep` mono `[n]` inline, tappable → scroll to that source row |
| **Off-topic** | Classifier flags + refusal template. **Does not decrement quota.** | Answer renders as muted "Câu này ngoài phạm vi…" with redirect chips ("Tra cứu ngày", "Hỏi về lá số") |
| **Tap-first** | n/a — UI shape. | Suggested chips are the primary path; input is for users who already know what to ask |

**Animation timing constants:**
- Typed char interval: `18 ms` (anchor) — feels alive but readable. `22 ms` for follow-ups (calmer).
- Sectioned reveal: `b-fade-in 320 ms ease-out` after typing completes.
- New follow-up auto-scroll: `behavior: 'smooth'` to the Q bubble's `offsetTop - 12 px`.
- Cursor blink: `b-cursor-blink 1s steps(2) infinite`.

**A11y:**
- The streaming `<p>` uses `aria-live="polite"` so screen readers announce the final answer (not every keystroke).
- Citations are real `<button>`s with `aria-label="Xem nguồn 1"`.
- Input has `aria-describedby` pointing to the scope hint + quota chip.
- Disabled input has `aria-disabled="true"` + the "Hết câu hôm nay" line gets `role="status"`.

**FE state shape (per route render):**
```ts
type Turn = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  citations?: number[];      // [1,4]
  refused?: boolean;
  status: 'streaming' | 'done' | 'error';
};

type ChatState = {
  threadId: string | null;
  turns: Turn[];             // turns[0] = anchor Q, turns[1] = anchor A, …
  sectionedBreakdown: SectionedData;  // computed once for the day; from bat-tu day-detail op
  sources: [string, string][];
  quotaRemaining: number;    // 0–10
  suggestedChips: string[];
};
```

### Phase 9 — Tools (½ day)
- Source: `c-screens-f.jsx` → `CChuyenLich`.
- Target: `/tien-ich/chuyen-lich`. Reached only from Tab 3 → Tiện ích.
- **Phong thuỷ** (`CPhongThuy`) and **Tiểu Vận** (`CTieuVan`) are written but **not routed in C**. They're held in reserve — only ship when content is ready. Do not surface in nav.

### Phase 10 — Edge states + offline (½ day)
- Source: `c-screens-h.jsx` → `CSubExpired`, `CConfirmDialog`, `COfflineHome`, `CNotifPerm`, `CPayFailure`.
- Wire each per §3.3.
- Offline: top banner on every read route; Tab 1 specifically renders `COfflineHome` against cached lịch.

### Phase 11 — Trust cleanup (½ day · spec only)
- **`/thanh-cong`** — remove any raw PayOS webhook dump. Render only `{plan_name}`, `{amount_vnd}`, `{expires_at}`.
- **`/lich`** — no public "About the API" paragraph. API docs at `/docs`.
- **Methodology card** — collapsible "Cách tính điểm" under every search result and day detail: Hoàng-đạo (40%) + Trực (20%) + Sao tốt/xấu (25%) + Tương sinh với mệnh (15%).
- **Locked Bát tự** — `CBaziLocked` must explain *what* unlocks: 1-năm sub includes both luận giải; or mua lẻ 299k for Bát tự alone.

---

## 6. Where forest-dark stays

Forest is the *ceremonial* surface in C — reserved cho những **moment đặc biệt**, không phải daily-use. Mỗi sáng mở app thấy forest = ceremonial mất ý nghĩa. Daily-use surfaces stay paper.

**Forest chỉ ở 5 chỗ:**
- App splash (01) — first touch
- Auth band (03–08) — chooser, signup, email login, forgot-password, OAuth callback
- First-run trio (09 giờ sinh, 10 dựng lịch, 11 lịch đã mở) — onboarding nghi thức
- Offline home (40) — sự kiện đặc biệt khi mất kết nối
- Logo lockup ở dark surfaces (e.g., footer của landing)

**Paper-default everywhere else**, bao gồm **Hôm nay (C12)** — đây là daily-use surface, phải khớp với C13 (Tháng) và C14 (Ngày khác) trong cùng Tab 1 để tạo dải đọc liền mạch. "Lịch tờ giấy" là metaphor — paper IS the brand, không phải forest with paper inset.

---

## 7. Sample data — canonical persona

Use the same fictional user across every demo / screenshot / Storybook entry.

```
Họ tên:        Nguyễn Thị Minh
Giới tính:     Nữ
Sinh:          20 / 05 / 1990 · giờ Mão (5–7h)
Nhật chủ:      Quý Thuỷ
Nạp âm:        Trường Lưu Thuỷ
Đại Vận:       Giáp Dần · Mộc · 32 → 41 tuổi
Hôm nay (mock): Thứ Hai · 11/05/2026 · ngày Bính Tuất
Năm đang xem:   Bính Ngọ 2026
Subscription:   1 năm · dùng đến 30.04.2027
```

---

## 8. Copy — source of truth

Canonical Vietnamese strings live in `c-screens-b.jsx` (pricing, plan labels) and `c-landing.jsx` (marketing). Do not paraphrase. Highlights:

- **Plan names:** `1 tháng` · `6 tháng` · `1 năm` (use this casing — not "Một tháng" etc.)
- **Plan sub-labels:** *Chỉ lịch · dùng thử* / *Chỉ lịch · người mới quen* / *Lịch + cả 2 luận giải*
- **Add-on names:** `Luận giải Bát tự` · `Luận giải Tiểu Vận`
- **Tab names:** **Lịch · Tra cứu · Tôi** (3 tabs, no FAB)
- **Segmented controls:** Tab 1 = `[Hôm nay | Tháng]`; Tab 2 = `[Ngày tốt cho việc | Hợp tuổi]`
- **Time anchor:** **30 giây đến trang lịch đầu tiên** (not "6 giây", not "lá số")
- **Sub status:** "Lịch của bạn dùng đến **DD.MM.YYYY**" (never "Bạn còn N lượng")
- **Hero headline:** `Lịch ngày lành` + italic `cho riêng bạn.` in `--gold-deep`

---

## 9. What NOT to do

- ❌ Don't reintroduce **lượng** / credits / micro-tx anywhere. Subscription only.
- ❌ Don't reintroduce the **FAB**. The pick wedge lives inside Tab 2.
- ❌ Don't reintroduce the **5-tab nav** or "Explore sheet". 3 tabs is final.
- ❌ Don't make the **phiếu** the default surface. It's for share/print only.
- ❌ Don't show **Phong thuỷ** or **Tiểu Vận** tools in nav (held in reserve — see Phase 9).
- ❌ Don't add a **theme toggle**. Paper default; forest is per-screen, not per-user.
- ❌ Don't ship a detail route without `<BackBar>`. If `<CBottomNav>` is hidden, BackBar is mandatory.
- ❌ Don't replace **Lora** with another serif. The Lora italic in headlines is the brand voice.
- ❌ Don't use **rounded cards with left-border accents**. The lịch-tờ IS the card.
- ❌ Don't add **gradient backgrounds**. Solid paper / solid forest only.
- ❌ Don't generate hanzi watermarks dynamically — they are picked per surface (吉 / 日 / 月 / 命 / 事).

---

## 10. Readability — designed for 30+ audience

Audience is 30+; presbyopia begins around 38–42. Enforce these floors everywhere.

### Minimum font sizes

| Role | Floor | Notes |
|---|---|---|
| Body / paragraph | **16 px** | Lora 16/1.6 minimum. 17–18 px preferred on landing. |
| List rows | **15 px** | 16 if dense. |
| Mono labels / kickers | **12 px** | Bump everywhere — 10 px is unreadable for 45+. |
| Captions | **13 px** | Floor. |
| Buttons | **15 px** body, **13 px** label | Kill 11 px CTA labels. |
| Pricing currency | **20 px** | On mobile rows. |

### Hard rules

- **Never** use `--gold` (#c5a55a) for text on paper. ~2:1 — fails everything. Use it for dividers, watermark strokes, ornament.
- **Never** use `--gold-deep` for text on forest. Use `--gold` instead.
- **Never** use cream below 60% alpha for text on forest.
- Letter-spacing on body text ≤ 0.005em.
- Line-height ≥ 1.55 on body, ≥ 1.35 on headlines.
- Underline links on paper. Colour-only differentiation isn't enough at 4.5:1.
- Touch targets ≥ 44 × 44 px. Bottom-nav cells, segmented pills, all must clear this.

---

## 11. Acceptance checklist

Before shipping each phase:

- [ ] All hex colours come from CSS vars (no hard-coded `#1d3129` etc.).
- [ ] No `Inter`, `Roboto`, `system-ui` in the rendered DOM.
- [ ] `LogoMark` (not full lockup) in nav and chrome.
- [ ] Every detail route has `<BackBar>`; every tab route has `<CBottomNav>` (3-tab).
- [ ] Headlines uppercase Barlow Condensed with `letter-spacing: -0.01em` + italic Lora accent.
- [ ] Mono kickers uppercase with `letter-spacing: 0.06em–0.22em`.
- [ ] At least one Kanji watermark per ceremonial surface, low opacity.
- [ ] Mobile sticky CTA bar on landing only — not in app shell.
- [ ] PayOS failure path renders `CPayFailure`, not a generic error.
- [ ] No body text below 16 px. No mono label below 12 px.
- [ ] `--gold` never used as text colour on paper. `--gold-deep` never used on forest.
- [ ] All interactive targets ≥ 44 × 44 px.
- [ ] Sample persona (§7) used everywhere a fake user appears.
- [ ] Bát tự route gated on yearly sub; non-yearly sees `CBaziLocked`.
- [ ] No copy mentions "lượng," "credit," "phiếu" outside of share/print contexts.

---

## 12. Questions?

Open `Direction C.html`, find the artboard, then open the matching `c-*.jsx` file for the JSX. The canvas is the spec; this doc is the map. The four strategy artboards at the top (Brief · IA · Language · Flow) are the *why*; the 40 production artboards are the *what*.
