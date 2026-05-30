# Admin dashboard — context handoff (Ngày Lành Tháng Tốt / ngaylanhthangtot.vn)

Handoff từ **repo app user** (`Ngay-lanh-thang-tot`) sang **repo admin riêng** (UI + routing admin). Hai repo dùng **cùng một Supabase project** (staging/prod).

| Repo | Trách nhiệm | Không làm ở đây |
|------|-------------|-----------------|
| **`Ngay-lanh-thang-tot`** (repo này) | Edge `admin-*`, migrations/RLS liên quan, `PACKAGES`, webhook PayOS, tài liệu API | Màn admin, layout CS, chart UI |
| **Repo admin** (riêng) | Login Supabase, gọi EF với JWT, toàn bộ UI P0–P1 | Service role trên client; copy business logic entitlement (gọi EF PATCH) |

**Stack app user:** React Router v7 · Supabase · PayOS · Vercel · DeepSeek (luận giải)  
**Monetization (Direction C):** **Gói lịch** (`subscription_expires_at`) + **add-on luận** — **không còn lượng trong UX/runtime** (2026-05).

Chi tiết pivot: `artifacts/plans/direction-c-pivot-plan.md` · credits retire: `artifacts/issues/credits-retire-housekeeping.md`

**Northstar gốc:** admin UI không nằm trong app PWA (`artifacts/docs/northstar-ngay-lanh.html`). Repo admin là sản phẩm nội bộ tách biệt; repo này chỉ ship **contract HTTP** (Edge Functions) mà admin repo consume.

---

## 1. Sản phẩm (admin cần biết)

| Khía cạnh | Mô tả |
|-----------|--------|
| Core | PWA **lịch ngày lành** cá nhân hóa Bát Tự (`profiles.la_so`, ngày/giờ sinh). |
| Monetization | **PayOS** one-shot: gói 3/6/12 tháng lịch + mua lẻ Luận Bát tự / Tiểu vận. **Không auto-renew.** |
| Gating | `subscription_expires_at` → lịch + luận ngày (sub active). `bazi_reading_unlocked_at` / `tieu_van_reading_expires_at` → luận add-on hoặc gói năm. |
| Credits / lượng | **Retired runtime.** Cột `credits_balance` + `credit_ledger` giữ cho audit; user mới = 0; không trừ lượng trên Edge. |

### Ai dùng admin?

| Vai trò | Nhu cầu chính |
|---------|----------------|
| **CS / hỗ trợ** | Tra user theo email, xem sub/luận, đơn PayOS, sửa entitlement khi thanh toán lỗi webhook |
| **Growth / ops** | KPI doanh thu, banner site, coupon, % referral checkout |
| **Kỹ thuật** | Debug webhook, lá số `la_so_recompute_status`, reading cache |

---

## 2. Cần xây những gì (scope)

### 2.1 Hiện trạng backend (repo `Ngay-lanh-thang-tot`)

| Thành phần | Trạng thái | Ghi chú |
|------------|------------|---------|
| `admin-dashboard-stats` | **Có** (Direction C v2) | KPI + chart 12 tháng; deploy `23825d3+` |
| `admin-site-banner` | **Có** | GET/PUT `app_config.site_banner` |
| `admin-users` / search | **Chưa** | CS phải vào Supabase Table Editor |
| `admin-user-entitlements` PATCH | **Chưa** | Gia hạn sub / mở luận thủ công |
| `admin-orders` | **Chưa** | Lọc `payment_orders` theo status/SKU/email |
| `admin-coupons` | **Chưa** | Bảng `discount_coupons` chỉ service_role ghi |
| `admin-config` | **Chưa** | `birth_edit_max_per_30d`, `checkout_referral_discount_percent` |
| Auth admin | **Có** | `ADMIN_EMAILS` + JWT user; pattern lặp ở 2 EF |

### 2.2 Ưu tiên module (MoSCoW)

Cột **Backend** = implement trong **repo này** (Edge). Cột **UI** = implement trong **repo admin riêng**.

#### Must have (P0) — vận hành hàng ngày

| # | Module | Mô tả | Backend (repo app) | UI (repo admin) |
|---|--------|--------|--------------------|-----------------|
| 1 | **Đăng nhập** | Supabase Auth — chỉ email ∈ `ADMIN_EMAILS` gọi được EF | Secret `ADMIN_EMAILS` | Login + guard 403 |
| 2 | **Dashboard** | Doanh thu 3 bucket + KPI sub/luận + MoM | `admin-dashboard-stats` ✅ | Chart stacked + cards |
| 3 | **Tìm user** | Search email / `user_id` / `referral_code` | `admin-users` GET `?q=` | Bảng kết quả → detail |
| 4 | **User detail** | Profile + entitlements + computed flags | `admin-users` GET `/:id` | Form read + PATCH entitlements |
| 5 | **Sửa entitlement** | Gia hạn lịch, mở/đóng luận BT & TV | `admin-user-entitlements` PATCH | Date pickers + audit note |

