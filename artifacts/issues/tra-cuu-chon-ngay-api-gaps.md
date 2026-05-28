# Issue: Tra cứu `/tra-cuu` — tu-tru-api `chon-ngay` contract gaps

**Status:** open  
**Severity:** BLOCKING (data quality on Tab 2 kết quả)  
**Feature:** tra-cuu / W6 PICKS  
**Owner:** tu-tru-api engine team (not NLTT Supabase `bat-tu`)  
**Reported:** 2026-05-27  
**Resolved:** —

**Spec:** `artifacts/integrations/tu-tru-api-direction-c-requirements.md` — REQ-P0-03, REQ-P1-03, REQ-P1-04, REQ-P3-07 (hop-tuoi)

---

## Description

Direction C Tab **Tra cứu** (`/tra-cuu` → `/tra-cuu/ket-qua`) depends on **`POST /v1/chon-ngay`** for ranked day picks. NLTT Edge proxies via `bat-tu` op `chon-ngay` with `source: "tra_cuu"` (subscription gate only, no credit deduct — REQ-NLTT-01 ✅).

FE audit (2026-05-27) found the **UI shell matches Direction C maket** after NLTT fixes, but **result rows still rely on FE fallbacks** when upstream omits canonical fields. Users may see **synthetic scores** (`gradeToScore`) and **generic reasons** (Trực + giờ tốt) instead of personalized `reason_vi`.

---

## Expected (REQ-P1-04 canonical response)

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
      "lunar_label": "Mùng 3 Tháng Năm",
      "truc": "Định",
      "gio_tot": [
        { "chi": "Thìn", "start_hour": 7, "end_hour": 9, "label_vi": "Thìn 7–9h" }
      ],
      "reason_vi": "Trực Định thuận nhật chủ Quý Thủy — giờ Thìn buổi sáng hoá giải xung Thổ, hợp ký kết."
    }
  ],
  "score_methodology": {
    "summary_vi": "…",
    "weights": []
  },
  "empty_reason_vi": null
}
```

### Field checklist (acceptance)

| Field | Priority | Rule |
|-------|----------|------|
| `ranked_days[]` | **P1** | Fixed key name; OpenAPI item schema; ≥1 fixture with 3–5 rows |
| `ranked_days[].score` | **P1** | Real 0–100; FE must not synthesize from grade |
| `ranked_days[].reason_vi` | **P1** | 1–3 câu tiếng Việt, **cá nhân hoá** với lá số + intent; ≠ nhãn Trực/giờ |
| `score_methodology` | **P0** | Same shape as `day-detail` (REQ-P0-03); FE replaces hard-coded collapsible |
| `empty_reason_vi` | **P1** | When `ranked_days: []` — HTTP 200, explain why (e.g. tháng xung, ngưỡng điểm) |
| `chon-ngay/detail` | **P1** | Same schema as personalized `day-detail` (breakdown 4 yếu tố + `reason_vi`, REQ-P0-02) |

### Anti-patterns (reject in QA)

- Response uses ad-hoc array keys only (`top_dates`, `results`, …) without `ranked_days`
- `reason_vi` = copy of `truc` + list `gio_tot`
- Missing `score` → FE invents 85/88/78 from rank
- Empty search returns 404 or `{}` without `empty_reason_vi`

---

## Actual (2026-05-27 prod / staging)

- NLTT `mapChonNgayPayloadToResultDays()` accepts **11 fallback array keys** — signals unstable upstream shape
- `tra-cuu.ket-qua.tsx` uses `gradeToScore()` when `score` absent
- `TraCuuMethodologyCollapsible` uses **static copy** — no `score_methodology` from API
- `CNoDatesFoundScreen` uses **static empty copy** — no `empty_reason_vi`
- `hop-tuoi`: `criteria[].points` often missing (REQ-P3-07) — FE heuristics from `overall_score`

---

## NLTT blocked until upstream ships

1. Remove `gradeToScore` / Trực·giờ fallback on `/tra-cuu/ket-qua` (map 1:1 `reason_vi` + `score`)
2. Render `TraCuuMethodologyCollapsible` from `score_methodology.summary_vi` (+ weights if present)
3. Render empty state body from `empty_reason_vi`
4. Drop multi-key array parsing once `ranked_days[]` is guaranteed

---

## Fixtures requested (attach to PR / staging)

1. **Happy path:** `CUOI_HOI`, range 30d, profile Lộ Bàng Thổ — 5 `ranked_days` with distinct `reason_vi`
2. **Low-score day:** same profile, one row score ~35 with honest `reason_vi`
3. **Empty:** range with `ranked_days: []` + non-null `empty_reason_vi`
4. **Mirror:** same date in `chon-ngay/detail` and `day-detail` — identical `score` + `breakdown[]`

Deliver JSON to NLTT for regression in `app/lib/chon-ngay-result.ts` tests.

---

## Affected NLTT files (consumer only)

- `app/lib/tra-cuu-pick.ts`
- `app/lib/chon-ngay-result.ts`
- `app/routes/tra-cuu.ket-qua.tsx`
- `app/components/direction-c/TraCuuMethodologyCollapsible.tsx`
- `app/components/direction-c/CNoDatesFoundScreen.tsx`
- `supabase/functions/bat-tu/index.ts` (proxy — no scoring logic)

---

## Fix Notes

Leave blank until tu-tru-api ships canonical schema and NLTT removes fallbacks.
