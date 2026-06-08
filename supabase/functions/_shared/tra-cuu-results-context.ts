/** Compact chon-ngay context for Tra cứu results chat. */

/** Matches `tra_cuu_results_threads.session_key` CHECK constraint. */
export const TRA_CUU_SESSION_KEY_MIN_LEN = 8;
export const TRA_CUU_SESSION_KEY_MAX_LEN = 128;

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

export function isTraCuuIsoDay(raw: string): boolean {
  return ISO_DAY.test(raw.trim().slice(0, 10));
}

export function buildTraCuuSessionKey(meta: TraCuuResultsPickMeta): string {
  return `${meta.intent}:${meta.range_start}:${meta.range_end}`;
}

export function validateTraCuuSessionKey(key: string): boolean {
  const len = key.length;
  return len >= TRA_CUU_SESSION_KEY_MIN_LEN && len <= TRA_CUU_SESSION_KEY_MAX_LEN;
}

/** Returns a Vietnamese-safe reason when meta cannot produce a DB-valid session key. */
export function validateTraCuuResultsPickMeta(
  meta: TraCuuResultsPickMeta,
): string | null {
  if (!meta.intent.trim()) return "Thiếu intent.";
  if (!meta.intent_label.trim()) return "Thiếu intent_label.";
  if (!isTraCuuIsoDay(meta.range_start)) return "range_start không hợp lệ.";
  if (!isTraCuuIsoDay(meta.range_end)) return "range_end không hợp lệ.";
  const key = buildTraCuuSessionKey(meta);
  if (!validateTraCuuSessionKey(key)) {
    return "session_key không hợp lệ.";
  }
  return null;
}

export function parseTraCuuResultsPickMeta(
  raw: Record<string, unknown>,
): TraCuuResultsPickMeta | null {
  const intent = typeof raw.intent === "string" ? raw.intent.trim() : "";
  const intent_label =
    typeof raw.intent_label === "string" ? raw.intent_label.trim() : "";
  const range_start =
    typeof raw.range_start === "string" ? raw.range_start.trim() : "";
  const range_end =
    typeof raw.range_end === "string" ? raw.range_end.trim() : "";
  const meta: TraCuuResultsPickMeta = {
    intent,
    intent_label,
    range_start,
    range_end,
  };
  return validateTraCuuResultsPickMeta(meta) ? null : meta;
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
