/**
 * Compact facts bundle for Gemini day-luan prompts.
 * Mirrors REQ-P1-01 `luan-context` until tu-tru-api ships the endpoint.
 * Keep in sync with `app/lib/day-luan-prompt-context.ts` (tests).
 */

export type DayLuanPromptSource = {
  ref: number;
  title_vi: string;
};

export type DayLuanBreakdownSummary = {
  id: "truc" | "sao28" | "can_chi_laso" | "gio_vang";
  label_vi: string;
  source_ref: number;
  verdict_vi: string;
  points: number | null;
  reason_vi: string;
};

export type DayLuanPromptContext = {
  date_iso: string;
  score: number | null;
  grade: string | null;
  can_chi_day: string | null;
  menh_user: string | null;
  breakdown_summary: DayLuanBreakdownSummary[];
  gio_tot: string[];
  gio_xau: string[];
  sources: DayLuanPromptSource[];
  scope_hint_vi: string;
  anchor_question_hint_vi: string;
};

export const DEFAULT_DAY_LUAN_SOURCES: readonly DayLuanPromptSource[] = [
  { ref: 1, title_vi: "Hiệp Kỷ Biện Phương — Trực ngày" },
  { ref: 2, title_vi: "Ngọc Hạp Thông Thư — Thần sát" },
  { ref: 3, title_vi: "Tứ trụ — tương sinh tương khắc với lá số" },
  { ref: 4, title_vi: "Lịch Vạn Niên — giờ Hoàng đạo" },
] as const;

const CANONICAL: readonly {
  id: DayLuanBreakdownSummary["id"];
  label_vi: string;
  source_ref: number;
}[] = [
  { id: "truc", label_vi: "Trực ngày", source_ref: 1 },
  { id: "sao28", label_vi: "Nhị thập bát tú", source_ref: 2 },
  { id: "can_chi_laso", label_vi: "Can chi · tương sinh với lá số bạn", source_ref: 3 },
  { id: "gio_vang", label_vi: "Giờ vàng trong ngày", source_ref: 4 },
];

const BASE_SCORE_RE =
  /điểm cơ bản|base score|^neutral$|nền cố định|mọi ngày bắt đầu/i;

function asRecord(x: unknown): Record<string, unknown> | null {
  if (x && typeof x === "object" && !Array.isArray(x)) {
    return x as Record<string, unknown>;
  }
  return null;
}

function pickStr(obj: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function pickNumber(obj: Record<string, unknown>, keys: string[]): number | null {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && /^-?\d+(\.\d+)?$/.test(v.trim())) {
      return Number(v);
    }
  }
  return null;
}

function pickIso(nested: Record<string, unknown>, root: Record<string, unknown>): string {
  for (const obj of [nested, root]) {
    for (const k of ["date", "date_iso", "iso_date", "isoDate", "ngay"]) {
      const v = obj[k];
      if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v)) {
        return v.slice(0, 10);
      }
    }
  }
  return "";
}

function formatDayShort(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  return `${m[3]}.${m[2]}`;
}

function bucketFactor(row: {
  source: string;
  type: string;
  reason_vi: string;
  id?: string;
}): DayLuanBreakdownSummary["id"] | null {
  const id = row.id?.toLowerCase();
  if (id === "truc") return "truc";
  if (id === "sao28" || id === "sao_28") return "sao28";
  if (id === "can_chi_laso" || id === "can_chi") return "can_chi_laso";
  if (id === "gio_vang" || id === "gio") return "gio_vang";

  const hay = `${row.source} ${row.type} ${row.reason_vi}`.toLowerCase();
  if (BASE_SCORE_RE.test(hay) && !/trực|truc/.test(hay)) return null;
  if (/trực|truc/.test(hay)) return "truc";
  if (/sao|28|tú|thần|sat|star|hung|cat|thiên|cương/.test(hay)) return "sao28";
  if (/can|chi|mệnh|menh|sinh|khắc|lá số|laso|tứ trụ/.test(hay)) {
    return "can_chi_laso";
  }
  if (/giờ|gio|hoang|hoàng|vàng|hour/.test(hay)) return "gio_vang";
  if (/penalty|kỵ|bonus/.test(hay)) return "sao28";
  return null;
}

