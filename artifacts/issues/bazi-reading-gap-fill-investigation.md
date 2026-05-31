# Bát Tự reading — investigation (2026-05-31)

## `reading_cache` (24h, prod `hptovpbiwvtngorhdhhm`)

| Pattern | Finding |
|---------|---------|
| **§01 `menh_tong_quan`** | Cache hits OK when stored: `menh_max_len` **2167–2939** chars (FE gate 600). Failures on live test are not “short prose in cache” — more likely **empty 200** (rate limit) or **FE never merged** preview sections for that session’s cache key. |
| **§02 `tinh_cach_trait_*`** | Scoped batches often return **2/4** traits only (e.g. `tinh_cach_trait_luu_y`, `tinh_cach_trait_tinh_cam`). |
| **§03 `luu_nien_life_*`** | Scoped life cache often **2/4** (e.g. `suc_khoe`, `tinh_duyen` only) — matches live “Tài lộc & Sự nghiệp chưa luận”. |
| **§05 core** | `luu_nien_nhin_chung, thuc_tien, ung_xu` — stable. |
| **Legacy plain** | Some rows `json_payload=false`, 13–1749 bytes — old/plain endpoints. |

## Edge logs (`generate-reading-la-so`, `generate-reading-luu-nien`)

- All recent invokes **HTTP 200**; durations **17–56s** (near 52s budget).
- Live session pattern: **many `la-so` POSTs** (8+) while §01 empty → mostly **`only_tinh_cach`** retries, not preview scope.
- **`luu-nien` life** ~51–56s per call; parallel Wave 2 + batch gap-fill can still return partial sections.

## Root cause summary

1. **§01:** Wave 2 + end retries started before preview menh succeeded → wasted `la-so` calls; rate-limit empty responses leave UI at 0 chars.
2. **§03:** Batch gap-fill with multiple `luu_nien_life_area_ids` still yields 2/4 in cache; need **one area per invoke** after bundle.
3. **UI:** `chapterVanFailed` flagged whole §03; OK areas showed “chưa luận” — fixed with **`area.luanFailed`**.

## FE changes (this pass)

- Up to **3× preview menh** (11s apart) **before** Wave 2; removed post-bundle menh retry.
- After bundle: **sequential gap-fill** per `tinh_cach_trait_id` / `luu_nien_life_area_id`.
- Outline + `CBaziVanNamSection`: per-area failed state.
