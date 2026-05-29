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

function unwrapFactsRoot(data: unknown): Record<string, unknown> | null {
  const root = asRecord(data);
  if (!root) return null;
  return asRecord(root.data) ?? asRecord(root.result) ?? root;
}

export type LuuNienLifeArea = {
  id: string;
  label: string;
  verdict: string;
  detail: string;
};

export type LuuNienWarning = {
  title: string;
  body: string;
};

export type LuuNienQuyNhanFacts = {
  tuoiHop: string[];
  tuoiXung: string[];
  huongQuyNhan: string | null;
  note: string | null;
};

/** `LuuNienResponse.dai_van_next` — §05 block Đại vận năm tới. */
export type DaiVanNextView = {
  display: string;
  themeVi: string | null;
  yearsLabel: string | null;
};

export type LuuNienFactsView = {
  yearCanChi: string | null;
  yearRating: string | null;
  yearTheme: string | null;
  lifeAreas: LuuNienLifeArea[];
  warnings: LuuNienWarning[];
  monthScores: number[];
  quyNhan: LuuNienQuyNhanFacts | null;
  daiVanNext: DaiVanNextView | null;
};

function stringList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const x of raw) {
    if (typeof x === "string" && x.trim()) out.push(x.trim());
    else {
      const o = asRecord(x);
      if (o) {
        const n = pickStr(o, ["name", "label", "tuoi", "chi"]);
        if (n) out.push(n);
      }
    }
  }
  return out;
}

function parseLifeAreas(raw: unknown): LuuNienLifeArea[] {
  if (!Array.isArray(raw)) return [];
  const out: LuuNienLifeArea[] = [];
  for (const item of raw) {
    const o = asRecord(item);
    if (!o) continue;
    const label = pickStr(o, ["label_vi", "label", "title", "name"]);
    const verdict = pickStr(o, [
      "verdict_vi",
      "outlook_vi",
      "verdict",
      "rating",
      "value",
    ]);
    const detail = pickStr(o, ["detail_vi", "detail", "description", "text"]);
    if (!label && !detail) continue;
    out.push({
      id: pickStr(o, ["id", "key"]) || label || `area-${out.length}`,
      label: label || "—",
      verdict: verdict || "—",
      detail: detail || "",
    });
  }
  return out;
}

function parseWarnings(raw: unknown): LuuNienWarning[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === "string" && item.trim()) {
        return { title: "Cảnh báo", body: item.trim() };
      }
      const o = asRecord(item);
      if (!o) return null;
      const title = pickStr(o, ["title_vi", "title", "label"]) || "Cảnh báo";
      const body = pickStr(o, ["body_vi", "body", "detail", "text", "message"]);
      if (!body) return null;
      return { title, body };
    })
    .filter((x): x is LuuNienWarning => x != null);
}

function parseMonthScores(raw: unknown): number[] {
  if (Array.isArray(raw)) {
    const nums = raw
      .map((x) => {
        if (typeof x === "number" && Number.isFinite(x)) return Math.round(x);
        const o = asRecord(x);
        if (o) {
          const s = o.score ?? o.value ?? o.diem;
          if (typeof s === "number" && Number.isFinite(s)) return Math.round(s);
        }
        return null;
      })
      .filter((x): x is number => x != null);
    if (nums.length >= 12) return nums.slice(0, 12);
  }
  const o = asRecord(raw);
  if (o) {
    const months = o.months ?? o.thang;
    if (Array.isArray(months)) {
      return parseMonthScores(months);
    }
  }
  return [];
}

function formatYearsRange(raw: unknown): string | null {
  if (Array.isArray(raw) && raw.length >= 2) {
    const a = raw[0];
    const b = raw[1];
    if (typeof a === "number" && typeof b === "number") {
      return `${a}–${b}`;
    }
    if (typeof a === "string" && typeof b === "string") {
      return `${a.trim()}–${b.trim()}`;
    }
  }
  return null;
}

function parseDaiVanNext(raw: unknown): DaiVanNextView | null {
  const o = asRecord(raw);
  if (!o) return null;
  const display = pickStr(o, ["display", "label", "can_chi", "canChi"]);
  const themeVi =
    pickStr(o, ["theme_vi", "themeVi", "summary_vi", "summary"]) || null;
  const yearsLabel =
    formatYearsRange(o.age_range ?? o.ageRange) ||
    formatYearsRange(o.start_year ?? o.startYear) ||
    pickStr(o, ["years", "year_range", "age_range_label"]) ||
    null;
  if (!display && !themeVi) return null;
  return { display, themeVi, yearsLabel };
}

function parseQuyNhan(root: Record<string, unknown>): LuuNienQuyNhanFacts | null {
  const block =
    asRecord(root.quy_nhan) ??
    asRecord(root.quyNhan) ??
    asRecord(root.quy_nhan_luu_y) ??
    null;
  const tuoiHop = stringList(
    block?.tuoi_hop ?? block?.tuoiHop ?? root.tuoi_hop ?? root.tuoiHop,
  );
  const tuoiXung = stringList(
    block?.tuoi_xung ?? block?.tuoiXung ?? root.tuoi_xung ?? root.tuoiXung,
  );
  const huongQuyNhan =
    pickStr(block ?? root, [
      "huong_quy_nhan",
      "huongQuyNhan",
      "quy_nhan_huong",
    ]) || null;
  const note =
    pickStr(block ?? root, ["note_vi", "note", "summary"]) || null;
  if (tuoiHop.length === 0 && tuoiXung.length === 0 && !huongQuyNhan && !note) {
    return null;
  }
  return { tuoiHop, tuoiXung, huongQuyNhan, note };
}

/** Parse `GET /v1/la-so/luu-nien` — tolerant until API team locks schema. */
export function parseLuuNienFactsView(data: unknown): LuuNienFactsView | null {
  const root = unwrapFactsRoot(data);
  if (!root) return null;

  const yearCanChi =
    pickStr(root, [
      "year_can_chi",
      "yearCanChi",
      "can_chi_year",
      "year_label_vi",
      "yearLabelVi",
    ]) || null;

  const yearRating =
    pickStr(root, ["year_rating", "yearRating", "rating_vi", "danh_gia_nam"]) ||
    null;
  const yearTheme =
    pickStr(root, [
      "year_theme_vi",
      "yearThemeVi",
      "year_theme",
      "theme_vi",
      "nhip_nam",
    ]) || null;

  const lifeAreas = parseLifeAreas(
    root.life_areas ?? root.lifeAreas ?? root.linh_vuc,
  );
  const warnings = parseWarnings(root.warnings ?? root.canh_bao);
  const monthScores = parseMonthScores(
    root.month_score_values ??
      root.monthScoreValues ??
      root.month_scores ??
      root.monthScores ??
      root.van_12_thang,
  );
  const quyNhan = parseQuyNhan(root);
  const daiVanNext = parseDaiVanNext(root.dai_van_next ?? root.daiVanNext);

  if (
    !yearCanChi &&
    !yearRating &&
    !yearTheme &&
    lifeAreas.length === 0 &&
    warnings.length === 0 &&
    monthScores.length === 0 &&
    !quyNhan &&
    !daiVanNext
  ) {
    return null;
  }

  return {
    yearCanChi,
    yearRating,
    yearTheme,
    lifeAreas,
    warnings,
    monthScores,
    quyNhan,
    daiVanNext,
  };
}
