# Direction B — screen-by-screen audit

> **Sources:** `artifacts/design/ngaylanhthangtot-vn/FE-HANDOFF.md`, `Direction B (bundled).html`, JSX references (`b-*.jsx`).  
> **App routes:** `app/routes.ts` → `app/routes/*.tsx`.  
> **Status legend:** ✅ aligned · ⚠️ gap · ❌ missing / wrong · 🔍 needs visual QA in browser

Audit started: 2026-05-11. Update this file as each batch is reviewed.

---

## Engineering note (2026-05-11)

Several authenticated routes existed as `.tsx` files and were linked from `BottomNav` / `nav-config`, but were **not registered in `app/routes.ts`**, so they would not load in the SPA. **Fixed** by adding:

`thang`, `toi`, `tra-cuu`, `so-viec`, `chuyen-lich`, `tieu-van`, `loi/khong-tim-thay-ngay`  
(`loi/khong-tim-thay-ngay` placed before static siblings that could be ambiguous.)

---

## Global checks (from FE-HANDOFF §8–§9)

| Rule | Current risk |
|------|----------------|
| Body text ≥ 16px on mobile | ⚠️ Hôm nay header subline uses **9.5px** mono; design doc §8 asks **≥12px** for mono kickers (prefer 12px floor for 30+ audience). |
| Mono kickers ≥ 12px | ⚠️ Same subline; credits chip / small labels to audit per screen. |
| No `--gold` as text on paper | ✅ Recent maket pass uses `#9a7c22` / ink for text on paper. |
| No `gold-deep` as text on forest | 🔍 spot-check forest cards. |
| `LogoMark` in app chrome (not full `Logo`) | ✅ Home header; 🔍 other tab roots. |
| BackBar on every route where BottomNav hidden | 🔍 verify each detail route (ngay, la-so chi tiết, AI reading, etc.). |
| No Inter / Roboto / bare `system-ui` for brand UI | 🔍 `grep` per phase; primitives should use theme stacks. |
| Ticket perforation visible on phiếu surfaces | 🔍 landing + pay success + share. |

---

## Screen inventory (design → app route)

| Design reference (FE-HANDOFF / canvas) | App route | Batch |
|------------------------------------------|-----------|-------|
| LandingV2 / LandingV2Mobile `b-landing-v2.jsx` | `/` `landing.tsx` | **1** |
| Auth chooser, email login, signup `b-flow-complete.jsx` | `/dang-nhap`, `/dang-nhap/email`, `/dang-ky`, `/quen-mat-khau` | **1** |
| OAuth callback | `/auth/callback` | **1** |
| Welcome / onboarding gate | `/app/bat-dau` | **1** |
| **07** HomTodayLight `b-refresh.jsx` | `/app` `app._index.tsx` | **2** |
| Tab 2 month + week `b-tabs.jsx` | `/app/thang` `app.thang.tsx` | **3** |
| Chọn ngày flow | `/app/chon-ngay`, `/app/chon-ngay/ket-qua` | **3** |
| **11** PickResultLight | `app.chon-ngay.ket-qua.tsx` | **3** |
| NO_DATES | `/app/loi/khong-tim-thay-ngay` | **3** |
| **13** Sổ việc ViecListLight | `/app/so-viec` | **3** |
| Tab 4 Tra cứu hub | `/app/tra-cuu` | **4** |
| Tab 5 Tôi | `/app/toi` | **4** |
| Mua lượng v2 | `/app/mua-luong`, `thanh-cong` | **4** |
| Lá số flow + chi tiết | `/app/la-so`, `chi-tiet` | **4** |
| Ngày / tuần / tháng detail | `/app/ngay/:ngay`, redirects | **4** |
| Hợp tuổi, Phong thủy, Tiểu vận, Chuyển lịch `b-flow3.jsx` | `/app/hop-tuoi`, `phong-thuy`, `tieu-van`, `chuyen-lich` | **5** |
| AI Reading `b-ai-reading.jsx` | (blocks in day detail / home / la-so — routes TBD in audit) | **5** |
| Habit 39–43 `b-habit.jsx` | Home ribbon + modals in `app._index.tsx`; `/app/nhip/*` | **2** |
| Share artefact | `/app/chia-se`, `/x/:token` | **6** |
| Legal / settings | `chinh-sach-bao-mat`, `dieu-khoan`, `cai-dat-app`, … | **6** |

---

## Batch 1 — Marketing & auth

### `/` Landing (`landing.tsx`)

