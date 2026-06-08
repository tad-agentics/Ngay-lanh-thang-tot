# Admin dashboard — cập nhật sau wave Tra cứu chat & quota (2026-06-08)

Handoff từ **repo app** (`Ngay-lanh-thang-tot`) → **repo admin** (`admin-ngaylanhthangtot`).  
Hai repo dùng **cùng Supabase project** `hptovpbiwvtngorhdhhm`.

**Đọc thêm:** `artifacts/docs/admin-dashboard-context.md` (contract tổng thể).  
**Tài liệu này:** chỉ delta cần admin dashboard / CS UI cập nhật sau các commit ~`cc1d6a8` … `e454b26` (đã deploy prod).

---

## 1. Tóm tắt product (admin & CS cần biết)

### Không còn “lượng” trong UX

Runtime user **không** thấy `credits_balance`. Thay bằng hai lớp giới hạn chat AI:

| Lớp | Đối tượng | Nguồn dữ liệu | Giới hạn mặc định |
|-----|-----------|---------------|-------------------|
| **Onboarding trial** | User **chưa từng sub** (`subscription_expires_at IS NULL`) | `profiles.onboarding_trial_questions_used` + `app_config.onboarding_trial_questions_max` | **5 lượt lifetime** (config được) |
| **Daily pool** | Mọi user được chat (sub active **hoặc** còn trial) | `day_luan_daily_usage` (theo `vn_date` Asia/Ho_Chi_Minh) | **10 lượt / ngày VN** |

Hai pool **dùng chung** cho:

- Luận ngày — `day-luan-chat` (follow-up + full read CTA qua `generate-reading-day`)
- Tra cứu kết quả — `tra-cuu-results-chat` (intro anchor + hỏi tiếp)

### Một “lượt” = một câu trả lời AI đã giao

- Chỉ **trừ sau khi** server đã lưu câu trả lời thành công (không trừ khi LLM lỗi / rate limit / user hủy giữa chừng).
- **Tra cứu — intro đầu tiên** (bubble sau chọn ngày): trừ **1 lượt** khi `anchor_intro` được lưu lần đầu trên thread (`tra-cuu-results-chat` action `open`). *Trước fix `e454b26` intro không trừ — CS có thể thấy user “hỏi miễn phí” nhiều lần trên data cũ.*
- **Tra cứu — hỏi tiếp**: trừ qua action `ask` (như luận ngày).
- **Full luận ngày** (màn `/luan-ai/day-*`, không inline): trừ daily qua `generate-reading-day` (sub); trial vẫn qua RPC trial khi là never-sub.

### Gating tra cứu (pick ngày)

- `bat-tu` `chon-ngay` với `source: tra_cuu`: cần **sub active** hoặc **còn trial** (`profileAllowsTraCuuOrPaidCalendar`).
- Pick **không** trừ trial/daily — chỉ intro + chat mới trừ.

---

## 2. Schema & `app_config` mới (đã migration trên prod)

### `profiles` — cột mới

| Cột | Kiểu | Admin UI |
|-----|------|----------|
| `onboarding_trial_questions_used` | `int >= 0` | **Hiển thị** trên user detail; **read-only** (chỉ Edge RPC `increment_onboarding_trial_question` ghi) |

**Computed flags** (nên thêm vào `admin-users` GET detail khi implement):

```ts
// shared/entitlements-core.ts — mirror trên admin EF
isNeverSubscribed: subscription_expires_at === null
trialMax: app_config.onboarding_trial_questions_max (default 5)
trialRemaining: max(0, trialMax - onboarding_trial_questions_used)  // chỉ never-sub
hasOnboardingTrialAccess: never-sub && trialRemaining > 0
trialExhausted: never-sub && trialRemaining === 0
```

### `app_config` — key mới

| Key | Default | Admin |
|-----|---------|-------|
| `onboarding_trial_questions_max` | `5` | **P1:** form sửa trong module App config (hoặc SQL tạm). Edge đọc **mỗi request** (không cache warm instance). |

