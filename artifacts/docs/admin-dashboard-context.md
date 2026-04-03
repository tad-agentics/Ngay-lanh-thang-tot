# Admin dashboard — context handoff (Ngày Lành Tháng Tốt / ngaylanhthangtot.vn)

Tài liệu này để **copy sang Cursor window / repo khác** khi xây admin dashboard cho team nội bộ. Repo gốc: **React Router v7 (Vite) + Supabase + PayOS + Vercel**; business logic credits/subscription nằm ở Postgres + Edge Functions.

---

## 1. Sản phẩm (tóm tắt)

- PWA chọn ngày lành theo Bát Tự, cá nhân hóa bằng lá số (`profiles.la_so`).
- Người dùng tiêu **lượng (credits)** hoặc dùng **gói thời hạn** (subscription) — không auto-renew.
- Chi phí từng tính năng đọc từ DB `feature_credit_costs`; thanh toán qua **PayOS** (checkout + webhook).

Chi tiết kiến trúc: `artifacts/docs/tech-spec.md`, `AGENTS.md`, `.cursor/rules/project.mdc`.

---

## 2. Repo & đường dẫn quan trọng

| Khu vực | Đường dẫn |
|--------|-----------|
| App (user) | `app/` (React Router v7) |
| Supabase migrations | `supabase/migrations/` |
| Edge Functions | `supabase/functions/` |
| Định nghĩa gói PayOS (server) | `supabase/functions/_shared/payos.ts` → `PACKAGES` |
| Copy + giá hiển thị UI mua lượng | `app/lib/packages.ts` → `UI_PACKAGES` |
| Map UI key → `feature_key` DB | `app/lib/constants.ts` → `FEATURE_KEY_MAP`, `toDbFeatureKey` |
| Type DB-aligned | `app/lib/database.types.ts`, `app/lib/api-types.ts` |
| Giới thiệu + thưởng lượng | Edge `referral-claim`, SQL `apply_referral_pair`, `app_config.referral_bonus_credits` |

**Lưu ý:** Giá gói và số lượng/tháng subscription hiện **hardcode** ở hai chỗ: Edge (`PACKAGES`) và frontend (`UI_PACKAGES`). Admin “sửa gói” theo yêu cầu growth thường cần **hoặc** (A) migration thêm bảng `commerce_packages` + đọc trong `payos-create-checkout` + API cho app, **hoặc** (B) tiếp tục deploy code khi đổi giá — document rõ cho team.

---

## 3. Biến môi trường (handoff)

### 3.1 App user (Vite) — public

File mẫu: `.env.example`.

| Biến | Mục đích |
|------|-----------|
| `VITE_SUPABASE_URL` | URL project Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | anon / publishable key (client) |
| `VITE_APP_URL` | Base URL app (redirect, share) |
| `VITE_VAPID_PUBLIC_KEY` | Web push (nếu admin không cần) |

### 3.2 Admin dashboard — **không** đưa Service Role vào browser

- `SUPABASE_SERVICE_ROLE_KEY` **bypass RLS** — chỉ dùng trên **server** (SSR route, Edge Function riêng, hoặc script local).
- Cách an toàn cho admin UI:
  1. **Supabase Auth** cho admin users + **Edge Function** `admin-*` kiểm tra JWT custom claim hoặc allowlist email + verify bằng `SUPABASE_SERVICE_ROLE_KEY` trong EF; client chỉ gọi EF với user JWT.
  2. Hoặc **Postgres**: cột `is_admin` / bảng `admin_users` + RLS policy `auth.jwt() ->> 'role'` / custom claim — cần migration mới (hiện **chưa có** admin role trong schema).

### 3.3 Edge Functions (Supabase Dashboard → Secrets)

| Secret | Dùng ở |
|--------|--------|
| `SUPABASE_URL` | auto |
| `SUPABASE_ANON_KEY` | EF verify JWT trong handler (vd. `referral-claim`, `payos-create-checkout`) |
| `SUPABASE_SERVICE_ROLE_KEY` | hầu hết EF ghi DB |
| `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY` | `payos-create-checkout`, `payos-webhook` |
| `BAT_TU_API_URL`, `BAT_TU_API_KEY` | `bat-tu` |
| `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` (optional) | `generate-reading` |
| `SHARE_TOKEN_SECRET` | share |
| `VAPID_*`, `CRON_SECRET` | push / cron (nếu bật) |