function parseSources(
  nested: Record<string, unknown>,
): DayLuanPromptSource[] {
  const raw = nested.sources;
  if (!Array.isArray(raw)) return [...DEFAULT_DAY_LUAN_SOURCES];
  const out: DayLuanPromptSource[] = [];
  for (const item of raw) {
    const o = asRecord(item);
    if (!o) continue;
    const ref = pickNumber(o, ["ref", "source_ref", "id"]);
    const title_vi = pickStr(o, ["title_vi", "title", "label"]);
    if (ref != null && ref >= 1 && ref <= 4 && title_vi) {
      out.push({ ref: Math.floor(ref), title_vi });
    }
  }
  return out.length === 4 ? out : [...DEFAULT_DAY_LUAN_SOURCES];
}

function parseGioList(nested: Record<string, unknown>, keys: string[]): string[] {
  for (const k of keys) {
    const v = nested[k];
    if (typeof v === "string" && v.trim()) return [v.trim()];
    if (!Array.isArray(v)) continue;
    const parts: string[] = [];
    for (const item of v) {
      if (typeof item === "string" && item.trim()) parts.push(item.trim());
      else {
        const o = asRecord(item);
        if (!o) continue;
        const chi = pickStr(o, ["chi_name", "chi", "label", "name"]);
        const range = pickStr(o, ["range", "label_vi", "gio"]);
        if (chi && range) parts.push(`${chi} ${range}`);
        else if (range) parts.push(range);
        else if (chi) parts.push(chi);
      }
    }
    if (parts.length) return parts;
  }
  return [];
}

function pickMenh(nested: Record<string, unknown>, root: Record<string, unknown>): string | null {
  for (const obj of [nested, root]) {
    const direct = pickStr(obj, ["menh_user", "menh", "nap_am", "napAm"]);
    if (direct) return direct;
    const laso = asRecord(obj.la_so) ?? asRecord(obj.laso);
    if (laso) {
      const m = pickStr(laso, ["menh", "nap_am", "napAm"]);
      if (m) return m;
    }
    const summary = asRecord(obj.bat_tu_summary) ?? asRecord(obj.batTuSummary);
    if (summary) {
      const m = pickStr(summary, ["menh", "nap_am"]);
      if (m) return m;
    }
  }
  return null;
}

