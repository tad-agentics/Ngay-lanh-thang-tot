# Ngày Lành Tháng Tốt — FE Handoff

> Direction B (final). 56 artboards. Brand kit applied. Light-default app, forest dark for ceremony.

---

## 0. TL;DR for the dev

- **Review** the design in `Direction B (bundled).html` (self-contained, opens offline; share with stakeholders).
- **Implement** from the JSX source modules listed below — *not* from the bundled HTML.
- Existing tokens in `app/theme.css` stay. Fonts stay (Lora / Barlow Condensed / IBM Plex Mono / Noto Serif SC). The phiếu / almanac metaphor is the visual system — don't replace it with generic cards.
- Ship v2 as **default**. Do not feature-flag v1 vs v2.

---

## 1. Files in this project

```
Direction B.html                  ← canvas entry (open in browser to review)
Direction B (bundled).html        ← single-file bundle, share with stakeholders
FE-HANDOFF.md                     ← this file

b-shared.jsx          Tokens, Logo, LogoMark, Ticket, Stamp, Kanji, Mono,
                      Phone, StatusBar, HomeIndicator, BackBar (shared chrome)
b-screens.jsx         App shell — Splash, Onboarding, Hôm nay, Pick flow,
                      Lá số, Sổ việc, Settings, Share
b-refresh.jsx         Light-default re-skin — HomTodayLight, PickResultLight,
                      MuaLuongV2 (the "Mua lượng" production screen)
b-tabs.jsx            5-tab nav system — BottomNav, TraCuuHub (Tab 4),
                      ToiProfile (Tab 5), TabsNotes
b-flow2.jsx           Auth chooser, OAuth callback, payment success
b-flow3.jsx           API-only secondary surfaces — Hợp tuổi (input + result),
                      Phong thuỷ (la bàn + phi tinh), Tiểu Vận, Chuyển lịch,
                      Hồ sơ gia đình (multi-profile manager), NO_DATES error
b-flow-complete.jsx   Auth + day/week/month detail screens
b-ai-reading.jsx      LLM Luận Giải — 4-phase loading, typed reveal,
                      sectioned cards, locked / retry / pin / share, lá số chi tiết
b-habit.jsx           Daily-return engine — Tiết khí wheel, streak ribbon,
                      day-7 celebration, broken-streak restart, notif cadence,
                      30-day history grid
b-cleanup.jsx         Trust / cleanup before · after diffs (6 fixes)
b-landing-v2.jsx      Landing — desktop (1440) + mobile (390)
b-app.jsx             Canvas assembly — which artboard goes in which row

surfaces2.jsx · surfaces3.jsx   Early single-screen explorations still
                                referenced by the canvas. Don't port —
                                superseded by b-refresh / b-tabs.

assets/logo-mark.svg
assets/logo-mark-reversed.svg
```

The `.jsx` files use React 18 + Babel-standalone in the browser for the canvas. **Port the markup into real components** in the React Router app — don't copy these files in as-is.

---

## 2. Design system — what to lift verbatim

### 2.1 Tokens (`b-shared.jsx` → `TOK`)

Already aligned with `app/theme.css`. Confirm these CSS vars exist:

| Token | Value | Use |
|---|---|---|
| `--paper` | `#f0ece2` | App default surface |
| `--paper-warm` | `#ebe4d2` | Section breaks, ticket fill |
| `--cream` | `#ede7d3` | Forest-mode text |
| `--ink` | `#1a1a1a` | Body text on paper |
| `--ink-2` | `#3a3a3a` | Secondary text |
| `--muted` | `#6a5f3f` | Mono labels (5.36:1 on paper · AA pass) |
| `--forest` | `#1d3129` | Ceremony surface |
| `--forest-deep` | `#15241e` | Forest accents |
| `--gold` | `#c5a55a` | Accent on forest only — never text on paper |
| `--gold-deep` | `#7d6219` | Accent text on paper (4.90:1 · AA pass) |
| `--border` | `rgba(122,112,80,0.18)` | Hairlines on paper |
| `--border-strong` | `rgba(26,26,26,0.45)` | CTA borders |

### 2.2 Type stack

```css
--display: 'Noto Serif SC', serif;       /* Hanzi watermarks only */
--display-2: 'Barlow Condensed', sans;   /* Headlines, kickers, labels */
--serif: 'Lora', serif;                  /* Body, testimonials */
--mono: 'IBM Plex Mono', mono;           /* Tags, mono-labels, dates */
--hanzi: 'Noto Serif SC', serif;         /* 命 事 吉 一 二 三 etc */
```