**Quy tắc ghi entitlement (phải khớp webhook):**

- Sub: `extendSubscriptionMonths(current, months)` — `supabase/functions/_shared/entitlements.ts`
- Luận BT: set `bazi_reading_unlocked_at = now()` (vĩnh viễn)
- Luận TV: `tieu_van_reading_expires_at` = max(now, current) + N năm (`applyYearlyBundleLuận` / webhook logic)
- **Không** tự ý sửa `la_so` / ngày sinh từ admin (user flow + `birth_edit_*`); chỉ đọc + `la_so_recompute_status`

#### Should have (P1) — đối soát & marketing

| # | Module | Mô tả | Backend | UI |
|---|--------|--------|---------|-----|
| 6 | **Đơn hàng** | Danh sách `payment_orders` + filter | `admin-orders` GET | Table + link user |
| 7 | **Banner** | Sticky banner toàn site | `admin-site-banner` ✅ | Form enabled/message/href |
| 8 | **Coupon** | CRUD `discount_coupons` | `admin-coupons` | List + create/deactivate |
| 9 | **Referral** | Xem `referred_by`, `referral_reward_events` trên user | Gộp trong `admin-users` detail | Tab referral |

#### Could have (P2) — sau khi P0 ổn

| # | Module | Ghi chú |
|---|--------|---------|
| 10 | **App config** | Sửa `checkout_referral_discount_percent`, `birth_edit_max_per_30d` |
| 11 | **Webhook log** | Đọc `webhook_events` theo `provider_order_code` |
| 12 | **Reading cache** | Xóa/xem `reading_cache` khi luận lỗi |
| 13 | **Xóa user** | `auth.admin.deleteUser` — confirm 2 bước |
| 14 | **Legacy credits** | Chỉ user cũ: điều chỉnh `credits_balance` + ledger `admin_adjustment` |
| 15 | **Báo cáo funnel** | Onboarding completion, conversion free→paid — query riêng |

#### Won't have (v1 admin)

- Sửa giá gói runtime (vẫn deploy `PACKAGES` / `UI_PACKAGES`)
- Chat/generative admin
- Multi-tenant / role RBAC (chỉ flat allowlist email)
- PayOS refund từ admin (làm trên PayOS Portal)
- Push notification campaign editor (Web Push đã retire)

### 2.3 API đề xuất (chưa implement — spec cho implementer)

**Chung mọi `admin-*` EF:**

```
Authorization: Bearer <supabase_access_token>
→ verify email ∈ ADMIN_EMAILS (lowercase)
→ service_role client cho DB
CORS: giống admin-dashboard-stats / admin-site-banner
```

#### `admin-users`

| Method | Path | Query/body | Response |
|--------|------|------------|----------|
| GET | `/functions/v1/admin-users` | `q` (email substring, uuid, referral code), `limit` (default 20) | `{ users: [{ id, email, subscription_expires_at, …, flags }] }` |
| GET | `/functions/v1/admin-users/:id` | — | Profile + last 10 `payment_orders` + `referral_reward_events` (as referrer) + `credit_ledger` (optional, legacy) |

**`flags` computed (server):** `subscriptionActive`, `canUseBaziReading`, `canUseTieuVanReading`, `isNeverSubscribed` — dùng `_shared/entitlements.ts`.

#### `admin-user-entitlements`

| Method | Body | Validation |
|--------|------|------------|
| PATCH | `{ userId, subscriptionExpiresAt?, baziReadingUnlock?: boolean, tieuVanExpiresAt?, adminNote }` | ISO dates; ghi `credit_ledger` hoặc bảng `admin_audit_log` (nếu thêm migration) |

#### `admin-orders`

| Method | Query |
|--------|-------|
| GET | `status`, `package_sku`, `user_id`, `from`, `to`, `limit`, `offset` |

Trả về: `id`, `user_id`, `email` (join), `package_sku`, `status`, `list_amount_vnd`, `amount_vnd`, `coupon_code`, `checkout_referral_code`, `provider_order_code`, `created_at`, `paid_at` (nếu có).

#### `admin-coupons` (P1)

CRUD trên `discount_coupons` — mirror validation migration `20260531150000_checkout_discounts.sql`.