### Bảng mới (debug CS — P2)

| Bảng | Mục đích |
|------|----------|
| `tra_cuu_results_threads` | 1 row / phiên tra cứu (`session_key` = `intent:range_start:range_end`) |
| `tra_cuu_results_ask_idempotency` | Ask idempotency (`status`: pending \| done \| failed) |
| `day_luan_daily_usage` | `(user_id, vn_date) → count` — daily pool |

**RLS:** user chỉ `SELECT` own `tra_cuu_results_threads`; mọi ghi qua Edge `service_role`. Deny INSERT/UPDATE/DELETE cho client trên `tra_cuu_results_*`, `day_luan_daily_usage`, `day_luan_*` idempotency (migration `20260609120000`).

### RPC admin hiện có (repo app)

| RPC | Ghi chú |
|-----|---------|
| `admin_day_luan_ask_counts(uuid[])` | Chỉ đếm `day_luan_ask_idempotency` **done** — **chưa** gồm tra cứu intro/ask |

---

## 3. Việc cần làm — repo admin

### P0 — User detail & CS

- [ ] **User detail:** hiển thị `onboarding_trial_questions_used` / `trialMax` / `trialRemaining` khi `neverSubscribed`.
- [ ] **Flags:** `hasOnboardingTrialAccess`, `trialExhausted`, `canAccessPaidCalendar` (sub **hoặc** trial) — dùng `shared/entitlements-core.ts` hoặc copy logic từ `supabase/functions/_shared/entitlements.ts`.
- [ ] **Daily hôm nay:** đọc `day_luan_daily_usage` where `user_id` + `vn_date = today VN` → `count` / remaining `10 - count`.
- [ ] **Help text CS:** một lượt = intro tra cứu **hoặc** một câu hỏi follow-up **hoặc** một lượt luận ngày chat; không trừ khi pick `chon-ngay` thất bại.

### P1 — Dashboard KPI (tùy roadmap)

Cân nhắc bổ sung vào `admin_dashboard_stats_snapshot()` (repo **app**, migration) + field JSON `admin-dashboard-stats` (repo **admin**, EF):

| KPI đề xuất | Query gợi ý |
|-------------|-------------|
| `onboardingTrialActive` | `profiles` never-sub AND `used < max` |
| `onboardingTrialExhausted` | never-sub AND `used >= max` |
| `traCuuThreadsLast30d` | `count(*)` from `tra_cuu_results_threads` where `created_at >= now()-30d` |
| `traCuuAnchorsLast30d` | threads where `anchor_intro <> ''` và `created_at` … |

*Doanh thu / sub KPI hiện tại **không đổi**.*

### P1 — App config UI

- [ ] CRUD hoặc single-field edit: `onboarding_trial_questions_max` (integer ≥ 1).
- [ ] Ghi chú: đổi config **có hiệu lực ngay** trên Edge; không cần redeploy function.

### P2 — Debug tabs

- [ ] Tab **Tra cứu chat:** list `tra_cuu_results_threads` + `ask_idempotency` theo `user_id` (service_role).
- [ ] Tab **Luận ngày chat:** giữ `day_luan_threads` / `day_luan_ask_idempotency`.
- [ ] **Không** cho CS sửa `onboarding_trial_questions_used` tay — nếu cần reset trial, dùng PATCH service_role có audit (đề xuất EF riêng, chưa có).

### RPC đề xuất (repo app — chưa implement)

Nếu admin cần một số “tổng lượt chat đã giao” thay vì chỉ `admin_day_luan_ask_counts`:

```sql
-- Gợi ý: admin_user_chat_turn_counts(p_user_ids uuid[])
-- trial used: profiles.onboarding_trial_questions_used (source of truth lifetime)
-- daily today: day_luan_daily_usage
-- breakdown optional:
--   day_luan asks done (existing RPC)
--   tra_cuu asks done (tra_cuu_results_ask_idempotency join threads)
--   tra_cuu anchors (threads with length(anchor_intro) > 0) — mỗi thread tối đa 1 intro
```

