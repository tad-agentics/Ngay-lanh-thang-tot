# Yêu cầu bổ sung API — tu-tru-api cho Direction C

**Đối tượng:** Team vận hành / phát triển [API Chọn Ngày Bát Tự](https://tu-tru-api.fly.dev/docs#/)  
**OpenAPI hiện tại:** `https://tu-tru-api.fly.dev/openapi.json` (info.version `0.1.0`)  
**Consumer:** Ứng dụng **Ngày Lành Tháng Tốt** (Direction C) — proxy qua Supabase Edge `bat-tu`  
**Cập nhật:** 2026-05-28 (audit: fixture điểm P0-02/P1-01; taxonomy score; màn 17–18 FE vs API; entitlement Tiểu Vận)  
**Liên quan:** `artifacts/plans/direction-c-pivot-plan.md` · W4–W10 · màn Lá số 17–18 · Tra cứu 19–21

---

## 0. API cần làm gì — checklist tóm tắt

> **Phía NLTT (app + Edge `bat-tu`) đã ship UI/mapper/workaround.** Cột **API phải làm** là việc team tu-tru-api cần bàn giao để bỏ heuristic, khóa contract, và mở tính năng còn thiếu.

| ID | API phải làm | Ưu tiên | OpenAPI 0.1.0 | NLTT hiện tại | Trạng thái |
|----|----------------|---------|---------------|---------------|------------|
| **REQ-P0-01** | `day-detail` **không bắt buộc birth** khi xem lịch chung (anon `/ngay/:ngay`) | **P0** | `birth_date` required | FE gửi `{ date }` only; Edge không chặn | 🔴 **Chưa document / cần xác nhận runtime** |
| **REQ-P0-02** | `breakdown[]` **đúng 4 phần tử** + `reason_vi` cá nhân hoá + `sources[]` trên `day-detail` & `chon-ngay/detail` | **P0** | `{}` rỗng | Đọc `breakdown`; FE fallback nhãn/giờ/generic copy khi thiếu `reason_vi` | 🟡 **Một phần** (điểm có lúc; `reason_vi` chưa đủ) |
| **REQ-P0-03** | `score_methodology` trên day-detail / ngay-hom-nay / lich-thang / chon-ngay | **P0** | Không có | Copy tĩnh FE (`DayScoreMethodologyCollapsible`, `TraCuuMethodologyCollapsible`) | 🔴 **Chưa có** |
| **REQ-P0-04** | `lich-thang` → `days[]` có `date`, `lunar_day`/`lunar_label`, `score`, `day_type` ổn định | **P0** | `{}` rỗng | Mapper quét ~10 key (`home-bat-tu.ts`) | 🟡 **Một phần** |
| **REQ-P1-01** | Endpoint mới `GET /v1/day-detail/luan-context` | **P1** | Không có | Interim: `buildDayLuanPromptContext()` + prompt Edge; anchor raw `day-detail` | 🟡 **Interim NLTT** · API 🔴 |
| **REQ-P1-02** | Endpoint mới `GET /v1/day-compare` | **P1** | Không có | Chip 「So sánh với ngày mai」 — copy tĩnh, LLM có thể bịa số | 🔴 **Chưa có** |
| **REQ-P1-03** | Cùng schema day-detail ↔ chon-ngay/detail | **P1** | `{}` rỗng | Hai mapper riêng (`day-detail-view`, `chon-ngay-detail`) | 🟡 **Một phần** |
| **REQ-P1-04** | `POST /v1/chon-ngay` → **`ranked_days[]`** canonical + `empty_reason_vi` | **P1** | `{}` rỗng | Ưu tiên `ranked_days`, fallback 11 array keys | 🟡 **Một phần** |
| **REQ-P2-01** | `GET /v1/la-so` + **`POST /v1/tu-tru`** — contract UI màn 17 (pillars, ngũ hành, đại vận) | **P2** | `{}` rỗng | Mapper `la-so-ui.ts` đọc nhiều alias từ `profiles.la_so` | 🟡 **Một phần** |
| **REQ-P2-01b** | `GET /v1/la-so` — facts cho Gemini **`la-so-chi-tiet`** (màn 18 interim MVP) | **P2** | `{}` rỗng | FE ship interim: `la-so` → `generate-reading` `la-so-chi-tiet` (5 aspect) | 🟡 **Interim NLTT** · API 🔴 |
| **REQ-P2-02** | `GET /v1/la-so/luu-nien?year=` — facts **vận năm** (≠ `tieu-van` vận tháng) | **P2** | Không có | Edge có prompt `luu-nien`; FE màn 18 **chưa gọi** | 🔴 **Chưa có** |
| **REQ-P2-03** | `POST /v1/tu-tru` → `engine_version` / `computed_at` | **P2** | Không có | G1 recompute dựa policy NLTT, chưa có stamp upstream | 🔴 **Chưa có** |
| **REQ-P2-04** | **`POST /v1/tu-tru` ≡ `GET /v1/la-so`** cùng birth — shape khớp cho cache `profiles.la_so` | **P2** | Không document | Onboarding lưu tu-tru; màn 17 đọc cache, màn 18 fetch la-so | 🔴 **Chưa khóa** |
| **REQ-P2-05** | `GET /v1/phong-thuy?year=` — contract Phi Tinh + hướng/màu năm (màn 18 §04) | **P2** | `{}` rỗng | Op có trong Edge; chưa wire màn 18 | 🟡 **Một phần** |
| **REQ-NLTT-01** | *(Không thuộc API)* tra cứu không trừ credit | — | — | ✅ Edge + FE shipped | ✅ **NLTT xong** |
| **REQ-P3-*** | Nice-to-have (semver, gio slots, purpose_rows, rate limit, …) | P3 | — | Workaround FE | ⚪ Backlog |

**Chú thích trạng thái:** 🔴 chưa có upstream · 🟡 có dữ liệu nhưng không đủ contract · ✅ xong · ⚪ không thuộc API

**Thứ tự đề xuất phía tu-tru-api:** P0-01 → P0-02 → P0-04 → P1-04 → P0-03 → P1-03 → P1-01/02 → P2.

---

## 1. Tóm tắt

Direction C là PWA 3 tab (Lịch · Tra cứu · Tôi), UI **lịch-tờ**, luận AI có nguồn, deep link `/ngay/:ngay`. Dữ liệu deterministic đến từ **tu-tru-api**; NLTT thêm auth, subscription (PayOS), cache Gemini qua Edge `generate-reading`.

**Sau pivot (2026-05-28):** NLTT đã gỡ shell Direction B, push/habit, credit UI legacy. **Ranh giới API không đổi** — tu-tru-api vẫn là engine duy nhất cho điểm ngày, lá số, chọn ngày, hợp tuổi.

Tài liệu này liệt kê **việc upstream phải bàn giao** để product chạy đúng spec — bổ sung OpenAPI 0.1.0, không thay thế docs hiện có.

---

## 2. Kiến trúc consumer

```
Browser (Direction C)
  → Supabase Edge `bat-tu` (auth, SUB_EXPIRED, billing tra cứu, Redis cache)
    → tu-tru-api.fly.dev `/v1/*` (engine Bát Tự)
  → Supabase Edge `generate-reading` (Gemini — luận văn)
  → (sau) Edge `day-luan-chat` (SSE follow-up — chưa build)
```

**Ranh giới trách nhiệm**

| Layer | Thuộc tu-tru-api | Thuộc NLTT Edge |
|-------|-------------------|-----------------|
| Điểm ngày, Trực, sao, giờ Hoàng/Hắc đạo | ✅ | — |
| `breakdown[]` 4 yếu tố + tổng điểm + **`reason_vi`** | ✅ tu-tru-api | — (Edge `bat-tu` proxy; FE map 1:1) |
| Lá số tứ trụ, ngũ hành, Dụng/Kỵ thần | ✅ | — |
| Luận văn AI (anchor, `la-so-chi-tiet`, `luu-nien`, `tieu-van`) | ❌ | ✅ `generate-reading` |
| Thread chat follow-up, quota 10 câu/ngày | ❌ | ✅ pipeline riêng (chưa ship) |
| Auth, subscription, credit ledger (legacy window) | ❌ | ✅ Supabase |

---

## 3. Baseline — endpoint NLTT đang gọi

| Method | Path | bat-tu `op` | Route Direction C | Ghi chú API |
|--------|------|-------------|-------------------|-------------|
| GET | `/v1/ngay-hom-nay` | `ngay-hom-nay` | `/lich` | **`score` cùng giá trị với `day-detail`** cùng ngày + profile (P0-02); methodology (P0-03) |
| GET | `/v1/lich-thang` | `lich-thang` | `/lich/thang` | Cần `days[].score` ổn định (P0-04) |
| GET | `/v1/day-detail` | `day-detail` | `/ngay/:ngay`, `/luan-ai/day-*` | **P0 blocker:** generic anon (P0-01) |
| POST | `/v1/chon-ngay` | `chon-ngay` | `/tra-cuu` → `/tra-cuu/ket-qua` | Cần `ranked_days[]` (P1-04) |
| POST | `/v1/chon-ngay/detail` | `chon-ngay/detail` | Tap row → `/ngay/:ngay` | Cần cùng schema day-detail (P1-03) |
| POST | `/v1/tu-tru` | `tu-tru` / `recompute-la-so` | Onboarding, G1 → `profiles.la_so` | Parity la-so (P2-04); version stamp (P2-03) |
| GET | `/v1/la-so` | `la-so` | `/toi/la-so` *(cache)* · `/toi/luan-bat-tu` *(live)* | Contract UI + Gemini (P2-01, P2-01b) |
| GET | `/v1/la-so/luu-nien` | *(chưa có op)* | `/toi/luan-bat-tu` §03 vận năm *(Make)* | Facts vận **năm** (P2-02) — **≠** `tieu-van` |
| GET | `/v1/tieu-van` | `tieu-van` | `/toi/luan-tieu-van` | **Vận tháng** — không nhầm với lưu niên / SKU "Tiểu Vận năm" |
| POST | `/v1/hop-tuoi` | `hop-tuoi` | `/tra-cuu/hop-tuoi` | `criteria[].points` (P3-07); FE `source: tra_cuu` (REQ-NLTT-01) |
| GET | `/v1/phong-thuy` | `phong-thuy` | `/toi/luan-bat-tu` §04 *(Make)* · `tien-ich/phong-thuy` → redirect `/lich` | `year=` Phi Tinh (P2-05); op có sẵn, **chưa wire** màn 18 |
| GET | `/v1/convert-date` | `convert-date` | Nội bộ Edge only | Không route C |
| GET | `/v1/weekly-summary` | `weekly-summary` | **Dropped C** | Deprecate docs (P3-05) |
| POST | `/v1/tu-tru` *(preview)* | `tu-tru-preview` | Onboarding preview | Không lưu `profiles.la_so` |
| GET | `/v1/share/{token}` | `share` | `/x/:token`, `/share/:token` | OG resolve |
| POST/GET | `/v1/profile` | `profile` | Sync birth | Đang dùng |

**Gap OpenAPI chung:** Response schema hầu hết `{}` — NLTT map linh hoạt (`day-detail-view.ts`, `home-bat-tu.ts`, `chon-ngay-result.ts`, `la-so-ui.ts`). **API phải publish schema thật** cho mọi field **P0/P1/P2**.

---

## 4. Yêu cầu chi tiết (phía tu-tru-api)

### P0 — Blocker chất lượng / anon

#### REQ-P0-01 · `GET /v1/day-detail` — chế độ **generic** (anonymous G5)

**API phải làm:** Cho phép xem chi tiết ngày **không cá nhân hoá** khi thiếu birth profile.

**Vấn đề:** OpenAPI 0.1.0 bắt buộc `birth_date=true`. Direction C cần `/ngay/:ngay` công khai (lịch chung + CTA đăng nhập).

**Đề xuất (chọn một):**

**A — Mở rộng endpoint hiện có**

```
GET /v1/day-detail?date=YYYY-MM-DD&mode=generic&tz=Asia/Ho_Chi_Minh
```

- `birth_date`, `birth_time`, `gender` **không bắt buộc** khi `mode=generic`.
- Response: lịch âm/dương, Can Chi ngày, Trực, sao, giờ Hoàng/Hắc đạo, **điểm generic** (không lá số), `personalized: false`.
- **Không** trả `breakdown` cá nhân hoá; có thể trả `breakdown_generic[]` 4 yếu tố lịch thuần.

**B — Endpoint mới**

```
GET /v1/day-detail/generic?date=YYYY-MM-DD&tz=...
```

**NLTT hiện tại:** `CDayDetailScreen` gửi `{ date: iso }` khi chưa login; Edge `bat-tu` chỉ bắt buộc `date` (không validate birth).

**Acceptance upstream:**

- HTTP 200 với `{ date }` only (không birth).
- OpenAPI cập nhật required params theo mode.
- Sample JSON generic trong repo fixtures.

---

#### REQ-P0-02 · `breakdown[]` ổn định — 4 yếu tố có nguồn + **lời giải thích cá nhân hoá** (màn 15 + 14)

**API phải làm:** Trả **đúng 4 phần tử** `breakdown` (và `sources[]`) trên **personalized** responses (`day-detail`, `chon-ngay/detail`). Mỗi phần tử phải có **`reason_vi`** — câu giải thích **vì sao yếu tố đó hợp hoặc không hợp với lá số user**, tác động thế nào tới điểm ngày — **không** chỉ lặp tên Trực/sao/giờ.

> **Owner:** **tu-tru-api** (engine Bát Tự upstream). **Không** thuộc NLTT Supabase Edge (`bat-tu` chỉ proxy pass-through) hay NLTT backend-developer (auth/RLS/billing). Gemini (`generate-reading`) viết **voice anchor** — **không** thay `breakdown[].reason_vi` trên UI.

**Phân công UI NLTT (Direction C — `/luan-ai/day-*`, anchor turn):**

| UI (maket) | Nguồn API | Ví dụ |
|------------|-----------|-------|
| **Verdict** (dòng đậm) | `breakdown[].type` | `Thu`, `Sao Thiên Lao`, `Nhâm Dần`, `Thìn 7–9h · Mùi 13–15h` |
| **Body** (serif, có `[n]`) | **`breakdown[].reason_vi`** | *“Trực Thu thuận thu hoạch nhưng Hắc Đạo — nên tránh khởi sự lớn với mệnh Lộ Bàng Thổ…”* |
| **Score chip** | `breakdown[].points` | `+24`, `-15`, `0` |
| **Citation** | `breakdown[].source_ref` → `[1]`–`[4]` | Khớp `sources[]` |

**NLTT hiện tại (interim — sẽ bỏ khi API ship P0-02):** `buildDayLuanSectionRows()` ghép body từ `reason_vi` tổng, `star_name`, `gio_tot`/`gio_xau`, hoặc copy generic — **không đạt spec**. FE **không** mở rộng heuristic; chờ upstream.

**Shape cũ (deprecated — không ship thêm):**

- Hàng `ĐIỂM CƠ BẢN` / `type: "neutral"` tách khỏi 4 yếu tố.
- `breakdown` 1–2 phần tử + `reason_vi` top-level dán nhãn (`Hắc Đạo — Trực Thu — Sao Giác`).
- Thiếu `id` / `can_chi_laso` → FE hiện placeholder *“Can Chi ngày được đối chiếu với mệnh…”*.

**Yêu cầu response (personalized `day-detail` và `chon-ngay/detail`):**

```json
{
  "score": 35,
  "grade": "D",
  "breakdown": [
    {
      "id": "truc",
      "source": "Trực ngày",
      "source_ref": 1,
      "type": "Thu · Hắc Đạo",
      "points": 8,
      "reason_vi": "Trực Thu thuận việc thu hoạch, kết thúc chu kỳ — nhưng ngày Hắc Đạo (Thiên Lao) làm giảm độ an toàn cho việc quan trọng với mệnh Lộ Bàng Thổ của bạn."
    },
    {
      "id": "sao28",
      "source": "Nhị thập bát tú",
      "source_ref": 2,
      "type": "Sao Thiên Lao · Giác",
      "points": -15,
      "reason_vi": "Hung tinh Thiên Lao chiếu nhật — kỵ sự kiện công khai, ký kết lớn; trừ 15 điểm so với nền ngày."
    },
    {
      "id": "can_chi_laso",
      "source": "Can chi · tương sinh với lá số",
      "source_ref": 3,
      "type": "Nhâm Dần",
      "points": 12,
      "reason_vi": "Can Nhâm (Thủy) và Chi Dần (Mộc) đối chiếu trụ Nhật và Dụng Thần trên lá số — hơi thuận với Lộ Bàng Thổ; cộng 12 điểm so với nền ngày."
    },
    {
      "id": "gio_vang",
      "source": "Giờ vàng trong ngày",
      "source_ref": 4,
      "type": "Thìn 7–9h · Mùi 13–15h",
      "points": 30,
      "reason_vi": "Buổi sáng có giờ Hoàng đạo Thìn thuận cho việc nhỏ; chiều Mùi ổn định — khung giờ mang phần lớn điểm còn lại (+30) sau khi trừ hung sao."
    }
  ],
  "sources": [
    { "ref": 1, "title_vi": "Hiệp Kỷ Biện Phương — Trực ngày" },
    { "ref": 2, "title_vi": "Ngọc Hạp Thông Thư — Thần sát" },
    { "ref": 3, "title_vi": "Tứ trụ — tương sinh tương khắc với lá số" },
    { "ref": 4, "title_vi": "Lịch Vạn Niên — giờ Hoàng đạo" }
  ]
}
```

**Quy tắc nội dung `reason_vi` (bắt buộc — team engine):**

1. **Cá nhân hoá:** Nêu quan hệ với **mệnh / Dụng Thần / trụ Nhật** của user (từ birth profile), không chỉ mô tả lịch chung.
2. **Giải thích điểm:** Nói rõ **vì sao cộng/trừ** (`points`), hoặc vì sao `0` (trung tính, không đáng kể) — user phải hiểu được tổng `score`.
3. **Một yếu tố = một đoạn:** 1–3 câu tiếng Việt; **không** gộp cả 4 yếu tố vào một `reason_vi`.
4. **`type` ≠ `reason_vi`:** `type` = nhãn ngắn (verdict UI); `reason_vi` = luận giải — **không** copy-paste cùng chuỗi.
5. **Giờ vàng:** `reason_vi` giải thích **khung giờ nào thuận/kỵ với lá số** — **không** chỉ liệt kê `gio_tot[]`/`gio_xau[]` (danh sách giờ vẫn trả ở field riêng cho UI lịch tờ).
6. **Ngôn ngữ:** Tiếng Việt; **không** enum engine (`neutral`, `penalty`, `bonus`) trong field hiển thị.

**Anti-pattern (reject trong QA upstream):**

| ❌ Không chấp nhận | ✅ Thay bằng |
|-------------------|-------------|
| `reason_vi`: *“Hắc Đạo (Thiên Lao) — Trực Thu — Sao Giác”* (chỉ nhãn) | Luận Trực + Hắc/Hoàng + tác động với mệnh user |
| `reason_vi`: *“Thiên Lao · Giác”* | Luận hung/cát + vì sao `points` âm/dương |
| `reason_vi` generic / placeholder | Luận Can Chi ngày ↔ lá số cụ thể |
| `reason_vi` = chuỗi giờ Hoàng/Hắc đạo | Luận **ý nghĩa** khung giờ với user |
| Hàng `ĐIỂM CƠ BẢN` +50 tách khỏi 4 yếu tố | Phân bổ điểm vào 4 `id`; tổng ≈ `score` |
| `breakdown.length !== 4` | Luôn đủ 4 phần tử, thứ tự cố định |

**Quy tắc điểm:**

| Field | Bắt buộc | Ghi chú |
|-------|----------|---------|
| `breakdown` | Có (personalized) | **Đúng 4 phần tử**, thứ tự: `truc` → `sao28` → `can_chi_laso` → `gio_vang` |
| `breakdown[].id` | Có | Enum cố định (4 giá trị trên) |
| `breakdown[].type` | Có | Verdict ngắn — **tiếng Việt** |
| **`breakdown[].reason_vi`** | **Có** | **Body UI + facts LLM** — xem quy tắc nội dung |
| `breakdown[].points` | Có | **`sum(breakdown[].points) ≈ score`** (±1 làm tròn). **Không** hàng “điểm cơ bản” riêng |
| `breakdown[].source_ref` | Có | `1`–`4` — map citation `[n]` |
| `sources[]` | Có | 4 mục, `ref` khớp `source_ref` |
| `score` | Có | **Cùng giá trị** với `GET /v1/day-detail` cùng `date` + birth profile (NLTT tab Hôm nay + luận AI dùng chung) |

**Phạm vi generic (`mode=generic`, REQ-P0-01):** Có thể trả `breakdown_generic[]` với `reason_vi` **không** cá nhân hoá (lịch thuần). Personalized **bắt buộc** quy tắc trên.

**Acceptance upstream:**

1. Fixture JSON 1 ngày score thấp (vd. 35) — 4 `reason_vi` đạt checklist nội dung.
2. `sum(points) ≈ score`; không key `ĐIỂM CƠ BẢN` / `neutral`.
3. NLTT `buildDayLuanSectionRows()` map **trực tiếp** `type` + `reason_vi` + `points` — **không** fallback heuristic.
4. `ngay-hom-nay.score === day-detail.score` cùng request profile (regression test).

**Liên quan LLM:** Gemini **không** viết lại breakdown UI. Anchor voice dùng cùng facts (`reason_vi` qua REQ-P1-01 `luan-context`); breakdown trên màn là **deterministic từ engine** (FE-HANDOFF §Phase 8).

> **Fixture trên:** `8 + (-15) + 12 + 30 = 35` — mọi ví dụ JSON trong doc **phải** tuân `sum(breakdown[].points) ≈ score`.

---

#### REQ-P0-02a · Taxonomy điểm — canonical API vs FE interim

**Canonical (upstream — dùng cho `breakdown[]`, `score_methodology`, `luan-context`):**

| `breakdown[].id` / `score_methodology.weights[].factor` | Nhãn UI (REQ-P0-03) | `max_points` gợi ý |
|--------------------------------------------------------|---------------------|-------------------|
| `truc` | Trực ngày | 30 |
| `sao28` | Nhị thập bát tú | 25 |
| `can_chi_laso` | Can chi · lá số | 25 |
| `gio_vang` | Giờ vàng | 20 |

**FE interim (chỉ collapsible copy tĩnh — bỏ khi ship P0-03):** `DayScoreMethodologyCollapsible` dùng nhãn marketing *Hoàng-đạo 40% · Trực 20% · Sao 25% · Tương sinh 15%* — **không** map 1:1 `id` engine. Upstream **không** adopt bộ % này; NLTT thay bằng `score_methodology.weights[]` từ API.

---

#### REQ-P0-03 · `score` + `score_methodology` block (màn 12–14, tra cứu)

**API phải làm:** Trả block methodology thay vì để FE copy tĩnh.

**NLTT hiện tại:** `DayScoreMethodologyCollapsible` / `TraCuuMethodologyCollapsible` — copy tĩnh (xem REQ-P0-02a FE interim). **Target:** render từ `score_methodology` API với `factor` = `truc` \| `sao28` \| `can_chi_laso` \| `gio_vang`.

```json
{
  "score": 76,
  "score_max": 100,
  "score_methodology": {
    "summary_vi": "Điểm tổng hợp từ Trực, sao, Can Chi với lá số, và giờ vàng.",
    "weights": [
      { "factor": "truc", "label_vi": "Trực ngày", "max_points": 30 },
      { "factor": "sao28", "label_vi": "Nhị thập bát tú", "max_points": 25 },
      { "factor": "can_chi_laso", "label_vi": "Can chi · lá số", "max_points": 25 },
      { "factor": "gio_vang", "label_vi": "Giờ vàng", "max_points": 20 }
    ]
  }
}
```

**Phạm vi:** `day-detail`, `ngay-hom-nay`, `lich-thang` (per-day nếu có score), `chon-ngay` response.

**NLTT UI (Direction C):** Collapsible *Cách tính điểm* chỉ render trên **`/ngay/:ngay`** (`DayScoreMethodologyCollapsible`) và tra cứu (`TraCuuMethodologyCollapsible`) — **không** trên **`/lich/thang`**. Tab Tháng chỉ hiện chấm màu tóm tắt (Tốt/Khá/Bình/Tránh) từ `score` hoặc fallback `day_type`; **không** hiện `breakdown[]` từng lớp (breakdown thuộc REQ-P0-02, scope `day-detail` / `chon-ngay/detail`).

---

#### REQ-P0-04 · `GET /v1/lich-thang` — score + âm lịch trên từng ô

**API phải làm:** Schema ổn định cho mảng ngày trong tháng.

| Field | Type | UI |
|-------|------|-----|
| `date` | `YYYY-MM-DD` | Tap → `/ngay/:ngay` |
| `lunar_day` / `lunar_label` | string | Ô lịch tháng |
| `score` | number 0–100 hoặc null | Chấm màu |
| `day_type` | enum | `tot` / `trung` / `xau` fallback |

**NLTT hiện tại:** `buildCalendarDaysForMonth()` quét nhiều alias field; `CMonthScreen` map `score` → màu chấm (`c-score.ts`), fallback Hoàng/Hắc đạo khi thiếu điểm. Subline *chấm theo mệnh {menh}* từ `profiles.la_so`. Không có methodology collapsible trên grid — user xem breakdown trên `/ngay/:ngay` sau khi tap ô.

---

### P1 — Pipeline luận ngày + tra cứu ranking

> Chat follow-up SSE (**`day-luan-chat`**) chưa ship NLTT. tu-tru-api chỉ cung cấp **facts** — không chat.

#### REQ-P1-01 · `GET /v1/day-detail/luan-context` (endpoint mới)

**API phải làm:** Payload compact **deterministic** cho prompt LLM (anchor + follow-up scope-lock). tu-tru-api **không** gọi Gemini — chỉ bàn giao facts đã chuẩn hoá.

**Contract URL:**

```
GET /v1/day-detail/luan-context
  ?birth_date=dd/mm/yyyy&birth_time=&gender=&date=YYYY-MM-DD&tz=Asia/Ho_Chi_Minh
```

**Response canonical (schema cố định — NLTT map 1:1 sang Gemini):**

```json
{
  "date_iso": "2026-05-28",
  "score": 35,
  "grade": "D",
  "can_chi_day": "Nhâm Dần",
  "menh_user": "Lộ Bàng Thổ",
  "breakdown_summary": [
    {
      "id": "truc",
      "label_vi": "Trực ngày",
      "source_ref": 1,
      "verdict_vi": "Thu",
      "points": 8,
      "reason_vi": "Trực Thu — thu hoạch, kết thúc chu kỳ…"
    },
    {
      "id": "sao28",
      "label_vi": "Nhị thập bát tú",
      "source_ref": 2,
      "verdict_vi": "Sao Thiên Lao",
      "points": -15,
      "reason_vi": "Hung tinh Thiên Cương…"
    },
    {
      "id": "can_chi_laso",
      "label_vi": "Can chi · tương sinh với lá số bạn",
      "source_ref": 3,
      "verdict_vi": "Nhâm Dần",
      "points": 12,
      "reason_vi": "Can Chi ngày đối chiếu Dụng Thần…"
    },
    {
      "id": "gio_vang",
      "label_vi": "Giờ vàng trong ngày",
      "source_ref": 4,
      "verdict_vi": "Thìn 7–9h",
      "points": 30,
      "reason_vi": "Giờ Hoàng đạo buổi sáng thuận cho việc nhỏ; khung chiều ổn — cộng phần lớn điểm còn lại sau hung sao."
    }
  ],
  "gio_tot": ["Thìn 7–9h"],
  "gio_xau": ["Tỵ 9–11h"],
  "sources": [
    { "ref": 1, "title_vi": "Hiệp Kỷ Biện Phương — Trực ngày" },
    { "ref": 2, "title_vi": "Ngọc Hạp Thông Thư — Thần sát" },
    { "ref": 3, "title_vi": "Tứ trụ — tương sinh tương khắc với lá số" },
    { "ref": 4, "title_vi": "Lịch Vạn Niên — giờ Hoàng đạo" }
  ],
  "scope_hint_vi": "Chỉ trả lời về ngày 28.05 và lá số của bạn — không chat tự do.",
  "anchor_question_hint_vi": "Tại sao ngày 28.05 được 35 điểm với mệnh Lộ Bàng Thổ?",
  "suggested_followups": [
    "Giờ nào trong ngày tốt nhất?",
    "Ngày này có nên ký hợp đồng không?",
    "So sánh với ngày mai"
  ]
}
```

| Field | Bắt buộc | Ghi chú LLM / UI |
|-------|----------|------------------|
| `breakdown_summary` | Có | **Đúng 4 phần tử**, `id` cố định — **cùng nội dung** với `day-detail.breakdown[]` (REQ-P0-02) |
| `breakdown_summary[].reason_vi` | **Có** | **Cùng quy tắc P0-02** — cá nhân hoá, giải thích `points`; Gemini anchor/follow-up **chỉ paraphrase**, không bịa |
| `breakdown_summary[].verdict_vi` | Có | = `breakdown[].type` |
| `breakdown_summary[].source_ref` | Có | Map citation `[1]`–`[4]` |
| `breakdown_summary[].points` | Có | **`sum ≈ score`** — không hàng điểm cơ bản riêng |
| `sources[]` | Có | Trùng ref 1–4; FE + Edge dùng thay hard-code |
| `scope_hint_vi` | Có | Inject system prompt follow-up |
| `anchor_question_hint_vi` | Có | Neo câu hỏi trên `/luan-ai/day-*` |
| `suggested_followups` | Khuyến nghị | Chip gợi ý — có thể giữ seed FE nếu thiếu |
| `menh_user` | Khuyến nghị | Nạp Âm / mệnh từ lá số — bắt buộc cá nhân hoá voice |

**Quy tắc nội dung (instruction cho team API, không phải prompt Gemini):**

1. **`luan-context` = projection của `day-detail` personalized** — `breakdown_summary[]` copy/sinh từ cùng engine run; **không** tính logic khác. **`sum(breakdown_summary[].points) ≈ score`** — mirror fixture REQ-P0-02 (vd. `8 + (-15) + 12 + 30 = 35`).
2. **`reason_vi` / `verdict_vi`:** Tuân REQ-P0-02 (cá nhân hoá, không nhãn, không list giờ thay luận).
3. **Không** trả field engine thô (`type: "neutral"`, `ĐIỂM CƠ BẢN`) trong payload hiển thị.
4. `gio_tot[]` / `gio_xau[]` = chuỗi hiển thị sẵn (`Thìn 7–9h`) — **bổ sung** cho `reason_vi` của `gio_vang`, không thay thế.
5. `scope_hint_vi`, `anchor_question_hint_vi`, `suggested_followups` — copy product, có thể do NLTT giữ seed nếu thiếu.

**NLTT hiện tại (interim 2026-05-28):**

- Edge `generate-reading` gọi `buildDayLuanPromptContext()` trong `supabase/functions/_shared/day-luan-prompt-context.ts` — **mirror** schema trên từ raw `day-detail` cho tới khi upstream ship endpoint.
- Prompt Gemini: `DAY_DETAIL_SYSTEM` / `DAY_DETAIL_FOLLOW_UP_SYSTEM` trong `generate-reading/index.ts` — follow-up **bắt buộc** citation `[1]–[4]`.
- Chưa có: SSE `day-luan-chat`, quota server `profiles.daily_chat_*`, `thread_id`.

**NLTT sau khi API ship:** bat-tu op `day-luan-context` → thay interim builder; bỏ heuristic map breakdown.

**Acceptance upstream:**

- OpenAPI schema + fixture JSON 1 ngày (score thấp + hung sao).
- `breakdown_summary.length === 4` luôn; không key tiếng Anh trong `verdict_vi`.
- `sources.length === 4` với ref 1–4.

---

#### REQ-P1-02 · `GET /v1/day-compare` (endpoint mới)

**API phải làm:** Facts so sánh 2 ngày — LLM **không được bịa** `delta_score` (chip 「So sánh với ngày mai」).

```
GET /v1/day-compare?birth_date=…&date_a=…&date_b=…&tz=…
```

**Response:**

```json
{
  "date_a": "2026-05-28",
  "date_b": "2026-05-29",
  "score_a": 35,
  "score_b": 62,
  "delta_score": 27,
  "better_for": ["ký hợp đồng", "họp quan trọng"],
  "comparison_vi": "Ngày mai Can Chi thuận Dụng Thần hơn — điểm cao hơn 27.",
  "sources": [{ "ref": 3, "title_vi": "Tứ trụ — tương sinh tương khắc với lá số" }]
}
```

| Field | Bắt buộc | Ghi chú |
|-------|----------|---------|
| `delta_score` | Có | `score_b - score_a` (signed) — Edge inject vào follow-up prompt |
| `comparison_vi` | Khuyến nghị | 1–2 câu facts; Gemini chỉ diễn đạt lại |
| `better_for` | Khuyến nghị | Gợi ý việc nên ưu tiên ở ngày tốt hơn |

**NLTT hiện tại:** Follow-up chip gọi Gemini thuần — có nguy cơ bịa số. Sau khi ship: Edge prefetch `day-compare` khi user hỏi/so sánh.

---

#### REQ-P1-03 · Đồng bộ shape `day-detail` ↔ `chon-ngay/detail`

**API phải làm:** Cùng schema `breakdown`, `sources`, `score_methodology`, `gio_tot`/`gio_xau` slots.

**NLTT hiện tại:** Hai code path parse (`parseDayDetailForView` vs `extractDetailReasonLines` + layer3).

---

#### REQ-P1-04 · `POST /v1/chon-ngay` — `ranked_days[]` canonical (W6 · Tab Tra cứu)

**API phải làm:** Response ranking ổn định — **field name cố định**, OpenAPI có schema item.

**Consumer:** `/tra-cuu` → overlay `CPickLoading` (G10) → `/tra-cuu/ket-qua`. NLTT Edge proxy `bat-tu` op `chon-ngay` với `source: "tra_cuu"` (subscription gate only, no credit — REQ-NLTT-01 ✅).

**Audit FE (2026-05-28):** Shell `/tra-cuu/ket-qua` khớp maket `CSearchResult` (BackBar, row highlight ★, typography `--display-2`). **Dữ liệu row vẫn phụ thuộc fallback** khi upstream thiếu field — điểm synthetic (`gradeToScore`), lý do generic, meta **「— · âm lịch」** khi thiếu `can_chi_day` (trước đó FE nhầm hiển thị **Trực** thay Can Chi — đã sửa mapper, chờ API).

**Request NLTT gửi:**

```json
{
  "birth_date": "dd/mm/yyyy",
  "birth_time": "",
  "gender": "nam|nu",
  "intent": "CUOI_HOI",
  "range_start": "dd/mm/yyyy",
  "range_end": "dd/mm/yyyy",
  "top_n": 5
}
```

**Response canonical:**

```json
{
  "intent": "CUOI_HOI",
  "intent_label_vi": "Cưới hỏi",
  "range_start": "2026-05-27",
  "range_end": "2026-06-25",
  "ranked_days": [
    {
      "rank": 1,
      "date": "2026-06-03",
      "score": 92,
      "grade": "A",
      "can_chi_day": "Kỷ Tỵ",
      "lunar_label": "Mùng 3 Tháng Năm",
      "truc": "Định",
      "gio_tot": [
        { "chi": "Thìn", "start_hour": 7, "end_hour": 9, "label_vi": "Thìn 7–9h" }
      ],
      "reason_vi": "Trực Định thuận nhật chủ Quý Thủy — giờ Thìn buổi sáng hoá giải xung Thổ, hợp ký kết."
    }
  ],
  "score_methodology": { "summary_vi": "…", "weights": [] },
  "empty_reason_vi": null
}
```

**UI contract `/tra-cuu/ket-qua` (maket `CSearchResult` · Design System §C):**

| UI (một row) | Nguồn API | Ví dụ |
|--------------|-----------|-------|
| Cột ngày (số lớn) | `date` → format `DD` | `06` |
| Sub ngày | `date` + weekday VN | `Th 06 · T7` |
| Meta (muted) | **`can_chi_day`** · `lunar_label` | `Kỷ Tỵ · Mùng 21 Tháng Tư` |
| Body (italic) | **`reason_vi`** | *Hỏa khí thịnh, hợp khai trương…* |
| Điểm (phải) | **`score`** + ramp màu | `92` |
| #1 highlight | `rank === 1` | nền gold, viền trái, ★ ĐỀ XUẤT |

**Phân tách field:** `truc` = Trực ngày (engine / breakdown) — **không** dùng thay `can_chi_day` trên meta row. `lunar_label` = chuỗi âm lịch hiển thị (tiếng Việt).

**`reason_vi` vs `reasons[]` (engine internal):**

| Field | UI `/tra-cuu/ket-qua` | Ghi chú |
|-------|----------------------|---------|
| **`reason_vi`** | ✅ Body italic — **duy nhất** field hiển thị khi có | 1–3 câu cá nhân hoá; **không** chuỗi `(+20)` factor |
| `reasons[]` / `scoring_factors[]` | ❌ **Không map UI** | Log chấm điểm nội bộ (Trực + điểm, Cát tinh + intent…). NLTT chỉ fallback **tạm** khi thiếu `reason_vi` — upstream **không** coi đây là copy hiển thị |

**NLTT mapper (2026-05-28):** `pickReasonsForUi()` — **`reason_vi` trước**, `reasons[]` sau. Khi upstream ship prose đúng spec, body đổi ngay **không cần** đổi FE thêm.

**Field checklist (acceptance):**

| Field | Priority | Rule |
|-------|----------|------|
| `ranked_days[]` | **P1** | Fixed key name; OpenAPI item schema; ≥1 fixture with 3–5 rows |
| `ranked_days[].score` | **P1** | Real 0–100; FE **không** synthesize từ grade |
| **`ranked_days[].can_chi_day`** | **P1** | Can Chi ngày (vd. `Kỷ Tỵ`) — meta row; **≠** `truc` |
| `ranked_days[].lunar_label` | **P1** | Âm lịch hiển thị (tiếng Việt) |
| `ranked_days[].reason_vi` | **P1** | 1–3 câu tiếng Việt, **cá nhân hoá** với lá số + intent; ≠ nhãn Trực/giờ (cùng quy tắc tinh gọn REQ-P0-02) |
| `score_methodology` | **P0** | Same shape REQ-P0-03; FE thay `TraCuuMethodologyCollapsible` copy tĩnh |
| `empty_reason_vi` | **P1** | When `ranked_days: []` — HTTP 200, explain why (e.g. tháng xung, ngưỡng điểm) |
| `chon-ngay/detail` | **P1** | Same schema personalized `day-detail` (breakdown 4 yếu tố + `reason_vi`, REQ-P0-02) |

**Anti-pattern (reject trong QA upstream):**

- Response chỉ dùng ad-hoc array keys (`top_dates`, `results`, …) **không** có `ranked_days`
- **`can_chi_day` thiếu** — FE hiển thị `— · {lunar}`; user không biết Can Chi ngày
- Dùng **`truc`** làm meta row (vd. `Định · Mùng 3…`) — sai maket
- `reason_vi` = copy `truc` + list `gio_tot`
- **`reasons[]` chứa dump factor `(+N)` làm nguồn UI** — phải sinh `reason_vi` prose riêng
- Thiếu `score` → FE invent 85/88/78 từ rank
- Empty search trả 404 hoặc `{}` **không** có `empty_reason_vi`

**Empty:** HTTP 200 + `"ranked_days": []` + `empty_reason_vi` (không 404 mơ hồ).

**Hiện trạng (2026-05-28 prod / staging):**

- NLTT `mapChonNgayPayloadToResultDays()` accept **11 fallback array keys** — dấu hiệu shape upstream chưa ổn định
- Mapper đọc `can_chi_day` / alias; meta row **không còn** dùng `truc` — nếu API thiếu Can Chi → `—`
- **`reason_vi`:** FE ưu tiên prose khi có; nếu chỉ có `reasons[]` dump → UI vẫn hiện log engine (chờ upstream)
- `tra-cuu.ket-qua.tsx` dùng `gradeToScore()` khi thiếu `score`
- `TraCuuMethodologyCollapsible` — copy tĩnh, chưa đọc `score_methodology`
- `CNoDatesFoundScreen` — copy empty tĩnh, chưa đọc `empty_reason_vi`

**NLTT blocked until upstream ships:**

1. Bỏ fallback `reasons[]` / Trực·giờ trên `/tra-cuu/ket-qua` khi `reason_vi` đã ship — body = `reason_vi` only
2. Render `TraCuuMethodologyCollapsible` từ `score_methodology.summary_vi` (+ `weights` nếu có)
3. Render empty state body từ `empty_reason_vi`
4. Bỏ multi-key array parsing khi `ranked_days[]` được guarantee

**Fixtures `chon-ngay` (attach PR / staging — gửi NLTT regression):**

1. **Happy path:** `CUOI_HOI`, range 30d, profile Lộ Bàng Thổ — 5 `ranked_days` với `reason_vi` khác nhau
2. **Low-score row:** cùng profile, một row score ~35 với `reason_vi` trung thực
3. **Empty:** range với `ranked_days: []` + non-null `empty_reason_vi`
4. **Mirror:** cùng `date` trong `chon-ngay/detail` và `day-detail` — `score` + `breakdown[]` khớp

**NLTT consumer files (proxy only — không scoring logic):**

- `app/lib/tra-cuu-pick.ts` · `app/lib/chon-ngay-result.ts`
- `app/routes/tra-cuu.ket-qua.tsx`
- `app/components/direction-c/TraCuuMethodologyCollapsible.tsx` · `CNoDatesFoundScreen.tsx`
- `supabase/functions/bat-tu/index.ts`

**SLA khuyến nghị:** p95 &lt; **8s** cho `top_n=5`, range 90 ngày.

---

#### REQ-NLTT-01 · Edge billing — tra cứu **không trừ credit** *(NLTT only — không thuộc P1 API)*

> **Không thuộc tu-tru-api** — ghi để upstream biết call volume từ `/tra-cuu`.

| Bước | Chi tiết |
|------|----------|
| FE | `source: "tra_cuu"` trên Tab Tra cứu: `chon-ngay` + **`hop-tuoi`** — `source` **không** forward upstream |
| Edge | `isTraCuuPickChonNgay()` → gate `canUseCalendar()`; **không** deduct credit |
| Trạng thái | ✅ Shipped 2026-05-27 (chon-ngay); ✅ hop-tuoi 2026-05-28 |

---

### P2 — Lá số & luận Bát tự (màn 17–18)

#### Thuật ngữ vận — tránh nhầm product vs API

| Tên | Layer | Chu kỳ | Endpoint / Edge | Màn Direction C |
|-----|-------|--------|-----------------|-----------------|
| **Lưu niên** | API + Bát Tự | **Năm** (Can Chi năm × lá số) | `GET /v1/la-so/luu-nien?year=` · Gemini `luu-nien` | Màn 18 §03 **Vận năm** (`CBaziReadingFull`) |
| **Tiểu vận** | API | **Tháng** (trụ tháng × lá số) | `GET /v1/tieu-van?month=` · Gemini `tieu-van` | `/toi/luan-tieu-van` |
| **Luận giải Tiểu Vận** | Product / SKU | **Năm** (copy gói) | *Không* map 1:1 tới `tieu-van` | Gói `luan_tieu_van` — nội dung ≈ **lưu niên**, không phải vận tháng |
| **Phong thủy năm** | API | Theo **`year=`** trên lá số | `GET /v1/phong-thuy?year=` | Màn 18 §04 — **endpoint riêng**, không nằm trong `luu-nien` |

> **NLTT Edge:** prompt `generate-reading` tách rõ — `tieu-van` luận **tháng**; `luu-nien` luận **năm** (`supabase/functions/generate-reading/index.ts`).

> **⚠️ Product gap (entitlement):** Gói/SKU **「Luận giải Tiểu Vận năm」** (`luan_tieu_van`, `tieu_van_reading_expires_at`) mở route `/toi/luan-tieu-van?year=` — nhưng code hiện tại gọi **`GET /v1/tieu-van`** cho **một tháng** (`month = {year}-{tháng hiện tại}`), **không** phải lưu niên 12 tháng. Để khớp copy gói + Make, cần wire **`luu-nien`** (REQ-P2-02) hoặc đổi positioning SKU.

**Màn 18 (`/toi/luan-bat-tu`) — Make target vs FE interim:**

| § Make (target) | Nguồn engine | Gemini | FE hiện tại (2026-05-28) |
|-----------------|--------------|--------|---------------------------|
| 01 Mệnh tổng quan | `GET /v1/la-so` facts | ❌ *(không có section `la-so-chi-tiet`)* | 🟡 header `laSoJsonToRevealProps(profile.la_so)` only |
| 02 Tính cách | `GET /v1/la-so` | `la-so-chi-tiet` → `tinh_cach` | 🟡 nằm trong 5 aspect (không tách block Make) |
| 03 Vận năm | `GET /v1/la-so/luu-nien?year=` | `luu-nien` | 🔴 chưa wire |
| 04 Phong thủy | `GET /v1/phong-thuy?year=` | *(optional prose)* | 🔴 chưa wire |
| 05 Quý nhân · lưu ý | lá số + lưu niên | `luu-nien` hoặc facts | 🔴 chưa wire |

**Interim MVP màn 18:** toàn bộ body luận = **5 section** `la-so-chi-tiet` (`tinh_cach`, `su_nghiep`, `tai_van`, `suc_khoe`, `tinh_duyen`) — đánh số 01–05 động trong `CBaziReadingScreen`; title có năm (`Luận giải Bát tự · 2026`) nhưng nội dung **chưa** theo vận năm.

---

#### REQ-P2-01 · `GET /v1/la-so` + `POST /v1/tu-tru` — contract màn 17

**Consumer:** `/toi/la-so` (`CLaSoFullScreen`) đọc **`profiles.la_so`** (output onboarding / G1 recompute). Mapper: `app/lib/la-so-ui.ts` · fixtures: `app/lib/la-so-ui.test.ts`.

**API phải làm:** Document + guarantee fields (snake_case canonical; camelCase optional):

| Field | Mapper cần | UI màn 17 shipped |
|-------|--------------|-------------------|
| `pillars.{year,month,day,hour}` | ✅ | ✅ 4 trụ (Giờ → Ngày → Tháng → Năm) |
| `_raw.element_counts` / `ngu_hanh` | ✅ | ✅ biểu đồ ngũ hành % |
| `nhat_chu`, `menh` | ✅ | ✅ headline Mệnh |
| `dung_than`, `ky_than` | ✅ | ✅ card Dụng/Kỵ |
| `dai_van.current` | ✅ | ✅ một dòng đại vận hiện tại |
| `pillars.year.nap_am.mo_ta` | ✅ (`extractMenhTagline`) | 🔴 tagline Make **chưa render** |
| `dai_van.cycles[]` / `dai_van_list[]` | ✅ | 🔴 timeline đại vận **chưa render** |
| `thap_than.dominant` | ✅ | 🔴 **chưa render** |
| `cuong_nhuoc` | ✅ (P2-01b) | 🔴 **chưa render** (chỉ dùng Gemini) |

**Chi tiết field (API contract):**

| Field | Ghi chú |
|-------|---------|
| `pillars.{year,month,day,hour}` | Mỗi trụ: `can.name`, `chi.name` |
| `_raw.element_counts` | `{ Kim, Moc, Thuy, Hoa, Tho }` — NLTT tính **%** (tổng = 100) |
| `ngu_hanh` / `element_counts` | Fallback nếu thiếu `_raw` |
| `nhat_chu` | Object `{ can_name, hanh }` hoặc string |
| `menh` | `{ nap_am_name, hanh }` hoặc string; `pillars.year.nap_am.mo_ta` cho tagline *(Make)* |
| `dung_than`, `ky_than` | `{ element, name }` |
| `dai_van.current` | `{ display, age_range, age_range_lunar?, start_age?, end_age? }` |
| `dai_van.cycles[]` hoặc `dai_van_list[]` | Timeline; `current` khớp hàng `isActive` |
| `thap_than.dominant` | Fallback cát tinh / Thập thần |
| `cuong_nhuoc` | Cường nhược nhật chủ — P2-01b |

**Không yêu cầu:** văn luận dài từ engine (thuộc NLTT Gemini).

---

#### REQ-P2-01b · `GET /v1/la-so` — facts cho Gemini `la-so-chi-tiet`

**Consumer:** `/toi/luan-bat-tu` — Edge `generate-reading` endpoint **`la-so-chi-tiet`** (5 khía cạnh: `tinh_cach`, `su_nghiep`, `tai_van`, `suc_khoe`, `tinh_duyen`).

**API phải làm:** Response `GET /v1/la-so` (hoặc nested `data`) chứa đủ facts để LLM **không bịa** — tối thiểu:

| Fact | Dùng cho section |
|------|------------------|
| `nhat_chu` + `hanh` + `cuong_nhuoc` | `tinh_cach` |
| `thap_than` (dominant + per-pillar nếu có) | `tinh_cach`, `su_nghiep` |
| `dung_than`, `ky_than` | `su_nghiep`, `tai_van`, `suc_khoe` |
| `pillars` đủ 4 trụ | Neo câu luận (mọi aspect) |
| `menh` / nap_âm | Bối cảnh `tinh_cach`, `su_nghiep` |
| `dai_van.current` | `tai_van` *(optional)* |

**NLTT hiện tại:** FE gọi `bat-tu` op `la-so` → `invokeGenerateReading({ endpoint: "la-so-chi-tiet", data: laso.data })`. Interim ship; cần upstream khóa shape.

---

#### REQ-P2-02 · `GET /v1/la-so/luu-nien?year=YYYY` — facts vận **năm**

> **Không phải `GET /v1/tieu-van`** (vận tháng). Không trùng SKU copy **"Luận giải Tiểu Vận"** về tên API — SKU đó map nội dung **lưu niên năm**.

**API phải làm:** Facts deterministic vận năm — **không** văn luận dài. Gợi ý schema:

| Field | Ghi chú |
|-------|---------|
| `year`, `year_can_chi`, `year_label_vi` | Ví dụ `2026`, `Binh Ngo` |
| `element_relation` | `tuong_sinh` \| `bi_sinh` \| `tuong_khac` \| `bi_khac` \| `binh_hoa` |
| `year_rating` / `year_theme_vi` | Ví dụ "Năm tốt — củng cố" |
| `life_areas[]` | `{ id, label_vi, verdict_vi, detail_vi }` — tài lộc, sự nghiệp, tình duyên, sức khỏe |
| `warnings[]` | Tam tai, tuế phá, … |
| `month_scores[12]` | Điểm/band 12 tháng âm — biểu đồ Make §03 |
| `quy_nhan` / `tuoi_hop` / `tuoi_xung` | Block §05 |

**NLTT hiện tại:** Edge có prompt `luu-nien` (3 phần `nhin_chung`, `thuc_tien`, `ung_xu`); **FE màn 18 chưa gọi**. Payload dự kiến: merge `{ la_so, luu_nien: { ... } }` hoặc single enriched response.

---

#### REQ-P2-03 · `POST /v1/tu-tru` — `engine_version` / `computed_at`

**API phải làm:** Stamp version để NLTT invalidate cache lá số khi thuật toán đổi (G1 recompute).

---

#### REQ-P2-04 · Parity `POST /v1/tu-tru` ↔ `GET /v1/la-so`

**Vấn đề:** Màn 17 đọc **`profiles.la_so`** (tu-tru); màn 18 fetch **`GET /v1/la-so`**. Nếu shape lệch → ngũ hành placeholder 20% trên màn 17 trong khi màn 18 đủ data.

**API phải làm:** Cùng `birth_date` + `birth_time` + `gender` → response tu-tru **chứa superset** field P2-01 (ít nhất `_raw.element_counts`, `pillars`, `dai_van`, `thap_than`, `cuong_nhuoc`). OpenAPI ghi rõ field nào xuất hiện ở cả hai endpoint.

**NLTT dự kiến:** `mergeLaSoJsonForChiTietDisplay()` + `extractLaSoChiTietEnrichment()` (`la-so-ui.ts`, có test) — gộp `_raw.element_counts` từ live `GET /v1/la-so` vào cache `profiles.la_so` khi parity khóa; **chưa wire route**.

---

#### REQ-P2-05 · `GET /v1/phong-thuy?year=` — màn 18 §04 Phong thủy

**Consumer:** Block **Phong thuỷ Bính Ngọ** trong `CBaziReadingFull` — hướng tốt/xấu, màu, sao bay 3×3.

**API phải làm:** Document + guarantee (đã có runtime; OpenAPI `{}`):

| Field | Ghi chú UI |
|-------|------------|
| `huong_tot[]`, `huong_xau[]` | Hướng cá nhân theo mệnh |
| `mau_may_man[]`, `mau_ky[]` | Màu hợp / tránh |
| `phi_tinh[]`, `phi_tinh_year` | Khi có query `year=` |
| `huong_tot_nam_nay[]`, `huong_xau_nam_nay[]` | Overlay lưu niên năm |
| `hoa_giai[]` | Gợi ý hóa giải sao xấu |

**NLTT hiện tại:** Op `phong-thuy` có trong Edge (`year` trong queryKeys); **chưa wire** vào `CBaziReadingScreen`. Route `tien-ich/phong-thuy` chỉ redirect `/lich` (bookmark). Không gộp vào `luu-nien`.

---

### P3 — Nice-to-have

| ID | API phải làm | NLTT workaround |
|----|--------------|-----------------|
| REQ-P3-01 | Semver / changelog trên `/health` | — |
| REQ-P3-02 | `gio_tot`/`gio_xau` slot `{ chi, start_hour, end_hour, label_vi }` | Parse string tự do |
| REQ-P3-03 | `purpose_rows[]` trên day-detail | Ghép từ `good_for`/`avoid_for` |
| REQ-P3-04 | `X-RateLimit-Remaining` | Lỗi generic |
| REQ-P3-05 | Deprecate `/v1/weekly-summary` trong docs | Op vẫn trong Edge |
| REQ-P3-06 | `chon-ngay` echo `candidates_scanned` | Empty copy tĩnh |
| REQ-P3-07 | `hop-tuoi` `criteria[].points` per tiêu chí | NLTT `enrichCriterionPoints()` heuristic trên `/tra-cuu/hop-tuoi/ket-qua` khi thiếu; bỏ khi upstream ship |

---

## 5. Endpoint mới / mở rộng — bảng giao việc API

| Priority | Method | Path / thay đổi | Blocker cho |
|----------|--------|-----------------|-------------|
| **P0** | GET | `day-detail?mode=generic` **hoặc** `/day-detail/generic` | Anon `/ngay/:ngay` |
| **P0** | — | `breakdown` + `sources` + `score_methodology` | Màn 14–15, collapsible |
| **P0** | — | `lich-thang` `days[].score`, `lunar_*` | `/lich/thang` |
| **P1** | GET | `/v1/day-detail/luan-context` | Pipeline chat ngày |
| **P1** | GET | `/v1/day-compare` | Chip so sánh ngày |
| **P1** | — | `chon-ngay` → `ranked_days[]` + `empty_reason_vi` | `/tra-cuu/ket-qua` |
| **P1** | — | Unified schema day-detail ↔ chon-ngay/detail | Một mapper FE |
| **P2** | GET | `/v1/la-so` OpenAPI đầy đủ | Màn 17 + `la-so-chi-tiet` (P2-01, P2-01b) |
| **P2** | — | `tu-tru` ≡ `la-so` parity | Cache `profiles.la_so` (P2-04) |
| **P2** | GET | `/v1/la-so/luu-nien?year=` | Màn 18 §03 vận năm + Gemini `luu-nien` |
| **P2** | GET | `/v1/phong-thuy?year=` schema | Màn 18 §04 phong thủy |
| **P2** | — | `tu-tru` version stamp | G1 recompute |
| **P3** | — | OpenAPI schemas đầy đủ (không `{}`) | QA contract |

---

## 6. Non-goals (không yêu cầu tu-tru-api)

- Gọi Gemini / OpenAI hoặc viết **system prompt** LLM
- SSE streaming chat, `thread_id`, quota 10 câu/ngày — NLTT Edge `generate-reading` (+ sau này `day-luan-chat`) + Postgres
- Auth user, subscription, PayOS
- Multi-profile gia đình (Direction C dropped)
- Web Push / habit streak (Direction C dropped 2026-05-28)

### 6.1 Ranh giới LLM — ai làm gì

| Việc | tu-tru-api | NLTT Edge / FE |
|------|------------|----------------|
| Schema `breakdown[]` + **`reason_vi` cá nhân hoá** | ✅ REQ-P0-02 | Map 1:1 → UI breakdown (verdict=`type`, body=`reason_vi`) |
| Schema `luan-context` + `day-compare` facts | ✅ REQ-P1-01/02 | Consume qua `bat-tu` |
| Compact builder interim từ raw `day-detail` | ❌ | ✅ `_shared/day-luan-prompt-context.ts` (**tạm** — bỏ khi P1-01 ship) |
| System prompt anchor / follow-up | ❌ | ✅ `generate-reading` `DAY_DETAIL_*_SYSTEM` |
| Citation `[1]–[4]` trong follow-up | Facts `source_ref` + `reason_vi` | Prompt + post-process (sau) |
| Quota 10 câu/ngày | ❌ | 🔴 Chưa server — FE sessionStorage tạm |
| Schema `la-so` facts (`cuong_nhuoc`, `thap_than`, …) | ✅ REQ-P2-01/01b | `la-so-chi-tiet` Gemini |
| Schema `luu-nien` facts vận **năm** | ✅ REQ-P2-02 | `generate-reading` `luu-nien` — màn 18 §03 |
| Schema `phong-thuy` + `year=` | ✅ REQ-P2-05 | Màn 18 §04 — **không** gộp `luu-nien` |
| Schema `tieu-van` vận **tháng** | ✅ upstream hiện có | `/toi/luan-tieu-van` — **≠** lưu niên |
| Heuristic ghép body breakdown từ nhãn/giờ | ❌ | 🔴 Interim only — **không mở rộng** |

---

## 7. Tiêu chí nghiệm thu (phía API)

1. **OpenAPI** cập nhật schema response cho mọi field P0/P1/P2 (không `{}` rỗng).
2. **Backward compatible:** field mới optional; client cũ không break.
3. **Timezone:** default `Asia/Ho_Chi_Minh`; accept `YYYY-MM-DD` ngoài `dd/mm/yyyy` nếu có thể.
4. **Staging:** deploy preview Fly; NLTT trỏ `BAT_TU_API_URL` staging QA.
5. **Fixtures tối thiểu** (JSON mẫu gửi NLTT):
   - Personalized `day-detail` — **4-item `breakdown`**, mỗi item có `reason_vi` đạt checklist P0-02 (kèm ngày score 35 + ngày score 76)
   - **`luan-context`** cho cùng ngày — `breakdown_summary` **mirror** `breakdown`
   - Pair **`ngay-hom-nay` + `day-detail`** cùng profile — **`score` khớp**
   - **`day-compare`** (date_a vs date_b + delta_score)
   - Generic `day-detail` (anon, `personalized: false`)
   - **`chon-ngay`:** happy path ≥5 `ranked_days` (distinct `reason_vi`) + empty `ranked_days: []` + `empty_reason_vi` + mirror `chon-ngay/detail` ↔ `day-detail` (REQ-P1-04)
   - **`la-so`** đủ field P2-01 (pillars, `_raw.element_counts`, `dai_van.cycles`, `cuong_nhuoc`)
   - **`tu-tru`** cùng birth — shape **mirror** `la-so` (P2-04)
   - **`la-so/luu-nien?year=2026`** — facts vận năm (P2-02)
   - **`phong-thuy?year=2026`** — `phi_tinh[]`, hướng/màu năm (P2-05)

---

## 8. Mapping NLTT sau khi upstream ship

| Upstream ship | bat-tu `op` (dự kiến) | FE / Edge cập nhật |
|---------------|------------------------|-------------------|
| `day-detail?mode=generic` | `day-detail` (body `{ date }` hoặc `mode`) | `CDayDetailScreen` anon |
| `luan-context` | `day-luan-context` *(mới)* | Edge `day-luan-chat` |
| `day-compare` | `day-compare` *(mới)* | Màn 15 chip / chat |
| `la-so` OpenAPI | — | Bỏ alias heuristic `la-so-ui.ts` khi contract khóa |
| `tu-tru` ≡ `la-so` | — | Màn 17 cache khớp màn 18 live fetch |
| `la-so` + `la-so-chi-tiet` | `la-so` *(giữ)* | `CBaziReadingScreen` §01–02 — **đang ship interim** |
| `la-so/luu-nien?year=` | `la-so-luu-nien` *(mới)* | Màn 18 §03 + `generate-reading` **`luu-nien`** |
| `phong-thuy?year=` | `phong-thuy` *(giữ)* | Màn 18 §04 — **endpoint riêng** |
| `ranked_days[]` | `chon-ngay` *(giữ)* | Bỏ fallback array keys |
| `score_methodology` | — | Render collapsible từ API |
| `breakdown` + `sources` + **`reason_vi`** | — | Map 1:1 UI; bỏ `DAY_LUAN_SOURCES` hard-code + FE heuristic body |

---

## 9. Liên hệ & tài liệu tham chiếu

| Tài liệu | Path / URL |
|----------|------------|
| Swagger UI | https://tu-tru-api.fly.dev/docs#/ |
| OpenAPI JSON | https://tu-tru-api.fly.dev/openapi.json |
| NLTT mapper day-detail | `app/lib/day-detail-view.ts` |
| NLTT mapper chọn ngày | `app/lib/chon-ngay-result.ts` |
| NLTT luận 4 yếu tố | `app/lib/day-luan-sectioned.ts` |
| NLTT luan-context interim (Edge) | `supabase/functions/_shared/day-luan-prompt-context.ts` |
| NLTT Gemini prompts | `supabase/functions/generate-reading/index.ts` |
| NLTT bat-tu proxy | `supabase/functions/bat-tu/index.ts` |
| NLTT mapper lá số | `app/lib/la-so-ui.ts` · `app/lib/la-so-ui.test.ts` |
| NLTT màn 18 | `app/components/direction-c/CBaziReadingScreen.tsx` |
| Make màn 17–18 | `artifacts/design/ngaylanhthangtot-vn/c-screens-g.jsx` |
| NLTT tra cứu pick | `app/lib/tra-cuu-pick.ts` |
| Pivot plan | `artifacts/plans/direction-c-pivot-plan.md` |

---

## 10. Lịch đề xuất phía upstream

| Tuần | Deliverable API | Trạng thái |
|------|-----------------|------------|
| T0 | Xác nhận REQ-P0-01..04 + sample JSON | 🔴 Chưa |
| T1 | Ship P0 lên staging | 🔴 Chưa |
| T2 | P1 `ranked_days[]` + unified day-detail schema | 🟡 FE sẵn, API chưa khóa |
| T2 | P1 `luan-context` + `day-compare` | 🔴 Chưa (block chat pipeline) |
| T3 | P2 `la-so` + parity `tu-tru` + `luu-nien` + `phong-thuy?year=` OpenAPI | 🔴 Chưa |
| — | NLTT REQ-NLTT-01 billing bypass | ✅ Shipped |

**Owner phía NLTT:** Tech Lead — nhận release upstream, cập nhật `bat-tu` ops + mappers, QA regression W4–W6.
