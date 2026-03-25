# Build Plan — Ngày Lành Tháng Tốt

> Generated during `/setup`. Update only via Tech Lead if specs change.  
> **Screen inventory:** `src/make-import/` (`routes.tsx`, `screens/`, `components/`, `lib/mock-data.ts`). **`screen-specs-*-v1.md` not produced** for this run — metadata below is synthesized from Make + northstar + tech-spec.

---

## Cursor orchestration (waves → commands)

Waves are **sequential** (see Depends on). Each wave maps to one **RAD command**; do not skip gates.

| Wave | Feature id (for `/feature`) | Command |
|------|-----------------------------|---------|
| **Foundation** | `foundation` | `/foundation` |
| **W1** | `auth-profile-billing` | `/feature auth-profile-billing` |
| **W2** | `core-loop` | `/feature core-loop` |
| **W3** | `personalization` | `/feature personalization` |
| **W4** | `social-specialty` | `/feature social-specialty` |
| **Cross-cutting** | `legal-settings` | `/feature legal-settings` |

Shorthand: **`/wave w1`** … **`/wave w4`** (see `.cursor/commands/wave.md`) — aliases the same dispatch text as the `/feature` row above.

**Incremental slices:** If part of a wave already landed in `main`/`staging`, still run **`/feature <id>`** for the *remaining* Backend → Frontend → QA work; then update `artifacts/plans/project-plan.md`.

---

## Feature Dependency Graph

| Wave | Feature id | Backend scope | Frontend scope | Depends on |
|------|------------|---------------|----------------|------------|
| **Foundation** | `foundation` | DB already migrated; `gen types`; Edge scaffolds: `bat-tu`, `payos-create-checkout`, `payos-webhook` (stubs ok); `robots.txt`, `sitemap.xml`, `manifest.json`; optional `share-resolve` stub | **`app/lib/supabase.ts`**, **`app/lib/auth.tsx`**, move **`src/make-import`** UI kit → `app/components/ui`, theme CSS → `app/app.css`; **`useInstallPrompt`**; **landing `/`** from northstar §7b (replace placeholder home); auth routes **Google + email** (Make: `DangNhap`, `DangNhapEmail`, `QuenMatKhau`); fix **sonner** (`next-themes`); install **tw-animate-css** + Radix/lucide deps; remove **`tsconfig` exclude** of `make-import` after port | — |
| **W1** | `auth-profile-billing` | Confirm **`handle_new_user`** + starter credits; profile RLS; PayOS live or sandbox keys on Edge | **Welcome** (`/bat-dau`), **Cài đặt** shell; **MuaLuong** + **MuaLuongThanhCong** wired to Edge checkout; **CreditGate** reads DB `feature_credit_costs`; **`FEATURE_KEY_MAP`** in `app/lib/constants.ts` | Foundation |
| **W2** | `core-loop` | **`bat-tu`** Edge: `ngay-hom-nay`, `weekly-summary`, `lich-thang`, `convert-date`, `chon-ngay`, `chon-ngay/detail`, `day-detail`; credit deduct per tech-spec | **Home**, **ChonNgay**, **ChonNgayKetQua**, **LichDetail** — replace `mock-data` + `UserContext` with ` useAuth` + profile + invokes | W1 |
| **W3** | `personalization` | **`bat-tu`**: `tu-tru`, `tieu-van`, `profile` sync; birth lock + `la_so` json on profile | **LasoFlow**, **LasoChiTiet**, **VanThang**; **no** persisted multi-person family table (tech-spec §17) | W2 |
| **W4** | `social-specialty` | **`bat-tu`**: `hop-tuoi`, `phong-thuy`; **`share_tokens`** + **`share-resolve`** + **`share-og`**; **`push_subscriptions`** + cron Edge for seasonal | **HopTuoi**, **PhongThuy**, **ChiaSe** + ShareCardCanvas; **ThongBaoQuyen**; **CaiDat** push toggle | W3 |
| **Cross-cutting** | `legal-settings` | — | **ChinhSachBaoMat**, **DieuKhoan**, **CaiDat**, **CaiDatApp** | W1+ |

---

## Foundation — context package

### Backend

- Migrations applied: `20260325120000_*`, `20260325120100_*`.
- Run **`supabase gen types`** → `app/lib/database.types.ts` (path per team convention).
- Edge Functions (minimum viable):
  - **`bat-tu`:** POST `{ op, body }` → forward to `BAT_TU_API_URL` with `X-API-Key`; enforce auth + credits per op (tech-spec §10).
  - **`payos-create-checkout`:** validate `package_sku` ∈ `le|goi_6thang|goi_12thang`; insert `payment_orders`; return PayOS URL.
  - **`payos-webhook`:** signature + idempotency + update `profiles` / bundle.
- Secrets: `BAT_TU_*`, `PAYOS_*`, `SUPABASE_SERVICE_ROLE_KEY`, `SHARE_TOKEN_SECRET`, VAPID, optional `CRON_SECRET`.