Display-2 is **always uppercase** with `letter-spacing: -0.01em` to `-0.02em` for headlines, `0.08em` to `0.18em` for kickers/labels.

### 2.3 Primitives to port

Build these as real components first — every screen uses them:

| Component | Props | Notes |
|---|---|---|
| `<Logo size dark showUrl />` | size in px | Full lockup. Splash, landing, share, footer only. |
| `<LogoMark size dark />` | size in px | Mark only. **Use this in app chrome** — BottomNav, status pills, share watermark. |
| `<Ticket variant=classic\|sharp\|wave>` | perforation style | Ticket/phiếu shell with serrated edge + dashed dotted line. |
| `<Stamp value /100>` | score | Forest disc with gold ring + score number. |
| `<Kanji ch size drift>` | hanzi character | Decorative watermark, low-opacity, rotating |
| `<Mono>` | text | Uppercase Plex Mono kicker style |
| `<BackBar title subtitle dark onBack onClose>` | — | **Top-aligned chevron + title for every detail screen** (anywhere BottomNav is hidden). Light + dark variants. Use this everywhere — never hand-roll a back row. |
| `<BottomNav active>` | tab id | 5-tab nav: `home / month / add / lookup / me`. The centre `add` slot is a FAB above the row. |

---

## 3. Implementation roadmap

Ship in this order. Each phase is independently deployable.

### Phase 1 — Tokens + primitives (½ day)
- Confirm `app/theme.css` has all `--*` vars from §2.1.
- Create `app/components/brand/` and port `Logo`, `LogoMark`, `Ticket`, `Stamp`, `Kanji`, `Mono`, **`BackBar`**, **`BottomNav`**.
- Replace any hard-coded brand SVG with these.

### Phase 2 — Landing v2 (1–2 days)
- Source: `b-landing-v2.jsx` (`LandingV2` for ≥1024px, `LandingV2Mobile` for <1024px).
- Target: `app/routes/landing.tsx`.
- Sections: Hero · 3-up Compare · How it works (3 steps) · Method (92/100 breakdown) · Pricing · Testimonials · FAQ · Final CTA · Footer.
- Mobile gets sticky bottom CTA bar; desktop does not.

### Phase 3 — Logo discipline + back-nav primitive (¼ day)
- BottomNav, status pills, share watermark, header chrome → `<LogoMark>`.
- Splash, onboarding-3, share artefact, landing nav, footer, payment success → `<Logo>` (full lockup).
- Every detail route (anywhere `<BottomNav>` is hidden) gets `<BackBar>` at the top. No exceptions.

### Phase 4 — Mua lượng v2 (1 day)
- Source: `b-refresh.jsx` → `MuaLuongV2`.
- Target: `app/routes/app.mua-luong.tsx`.
- Three plans: **Lẻ — gói nhỏ** (49k · 30 lượng · một lần), **Tháng An Cư** (89k/tháng · 100 lượng · "PHỔ BIẾN"), **Năm Phú Quý** (749k/năm · 1500 lượng · "−30%").
- Anchored math row: "10 lượng = ~5 phiếu chọn ngày = ~1 lá số."
- PayOS failure → recovery state with retry + alternate method.

### Phase 5 — Light-default flip (1–2 days)
Three screens flip from forest-default → paper-default:
- `app/routes/app.home.tsx` — Hôm nay (canvas **07**, source `b-refresh.jsx` → `HomTodayLight`)
- `app/routes/app.chon-ngay.ket-qua.tsx` — Pick result (canvas **11**, source `b-refresh.jsx` → `PickResultLight`)
- `app/routes/app.so-viec.tsx` — Sổ việc (canvas **13**, source `b-screens.jsx` → `ViecListLight`)

Forest-on-cream becomes accent, not chrome. Score chip + Kanji watermark + ticket header keep forest-gold treatment. List rows + cards on paper.

> **API field coverage:** the production light **07** and **11** already carry every API field from spec — Hoàng Đạo verdict pill, 6 hoàng-đạo hours + giờ xấu strip, Đại Vận strip, Grade A + layer3 score breakdown. The earlier dark "API reference" screens (20 / 21) have been retired from the canvas; their data shapes were ported into 07 / 11 directly. See the `Merge notes` card at the top of section 2b.

### Phase 6 — API-only surfaces (1–2 days)
Net-new screens with no Row 2 counterpart. All in `b-flow3.jsx`:
- **Hợp tuổi** input + result (`HopTuoiInput`, `HopTuoiResult`) — canvas **22 / 23**
- **Phong thuỷ** la bàn + Cửu Cung phi tinh (`PhongThuy`) — canvas **24**
- **Tiểu Vận** vận tháng widget (`TieuVan`) — canvas **25**
- **Chuyển âm ↔ dương** utility (`ConvertLich`) — canvas **26**
- **Hồ sơ gia đình** multi-profile manager (`ProfilesList`) — canvas in section 5
- **NO_DATES_FOUND** error state (`ErrorNoDates`) — canvas **29**

