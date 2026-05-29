# Luận giải Bát tự năm (màn 18) — Kiểm tra wire API/BE & yêu cầu còn thiếu

**Route:** `/toi/luan-bat-tu`  
**Design (Direction C):** màn **18** · Luận giải Bát tự năm — spec `artifacts/design/ngaylanhthangtot-vn/FE-HANDOFF.md` §1 (artboard 18), prototype `c-screens-g.jsx` (`CBaziReadingFull`)  
**FE:** `CBaziReadingScreen`, `CBaziReadingPaywallView`, `CBaziReadingChapter`, `CBaziMenhTongQuanBlock`, `CBaziVanNamSection`, `CBaziPhongThuySection`, `CBaziQuyNhanSection`, `bazi-reading-load.ts`, `bazi-reading-outline.ts`, `bazi-reading-session.ts`  
**Tham chiếu tổng:** `artifacts/integrations/tu-tru-api-direction-c-requirements.md` (REQ-P2-01 … P2-05)

> **Thuật ngữ:** **Direction C** là design system / spec sản phẩm. File `c-screens-g.jsx` chỉ là **prototype JSX trong repo** để port — không phải một “design Make” riêng. Khi doc nói “khớp spec” = khớp **Direction C màn 18**, không phải công cụ Figma Make.

---

## 1. Luồng tổng quát (đã wire)

```mermaid
sequenceDiagram
  participant FE as React FE
  participant BT as Edge bat-tu
  participant API as tu-tru-api
  participant GR as Edge generate-reading-*
  participant Gemini as Gemini

  Note over FE: User đã mở khóa (canUseBaziReading)
  par Facts
    FE->>BT: op la-so
    BT->>API: GET /v1/la-so
    FE->>BT: op la-so-luu-nien + year
    BT->>API: GET /v1/la-so/luu-nien
    FE->>BT: op phong-thuy + year + detail=full
    BT->>API: GET /v1/phong-thuy
  end
  par Luận giải
    FE->>GR: la-so-chi-tiet (generate-reading-la-so)
    GR->>Gemini: aspect JSON
    FE->>GR: luu-nien (generate-reading-tieu-van)
    GR->>Gemini: 3 phần JSON
    FE->>GR: phong-thuy (generate-reading-la-so)
    GR->>Gemini: prose
  end
  FE->>FE: buildBaziDisplayChapters → 5 § Direction C
```

**Paywall (chưa mở khóa):**

| Bước | Wire | Ghi chú |
|------|------|---------|
| `bat-tu` → `la-so` + merge enrichment | ✅ | §01 `loadBaziPaywallLaSoDisplay` |
| `profiles.la_so` | ✅ | Fallback nếu `la-so` lỗi |
| `generate-reading` `la-so-chi-tiet` + `preview: true` | ✅ | §02 Tính cách (1 section) |
| `bat-tu` → `la-so-luu-nien` | 🟡 | Chỉ khi đã entitlement — paywall thường 403; tiêu đề fallback “Vận năm” |
| §03–§05 | ⚠️ Mock FE | `bazi-paywall-mock.ts` — blur, không Gemini |

**Session cache (đã mở khóa):** `sessionStorage` v2 (`w11` revision) lưu `sections`, `yearCanChi`, `laSoDisplay`, `luuNienFactsRaw`, `phongThuyFactsRaw`. Cache hit → **không** gọi lại 3× Gemini cho đến khi user bấm **Tải lại** hoặc revision đổi.

---

## 2. Bảng đối chiếu 5 § (Direction C màn 18)

| § | Tiêu đề (Direction C) | Nguồn thiết kế | tu-tru-api (facts) | Edge `bat-tu` op | Edge Gemini | FE hiện tại | Khớp spec UI |
|---|------------------------|----------------|--------------------|------------------|-------------|-------------|--------------|
| **01** | Mệnh tổng quan | `GET /v1/la-so` | REQ-P2-01 | `la-so` | ❌ không LLM | `CBaziMenhTongQuanBlock` — tứ trụ, ngũ hành %, đại vận, dụng/kỵ | 🟡 §02 sub-block tính cách vẫn thiếu |
| **02** | Tính cách · cá tính | `la-so-chi-tiet` | REQ-P2-01b | `la-so` | `tinh_cach` | Prose | 🟡 Thiếu 4 sub-mục structured |
| **03** | Vận năm {Can Chi} | `la-so/luu-nien` | REQ-P2-02 | `la-so-luu-nien` *(gate)* | `luu-nien` → `nhin_chung`, `thuc_tien` *(không gồm `ung_xu`)* | `CBaziVanNamSection` facts + prose | 🟡 Rich UI khi API có `life_areas`, `month_scores` |
| **04** | Phong thủy {Can Chi} | `phong-thuy` | REQ-P2-05 | `phong-thuy` full *(gate)* | `phong-thuy` | `CBaziPhongThuySection` | 🟡 Rich UI khi API có hướng/màu/phi_tinh |
| **05** | Quý nhân · lưu ý | lưu niên facts | REQ-P2-02 `quy_nhan` | *(facts)* | `luu_nien_ung_xu` only | `CBaziQuyNhanSection` | 🟡 Cards tuổi hợp/xung khi API có field |

**Chú thích:** ✅ wire đúng · 🟡 prose/facts tối thiểu · 🔴 cần API field mới

---

## 3. Chi tiết BE (Supabase Edge)

### 3.1 `bat-tu` → tu-tru-api

| Op FE | Path upstream | Gate Bát tự | Dùng ở màn 18 |
|-------|---------------|-------------|----------------|
| `la-so` | `GET /v1/la-so` | Không | Facts §01 + input Gemini |
| `la-so-luu-nien` | `GET /v1/la-so/luu-nien?year=` | **403 `BAZI_READING_LOCKED`** | Facts §03/§05 + input `luu-nien` |
| `phong-thuy` | `GET /v1/phong-thuy?year=&detail=full` | **403** khi `detail=full` | Facts §04 + input `phong-thuy` |

