# API spec (tu-tru-api) — nguồn: OpenAPI tại `https://tu-tru-api.fly.dev/openapi.json`

Chi tiết **phản hồi v2** dưới đây phản ánh trường mà app **Ngày Lành Tháng Tốt** đọc (mapper: `app/lib/hop-tuoi-result.ts`). OpenAPI có thể khai báo response dạng object rỗng; khi upstream bổ sung field, ưu tiên contract thực tế JSON.

Ref: [Swagger hop-tuoi](https://tu-tru-api.fly.dev/docs#/default/hop_tuoi_endpoint_v1_hop_tuoi_post).

---

## POST `/v1/hop-tuoi`

### Body — `HopTuoiRequest`

| Field | Bắt buộc | Ghi chú |
|--------|----------|---------|
| `person1_birth_date` | Có | Chuỗi ngày sinh người 1 (định dạng API, thường `dd/mm/yyyy`). |
| `person2_birth_date` | Có | Chuỗi ngày sinh người 2. |
| `person1_birth_time`, `person1_gender`, `person2_birth_time`, `person2_gender` | Tuỳ | Mã giờ can chi (0,2,…,23) / giới tính `1` (nam), `-1` (nữ). |
| `relationship_type` | Không | **Không gửi hoặc để trống** → phản hồi **v1**. **Gửi một giá trị enum** → phản hồi **v2** (định tính: verdict, criteria, …). |

### `relationship_type` (enum chuỗi)

| Giá trị | Ý nghĩa gợi ý |
|---------|----------------|
| `PHU_THE` | Phu thê / vợ chồng |
| `DOI_TAC` | Đối tác |
| `SEP_NHAN_VIEN` | Sếp — nhân viên |
| `DONG_NGHIEP` | Đồng nghiệp |
| `BAN_BE` | Bạn bè |
| `PHU_TU` | Phụ — tử |
| `ANH_CHI_EM` | Anh chị em |
| `THAY_TRO` | Thầy — trò |

### Phản hồi — envelope

JSON có thể là object phẳng hoặc lồng một trong: `data`, `result`, `hop_tuoi`. App chọn object lồng đầu tiên có dữ liệu, rồi fallback root.

---

## v1 (`version: 1` hoặc không gửi `relationship_type`)

Đặc trưng: **điểm 0–100** + grade/chữ cái + Nạp Âm (tóm tắt).

| Field | Ghi chú |
|--------|---------|
| `version` | `1` hoặc không có. |
| `overall_score`, `score`, `diem`, `hop_diem`, `compatibility_score` | Một trong các key điểm 0–100; v1 thiếu điểm có fallback hiển thị nội bộ (không áp dụng cho v2). |
| `grade`, `letter_grade`, … | Chữ cái / nhãn bậc. |
| `nap_am_1`, `nap_am_2` hoặc `person1`/`person2`.`menh` | Nạp Âm. |
| `summary`, `nap_am_relation`, `ngu_hanh_relation`, … | Tóm tắt quan hệ Nạp Âm / ngũ hành. |
| `person1`, `person2` | Tuỳ chọn — xem mục [Person](#person-object-person1--person2). |

---

## v2 (`version: 2` khi có `relationship_type`)

Đặc trưng: **định tính** — verdict, mức đánh giá, tiêu chí có sentiment, diễn giải, gợi ý. **Không bắt buộc** có điểm 0–100; nếu API **không** gửi trường điểm, app **không** hiển thị vòng `/100`.

| Field | Ghi chú |
|--------|---------|
| `version` | `2`. |
| `verdict` | Kết luận ngắn (tiếng Việt), hiển thị làm headline / chip. |
| `verdict_level` / `verdictLevel` | Số nguyên **1–4** (thang mức đánh giá). App map: 1 → Cần lưu ý, 2 → Trung bình, 3 → Hợp, 4 → Rất hợp khi không có `verdict`. |
| `relationship_type` / `relationshipType` | Echo enum (debug / chip phụ). |
| `relationship_label` / `relationshipLabel` | Nhãn hiển thị (vd. «Đối tác», «Phu Thê»). Thiếu thì app map từ `relationship_type`. |
| `criteria` | Mảng tiêu chí — xem [Criteria item](#v2-criteria-item). |
| `reading` / `reading_vi`, `doc`, `diễn giải`, … | **Diễn giải** (khối UI «Diễn giải»). |
| `advice` / `loi_khuyen`, … | **Gợi ý** (khối «Gợi ý»). |
| `overall_score`, `score`, … | **Tuỳ chọn** trên v2 — chỉ khi có thì app hiện vòng điểm kèm disclaimer «do API gửi kèm». |
| `nap_am_1`, `nap_am_2`, `summary`, … | Nạp Âm / tóm tắt kỹ thuật — tách với reading; nếu trùng nội dung `reading`, app thay bằng dòng tóm tắt ngắn. |
| `person1`, `person2` | Tuỳ chọn — [Person](#person-object-person1--person2). |

### v2 — `criteria` item

Mỗi phần tử là **chuỗi** (chỉ tên tiêu chí, sentiment `unknown`) hoặc **object**:

| Field | Ghi chú |
|--------|---------|
| `name` | Ưu tiên; nếu thiếu có thể lấy `label`, `title`, `key`, `text`, `criterion` (tránh dùng `text` cho đoạn dài làm tên). |
| `sentiment` | Trạng thái: app chuẩn hoá về `positive` \| `neutral` \| `negative` \| `unknown`. API có thể gửi enum tiếng Anh (`positive`, …) hoặc cụm tiếng Việt; có xử lý đặc biệt vd. «Không tốt» → `negative`. |
| `description` | Mô tả chi tiết; app hiển thị trong accordion. Có thể dùng synonym: `detail`, `mo_ta`, `reading`, `text`, `body` (ưu tiên không trùng toàn bộ với `name`). |

Thứ tự hiển thị sau khi map: **negative → unknown → neutral → positive** (ưu tiên rủi ro lên trước).

### Person object (`person1` / `person2`)

| Field | Ghi chú |
|--------|---------|
| `birth_date` / `birthDate` | Ngày sinh (chuỗi API). |
| `menh`, `nap_am`, `nap_am_name`, `name` | Nạp Âm / tên cột. |
| `hanh`, `ngu_hanh`, `han` | Hành. |
| `nhatChu`, `nhat_chu`, … | Nhật Chủ. |
| `gender` | `1` Nam, `-1` Nữ. |

---

## Triển khai app

- Proxy Edge: `supabase/functions/bat-tu/index.ts` (forward `relationship_type` trong body `hop-tuoi`).
- Map UI: `app/lib/hop-tuoi-result.ts` (`hopTuoiPayloadToPanel`), `app/components/hop-tuoi/HopTuoiResultPanel.tsx`.