All seven use the shared `<BackBar dark>` (no BottomNav).

### Phase 7 — 5-tab nav refresh (1 day)
Source: `b-tabs.jsx`.
- `BottomNav` — 5 cells `home / month / add / lookup / me` with the FAB occupying the centre slot above the row.
- **Tab 4 = Tra cứu** (`TraCuuHub`): grid of 4 lookup tools (Hợp tuổi, Phong thuỷ, Hợp giờ, Tiểu Vận) on top, "Sổ ngày đã chọn" list below.
- **Tab 5 = Tôi** (`ToiProfile`): identity card with 4-trụ pillars, ví lượng + Mua thêm CTA + activity log, settings list.
- **Explore sheet retired.** Every Explore destination has been folded into a tab — Hôm nay → tab 1, Lịch → tab 2 (+ Tuần segmented control), Chọn ngày → FAB, Hợp tuổi/Phong thuỷ/Tiểu Vận → tab 4, Mua lượng + Cài đặt → tab 5. Do not reintroduce the sheet.

### Phase 8 — AI Reading (LLM Luận Giải) (1–2 days)
Source: `b-ai-reading.jsx`. Seven artboards in canvas section 2c:
- AR-01 4-phase loading · AR-02 typed reveal · AR-03 sectioned card with citations · AR-04 locked-state + bulk unlock · AR-05 section retry + depth badges · AR-06 pin + share-just-reading · AR-07 Lá số chi tiết (5 mục).
- All use `<BackBar dark>`.
- Animations: typed reveal uses `useEffect` + interval for cursor; loading phases progress through a segmented bar.

### Phase 9 — Habit loop (½–1 day)
Source: `b-habit.jsx`. Five artboards in canvas section 2e:
- **39 · Hôm nay** with Tiết khí wheel + streak ribbon (replaces the streak-flame).
- **40 · Đủ 7 ngày** celebration screen (giant "7" + day-row checkmarks).
- **41 · Liền ngắt** gentle restart (broken streak — never blames user).
- **42 · 3 nhịp** notification cadence (AM / mid / PM with `AM/★/TUẦN` icons).
- **43 · Lịch sử 30 ngày** grid.
- All non-home screens use `<BackBar dark>`.

### Phase 10 — Auth + day/week/month detail (1 day)
Source: `b-flow-complete.jsx`. Eight artboards in canvas section 2d (canvas **30–38**):
- Login chooser, login email, signup with prefill + referral, welcome gate, day detail (`/ngay/:ngay`), week list, month full re-skin, payment success, OAuth callback.

### Phase 11 — Trust cleanup (½ day)
Source: `b-cleanup.jsx`. Six before · after diffs in canvas section 2f (canvas **44–48**). Apply each fix to the corresponding live route.

---

## 4. Where forest-dark stays

Don't flip these to paper. Forest is the *ceremonial* surface:

- App splash + onboarding step 3 (lá số reveal)
- Share artefact (`/chia-se/:id`)
- Lá số centrefold (`/app/la-so` — main reveal block, not chrome)
- Payment success
- All AI Reading screens (LLM Luận Giải is ceremonial by intent)
- All Habit-loop detail screens (streak rituals)
- All Hợp tuổi / Phong thuỷ / Tiểu Vận / Chuyển lịch (lookup utilities — Mono-dense, dark-paper aesthetic)
- Landing — How it works section · Testimonials section · Final CTA · Footer

---

## 5. Sample data — canonical persona

Use the same fictional user across every demo / screenshot / Storybook entry so QA can spot inconsistencies:

```
Họ tên:        Nguyễn Thị Minh
Giới tính:     Nữ
Sinh:          20 / 05 / 1990 · giờ Mão (5–7h)
Nhật chủ:      Quý Thuỷ
Nạp âm:        Trường Lưu Thuỷ
Đại Vận:       Giáp Dần · Mộc · 32 → 41 tuổi
Hôm nay (mock): Thứ Hai · 11/05/2026 · ngày Bính Tuất
```

`Hồ sơ gia đình` (Tab 5 → multi-profile manager) demos the same Minh as the `Tôi` row, plus `Chồng — Trần Văn Hùng (20/08/1980)` and `Con trai — Trần Quang Anh (11/11/2012)`.

---

## 6. Copy — source of truth

