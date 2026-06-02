import type { VanTrinhNamLuanContext, VanTrinhNamMonthBlock } from "~/lib/van-trinh-nam-types";

function asRecord(x: unknown): Record<string, unknown> | null {
  if (x && typeof x === "object" && !Array.isArray(x)) {
    return x as Record<string, unknown>;
  }
  return null;
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function strArr(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string" && x.trim() !== "");
}

function num(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function parseDayRow(raw: unknown) {
  const r = asRecord(raw);
  if (!r) return null;
  const date = str(r.date);
  if (!date) return null;
  return {
    date,
    date_vi: str(r.date_vi) || date,
    can_chi: str(r.can_chi) || "—",
    grade: str(r.grade) || "—",
    score: num(r.score),
    mitigation_tags: strArr(r.mitigation_tags),
  };
}

function parseMonth(raw: unknown): VanTrinhNamMonthBlock | null {
  const r = asRecord(raw);
  if (!r) return null;
  const monthNum = num(r.month_num);
  if (monthNum < 1 || monthNum > 12) return null;
  const b1 = asRecord(r.b1_month_theme);
  const b3 = asRecord(r.b3_luu_nhat_calendar);
  const b4 = asRecord(r.b4_action);
  if (!b1 || !b3 || !b4) return null;

  const b2Raw = Array.isArray(r.b2_month_emphasis) ? r.b2_month_emphasis : [];
  const b2 = b2Raw
    .map((row) => {
      const e = asRecord(row);
      if (!e) return null;
      return {
        aspect_id: str(e.aspect_id),
        label_vi: str(e.label_vi),
        emphasis_signal: (str(e.emphasis_signal) ||
          "neutral") as VanTrinhNamMonthBlock["b2_month_emphasis"][0]["emphasis_signal"],
        fact_bullets_vi: strArr(e.fact_bullets_vi),
      };
    })
    .filter((x): x is NonNullable<typeof x> => x != null && Boolean(x.aspect_id));

  const stats = asRecord(b3.calendar_stats);

  return {
    month_num: monthNum,
    target_month: str(r.target_month),
    title_vi: str(r.title_vi) || `Tháng ${monthNum}`,
    solar_range: str(r.solar_range),
    b1_month_theme: {
      luu_nguyet_display: str(b1.luu_nguyet_display),
      nap_am: str(b1.nap_am) || undefined,
      month_hanh: str(b1.month_hanh) || undefined,
      element_relation_nhat_chu: str(b1.element_relation_nhat_chu) || undefined,
      month_archetype: str(b1.month_archetype) || undefined,
      fact_bullets_vi: strArr(b1.fact_bullets_vi),
    },
    b2_month_emphasis: b2,
    b3_luu_nhat_calendar: {
      best_days: (Array.isArray(b3.best_days) ? b3.best_days : [])
        .map(parseDayRow)
        .filter((x): x is NonNullable<typeof x> => x != null),
      avoid_days: (Array.isArray(b3.avoid_days) ? b3.avoid_days : [])
        .map(parseDayRow)
        .filter((x): x is NonNullable<typeof x> => x != null),
      top_hours: strArr(b3.top_hours),
      calendar_stats: stats
        ? {
            grade_a: num(stats.grade_a),
            grade_b: num(stats.grade_b),
            total_days: num(stats.total_days, 31),
          }
        : undefined,
    },
    b4_action: {
      action_tags_nen: strArr(b4.action_tags_nen),
      action_tags_tranh: strArr(b4.action_tags_tranh),
    },
  };
}

/** Tolerant parse `GET /v1/luu-nien/luan-context` payload. */
export function parseVanTrinhNamLuanContext(
  raw: unknown,
): VanTrinhNamLuanContext | null {
  const root = asRecord(raw);
  if (!root) return null;

  const meta = asRecord(root.meta);
  const partA = asRecord(root.part_a);
  const partB = asRecord(root.part_b);
  if (!meta || !partA || !partB) return null;

  const hook = asRecord(partA.hook_year);
  const you = asRecord(partA.you_this_year);
  if (!hook || !you) return null;

  const monthsRaw = Array.isArray(partB.luu_nguyet_months)
    ? partB.luu_nguyet_months
    : [];
  const months = monthsRaw
    .map(parseMonth)
    .filter((m): m is VanTrinhNamMonthBlock => m != null)
    .sort((a, b) => a.month_num - b.month_num);

  const aspectsRaw = Array.isArray(partA.four_aspects_year)
    ? partA.four_aspects_year
    : [];
  const fourAspects = aspectsRaw
    .map((row) => {
      const a = asRecord(row);
      if (!a) return null;
      const aspectId = str(a.aspect_id);
      if (!aspectId) return null;
      return {
        aspect_id: aspectId,
        label_vi: str(a.label_vi) || aspectId,
        verdict_signal: (str(a.verdict_signal) ||
          "than_trong") as VanTrinhNamLuanContext["part_a"]["four_aspects_year"][0]["verdict_signal"],
        fact_bullets_vi: strArr(a.fact_bullets_vi),
      };
    })
    .filter((x): x is NonNullable<typeof x> => x != null);

  const daiVan = asRecord(you.dai_van);
  const daiCurrent = daiVan ? asRecord(daiVan.current) : null;
  const transition = daiVan?.transition_in_year
    ? asRecord(daiVan.transition_in_year)
    : null;

  const partC = asRecord(root.part_c);
  const closing = partC ? asRecord(partC.closing_hints) : null;
  const synthesis = closing ? asRecord(closing.synthesis_inputs) : null;

  const partD = asRecord(root.part_d);
  const mechanics = partD ? asRecord(partD.mechanics) : null;

  const brief = asRecord(root.writing_brief);

  return {
    meta: {
      product_title_vi: str(meta.product_title_vi) || undefined,
      year: num(meta.year, new Date().getFullYear()),
      engine_version: str(meta.engine_version) || "0",
      computed_at: str(meta.computed_at) || undefined,
      disclaimers: strArr(meta.disclaimers),
    },
    part_a: {
      hook_year: {
        year: num(hook.year, num(meta.year)),
        year_can_chi: str(hook.year_can_chi),
        year_hanh: str(hook.year_hanh) || undefined,
        element_relation: str(hook.element_relation) || undefined,
        year_rating: str(hook.year_rating) || undefined,
        year_theme_signal: str(hook.year_theme_signal) || undefined,
        fact_bullets_vi: strArr(hook.fact_bullets_vi),
      },
      you_this_year: {
        natal_facts_vi: strArr(you.natal_facts_vi),
        nhat_chu_hanh: str(you.nhat_chu_hanh) || undefined,
        dung_than: str(you.dung_than) || undefined,
        ky_than: str(you.ky_than) || undefined,
        dai_van: {
          current: {
            display: str(daiCurrent?.display) || "—",
            can_hanh: str(daiCurrent?.can_hanh) || undefined,
            age_range: str(daiCurrent?.age_range) || undefined,
            relation_to_dung_than_signal:
              str(daiCurrent?.relation_to_dung_than_signal) || undefined,
          },
          transition_in_year: transition
            ? {
                from_display: str(transition.from_display),
                to_display: str(transition.to_display),
                applies_from_month: num(transition.applies_from_month, 1),
              }
            : null,
          disclaimer_fact_vi:
            typeof daiVan?.disclaimer_fact_vi === "string"
              ? daiVan.disclaimer_fact_vi
              : null,
        },
      },
      four_aspects_year: fourAspects,
      year_aspect_ranking: strArr(partA.year_aspect_ranking),
    },
    part_b: { luu_nguyet_months: months },
    part_c: {
      closing_hints: {
        synthesis_inputs: {
          archetype_counts: synthesis?.archetype_counts as
            | Record<string, number>
            | undefined,
          strong_months: Array.isArray(synthesis?.strong_months)
            ? synthesis!.strong_months.map((n) => num(n)).filter((n) => n >= 1)
            : undefined,
          month_count: synthesis ? num(synthesis.month_count, months.length) : undefined,
        },
      },
    },
    part_d: {
      mechanics: mechanics
        ? {
            natal: mechanics.natal as Record<string, string> | undefined,
            dung_than: str(mechanics.dung_than) || undefined,
            ky_than: str(mechanics.ky_than) || undefined,
            dai_van_current: str(mechanics.dai_van_current) || undefined,
            luu_nien_pillar: str(mechanics.luu_nien_pillar) || undefined,
            luu_nguyet_sample_pillar:
              str(mechanics.luu_nguyet_sample_pillar) || undefined,
            framework_line_vi: str(mechanics.framework_line_vi) || undefined,
          }
        : {},
    },
    writing_brief: brief
      ? {
          forbidden_response_keys: strArr(brief.forbidden_response_keys),
          render_order: strArr(brief.render_order),
          rules: brief.rules as Record<string, string> | undefined,
        }
      : undefined,
  };
}

export function validateVanTrinhNamMonths(
  ctx: VanTrinhNamLuanContext,
): boolean {
  return ctx.part_b.luu_nguyet_months.length === 12;
}

/** Chart values 0–100 per solar month from B3 calendar_stats. */
export function deriveVanTrinhNamMonthChartValues(
  months: VanTrinhNamMonthBlock[],
): number[] {
  const byNum = new Map(months.map((m) => [m.month_num, m]));
  const out: number[] = [];
  for (let i = 1; i <= 12; i += 1) {
    const m = byNum.get(i);
    const stats = m?.b3_luu_nhat_calendar.calendar_stats;
    if (!stats || stats.total_days <= 0) {
      out.push(50);
      continue;
    }
    const good = stats.grade_a + stats.grade_b;
    out.push(Math.round(Math.min(100, Math.max(8, (good / stats.total_days) * 100))));
  }
  return out;
}

export function yearCanChiFromContext(ctx: VanTrinhNamLuanContext): string {
  const y = ctx.part_a.hook_year;
  if (y.year_can_chi) return `${y.year_can_chi}`.trim();
  return String(y.year);
}