#### `admin-site-banner` (đã có)

```
GET  → { enabled, message, href }
PUT  → body { enabled, message, href }  (message ≤ 600 chars; href relative hoặc https)
```

### 2.4 Màn hình UI (chỉ repo admin — không thêm route vào `app/`)

Route gợi ý cho **repo admin**:

```
/login
/dashboard          → GET admin-dashboard-stats
/users              → admin-users search
/users/:id          → detail + PATCH admin-user-entitlements
/orders             → admin-orders (P1)
/marketing/banner   → admin-site-banner
/marketing/coupons  → admin-coupons (P1)
```

**Tích hợp repo admin:**

1. `createClient(VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY)` + `signInWithPassword` / OAuth (cùng Auth project).
2. Mọi gọi admin: `supabase.functions.invoke('admin-dashboard-stats', { headers: { Authorization: \`Bearer ${session.access_token}\` } })` hoặc `fetch(\`${SUPABASE_URL}/functions/v1/admin-dashboard-stats\`, …)`.
3. Base URL functions: `https://<project-ref>.supabase.co/functions/v1/<name>`.
4. CORS: nếu admin host khác domain app user, thêm origin admin vào `supabase/functions/_shared/allowed-origin.ts` (hoặc pattern dev) rồi deploy EF.

**Env repo admin (ví dụ):** chỉ `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY`. **Không** `SERVICE_ROLE_KEY` trên client.

### 2.5 Tạm thời không có admin UI (Supabase / PayOS)

| Việc | Công cụ |
|------|---------|
| Xem/sửa 1 profile | Supabase → Table Editor → `profiles` |
| Đơn thanh toán | Table `payment_orders` + filter `status` |
| Webhook PayOS | PayOS Portal + table `webhook_events` |
| Coupon | SQL hoặc insert `discount_coupons` (service role) |
| Banner | Gọi `admin-site-banner` qua curl/Postman hoặc seed |
| KPI nhanh | Gọi `admin-dashboard-stats` hoặc SQL aggregate trên `payment_orders` |
| Xóa auth user | Supabase Auth → Users |

### 2.6 Bảo mật & audit

- [ ] `ADMIN_EMAILS` chỉ email công ty; rotate khi offboard
- [ ] Mọi PATCH entitlement ghi **ai + khi + lý do** (migration `admin_audit_log` khuyến nghị)
- [ ] Không log JWT / raw webhook chứa PII ra client console
- [ ] CORS: chỉ origin admin app (staging/prod)
- [ ] Rate limit (Supabase platform) — tránh scrape user list

### 2.7 Env admin app

| Biến | Bắt buộc |
|------|----------|
| `VITE_SUPABASE_URL` | Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Anon key |
| (optional) `VITE_ADMIN_APP_URL` | Redirect OAuth |

Edge secrets (project): `ADMIN_EMAILS` — **bắt buộc** trước khi test EF.

---

## 3. Repo & đường dẫn quan trọng

| Khu vực | Đường dẫn |
|--------|-----------|
| App user | `app/` |
| Migrations | `supabase/migrations/` |
| Edge Functions | `supabase/functions/` |
| PayOS catalog (server) | `supabase/functions/_shared/payos.ts` → `PACKAGES` |
| UI gói + giá hiển thị | `app/lib/packages.ts` → `UI_PACKAGES` |
| Entitlements (FE) | `app/lib/entitlements.ts` |
| Entitlements (Edge) | `supabase/functions/_shared/entitlements.ts` |
| Types | `app/lib/database.types.ts`, `app/lib/api-types.ts` |
| Referral | `referral_reward_events`, `grant_referral_subscription_reward`, `checkout_referral_discount_percent` |
| Shared admin auth (nên tách) | Hiện copy trong từng `admin-*/index.ts` — refactor → `_shared/admin-auth.ts` |

**Giá gói:** vẫn hardcode `PACKAGES` + `UI_PACKAGES` — đổi giá = deploy code (hoặc tương lai: bảng `commerce_packages`).

---

## 4. Edge Functions admin (repo này)

| Function | Auth | Mục đích | Priority |
|----------|------|----------|----------|
| `admin-dashboard-stats` | JWT + `ADMIN_EMAILS` | KPI + doanh thu 12 tháng | P0 ✅ |
| `admin-site-banner` | Cùng pattern | GET/PUT `app_config.site_banner` | P1 ✅ |
| `admin-users` | Cùng pattern | Search + user detail | P0 ❌ |
| `admin-user-entitlements` | Cùng pattern | PATCH sub/luận | P0 ❌ |
| `admin-orders` | Cùng pattern | List orders | P1 ❌ |
| `admin-coupons` | Cùng pattern | CRUD coupons | P1 ❌ |