File: `supabase/functions/bat-tu/index.ts`.

### 3.2 `generate-reading-*` (Gemini + `reading_cache`)

| Endpoint | Edge function | Entitlement | Ghi chú |
|----------|---------------|-------------|---------|
| `la-so-chi-tiet` | `generate-reading-la-so` | JWT + `canUseBaziReading` | `preview: true` → không cần entitlement; 1 section |
| `luu-nien` | `generate-reading-tieu-van` | JWT + `canUseBaziReading` | REQ-BE-01 ✅ (`bazi-reading-gate.ts`) |
| `phong-thuy` | `generate-reading-la-so` | JWT + `canUseBaziReading` | REQ-BE-01 ✅ |

Shared gate: `supabase/functions/_shared/bazi-reading-gate.ts` · `requireBaziReadingAuth()`.

**Deploy:** `bat-tu`, `generate-reading-la-so`, `generate-reading-tieu-van`.

### 3.3 Mapping Gemini / facts → chương FE

`buildBaziDisplayChapters()` (`app/lib/bazi-reading-outline.ts`):

| Nguồn | § Direction C |
|-------|----------------|
| `laSo` (merge live + profile) | §01 |
| `tinh_cach` | §02 |
| `luu_nien_*` **trừ** `luu_nien_ung_xu` | §03 prose |
| `phong_thuy_*` | §04 prose |
| `luu_nien_ung_xu` only | §05 prose |
| `parseLuuNienFactsView` | §03 rich + `quyNhan` §05 |
| `parsePhongThuyFactsView` | §04 rich |

Luôn render **5 heading**; `emptyReason` khi thiếu data (REQ-FE-01 ✅).

---

## 4. Yêu cầu API / BE / FE (phần chưa đủ data)

### REQ-BR-01 · §01 — Ngũ hành % + timeline đại vận

**Trạng thái:** ✅ Đã có trên `CBaziMenhTongQuanBlock` khi `laSo` merge từ `loadBaziReadingFull` / paywall live `la-so`.

---

### REQ-BR-02 · §01 — Live `GET /v1/la-so`

**Trạng thái:** ✅ `loadBaziReadingFull` + `loadBaziPaywallLaSoDisplay` gọi `mergeLaSoJsonForChiTietDisplay`.

---

### REQ-BR-03 · §02 — Structured “Tính cách” (optional)

Vẫn một `tinh_cach.text` từ Gemini — cần API hoặc subsections (4 sub-block như prototype màn 18).

---

### REQ-BR-04 · §03 — Facts lưu niên rich

**FE:** `CBaziVanNamSection` + `parseLuuNienFactsView` — chờ API populate `life_areas`, `warnings`, `month_scores`.

---

### REQ-BR-05 · §04 — Facts phong thủy rich

**FE:** `CBaziPhongThuySection` + `parsePhongThuyFactsView` — chờ API đầy đủ OpenAPI fields.

---

### REQ-BR-06 · §05 — Quý nhân

**Trạng thái mapping:** ✅ Không còn gom 4 aspect `la-so-chi-tiet`. Prose = `luu_nien_ung_xu`; cards = `quy_nhan` facts.

**API:** Cần guarantee `quy_nhan`, `dai_van_next` trên lưu niên / lá số.

---

### REQ-BR-07 · Paywall §03–05 — Teaser facts (optional P2)

Mock + blur; có thể thêm teaser deterministic sau.

---

### REQ-BE-01 · Gate `luu-nien` + `phong-thuy`

**Trạng thái:** ✅ Đã triển khai (2026-05-29).

---

### REQ-FE-01 · Luôn 5 chương

**Trạng thái:** ✅ `buildBaziDisplayChapters`.

---

### REQ-FE-02 · Tiêu đề năm không hardcode

**Trạng thái:** ✅ `fallbackFlowYearCanChiLabel` → `""`; tiêu đề “Vận năm” / “Phong thủy năm” khi chưa có `year_can_chi`.

---

## 5. Checklist QA wire (staging)

| # | Test | Kỳ vọng |
|---|------|---------|
| 1 | User có entitlement | 5 §; §02–05 có prose hoặc facts |
| 2 | `la-so-luu-nien` 200 | §03 prose/facts; tiêu đề “Vận năm {Can Chi}” |
| 3 | `phong-thuy` full 200 | §04 |
| 4 | Thiếu `luu-nien` | §03 empty state (heading vẫn có) |
| 5 | Paywall | §01 live lá số; §02 preview; §03–05 blur mock |
| 6 | `preview: true` | 1 section; không full aspect |
| 7 | Vào lại màn trong cùng session | Cache v2 — không gọi lại Gemini |
| 8 | Bấm **Tải lại** | Full load + cập nhật cache |
| 9 | §03 vs §05 | Không trùng đoạn văn `luu_nien_*` |

---

## 6. Tóm tắt cho PM

| Câu hỏi | Trả lời |
|---------|---------|
| Đã gọi đúng API chưa? | **Có** — facts qua `bat-tu`; Gemini qua 2 Edge functions; gate entitlement đồng bộ. |
| Đã khớp Direction C màn 18 chưa? | **Một phần** — 5 § + block §01/§03–05; rich cards phụ thuộc API team. |
| Blocker chính? | Structured facts REQ-P2-02 / P2-05; optional §02 subsections. |
| Paywall? | §01–02 thật; §03–05 mock. |

---

*Cập nhật: 2026-05-29 — thuật ngữ Direction C; audit fixes (prose §03/§05, cache v2, REQ-BE-01).*