| Check | Result |
|------|--------|
| Sections vs `b-landing-v2.jsx` | ⚠️ Structure claims parity in file header; **verify** Compare / How / Method / Pricing / Testimonials / FAQ / CTA / Footer against canvas. |
| Sticky mobile CTA | 🔍 Confirm mobile-only sticky bar per §2 Phase 2. |
| Canonical copy | ❌ **VERIFY PRODUCT:** FE-HANDOFF §6 cites **Lẻ — gói nhỏ** **49k · 30 lượng**; `PACKAGES_V2` in code uses **99.000₫ · 100 lượng** for `le` and different 6m/12m prices than doc examples (89k/749k). Align copy with **business** source of truth, then refresh design doc or code. |
| Tokens | ⚠️ Local `TOK` in `landing.tsx` vs `app/theme.css` / `maket-tokens` — consider one source to avoid drift (`#f0ece2` paper vs maket `#f1ece1`). |

### Auth surfaces (`dang-nhap`, `dang-nhap/email`, `dang-ky`, `quen-mat-khau`, `auth.callback`)

| Check | Result |
|------|--------|
| Forest vs paper | 🔍 FE Phase 10: confirm which screens are forest ceremonial vs paper. |
| BackBar / navigation | 🔍 Email flow should match `b-flow-complete` artboards 30–33. |
| Referral + prefill (signup) | 🔍 Spec in `b-flow-complete` — verify `dang-ky` behaviour. |

### `/app/bat-dau` (welcome / onboarding)

| Check | Result |
|------|--------|
| Logo vs LogoMark | 🔍 Full lockup where handoff requires it (§3 Phase 3). |
| Path to lá số | 🔍 Match flow complete welcome gate. |

---

## Batch 2 — Tab 1 · Hôm nay (`/app` `app._index.tsx`)

| Check | Result |
|------|--------|
| Canvas **07** fields | ✅ Hoàng đạo verdict, giờ tốt/xấu grid, Đại Vận strip, weekly rows, primary CTA — implemented per recent maket pass. |
| Typography vs §8 | ⚠️ **Header subline** `fontSize: 9.5` — below FE-HANDOFF minimum for mono; bump to **≥11–12px** or swap role to caption 12px. |
| Display font | ✅ Montserrat for maket display (per export); note FE-HANDOFF §2.2 still lists Barlow Condensed for `--display-2` — **design doc vs product** resolution may be needed. |
| Streak ribbon | ✅ Aligned to `b-habit` ribbon pattern; 🔍 compare Tiết khí wheel if design adds **39** artboard extras. |
| Day-7 / restart modals | ✅ Updated to shared `HM` tokens + ticket pattern. |
| Kanji watermarks | ⚠️ Verdict card Kanji removed for maket flat forest block — if §9 “at least one Kanji per ceremonial surface” applies to home, **confirm** with design intent (export vs rule). |

---

## Batch 3 — Core loop (scheduled for next passes)

### `/app/thang`

🔍 Segmented **Tháng | Tuần**; paper-default; grid/list density + chip grades vs `b-tabs` + canvas.

### `/app/chon-ngay` & `/app/chon-ngay/ket-qua`

🔍 Light-default pick flow vs **11**; loading dopamine (`ChonNgayLoadingPanel`); result cards vs `PickResultLight`.

### `/app/loi/khong-tim-thay-ngay`

🔍 Forest `ErrorNoDates` pattern from `b-flow3.jsx` canvas **29**.

### `/app/so-viec`

🔍 **13** ViecListLight — list rows on paper, ticket edges, saved-picks empty states.

---

## Batch 4+ — Tab hub, profile, billing, lookups (outline)

- **`/app/tra-cuu`:** 4-up grid + “Sổ ngày đã chọn” vs `TraCuuHub`.  
- **`/app/toi`:** Identity card, pillars, credits, settings links vs `ToiProfile`.  
- **`/app/mua-luong`:** Plan names **Lẻ — gói nhỏ** / **Tháng An Cư** / **Năm Phú Quý** + anchored math row vs `MuaLuongV2`.  
- **Lookup utilities:** BackBar dark, mono-dense aesthetic per §4.  
- **AI Reading:** Sectioned cards, pin/share, loading phases vs `b-ai-reading.jsx`.

---

## How to continue the audit

1. Open **`Direction B (bundled).html`** → locate artboard number.  
2. Open matching **`b-*.jsx`** named in FE-HANDOFF §1.  
3. Open **`app/routes/<route>.tsx`** — compare layout, tokens, copy, motion.  
4. Record PASS / GAP here; note **BLOCKING** vs **nice-to-have**.  
5. Run **readability pass** (§8) on any new screen with a 9–11px label.

---

## Changelog

| Date | Change |
|------|--------|
| 2026-05-11 | Initial inventory + batches 1–3 notes; registered missing `app/routes.ts` children; home typography / pricing discrepancies flagged. |