Deploy secret:

```bash
npx supabase secrets set ADMIN_EMAILS=you@company.com,other@company.com --project-ref hptovpbiwvtngorhdhhm
```

**Không** expose `SUPABASE_SERVICE_ROLE_KEY` trên browser admin.

---

## 5. `admin-dashboard-stats` response (v2 — Direction C)

`GET` hoặc `POST` với `Authorization: Bearer <user_jwt>`.

### `totals`

| Field | Ý nghĩa |
|-------|---------|
| `totalRevenueVnd` | Tổng đơn `paid` |
| `paidOrdersCount` | Số đơn paid |
| `profilesCount` | Tổng profiles |
| `newProfilesLast30Days` | Đăng ký 30 ngày |
| `activeSubscribers` | `subscription_expires_at > now()` |
| `expiredSubscribers` | Có `subscription_expires_at` nhưng ≤ now |
| `neverSubscribed` | `subscription_expires_at IS NULL` |
| `baziReadingUnlocked` | `bazi_reading_unlocked_at IS NOT NULL` |
| `tieuVanReadingActive` | `tieu_van_reading_expires_at > now()` |
| `revenueByBucketVnd` | `{ subscription, addon, legacy }` (VND) |
| `ordersBySku` | Map `package_sku` → số đơn paid |
| `*MomPct` | MoM % (chuỗi hiển thị, dấu phẩy thập phân VN) |

### `monthly[]` (12 tháng)

| Field | Ý nghĩa |
|-------|---------|
| `subscriptionRevenueVnd` | `goi_1thang`, `goi_6thang`, `goi_12thang` |
| `addonRevenueVnd` | `luan_bat_tu`, `luan_tieu_van` |
| `legacyRevenueVnd` | `le` + SKU lạ / đơn cũ |
| `*M` | Cùng giá trị / 1e6 (scale chart) |
| `leRevenueVnd`, `leM` | **Deprecated** — alias của `legacy*` |

---

## 6. PayOS `package_sku` (Direction C)

| SKU | VND | Hiệu ứng chính |
|-----|-----|----------------|
| `goi_1thang` | 299_000 | `subscription_expires_at` +3 tháng |
| `goi_6thang` | 499_000 | +6 tháng + Tiểu vận 1 năm |
| `goi_12thang` | 799_000 | +12 tháng + unlock cả hai luận |
| `luan_bat_tu` | 299_000 | `bazi_reading_unlocked_at` |
| `luan_tieu_van` | 199_000 | `tieu_van_reading_expires_at` +1 năm |
| `le` | 99_000 | **Legacy** — +100 lượng (webhook only, không checkout) |

Checkout UI: `/dat-lich` — chỉ `CHECKOUT_PACKAGE_SKUS` (không có `le`).

Webhook: `payos-webhook` → ghi entitlement + ledger (legacy credit path chỉ khi SKU `le`).

---

## 7. Schema `profiles` (admin-relevant)

| Cột | Admin use |
|-----|-----------|
| `subscription_expires_at` | Gia hạn lịch — **field chính** |
| `bazi_reading_unlocked_at` | Mở luận Bát tự (vĩnh viễn) |
| `tieu_van_reading_expires_at` | Hết hạn luận Tiểu vận |
| `credits_balance` | **Legacy** — đọc only; không CS “nạp lượng” là flow chính |
| `la_so`, `ngay_sinh`, `gio_sinh`, `gioi_tinh` | CS / debug (read-only khuyến nghị) |
| `la_so_recompute_status` | `pending` \| `ready` \| `failed` sau sửa sinh |
| `birth_edit_count`, `birth_edit_window_start` | Giới hạn sửa sinh (max từ `app_config.birth_edit_max_per_30d`) |
| `referral_code`, `referred_by`, `referral_reward_total_vnd` | Referral |
| `onboarding_completed_at` | Onboarding |

**RLS:** user chỉ own row; admin ghi qua **service_role** hoặc EF `admin-*`.

---

## 8. Bảng khác

| Bảng | Admin |
|------|--------|
| `payment_orders` | Đọc — CS, đối soát (cột quan trọng bên dưới) |
| `discount_coupons` | CRUD (P1) — không policy ghi cho user |
| `credit_ledger` | Đọc — legacy + idempotency |
| `feature_credit_costs` | Đọc — bat-tu dùng biết op “paid”; không trừ lượng |
| `referral_reward_events` | Đọc thưởng giới thiệu (cash VND) |
| `webhook_events` | Idempotency PayOS (P2 debug) |
| `reading_cache` | Debug luận AI (P2) |
| `day_luan_threads` | Debug chat luận ngày (P2) |