function buildBreakdownSummary(
  nested: Record<string, unknown>,
  root: Record<string, unknown>,
): DayLuanBreakdownSummary[] {
  const pointsById = new Map<
    DayLuanBreakdownSummary["id"],
    { points: number; reason_vi: string; verdict_vi: string }
  >();

  const br = nested.breakdown ?? root.breakdown;
  if (Array.isArray(br)) {
    for (const item of br) {
      const o = asRecord(item);
      if (!o) continue;
      const source = pickStr(o, ["source", "label", "title"]);
      const type = pickStr(o, ["type", "kind", "verdict"]);
      const reason_vi = pickStr(o, ["reason_vi", "reasonVi", "reason", "note"]) || "—";
      const id = pickStr(o, ["id"]);
      const pts = pickNumber(o, ["points", "point", "score"]) ?? 0;
      const bucket = bucketFactor({ source, type, reason_vi, id });
      if (!bucket) continue;
      const prev = pointsById.get(bucket);
      pointsById.set(bucket, {
        points: (prev?.points ?? 0) + pts,
        reason_vi: prev?.reason_vi && prev.reason_vi !== "—" ? prev.reason_vi : reason_vi,
        verdict_vi: type && !/^(neutral|penalty|bonus)$/i.test(type)
          ? type
          : prev?.verdict_vi ?? "",
      });
    }
  }

  const trucName =
    pickStr(nested, ["truc_name", "truc"]) ||
    pickStr(asRecord(nested.truc) ?? {}, ["name"]);
  const trucDisplay = trucName.replace(/^trực\s+/i, "").trim() || trucName;
  const canChi =
    pickStr(nested, ["can_chi", "canChi", "can_chi_day"]) || "—";
  const starName = pickStr(nested, ["star_name", "starName"]);
  const sao28 = pickStr(nested, ["sao_28", "sao28"]);
  const starLine =
    starName && sao28 ? `${starName} · ${sao28}` : starName || sao28;
  const gioTot = parseGioList(nested, [
    "gio_tot",
    "gioTot",
    "gio_hoang_dao",
    "best_hours",
  ]);
  const gioXau = parseGioList(nested, ["gio_xau", "gioXau", "bad_hours"]);

  return CANONICAL.map(({ id, label_vi, source_ref }) => {
    const fromApi = pointsById.get(id);
    let verdict_vi = fromApi?.verdict_vi?.trim() ?? "";
    let reason_vi = fromApi?.reason_vi?.trim() ?? "—";

    if (id === "truc") {
      if (!verdict_vi) verdict_vi = trucDisplay || "—";
      if (reason_vi === "—" && trucName) reason_vi = trucName;
    } else if (id === "sao28") {
      if (!verdict_vi) {
        verdict_vi = (starLine.split("·")[0]?.trim() ?? starLine) || "—";
      }
      if (reason_vi === "—" && starLine) reason_vi = starLine;
    } else if (id === "can_chi_laso") {
      if (!verdict_vi) verdict_vi = canChi !== "—" ? canChi : "—";
      if (reason_vi === "—") {
        reason_vi =
          "Can Chi ngày được đối chiếu với mệnh và Dụng Thần trên lá số của bạn.";
      }
    } else if (id === "gio_vang") {
      if (!verdict_vi) verdict_vi = gioTot[0] ?? "—";
      if (reason_vi === "—") {
        reason_vi = gioTot.length
          ? `Giờ Hoàng đạo: ${gioTot.join(", ")}.`
          : "Chưa có bảng giờ vàng cho ngày này.";
      }
    }

    return {
      id,
      label_vi,
      source_ref,
      verdict_vi: verdict_vi || "—",
      points: fromApi?.points ?? null,
      reason_vi,
    };
  });
}

/** Build REQ-P1-01-shaped context from raw `day-detail` JSON. */
export function buildDayLuanPromptContext(raw: unknown): DayLuanPromptContext {
  const root = asRecord(raw) ?? {};
  const nested =
    asRecord(root.data) ?? asRecord(root.result) ?? asRecord(root.payload) ?? root;

  const date_iso = pickIso(nested, root);
  const score = pickNumber(nested, ["score", "diem", "total_score"]);
  const grade = pickStr(nested, ["grade", "rank", "hang"]) || null;
  const can_chi_day =
    pickStr(nested, ["can_chi", "canChi", "can_chi_day"]) || null;
  const menh_user = pickMenh(nested, root);
  const breakdown_summary = buildBreakdownSummary(nested, root);
  const gio_tot = parseGioList(nested, [
    "gio_tot",
    "gioTot",
    "gio_hoang_dao",
    "best_hours",
  ]);
  const gio_xau = parseGioList(nested, ["gio_xau", "gioXau", "bad_hours"]);
  const sources = parseSources(nested);

  const dayShort = date_iso ? formatDayShort(date_iso) : "ngày này";
  const scope_hint_vi =
    `Chỉ trả lời về ngày ${dayShort} và lá số của bạn — không chat tự do.`;
  const scorePart =
    score != null ? `${score} điểm` : "cách chấm này";
  const anchor_question_hint_vi =
    menh_user != null
      ? `Tại sao ngày ${dayShort} được ${scorePart} với mệnh ${menh_user}?`
      : `Tại sao ngày ${dayShort} được ${scorePart} với mệnh của tôi?`;

  return {
    date_iso,
    score,
    grade,
    can_chi_day,
    menh_user,
    breakdown_summary,
    gio_tot,
    gio_xau,
    sources,
    scope_hint_vi,
    anchor_question_hint_vi,
  };
}
