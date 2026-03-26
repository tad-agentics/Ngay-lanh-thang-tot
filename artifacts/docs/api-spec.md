# API spec (tu-tru-api) — nguồn: OpenAPI tại `https://tu-tru-api.fly.dev/openapi.json`

## POST `/v1/hop-tuoi`

### Body — `HopTuoiRequest`

| Field | Bắt buộc | Ghi chú |
|--------|----------|---------|
| `person1_birth_date` | Có | Chuỗi ngày sinh người 1 (định dạng API). |
| `person2_birth_date` | Có | Chuỗi ngày sinh người 2. |
| `person1_birth_time`, `person1_gender`, `person2_birth_time`, `person2_gender` | Tuỳ | Giờ (0–23) / giới tính. |
| `relationship_type` | Không | **Để trống** → phản hồi **v1** (`version: 1`, điểm + grade). **Gửi một giá trị** trong tập dưới → phản hồi **v2** (`version: 2`, `verdict`, `criteria`, `reading`, `advice`, …). |

### `relationship_type` (enum chuỗi)

Theo mô tả schema OpenAPI, dùng **một trong**:

- `PHU_THE` — Phu thê / vợ chồng  
- `DOI_TAC` — Đối tác  
- `SEP_NHAN_VIEN` — Sếp — nhân viên  
- `DONG_NGHIEP` — Đồng nghiệp  
- `BAN_BE` — Bạn bè  
- `PHU_TU` — Phụ — tử  
- `ANH_CHI_EM` — Anh chị em  
- `THAY_TRO` — Thầy — trò  

### Phản hồi

- **v1:** `version: 1` (hoặc không có `relationship_type` trên request) — điểm, grade, Nạp Âm, tóm tắt (app map như cũ).  
- **v2:** `version: 2` — `verdict`, `criteria`, `reading`, `advice` (và có thể kèm trường Nạp Âm / điểm tùy engine). App đọc linh hoạt các key lồng `data` / `result`.

Ref: [Swagger hop-tuoi](https://tu-tru-api.fly.dev/docs#/default/hop_tuoi_endpoint_v1_hop_tuoi_post).