### `payment_orders` (admin columns)

| Cột | Ý nghĩa |
|-----|---------|
| `status` | `pending` \| `paid` \| `cancelled` \| `failed` \| `expired` |
| `package_sku` | SKU PayOS |
| `list_amount_vnd` | Giá catalog trước giảm |
| `amount_vnd` | Số tiền thực thu PayOS |
| `coupon_code` | Mã coupon |
| `checkout_referral_code` | Mã GT referee nhập lúc checkout |
| `referrer_profile_id` | Người giới thiệu (nếu có) |
| `discount_breakdown` | JSON chi tiết giảm giá |
| `provider_order_code` | Mã PayOS — đối chiếu portal |
| `expires_at` | Hết hạn link pending (~5 phút) |

### `app_config` keys

| Key | Ý nghĩa |
|-----|---------|
| `site_banner` | JSON banner sticky |
| `birth_edit_max_per_30d` | Số lần sửa sinh / 30 ngày (default 2) |
| `checkout_referral_discount_percent` | % giảm checkout referral (0 = chỉ ghi nhận referrer) |
| `starter_credits` | **Legacy** — 0 sau migration retire |
| `pivot_transition_until` | **Legacy** — đóng |

---

## 9. Nghiệp vụ admin → kỹ thuật

| Yêu cầu | Cách làm (ưu tiên) |
|---------|---------------------|
| Xem KPI / doanh thu | `admin-dashboard-stats` ✅ |
| Sửa banner site | `admin-site-banner` ✅ |
| Tìm user / sửa sub-luận | `admin-users` + `admin-user-entitlements` ❌ → tạm Supabase Table Editor |
| Đơn PayOS lỗi | `payment_orders` + `webhook_events` + PayOS Portal |
| Coupon campaign | `discount_coupons` + SQL hoặc `admin-coupons` ❌ |
| Xóa user | `auth.admin.deleteUser` (Supabase Auth UI hoặc EF P2) |
| Nạp lượng | **Deprecated** — legacy only |
| Sửa giá gói | Sửa `PACKAGES` + `UI_PACKAGES` + deploy |

---

## 10. Secrets (Edge)

| Secret | Dùng cho |
|--------|----------|
| `SUPABASE_*` | Auto |
| `ADMIN_EMAILS` | Admin EF allowlist |
| `PAYOS_*` | PayOS (admin thường không cần) |
| `BAT_TU_API_*` | Engine |
| `DEEPSEEK_*` | `generate-reading-*` |
| `SHARE_TOKEN_SECRET` | Share |

---

## 11. Lệnh hữu ích

```bash
npx supabase db push
npx supabase functions deploy admin-dashboard-stats admin-site-banner
# Sau khi thêm EF mới:
# npx supabase functions deploy admin-users admin-user-entitlements admin-orders
npx supabase gen types typescript --linked > app/lib/database.types.ts
```

Test stats (thay JWT):

```bash
curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://hptovpbiwvtngorhdhhm.supabase.co/functions/v1/admin-dashboard-stats"
```

---

## 12. Checklist triển khai

### Repo app (`Ngay-lanh-thang-tot`) — backend contract

- [x] `admin-dashboard-stats` Direction C buckets + KPI
- [x] `admin-site-banner`
- [ ] `_shared/admin-auth.ts` (DRY verify + service client)
- [ ] `admin-users` search + detail
- [ ] `admin-user-entitlements` PATCH + audit log migration (optional)
- [ ] `admin-orders` list/filter
- [ ] `admin-coupons` CRUD (P1)
- [ ] CORS: allow origin deploy repo admin (nếu khác `ngaylanhthangtot.vn`)

### Repo admin (riêng) — UI only

- [ ] Auth Supabase + handle 403 từ EF
- [ ] Dashboard (chart 3 series + KPI + `ordersBySku`)
- [ ] Users search + detail + entitlement form
- [ ] Orders, banner, coupons (P1)

### Ops (shared)

- [ ] `ADMIN_EMAILS` set trên Supabase project
- [ ] URL deploy repo admin + danh sách email được phép
- [ ] Quy trình CS: PATCH entitlement (EF) vs hoàn tiền (PayOS Portal)

**Phiên bản context:** 2026-05-31 — repo app: stats/banner EF done; P0 CS EF pending. Repo admin: implement UI against contracts above.