The product names, plan labels, and microcopy in `b-landing-v2.jsx` and `b-refresh.jsx` are the **canonical Vietnamese strings**. Do not paraphrase. Highlights:

- Plan names: **Lẻ — gói nhỏ** · **Tháng An Cư** · **Năm Phú Quý**
- Action tags: **Mở quẻ** (open) · **Dựng lá số** (build chart) · **Chọn việc** (pick) · **Nhận phiếu** (receive)
- Time anchor: **30 giây đến phiếu đầu tiên** (not "6 giây")
- Free gift: **20 lượng tặng · không cần thẻ**
- Tab names: **Hôm nay · Tháng · (FAB) · Tra cứu · Tôi**
- Testimonial format: name · city · event tag (e.g. "Chị Hằng · Đà Nẵng · Khai trương cửa hàng")

---

## 7. What NOT to do

- ❌ Don't add a theme toggle. Light is default; forest is per-screen, not per-user.
- ❌ Don't keep both v1 and v2 behind a flag. Retire v1.
- ❌ Don't reintroduce the Explore sheet. Every destination has a tab home.
- ❌ Don't ship a detail route without `<BackBar>`. If `<BottomNav>` is hidden, `<BackBar>` is mandatory.
- ❌ Don't generate hanzi watermarks dynamically — they are decorative, picked per surface (吉 / 日 / 月 / 命 / 事 / 一 二 三).
- ❌ Don't replace `Lora` with another serif. The Lora italic in headlines is the brand voice.
- ❌ Don't use rounded cards with left-border accents anywhere. The ticket / phiếu IS the card.
- ❌ Don't add gradient backgrounds. Solid paper / solid forest only.

---

## 8. Readability — designed for 30+ audience

The audience is 30 and up. Presbyopia begins around 38–42 and reading comfort declines well before that. Enforce these floors everywhere.

### Minimum font sizes (mobile + desktop)

| Role | Floor | Notes |
|---|---|---|
| Body / paragraph | **16 px** | Lora 16/1.6 minimum. 17–18 px preferred on landing. |
| List items / row text | **15 px** | Bumps to 16 if dense. |
| Mono labels / kickers | **12 px** | Was 9–11 in the canvas. Bump everywhere — labels at 10 px are unreadable for 45+. |
| Captions / footnotes | **13 px** | Avoid below this. |
| Buttons / CTAs | **15 px** body, **13 px** label | Kill 11 px CTA labels. |
| Pricing currency | **20 px** | Was 16 in mobile rows. |

### Hard rules

- **Never use `--gold` (#c5a55a) for text on paper.** It only hits 2:1 — fails everything. It's for dividers, watermark strokes, ticket-edge ornament.
- **Never use `--gold-deep` for text on forest.** Use `--gold` instead.
- **Never use `cream` below 60% alpha for text on forest.** 50% drops to 3.97:1.
- **Letter-spacing on body text ≤ 0.005em.** Tight tracking on Lora at 16 px hurts older eyes.
- **Line-height ≥ 1.55 on body**, ≥ 1.35 on headlines.
- **Underline links on paper.** Color-only differentiation isn't enough at 4.5:1.
- **Touch targets ≥ 44 × 44 px** (iOS HIG). Bottom-nav cells, FAB, tab segments — all must clear this.

---

## 9. Acceptance checklist

Before shipping each phase, verify:

- [ ] All hex colors come from CSS vars (no hard-coded `#1d3129` etc.).
- [ ] No `Inter`, `Roboto`, `system-ui` in the rendered DOM.
- [ ] `LogoMark` (not full lockup) in BottomNav.
- [ ] **Every detail route has `<BackBar>`**; every tab route has `<BottomNav>`.
- [ ] Headlines uppercase with `letter-spacing: -0.01em`.
- [ ] Mono kickers uppercase with `letter-spacing: 0.08em–0.18em`.
- [ ] At least one Kanji watermark per ceremonial surface, low opacity.
- [ ] Ticket perforation visible (dashed line + corner punches) on every phiếu.
- [ ] Mobile CTA bar sticky on landing only, not in app shell.
- [ ] PayOS failure path shows recovery state, not generic error.
- [ ] **No body text below 16 px. No mono label below 12 px.**
- [ ] **`--gold` never used as text color on paper.**
- [ ] **`--gold-deep` never used as text color on forest.**
- [ ] All link/CTA text passes contrast in **both** default and hover states.
- [ ] All interactive targets ≥ 44 × 44 px.
- [ ] Sample-data persona (§5) used everywhere a fake user appears.

---

## 10. Questions?

Open `Direction B.html`, find the artboard, then open the matching `.jsx` file for the actual JSX. The canvas is the spec; this doc is the map.
