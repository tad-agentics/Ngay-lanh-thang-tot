# Yêu cầu bổ sung API — tu-tru-api cho Direction C

**Đối tượng:** Team vận hành / phát triển [API Chọn Ngày Bát Tự](https://tu-tru-api.fly.dev/docs#/)  
**OpenAPI hiện tại:** `https://tu-tru-api.fly.dev/openapi.json` (info.version `0.1.0`)  
**Consumer:** Ứng dụng **Ngày Lành Tháng Tốt** (Direction C) — proxy qua Supabase Edge `bat-tu`  
**Ngày:** 2026-05-27  
**Liên quan:** `artifacts/plans/direction-c-pivot-plan.md` · `artifacts/design/ngaylanhthangtot-vn/FE-HANDOFF.md` · W4–W5 · **W6 (màn 19–21 Tra cứu)**

---

## 1. Tóm tắt

Direction C pivot sang PWA 3 tab (Lịch · Tra cứu · Tôi), UI **lịch-tờ**, luận AI có nguồn, và deep link công khai `/ngay/:ngay`. Phần lớn dữ liệu deterministic đến từ **tu-tru-api**; NLTT chỉ thêm auth, billing, cache Gemini, và (sắp tới) pipeline chat ngày riêng trên Edge.

Tài liệu này liệt kê **endpoint mới** và **mở rộng contract** cần upstream bổ sung để product Direction C chạy đúng spec — không thay thế OpenAPI hiện có mà **bổ sung** cho pivot.

---

## 2. Kiến trúc consumer

```
Browser (Direction C)
  → Supabase Edge `bat-tu` (auth, SUB_EXPIRED, billing, cache Redis)
    → tu-tru-api.fly.dev `/v1/*` (engine Bát Tự)
  → Supabase Edge `generate-reading` / `day-luan-chat` (sau này)
    → Gemini (chỉ văn bản luận — KHÔNG thuộc tu-tru-api)
```

**Ranh giới trách nhiệm**

| Layer | Thuộc tu-tru-api | Thuộc NLTT Edge |
|-------|-------------------|-----------------|
| Điểm ngày, Trực, sao, giờ Hoàng/Hắc đạo | ✅ | — |
| `breakdown[]` 4 yếu tố + tổng điểm | ✅ | — |
| Lá số tứ trụ, ngũ hành, Dụng/Kỵ thần | ✅ | — |
| Luận văn AI (anchor, follow-up, Bát tự chi tiết) | ❌ | ✅ Gemini |
| Thread chat, quota 10 câu/ngày | ❌ | ✅ pipeline riêng |
| Auth, subscription, credit ledger | ❌ | ✅ Supabase |

---

## 3. Baseline — endpoint đang dùng

| Method | Path | bat-tu `op` | Màn Direction C |
|--------|------|-------------|-----------------|
| GET | `/v1/ngay-hom-nay` | `ngay-hom-nay` | 12 `/lich` |
| GET | `/v1/lich-thang` | `lich-thang` | 13 `/lich/thang` |
| GET | `/v1/day-detail` | `day-detail` | 14 `/ngay/:ngay`, 15 `/luan-ai/day-*` |
| POST | `/v1/chon-ngay` | `chon-ngay` | **19–21** `/tra-cuu` (overlay G10 → `/tra-cuu/ket-qua`) |
| POST | `/v1/chon-ngay/detail` | `chon-ngay/detail` | 21 tap row → `/ngay/:ngay` |
| POST | `/v1/tu-tru` | `tu-tru` / `recompute-la-so` | Onboarding 09–11, G1 |
| GET | `/v1/la-so` | `la-so` | 18 `/toi/luan-bat-tu` (payload AI) |
| GET | `/v1/tieu-van` | `tieu-van` | Tiểu vận (ngoài band 15–18) |
| POST | `/v1/hop-tuoi` | `hop-tuoi` | 22–23 |
| GET | `/v1/phong-thuy` | `phong-thuy` | Hold (không route C v1) |
| GET | `/v1/convert-date` | `convert-date` | 24 chuyển lịch |
| GET | `/v1/weekly-summary` | `weekly-summary` | Legacy (deprecated C) |
| POST/GET | `/v1/profile` | `profile` | Sync birth profile |

**Ghi chú OpenAPI:** Response schema hầu hết `{}` rỗng — NLTT map field linh hoạt (`app/lib/day-detail-view.ts`, `home-bat-tu.ts`, `la-so-ui.ts`). Pivot cần **contract ổn định có version** cho các field dưới đây.

---

## 4. Yêu cầu theo mức ưu tiên

### P0 — Blocker pivot (W4 đã ship / cần upstream xác nhận)

#### REQ-P0-01 · `GET /v1/day-detail` — chế độ **generic** (anonymous G5)

**Vấn đề:** OpenAPI bắt buộc `birth_date*`. Direction C cần trang công khai `/ngay/:ngay` **không cá nhân hoá** khi chưa đăng nhập (lịch chung + CTA đăng nhập), không 401.

**Đề xuất (chọn một):**

**A — Mở rộng endpoint hiện có**

```
GET /v1/day-detail?date=YYYY-MM-DD&mode=generic&tz=Asia/Ho_Chi_Minh
```

- `birth_date`, `birth_time`, `gender` **không bắt buộc** khi `mode=generic`.
- Response: lịch âm/dương, Can Chi ngày, Trực, sao, giờ Hoàng/Hắc đạo, **điểm generic** (không lá số), `personalized: false`.
- **Không** trả `breakdown` cá nhân hoá; có thể trả `breakdown_generic[]` 4 yếu tố lịch thuần (không “với mệnh của bạn”).

**B — Endpoint mới**

```
GET /v1/day-detail/generic?date=YYYY-MM-DD&tz=...
```

**Acceptance (NLTT):**

- Edge `bat-tu` op `day-detail` với body `{ date }` only → 200 + JSON usable.
- FE `CDayDetailScreen` anon hiển thị lịch-tờ + methodology, không crash.

---

#### REQ-P0-02 · `breakdown[]` ổn định — 4 yếu tố có nguồn (màn 15 + 14)

**Vấn đề:** UI Direction C hiển thị **Phân tích chi tiết · 4 yếu tố** deterministic (không LLM). Hiện app fallback ghép từ `trucTitle`, `starLine`, `reasonLines` khi thiếu `breakdown`.

**Yêu cầu response (personalized `day-detail` và `chon-ngay/detail`):**

```json
{
  "score": 76,
  "grade": "B",
  "breakdown": [
    {
      "id": "truc",
      "source": "Trực ngày",
      "source_ref": 1,
      "type": "Định",
      "points": 24,
      "reason_vi": "Trực Định — vững vàng, hợp ký kết…"
    },
    {
      "id": "sao28",
      "source": "Nhị thập bát tú",
      "source_ref": 2,
      "type": "Thiên Đức",
      "points": 20,
      "reason_vi": "…"
    },
    {
      "id": "can_chi_laso",
      "source": "Can chi · tương sinh với lá số",
      "source_ref": 3,
      "type": "Mậu Tuất → Quý Thủy",
      "points": 18,
      "reason_vi": "…"
    },
    {
      "id": "gio_vang",
      "source": "Giờ vàng trong ngày",
      "source_ref": 4,
      "type": "Thìn 7–9h · Mùi 13–15h",
      "points": 14,
      "reason_vi": "…"
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

| Field | Bắt buộc | Ghi chú |
|-------|----------|---------|
| `breakdown` | Có (personalized) | **Đúng 4 phần tử**, thứ tự cố định |
| `breakdown[].source_ref` | Khuyến nghị | Map citation `[1]`–`[4]` cho LLM + UI |
| `breakdown[].points` | Có | Tổng ≈ `score` (cho phép làm tròn ±1) |
| `sources[]` | Khuyến nghị | FE không hard-code nguồn nữa |

**Acceptance:** `buildDayLuanSectionRows()` không cần fallback heuristic; màn 15 sectioned panel luôn đủ 4 hàng.

---

#### REQ-P0-03 · `score` + methodology block (màn 12–14)

**Yêu cầu thêm (day-detail, ngay-hom-nay, lich-thang per-day):**

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

**Acceptance:** Collapsible **「Cách tính điểm」** trên `/ngay/:ngay` render từ API, không copy tĩnh.

---

#### REQ-P0-04 · `GET /v1/lich-thang` — score + âm lịch trên từng ô

**Yêu cầu:** Mỗi phần tử trong `days[]` (hoặc tương đương) **ổn định**:

| Field | Type | UI |
|-------|------|-----|
| `date` | `YYYY-MM-DD` | Tap → `/ngay/:ngay` |
| `lunar_day` | string | Ô lịch tháng (vd. `"初五"`) |
| `score` | number 0–100 hoặc null | Chấm chấm màu |
| `day_type` | enum | `tot` / `trung` / `xau` fallback khi thiếu score |

**Acceptance:** `CMonthScreen` không suy điểm từ `dayType` khi engine đã có score.

---

### P1 — Hỗ trợ pipeline luận ngày (W5b — engine context, không phải chat)

> NLTT sẽ có Edge **`day-luan-chat`** riêng (SSE, quota, thread). tu-tru-api chỉ cung cấp **facts gói sẵn** để scope-lock LLM — không implement chat.

#### REQ-P1-01 · `GET /v1/day-detail/luan-context` (endpoint mới)

**Mục đích:** Một payload compact, deterministic, dùng làm system context cho anchor + follow-up (thay vì gửi raw JSON day-detail đầy đủ).

```
GET /v1/day-detail/luan-context
  ?birth_date=dd/mm/yyyy&birth_time=&gender=&date=YYYY-MM-DD&tz=Asia/Ho_Chi_Minh
```

**Response gợi ý:**

```json
{
  "date_iso": "2026-05-26",
  "date_display_vi": "26.05.2026 · Thứ Ba",
  "can_chi": "Mậu Tuất",
  "score": 76,
  "menh_user": "Quý Thủy",
  "nhat_chu": "Quý",
  "breakdown_summary": [ "…4 dòng tóm tắt…" ],
  "gio_tot": [ { "label_vi": "Thìn 7–9h sáng", "reason_vi": "…" } ],
  "gio_tranh": [ "Tỵ", "Ngọ" ],
  "sources": [ { "ref": 1, "title_vi": "…" } ],
  "scope_hint_vi": "Chỉ trả lời về ngày 26.05.2026 và lá số Quý Thủy.",
  "suggested_followups": [
    "Giờ nào trong ngày tốt nhất?",
    "Hôm nay có nên ký hợp đồng không?",
    "So sánh với ngày mai"
  ]
}
```

**Acceptance:** Edge `day-luan-chat` inject payload này vào prompt; không cần post-process citation từ field thiếu.

---

#### REQ-P1-02 · `GET /v1/day-compare` (endpoint mới)

**Mục đích:** Chip follow-up **「So sánh với ngày mai」** — engine trả facts, LLM chỉ diễn đạt.

```
GET /v1/day-compare
  ?birth_date=…&birth_time=…&gender=…
  &date_a=YYYY-MM-DD&date_b=YYYY-MM-DD&tz=…
```

**Response:**

```json
{
  "date_a": { "date_iso": "…", "score": 76, "headline_vi": "…" },
  "date_b": { "date_iso": "…", "score": 68, "headline_vi": "…" },
  "comparison_vi": "Ngày A thuận hơn cho ký kết vì…",
  "better_for": ["ky_hop_dong"],
  "delta_score": 8
}
```

**Acceptance:** Follow-up compare không bịa số từ LLM khi user hỏi so sánh 2 ngày.

---

#### REQ-P1-03 · Đồng bộ shape `day-detail` ↔ `chon-ngay/detail`

**Yêu cầu:** Cùng schema `breakdown`, `sources`, `score_methodology`, `gio_tot`/`gio_xau` slots cho:

- `GET /v1/day-detail`
- `POST /v1/chon-ngay/detail`

**Acceptance:** Một mapper FE (`parseDayDetailForView`) — không nhánh riêng cho chọn ngày.

---

#### REQ-P1-04 · `POST /v1/chon-ngay` — response xếp hạng ổn định (W6 · màn 19–21)

**Vấn đề:** FE W6 đã ship (`app/lib/chon-ngay-result.ts`, `app/lib/tra-cuu-pick.ts`) nhưng phải quét ~12 tên field (`recommended_dates`, `top_days`, `days`, …) vì OpenAPI/schema `{}` rỗng. Pivot cần **top N ngày** có `score` + metadata hiển thị trên `/tra-cuu/ket-qua` và empty state rõ ràng.

**Request (đã gửi từ NLTT):**

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

| Param | Bắt buộc | Ghi chú |
|-------|----------|---------|
| `intent` | Có | Enum 26 việc (đồng bộ NLTT `TuTruIntent`) |
| `range_start` / `range_end` | Có | Inclusive; NLTT gửi `dd/mm/yyyy` |
| `top_n` | Khuyến nghị | Default **5** (FE W6); max 10 |

**Response gợi ý (canonical — ưu tiên tên field cố định):**

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
      "lunar_label": "初八",
      "truc": "Định",
      "gio_tot": [
        { "chi": "Thìn", "start_hour": 7, "end_hour": 9, "label_vi": "Thìn 7–9h" }
      ],
      "reason_vi": "Trực Định · Can Chi thuận nhật chủ · giờ Hoàng đạo sáng."
    }
  ],
  "score_methodology": {
    "summary_vi": "Điểm tổng hợp từ Trực, sao, Can Chi với lá số, và giờ vàng — có trọng số theo việc đã chọn.",
    "weights": [
      { "factor": "truc", "label_vi": "Trực ngày", "max_points": 30 },
      { "factor": "sao28", "label_vi": "Nhị thập bát tú", "max_points": 25 },
      { "factor": "can_chi_laso", "label_vi": "Can chi · lá số", "max_points": 25 },
      { "factor": "gio_vang", "label_vi": "Giờ vàng", "max_points": 20 }
    ]
  },
  "empty_reason_vi": null
}
```

**Empty (không có ngày trong khoảng):**

- HTTP **200** + `"ranked_days": []` + `empty_reason_vi` (vd. *「Không có ngày đạt ngưỡng cho việc này trong khoảng đã chọn」*).
- **Không** trả 404/422 mơ hồ — FE route `/tra-cuu/khong-co-ngay` cần meta `intent` + range.

| Field | Bắt buộc | UI W6 |
|-------|----------|-------|
| `ranked_days[]` | Có (array, có thể rỗng) | Danh sách `/tra-cuu/ket-qua` |
| `ranked_days[].date` | Có | `YYYY-MM-DD` — tap → `/ngay/:ngay` |
| `ranked_days[].score` | Khuyến nghị | Chấm điểm + grade A/B/C |
| `ranked_days[].rank` | Khuyến nghị | Thứ hạng 1…N |
| `ranked_days[].reason_vi` | Khuyến nghị | Dòng tóm tắt dưới ngày |
| `score_methodology` | Khuyến nghị | Collapsible **「Cách chọn ngày」** (hiện copy tĩnh — cần API) |

**Acceptance:**

- `mapChonNgayPayloadToResultDays()` đọc **`ranked_days` trước**, không cần heuristic array keys.
- Response &lt; **8s** p95 cho `top_n=5`, range 90 ngày (align overlay slow threshold G10).
- OpenAPI document đủ schema item `ranked_days[]`.

---

#### REQ-NLTT-01 · Edge `bat-tu` — tra cứu **không trừ credit** (W6 · consumer)

> **Không thuộc tu-tru-api** — ghi ở đây để upstream biết NLTT sẽ gọi `POST /v1/chon-ngay` thường xuyên từ tab Tra cứu mà **không** coi là op trả phí theo lượng.

**Spec pivot (màn 20):** `chon-ngay` từ `/tra-cuu` — **no credit deduct**; gating bằng subscription (`subscription_expires_at`), không `feature_credit_costs`.

**Hiện trạng NLTT (2026-05-27):** Edge `bat-tu` vẫn map `chon-ngay` → `chon_ngay_30/60/90` và trừ `credits_balance` khi `is_free = false`. FE W6 đã ship; **billing chưa khớp spec**.

**Đề xuất patch NLTT (một trong các cách):**

| Cách | Mô tả |
|------|--------|
| A | Body flag `source: "tra_cuu"` → `featureKeyForBilling = null` |
| B | Entitlement-only: có sub active → cho phép; legacy credits chỉ transition window (G4) |
| C | `feature_credit_costs.chon_ngay_*` → `is_free = true` (chỉ dev/staging) |

**Acceptance:** User có sub active tra cứu 5 lần liên tiếp — `credits_balance` không đổi; ledger không có dòng `chon_ngay_*` từ tab Tra cứu.

---

### P2 — Lá số & luận Bát tự (màn 17–18)

#### REQ-P2-01 · `GET /v1/la-so` — contract ngũ hành + trụ

**Yêu cầu document + guarantee:**

| Field | Ghi chú |
|-------|---------|
| `_raw.element_counts` | `{ kim, moc, thuy, hoa, tho }` số — NLTT tính % cột màn 17 |
| `pillars[]` hoặc `thien_can` + `dia_chi` | 4 trụ Niên/Nguyệt/Nhật/Thời |
| `menh`, `nhat_chu`, `dung_than`, `ky_than` | string hiển thị |
| `dai_van.current` | Đại vận hiện tại (màn 17) |

**Acceptance:** `CLaSoFullScreen` đọc từ `profiles.la_so` (POST tu-tru) **hoặc** GET la-so — cùng shape.

---

#### REQ-P2-02 · `GET /v1/la-so/luu-nien` hoặc query `?year=YYYY` (endpoint mới / mở rộng)

**Vấn đề:** Màn 18 title **「Luận giải Bát tự · {năm}」** — Gemini cần facts vận năm, không chỉ tính cách tĩnh.

**Đề xuất:**

```
GET /v1/la-so/luu-nien?birth_date=…&birth_time=…&gender=…&year=2026
```

**Response:** Khối `luu_nien` / `van_nam` (Can Chi năm, tương sinh/khắc với mệnh, tháng nhạy cảm…) — **facts only**, không văn luận dài.

**Acceptance:** Edge `generate-reading` endpoint `la-so-chi-tiet` nhận merged payload `{ la_so, luu_nien_2026 }`.

---

#### REQ-P2-03 · `POST /v1/tu-tru` — version stamp

**Yêu cầu:** Response có `engine_version` / `computed_at` để NLTT invalidate cache lá số khi engine đổi thuật toán (G1 recompute policy).

---

### P3 — Nice-to-have (W6+)

| ID | Yêu cầu | Lý do |
|----|---------|-------|
| REQ-P3-01 | `GET /v1/openapi-changelog` hoặc bump semver trong `/health` | FE/Edge biết breaking change |
| REQ-P3-02 | `gio_tot` / `gio_xau` chuẩn hoá slot `{ chi, start_hour, end_hour, label_vi }` | Bỏ parse string tự do |
| REQ-P3-03 | `purpose_rows[]` (`nen_lam` / `khong_nen` / `trung_lap`) trên day-detail | Màn 14 việc nên/tránh |
| REQ-P3-04 | Rate limit header `X-RateLimit-Remaining` | Edge bat-tu hiển thị lỗi rõ |
| REQ-P3-05 | Deprecate `/v1/weekly-summary` trong docs | Direction C bỏ tab Tuần |
| REQ-P3-06 | `chon-ngay` echo `candidates_scanned` / `days_in_range` | Copy empty state + methodology (minh bạch) |

---

## 5. Endpoint mới — tóm tắt

| Priority | Method | Path | Màn / pipeline |
|----------|--------|------|----------------|
| P0 | GET | `/v1/day-detail/generic` **hoặc** `day-detail?mode=generic` | 14 anon G5 |
| P0 | — | Mở rộng `breakdown` + `sources` + `score_methodology` | 14, 15 |
| P0 | — | Mở rộng `lich-thang` `days[].score`, `lunar_day` | 13 |
| P1 | GET | `/v1/day-detail/luan-context` | Pipeline `day-luan-chat` |
| P1 | GET | `/v1/day-compare` | Màn 15 follow-up |
| P1 | — | Mở rộng `POST /v1/chon-ngay` → `ranked_days[]` + `score_methodology` | W6 màn 19–21 |
| P2 | GET | `/v1/la-so/luu-nien` (hoặc `?year=`) | 18 |
| P2 | — | `la-so` + `tu-tru` contract ổn định | 17, 18 |

---

## 6. Non-goals (không yêu cầu tu-tru-api)

- **Không** SSE streaming chat, `thread_id`, quota 10 câu/ngày — thuộc NLTT Edge + Postgres.
- **Không** gọi Gemini / OpenAI từ tu-tru-api.
- **Không** auth user, subscription, PayOS — NLTT Supabase.
- **Không** multi-profile gia đình — Direction C dropped (single birth profile).

---

## 7. Tiêu chí nghiệm thu chung

1. **OpenAPI** cập nhật schema response (không `{}` rỗng) cho mọi field P0/P1.
2. **Backward compatible:** Field mới optional; client cũ không break.
3. **Timezone:** Default `Asia/Ho_Chi_Minh`; `date` accept `YYYY-MM-DD` (NLTT gửi ISO) ngoài `dd/mm/yyyy` nếu có thể.
4. **Staging:** Deploy preview trên Fly; NLTT trỏ `BAT_TU_BASE_URL` staging để QA.
5. **Fixtures:** 3 JSON mẫu tối thiểu:
   - Personalized day-detail (có `breakdown` 4项)
   - Generic day-detail (anon)
   - la-so + luu-nien 2026
   - `chon-ngay` với `ranked_days` (≥3 items) + empty `ranked_days: []`

---

## 8. Mapping NLTT sau khi upstream ship

| Upstream | bat-tu `op` (dự kiến) | FE |
|----------|-------------------------|-----|
| `day-detail?mode=generic` | `day-detail` body `{ date }` | `CDayDetailScreen` anon |
| `luan-context` | `day-luan-context` (mới) | `day-luan-chat` Edge |
| `day-compare` | `day-compare` (mới) | Màn 15 chip / chat |
| `la-so/luu-nien` | `la-so-luu-nien` (mới) | `CBaziReadingScreen` |
| `chon-ngay` `ranked_days[]` | `chon-ngay` (giữ op) | `tra-cuu.ket-qua`, `chon-ngay-result.ts` |
| — | `bat-tu` REQ-NLTT-01 billing bypass | `/tra-cuu` overlay pick |

---

## 9. Liên hệ & tài liệu tham chiếu

| Tài liệu | Path / URL |
|----------|------------|
| Swagger UI | https://tu-tru-api.fly.dev/docs#/ |
| OpenAPI JSON | https://tu-tru-api.fly.dev/openapi.json |
| NLTT mapper day-detail | `app/lib/day-detail-view.ts` |
| NLTT bat-tu proxy | `supabase/functions/bat-tu/index.ts` |
| Pivot plan W4–W6 | `artifacts/plans/direction-c-pivot-plan.md` |
| NLTT tra cứu pick | `app/lib/tra-cuu-pick.ts` · `app/hooks/useTraCuuPickOverlay.ts` |
| FE Handoff Phase 8 | `artifacts/design/ngaylanhthangtot-vn/FE-HANDOFF.md` |
| API spec nội bộ (hop-tuoi) | `artifacts/docs/api-spec.md` |

---

## 10. Lịch đề xuất phía upstream

| Tuần | Deliverable |
|------|-------------|
| T0 | Xác nhận REQ-P0-01..04 + sample JSON |
| T1 | Ship P0 lên staging |
| T2 | P1 `luan-context` + `day-compare` (blocking W5b chat pipeline) |
| T2 | P1 `chon-ngay` `ranked_days[]` contract (W6 FE đã ship) |
| T3 | P2 `la-so/luu-nien` + OpenAPI schemas đầy đủ |
| T3 | NLTT REQ-NLTT-01 billing bypass tra cứu |

**Owner phía NLTT:** Tech Lead — nhận PR/upstream release, cập nhật `bat-tu` ops + mappers, QA W4–W6.