**Giới thiệu — `referral-claim`:** trong `supabase/config.toml` đặt `verify_jwt = false`; handler kiểm tra Bearer + `auth.getUser()`, cộng lượng qua RPC `apply_referral_pair` với service role. Không cần thêm secret ngoài bảng trên.

Local EF: `supabase/functions/.env` (gitignored).

---

## 4. Schema Postgres (public) — liên quan admin

### 4.1 `profiles` (1:1 `auth.users`)

| Cột | Ý nghĩa |
|-----|---------|
| `id` | PK = `auth.users.id` |
| `email`, `display_name` | Hiển thị; `email` có thể lệch OAuth |
| `ngay_sinh`, `gio_sinh`, `gioi_tinh` | Sinh học; sau `birth_data_locked_at` user **không** sửa được (trigger) |
| `la_so` | JSON lá số — user **không** sửa trực tiếp (trigger); service_role được |
| `credits_balance` | `integer >= 0` (CHECK) — user **không** PATCH trực tiếp (trigger); service_role / `apply_referral_pair` được |
| `referral_code` | Mã mời duy nhất (UPPER), sinh khi tạo profile; user **không** sửa qua client |
| `referred_by` | FK → `profiles.id`, `ON DELETE SET NULL` — người giới thiệu khi thưởng đã áp; user **không** sửa qua client |
| `subscription_expires_at` | Hết hạn gói “không giới hạn lượng” |
| `birth_data_locked_at`, `onboarding_completed_at`, `push_enabled` | |
| `created_at`, `updated_at` | |

**RLS:** user chỉ SELECT/UPDATE/INSERT own row. **Service role** bypass + được phép sửa `la_so` / lock (xem trigger).

**Xóa user:** xóa `auth.users` (Admin API) → CASCADE xóa `profiles` và các bảng FK tới `user_id`.

### 4.2 `credit_ledger`

- Mọi thay đổi số dư “có truy vết” nên có dòng ledger.
- Cột: `user_id`, `delta` (âm = trừ), `balance_after`, `reason`, `feature_key` (nullable FK), `idempotency_key` (unique), `metadata`, `created_at`.
- **RLS:** user chỉ đọc own; **không** có policy INSERT cho authenticated — ghi qua **service_role** (Edge).

**Reason** thực tế từ code: `starter_grant`, `referral_bonus_referee`, `referral_bonus_referrer`, `payos_purchase`, `payos_subscription`, và các lý do deduct trong `bat-tu` (xem EF).

**Admin nạp / hoàn / trừ lượng (khuyến nghị):**

1. Trong transaction: `SELECT credits_balance FOR UPDATE` → tính `new_bal` (≥ 0) → `UPDATE profiles` → `INSERT credit_ledger` với `reason` ví dụ `admin_adjustment`, `metadata` JSON (note, ticket).
2. Dùng `idempotency_key` unique cho mỗi thao tác idempotent (vd. `admin:{uuid}`).

### 4.3 `feature_credit_costs`

- PK `feature_key` (text), `credit_cost`, `is_free`, `updated_at`.
- **RLS:** mọi người đọc được; **không** có policy UPDATE cho user thường — chỉnh qua **service_role** hoặc migration.

**Danh sách key đã seed / migration** (có thể đã đổi `credit_cost` theo file migration sau):

- `ngay_hom_nay`, `weekly_summary`, `convert_date`, `lich_thang_overview` — free
- `chon_ngay_30`, `chon_ngay_60`, `chon_ngay_90`, `chon_ngay_detail`, `day_detail`, `tu_tru`, `tieu_van`, `hop_tuoi`, `phong_thuy`, `share_card`
- `la_so_diengiai` — có migration free/paid

