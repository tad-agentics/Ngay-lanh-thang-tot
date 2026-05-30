# Admin dashboard — context handoff (Ngày Lành Tháng Tốt / ngaylanhthangtot.vn)

Tài liệu cho **admin dashboard nội bộ** (repo riêng hoặc window Cursor khác), kết nối cùng Supabase project production/staging.

**Stack app user:** React Router v7 · Supabase · PayOS · Vercel · DeepSeek (luận giải)  
**Monetization (Direction C):** **Gói lịch** (`subscription_expires_at`) + **add-on luận** — **không còn lượng trong UX/runtime** (2026-05).

Chi tiết pivot: `artifacts/plans/direction-c-pivot-plan.md` · credits retire: `artifacts/issues/credits-retire-housekeeping.md`

---

## 1. Sản phẩm (admin cần biết)

| Khía cạnh | Mô tả |
|-----------|--------|
| Core | PWA **lịch ngày lành** cá nhân hóa Bát Tự (`profiles.la_so`, ngày/giờ sinh). |
| Monetization | **PayOS** one-shot: gói 3/6/12 tháng lịch + mua lẻ Luận Bát tự / Tiểu vận. **Không auto-renew.** |
| Gating | `subscription_expires_at` → lịch + luận ngày (sub active). `bazi_reading_unlocked_at` / `tieu_van_reading_expires_at` → luận add-on hoặc gói năm. |
| Credits / lượng | **Retired runtime.** Cột `credits_balance` + `credit_ledger` giữ cho audit; user mới = 0; không trừ lượng trên Edge. |

---

## 2. Repo & đường dẫn quan trọng

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
| Referral (cash on sub purchase) | `referral_reward_events`, `grant_referral_subscription_reward`, `checkout_referral_discount_percent` |

**Giá gói:** vẫn hardcode `PACKAGES` + `UI_PACKAGES` — đổi giá = deploy code (hoặc tương lai: bảng `commerce_packages`).

---

## 3. Edge Functions admin (repo này)

| Function | Auth | Mục đích |
|----------|------|----------|
| `admin-dashboard-stats` | JWT + secret `ADMIN_EMAILS` | KPI + doanh thu 12 tháng |
| `admin-site-banner` | Cùng pattern | GET/PUT `app_config.site_banner` |

Deploy secret:

```bash
supabase secrets set ADMIN_EMAILS=you@company.com,other@company.com
```

**Không** expose `SUPABASE_SERVICE_ROLE_KEY` trên browser admin.

---

## 4. `admin-dashboard-stats` response (v2 — Direction C)

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

Mỗi phần tử:

| Field | Ý nghĩa |
|-------|---------|
| `subscriptionRevenueVnd` | `goi_1thang`, `goi_6thang`, `goi_12thang` |
| `addonRevenueVnd` | `luan_bat_tu`, `luan_tieu_van` |
| `legacyRevenueVnd` | `le` + SKU lạ / đơn cũ |
| `*M` | Cùng giá trị / 1e6 (scale chart) |
| `leRevenueVnd`, `leM` | **Deprecated** — alias của `legacy*` |

---

## 5. PayOS `package_sku` (Direction C)

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

## 6. Schema `profiles` (admin-relevant)

| Cột | Admin use |
|-----|-----------|
| `subscription_expires_at` | Gia hạn lịch — **field chính** |
| `bazi_reading_unlocked_at` | Mở luận Bát tự (vĩnh viễn) |
| `tieu_van_reading_expires_at` | Hết hạn luận Tiểu vận |
| `credits_balance` | **Legacy** — đọc only; không CS “nạp lượng” là flow chính |
| `la_so`, `ngay_sinh`, `gio_sinh`, `gioi_tinh` | CS / debug |
| `la_so_recompute_status` | `pending` \| `ready` \| `failed` sau sửa sinh |
| `birth_edit_count`, `birth_edit_window_start` | Giới hạn sửa sinh (max từ `app_config.birth_edit_max_per_30d`) |
| `referral_code`, `referred_by`, `referral_reward_total_vnd` | Referral |
| `onboarding_completed_at` | Onboarding |

**RLS:** user chỉ own row; admin ghi qua **service_role** hoặc EF `admin-*`.

---

## 7. Bảng khác

| Bảng | Admin |
|------|--------|
| `payment_orders` | Đọc — hỗ trợ CS, đối soát |
| `credit_ledger` | Đọc — lịch sử (legacy + unlock idempotency) |
| `feature_credit_costs` | **Không** dùng để trừ lượng nữa; `bat-tu` chỉ dùng để biết op “paid” → cần sub |
| `referral_reward_events` | Đọc thưởng giới thiệu |
| `webhook_events` | Idempotency PayOS |
| `reading_cache` | Debug luận AI (service_role) |

### `app_config` keys

| Key | Ý nghĩa |
|-----|---------|
| `site_banner` | JSON banner sticky |
| `birth_edit_max_per_30d` | Số lần sửa sinh / 30 ngày (default 2) |
| `checkout_referral_discount_percent` | % giảm checkout referral |
| `starter_credits` | **Legacy** — 0 sau migration retire |
| `pivot_transition_until` | **Legacy** — đóng |

---

## 8. Nghiệp vụ admin → kỹ thuật

| Yêu cầu | Cách làm |
|---------|----------|
| Xem KPI / doanh thu | Gọi `admin-dashboard-stats` |
| Sửa banner site | `admin-site-banner` |
| Gia hạn lịch user | `UPDATE profiles SET subscription_expires_at = …` (stack từ `max(now, expires)`) qua service_role / EF tương lai |
| Mở luận Bát tự / Tiểu vận | Set `bazi_reading_unlocked_at` / `tieu_van_reading_expires_at` |
| Đơn PayOS lỗi | Đọc `payment_orders` + `webhook_events` |
| Xóa user | `auth.admin.deleteUser` → cascade |
| Nạp lượng | **Deprecated** — chỉ legacy user; nếu bắt buộc: `credits_balance` + `credit_ledger` (`reason: admin_adjustment`) |
| Sửa giá gói | Sửa `PACKAGES` + `UI_PACKAGES` + deploy |

**EF đề xuất (chưa có):** `admin-user-detail`, `admin-user-entitlements` (PATCH), `admin-orders` (filter).

---

## 9. Secrets (Edge)

| Secret | Dùng cho |
|--------|----------|
| `SUPABASE_*` | Auto |
| `ADMIN_EMAILS` | Admin EF allowlist |
| `PAYOS_*` | PayOS (admin thường không cần) |
| `BAT_TU_API_*` | Engine |
| `DEEPSEEK_*` | `generate-reading-*` |
| `SHARE_TOKEN_SECRET` | Share |

---

## 10. Lệnh hữu ích

```bash
npx supabase db push
npx supabase functions deploy admin-dashboard-stats admin-site-banner
npx supabase gen types typescript --linked > app/lib/database.types.ts
```

---

## 11. Checklist admin UI

- [ ] Auth: Supabase login + gọi EF với user JWT (không service role client-side)
- [ ] Dashboard: 3 cột doanh thu (subscription / add-on / legacy) + KPI sub
- [ ] User detail: entitlements editable (sub + luận), không ưu tiên credits
- [ ] Orders table: filter theo `package_sku` Direction C
- [ ] Banner: `admin-site-banner`

**Phiên bản context:** 2026-05-31 — sau `20260531210000_retire_credits_runtime` + Direction C entitlements.
