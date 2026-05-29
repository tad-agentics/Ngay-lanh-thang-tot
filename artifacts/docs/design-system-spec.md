# Design System — Ngày Lành Tháng Tốt (Direction C)

**Version:** 2.0 (Direction C pivot)  
**Last updated:** 2026-05-27  
**Canonical visual spec:** `artifacts/design/ngaylanhthangtot-vn/Design System.html`  
**FE handoff:** `artifacts/design/ngaylanhthangtot-vn/FE-HANDOFF.md`  
**Retired:** Direction B → `artifacts/design/ngaylanhthangtot-vn/retired-direction-b/`

---

## Product metaphor

Direction C centers the **lịch-tờ** (tear-off calendar page), not the phiếu. Users **open their calendar** daily; subscription replaces lượng/credits in UI copy and gating.

---

## Color tokens (`app/theme.css`)

| Token | Value | Use |
|---|---|---|
| `--paper` | `#f0ece2` | App default surface |
| `--paper-warm` | `#ede7d3` | Section breaks, lịch-tờ fill |
| `--cream` | `#ede7d3` | Forest-mode text |
| `--ink` | `#18150e` | Body text on paper |
| `--ink-2` | `#3a3220` | Secondary text |
| `--muted` | `#7a7050` | Mono labels (AA on paper) |
| `--forest` | `#1d3129` | Ceremony surface |
| `--forest-deep` | `#0e1c14` | Forest accents |
| `--gold` | `#c5a55a` | Accent on forest only — **never text on paper** |
| `--gold-deep` | `#9a7c22` | Accent text on paper |
| `--red` | `#a3201f` | Day number on lịch-tờ only + danger |
| `--green` / `--green-mute` | `#5e7d5e` / `#7a9a80` | Score dots |
| `--border` | `rgba(154,124,34,0.18)` | Hairlines |

---

## Typography

| Role | Font | Notes |
|---|---|---|
| Display / headlines | Barlow Condensed 800 | UPPERCASE, `letter-spacing: -0.01em`, tabular-nums for numbers |
| Body | Lora 400–700 | 16px floor; italic accent in `--gold-deep` |
| Kickers / labels | IBM Plex Mono 600 | 12px floor, uppercase, `letter-spacing: 0.06–0.22em` |
| Hanzi watermarks | Noto Serif SC | Decorative only — 吉 / 日 / 月 / 命 / 事 |

Headline pattern: UPPERCASE Barlow + italic Lora phrase in gold-deep (e.g. `Lịch ngày lành` + *cho riêng bạn.*).

---

## Brand primitives (`app/components/brand/`)

Port from `artifacts/design/ngaylanhthangtot-vn/b-shared.jsx` + `c-screens-a.jsx`:

| Component | Source | Notes |
|---|---|---|
| `Logo`, `LogoMark` | `b-shared.jsx` | Mark in app chrome; full lockup splash/landing only |
| `BackBar` | `b-shared.jsx` | Mandatory on every detail route |
| `Mono`, `Kanji` | `b-shared.jsx` | Kickers, watermarks |
| `Ticket` | `b-shared.jsx` | **Share/print only** — not default result surface |
| `CBottomNav` | `c-screens-a.jsx` | **3 tabs:** Lịch · Tra cứu · Tôi |
| `CSegmented` | `c-screens-a.jsx` | Tab 1: Hôm nay \| Tháng; Tab 2: Ngày tốt \| Hợp tuổi |
| `CTopStrip` | `c-screens-a.jsx` | Quiet identity strip |

---

## Surface rules

| Surface | Screens |
|---|---|
| **Forest** (ceremonial) | Splash, auth band, first-run (giờ sinh → lịch đã mở), Hôm nay (#12), offline home |
| **Paper** (default) | Month grid, day detail, search, hợp tuổi, AI, lá số, tôi, pricing, payment |

No theme toggle. No gradients. No rounded cards with left-border accents — the lịch-tờ IS the card.

---

## shadcn/ui (`app/components/ui/`)

Minimal Radix subset only — do not add new shadcn components without a live import site:

| File | Use |
|---|---|
| `button.tsx` | Auth layout fallback CTA |
| `select.tsx` | Hợp tuổi + profile edit pickers |
| `collapsible.tsx` | Methodology accordions |
| `skeleton.tsx` | Lịch recompute loading |
| `sonner.tsx` | Global toast host (`root.tsx`) |
| `utils.ts` | `cn()` helper for above |

Direction C screens compose brand primitives + this list — do not replace lịch-tờ patterns with generic Card/Dialog components.

---

## Readability (30+ audience)

- Body ≥ 16px; mono labels ≥ 12px; touch targets ≥ 44×44px
- Never `--gold` as text on paper; never `--gold-deep` on forest
- Underline links on paper surfaces

---

## Canvas source modules

| Band | JSX |
|---|---|
| Tab 1 + chrome | `c-screens-a.jsx` |
| Tab 2 + Tab 3 entry + pricing | `c-screens-b.jsx` |
| Auth + first-run | `c-screens-c.jsx`, `c-screens-f.jsx` |
| Day detail + share | `c-screens-d.jsx` |
| Payment confirm/success | `c-screens-e.jsx` |
| Tools + profile edit | `c-screens-g.jsx` |
| AI + lá số | `c-screens-h.jsx` |
| Edge states + settings | `c-screens-i.jsx` |
| Landing | `c-landing.jsx` |

Open `Direction C.html` in browser to review all 40 artboards + 4 strategy boards.