### Frontend

- Port **shadcn-style** `src/make-import/src/app/components/ui/**` → `app/components/ui/`.
- Merge **theme** (`theme.css`, `tailwind.css`, `index.css`, `fonts.css`) into app styles; self-host fonts per RAD.
- **Landing** at `_index` route: copy from northstar §7b (headline, FAQ, CTAs, JSON-LD); match EDS visually using Make tokens.
- **Auth:** Supabase Auth UI flow; callback route; guard: session required for `/app/*` (detail in Foundation).
- **Hooks:** `useAuth`, `useProfile`, `useFeatureCosts`, `useInstallPrompt`.

### Acceptance — Foundation

- [ ] `npm run build` passes with ported UI deps and no `make-import` exclude (or deliberately staged).
- [ ] Sign up creates **`profiles`** + **starter** ledger row.
- [ ] Landing shows §7b content; `/app` (or chosen shell) shows Home with real or stubbed engine for **free** endpoints.

---

## W1 — auth-profile-billing

**Backend:** PayOS order + webhook happy path in dev sandbox.

**Frontend — Make files:** `Welcome.tsx`, `DangNhap.tsx`, `DangNhapEmail.tsx`, `QuenMatKhau.tsx`, `MuaLuong.tsx`, `MuaLuongThanhCong.tsx`, `CaiDat.tsx` (partial), `CreditGate.tsx`.

**Data:** `profiles.credits_balance`, `subscription_expires_at`, `feature_credit_costs` (no hardcoded `FEATURE_COSTS` in UI long-term).

**Copy:** Paywall strings per `copy-rules.mdc` (Paywall / Purchase Moment).

**Credits:** Map mock keys → DB (tech-spec §4).

**Acceptance:** User can sign in, see balance, open checkout URL, webhook test credits (sandbox).

---

## W2 — core-loop

**Backend:** Full **`bat-tu`** op allowlist for anonymous vs authenticated (tech-spec).

**Frontend — Make files:** `Home.tsx`, `ChonNgay.tsx`, `ChonNgayKetQua.tsx`, `LichDetail.tsx`, components under `home/`, `chon-ngay/`, `CalendarGrid`, etc.

**Dopamine (EDS §6):** **D1** result stagger on **ChonNgayKetQua** (`ResultDayCard`, `ChonNgayLoadingPanel`) — `motion/react`.

**Acceptance:** Anonymous: today + weekly + calendar overview. Logged-in: chọn ngày windows + detail with credit deduction.

---

## W3 — personalization

**Frontend — Make files:** `LasoFlow.tsx`, `LasoChiTiet.tsx`, `VanThang.tsx`, `LasoRevealSequence.tsx`.

**Dopamine:** **D2** lá số reveal sequence.

**Constraints:** Birth submit once + lock; **`tu_tru`** cost 15; **vận tháng** 3 credits when applicable.

**Acceptance:** Full lá số stored in `profiles.la_so`; VanThang uses personalized data when profile has lá số.

---

## W4 — social-specialty

**Frontend — Make files:** `HopTuoi.tsx`, `PhongThuy.tsx`, `ChiaSe.tsx`, `ShareCardCanvas.tsx`, `HopTuoiResultPanel.tsx`, `ThongBaoQuyen.tsx`.

**Backend:** `share_tokens` insert via client or Edge; public **`share-resolve`** + **`share-og`**; web push registration + cron sends (defer cron to end of W4 if needed).

**Dopamine:** **D3** hợp tuổi score (**react-countup**); **D4** share card spring (**motion**).

**Acceptance:** Share link opens preview; OG validates on Zalo debug; hop tuổi + phong thủy consume credits correctly.

---

## Copy & QA notes

- All user-facing errors → **`ErrorBanner`** + standardized JSON `error.code` from Edge (tech-spec §10).
- **Empty/loading:** `EmptyState.tsx`, skeletons from Make where present.
- **Mobile:** 375px baseline per FRONTEND.mdc.

---

## Dependency note (from Make)

Root **`package.json`** should include UI deps **actually imported** in Make (Radix primitives, `lucide-react`, `sonner`, `vaul`, `cmdk`, `date-fns`, `react-day-picker`, `react-hook-form`, `embla-carousel-react`, `recharts`, `input-otp`, `react-resizable-panels`, `class-variance-authority`, `clsx`, `tailwind-merge`, **`tw-animate-css`**). **Do not** add `@mui/*` or `@emotion/*` — not used in Make TSX.

**PayOS:** Server-side HTTP from Edge — **no** required npm `payos` package in SPA unless you add a thin client SDK later.

---

## Seed verification

`supabase/seed.sql` seeds **`app_config`** + **`feature_credit_costs`** only. **No `auth.users`** in SQL — create test users via app signup or Supabase dashboard. After signup, **`profiles`** + **`credit_ledger`** populated by trigger.
