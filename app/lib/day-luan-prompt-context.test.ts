import { describe, expect, it } from "vitest";

import { buildDayLuanPromptContext } from "../../supabase/functions/_shared/day-luan-prompt-context";

describe("buildDayLuanPromptContext", () => {
  it("builds REQ-P1-01 shaped context from raw day-detail", () => {
    const ctx = buildDayLuanPromptContext({
      date: "2026-05-28",
      score: 35,
      can_chi: "Nhâm Dần",
      truc_name: "Trực Thu",
      star_name: "Sao Thiên Lao",
      sao_28: "Tú",
      gio_tot: [{ chi_name: "Thìn", range: "7–9h" }],
      gio_xau: [{ chi_name: "Tỵ", range: "9–11h" }],
      menh: "Lộ Bàng Thổ",
      breakdown: [
        {
          id: "base",
          source: "ĐIỂM CƠ BẢN",
          type: "neutral",
          points: 50,
          reason_vi: "Mọi ngày bắt đầu từ 50 điểm.",
        },
        {
          source: "THIÊN CƯƠNG",
          type: "penalty",
          points: -15,
          reason_vi: "Hung tinh Thiên Cương",
        },
      ],
    });

    expect(ctx.date_iso).toBe("2026-05-28");
    expect(ctx.score).toBe(35);
    expect(ctx.menh_user).toBe("Lộ Bàng Thổ");
    expect(ctx.breakdown_summary).toHaveLength(4);
    expect(ctx.breakdown_summary[0]?.label_vi).toBe("Trực ngày");
    expect(ctx.breakdown_summary[1]?.points).toBe(-15);
    expect(ctx.sources).toHaveLength(4);
    expect(ctx.scope_hint_vi).toContain("28.05");
    expect(ctx.anchor_question_hint_vi).toContain("Lộ Bàng Thổ");
  });
});