Ưu tiên hiển thị **`onboarding_trial_questions_used`** + **`day_luan_daily_usage`** trước; breakdown P2.

---

## 4. Việc **không** cần đổi admin (trừ khi đang copy sai logic)

| Hạng mục | Ghi chú |
|----------|---------|
| PayOS / `package_sku` | Không đổi |
| `admin-dashboard-stats` revenue buckets | Không đổi |
| `credits_balance` | Vẫn legacy read-only |
| PATCH entitlement sub / luận BT & TV | Không đổi contract |

---

## 5. Deploy & sync giữa hai repo

| Thành phần | Repo | Lệnh / ghi chú |
|------------|------|----------------|
| Migrations (schema, RPC snapshot) | **App** | `supabase db push` — đã có trên prod |
| `tra-cuu-results-chat`, `day-luan-chat`, `generate-reading-day`, `bat-tu` | **App** | Đã deploy |
| `admin-dashboard-stats` EF | **Admin only** | `supabase functions deploy admin-dashboard-stats` — **không** deploy bản copy trong app repo |
| FE admin UI | **Admin** | Consume EF + types sau khi mở rộng response |

Sau khi app repo thêm field vào `admin_dashboard_stats_snapshot()`, admin repo cần:

1. Pull migration (hoặc chạy `db push` từ app nếu shared workflow).
2. Cập nhật type response + chart/cards UI.
3. Redeploy `admin-dashboard-stats`.

---

## 6. SQL tham khảo (CS / debug trong Supabase SQL Editor)

```sql
-- Trial + sub snapshot một user
select
  id,
  email,
  subscription_expires_at,
  onboarding_trial_questions_used,
  (select value::int from app_config where config_key = 'onboarding_trial_questions_max') as trial_max
from profiles
where id = '<user_uuid>';

-- Daily pool hôm nay (VN)
select count
from day_luan_daily_usage
where user_id = '<user_uuid>'
  and vn_date = (timezone('Asia/Ho_Chi_Minh', now()))::date;

-- Phiên tra cứu gần nhất
select id, session_key, left(anchor_intro, 80) as intro_preview,
       follow_up_count, created_at, updated_at
from tra_cuu_results_threads
where user_id = '<user_uuid>'
order by updated_at desc
limit 10;
```

---

## 7. Commit app repo (reference)

| Commit | Mô tả ngắn |
|--------|------------|
| `cc1d6a8` | Daily quota full read + refund khi LLM fail |
| `23b4956` / `50be308` | Tra cứu idempotency + CAS thread |
| `74ea5cb` | Trial + daily consume cùng lúc sau answer thành công |
| `ff86fbd` | RLS deny client write bảng chat mới |
| `26bda4e` | Log RPC quota vs exhaustion |
| `2f73333` | Validate `session_key` tra cứu |
| `d03dca4` | `onboarding_trial_questions_max` đọc fresh từ DB |
| `e454b26` | **Intro tra cứu trừ quota** khi lưu `anchor_intro` lần đầu |

---

## 8. Checklist gửi team admin

- [ ] Đọc mục 1 (model lượt) — cập nhật playbook CS
- [ ] User detail: trial used / remaining + daily today
- [ ] (P1) App config: `onboarding_trial_questions_max`
- [ ] (P1) KPI trial active/exhausted nếu product cần trên dashboard
- [ ] (P2) Debug tra cứu threads / asks
- [ ] Không deploy `admin-dashboard-stats` từ repo app
- [ ] Yêu cầu app team nếu cần RPC `admin_user_chat_turn_counts` hoặc mở rộng snapshot RPC

**Liên hệ kỹ thuật app:** migrations & Edge `admin-*` mới → PR repo `Ngay-lanh-thang-tot`. UI → PR repo admin.
