/** Compact chon-ngay context for Tra cứu results chat. */

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

function asRecord(x: unknown): Record<string, unknown> | null {
  if (x && typeof x === "object" && !Array.isArray(x)) {
    return x as Record<string, unknown>;
  }
  return null;
}

function pickIso(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim().slice(0, 10);
  return ISO_DAY.test(t) ? t : null;
}

function pickIsoFromRow(obj: Record<string, unknown>): string | null {
  for (const k of ["iso_date", "solar_date", "date", "ngay", "date_solar"]) {
    const v = obj[k];
    if (typeof v === "string") {
      const iso = pickIso(v);
      if (iso) return iso;
    }
  }
  return null;
}

function pickString(obj: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

export type TraCuuResultsPickMeta = {
  intent: string;
  intent_label: string;
  range_start: string;
  range_end: string;
};

export function buildTraCuuSessionKey(meta: TraCuuResultsPickMeta): string {
  return `${meta.intent}:${meta.range_start}:${meta.range_end}`.slice(0, 128);
}

export function buildTraCuuResultsPickContext(
  payload: unknown,
  meta: TraCuuResultsPickMeta,
): Record<string, unknown> {
  const root = asRecord(payload) ?? {};
  const metaBlock = asRecord(root.meta) ?? root;
  const ranked: Record<string, unknown>[] = [];

  const arrays = [
    root.ranked_days,
    root.recommended_dates,
    root.top_dates,
    root.days,
  ];
  for (const arr of arrays) {
    if (!Array.isArray(arr)) continue;
    for (const item of arr) {
      if (ranked.length >= 8) break;
      const obj = asRecord(item);
      if (!obj) continue;
      const iso = pickIsoFromRow(obj);
      if (!iso) continue;
      ranked.push({
        date_iso: iso,
        score: typeof obj.score === "number" ? obj.score : undefined,
        grade: pickString(obj, ["grade"]),
        can_chi: pickString(obj, ["can_chi_day", "can_chi", "day_can_chi"]),
        lunar_label: pickString(obj, ["lunar_date", "lunar_label", "am_lich"]),
        truc: pickString(obj, ["truc", "truc_ngay"]),
        reason_vi: pickString(obj, ["reason_vi", "summary_vi", "one_liner"]),
        gio_tot: obj.gio_tot ?? obj.time_slots,
      });
    }
    if (ranked.length > 0) break;
  }

  const batTu = asRecord(metaBlock.bat_tu_summary) ?? metaBlock;

  return {
    endpoint: "tra-cuu-results",
    intent: meta.intent,
    intent_label: meta.intent_label,
    range_start: meta.range_start,
    range_end: meta.range_end,
    bat_tu_summary: {
      menh: pickString(batTu, ["menh", "menh_user"]),
      dung_than: pickString(batTu, ["dung_than", "dungThan"]),
      summary_vi: pickString(batTu, ["summary_vi", "summary"]),
    },
    ranked_days: ranked,
    scope_hint_vi:
      `Giao diện chỉ hiện 3 ngày đầu; còn lại trong ranked_days — khi người dùng hỏi thêm, gợi ý từ pool đó. Chỉ luận về các ngày trong danh sách gợi ý cho việc «${meta.intent_label}», theo lá số của người dùng. Không bịa ngày ngoài danh sách.`,
    anchor_question_hint_vi:
      "Giải thích ngày nào trong danh sách phù hợp và vì sao, hoặc trả lời câu hỏi cụ thể về một ngày đã gợi ý.",
  };
}