Khi thêm key mới: đồng bộ `FEATURE_KEY_MAP` trong app + EF `bat-tu` nếu có billing.

### 4.4 `app_config`

- `config_key` / `value` (text).
- Đã dùng: `starter_credits` (int string, default fallback 20), `credit_expiry_months`, **`referral_bonus_credits`** (int string, ví dụ `10`) — số lượng mỗi bên (người được mời + người mời) khi áp referral thành công. **Chỉ user/sự kiện sau khi đổi giá trị** nhận mức mới (không retroactive).
- **RLS:** read all; ghi bằng service_role.

### 4.5 `payment_orders`

- Đơn PayOS: `package_sku`, `credits_to_add`, `subscription_months`, `amount_vnd`, `status`, v.v.
- Admin có thể chỉ đọc để hỗ trợ CS; không cần sửa trừ khi reconcile thủ công.

### 4.6 Bảng khác (tham khảo)

- `webhook_events` — idempotency PayOS
- `share_tokens`, `push_subscriptions`
- `reading_cache` — cache LLM; chỉ service_role

---

## 5. PayOS & gói (`package_sku`)

**SKU hợp lệ (cố định product):** `le` | `goi_6thang` | `goi_12thang`.

Định nghĩa server (`supabase/functions/_shared/payos.ts`):

| SKU | amountVnd | creditsToAdd | subscriptionMonths |
|-----|-----------|--------------|---------------------|
| `le` | 99_000 | 100 | null |
| `goi_6thang` | 789_000 | null | 6 |
| `goi_12thang` | 989_000 | null | 12 |

Checkout: `supabase/functions/payos-create-checkout` — tạo `payment_orders` với snapshot `credits_to_add` / `subscription_months` / `amount_vnd` từ `PACKAGES`.

Webhook: `supabase/functions/payos-webhook` — khi `paid`: cộng `credits_balance` + ledger `payos_purchase`, hoặc kéo dài `subscription_expires_at` + ledger `payos_subscription` (delta 0).

---

## 6. Yêu cầu nghiệp vụ admin → mapping kỹ thuật

| Yêu cầu | Thực hiện |
|---------|-----------|
| Sửa thông tin user | `profiles` qua service_role; email có thể cần đồng bộ `auth.users` qua Admin API |
| Xóa user | `auth.admin.deleteUser` (Supabase) — cascade |
| Nạp / refund / xóa lượng | `profiles.credits_balance` + `credit_ledger` (transaction, `balance_after` đúng, CHECK ≥ 0) |
| Sửa giá tính năng | `UPDATE feature_credit_costs` |
| Sửa gói lẻ / 6T / 12T | Hiện: sửa `PACKAGES` + `UI_PACKAGES` + deploy EF + app; tương lai: đưa vào DB + đọc trong checkout |
| Sửa starter credits user mới | `app_config.starter_credits` |

---

## 7. Rủi ro & tuân thủ

- **PII / lá số:** chỉ staff được phép; log audit (ai sửa gì, khi nào).
- **Service role:** không commit, không expose client.
- **Trigger `profiles`:** user thường không đổi được birth fields sau lock — admin có thể cần policy riêng hoặc chỉ sửa qua service_role (trigger cho phép service_role).

---

## 8. Lệnh hữu ích (repo gốc)

```bash
# Types DB (sau khi đổi schema)
npx supabase gen types typescript --linked > app/lib/database.types.ts

# Local
supabase start
supabase functions serve ...
```

---

## 9. Checklist mang sang window mới

- [ ] Clone / mở đúng repo hoặc repo admin riêng kết nối cùng Supabase project
- [ ] Có `VITE_SUPABASE_*` nếu client đọc public data; mọi thao tác nhạy cảm qua server/EF + service role
- [ ] Quyết định mô hình auth admin (EF + allowlist, hoặc DB role + RLS)
- [ ] Copy file này + `tech-spec.md` (mục credits/PayOS) nếu cần chi tiết FR

**Phiên bản context:** theo migrations tới `20260406120000_*` trong repo; khi schema đổi, cập nhật mục 4–5.
