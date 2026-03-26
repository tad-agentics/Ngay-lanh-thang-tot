import { describe, expect, it } from "vitest";

import {
  hopTuoiPayloadToPanel,
  relationshipLabelFromType,
  scoreToGradLabel,
} from "./hop-tuoi-result";

describe("scoreToGradLabel", () => {
  it("maps bands (top two align with letter grades at 85 / 70)", () => {
    expect(scoreToGradLabel(85)).toBe("Rất hợp");
    expect(scoreToGradLabel(84)).toBe("Hợp");
    expect(scoreToGradLabel(70)).toBe("Hợp");
    expect(scoreToGradLabel(69)).toBe("Trung bình");
    expect(scoreToGradLabel(45)).toBe("Trung bình");
    expect(scoreToGradLabel(30)).toBe("Cần lưu ý");
  });
});

describe("relationshipLabelFromType", () => {
  it("maps PHU_THE to display label", () => {
    expect(relationshipLabelFromType("PHU_THE")).toContain("Phu thê");
  });
});

describe("hopTuoiPayloadToPanel", () => {
  it("reads flat API-style keys", () => {
    const p = hopTuoiPayloadToPanel({
      score: 78,
      nap_am_1: "Bích Đại Khánh Thổ",
      nap_am_2: "Thạch Lựu Mộc",
      summary: "Tương sinh Thổ–Mộc — tài chính ổn.",
    });
    expect(p?.apiVersion).toBe(1);
    expect(p?.chipLabel).toBe(p?.gradLabel);
    expect(p?.score).toBe(78);
    expect(p?.showNumericScore).toBe(true);
    expect(p?.gradLabel).toBe("Hợp");
    expect(p?.naphAm1).toContain("Thổ");
    expect(p?.naphAmRelation).toContain("Tương sinh");
  });

  it("reads nested data", () => {
    const p = hopTuoiPayloadToPanel({
      data: { diem: 55, nap_am_1: "A", nap_am_2: "B", mo_ta: "OK" },
    });
    expect(p?.apiVersion).toBe(1);
    expect(p?.score).toBe(55);
    expect(p?.naphAmRelation).toBe("OK");
  });

  it("reads tu-tru-api person1/person2 + overall_score + grade", () => {
    const p = hopTuoiPayloadToPanel({
      status: "success",
      overall_score: 88,
      grade: "A",
      person1: { menh: "Lộ Bàng Thổ", hanh: "Thổ" },
      person2: { menh: "Kiếm Phong Kim", hanh: "Kim" },
      summary: "Hai lá số rất tương hợp.",
      ngu_hanh_relation: "Tương Sinh",
    });
    expect(p?.score).toBe(88);
    expect(p?.gradLabel).toBe("Rất hợp");
    expect(p?.naphAm1).toBe("Lộ Bàng Thổ");
    expect(p?.naphAm2).toBe("Kiếm Phong Kim");
    expect(p?.naphAmRelation).toContain("tương hợp");
    expect(p?.personCards.p1?.menh).toBe("Lộ Bàng Thổ");
    expect(p?.personCards.p2?.hanh).toBe("Kim");
  });

  it("maps v2: version 2 + verdict + criteria + reading + advice", () => {
    const p = hopTuoiPayloadToPanel({
      version: 2,
      relationship_type: "DOI_TAC",
      relationship_label: "Đối tác",
      overall_score: 80,
      verdict: "Khá hợp trong quan hệ đối tác",
      criteria: [
        { name: "Nạp Âm", sentiment: "positive", description: "Tương sinh." },
        { label: "Địa Chi tam hợp" },
      ],
      reading: "Hai bên bổ trợ trong giai đoạn đầu.",
      advice: "Nên chốt cam kết bằng văn bản.",
      nap_am_1: "Kim 1",
      nap_am_2: "Mộc 2",
    });
    expect(p?.apiVersion).toBe(2);
    expect(p?.chipLabel).toContain("Khá hợp");
    expect(p?.relationshipLabel).toBe("Đối tác");
    expect(p?.showNumericScore).toBe(true);
    expect(p?.score).toBe(80);
    expect(p?.criteriaLines.length).toBeGreaterThanOrEqual(2);
    expect(p?.criteriaRows.length).toBeGreaterThanOrEqual(2);
    const napAmRow = p?.criteriaRows.find((r) => r.name === "Nạp Âm");
    expect(napAmRow?.description).toBe("Tương sinh.");
    expect(p?.criteriaRows.some((r) => r.sentiment === "positive")).toBe(true);
    expect(p?.reading).toContain("bổ trợ");
    expect(p?.advice).toContain("văn bản");
  });

  it("v2 without numeric score: no implied 72, showNumericScore false", () => {
    const p = hopTuoiPayloadToPanel({
      version: 2,
      verdict: "Cần trao đổi thêm",
      criteria: [{ name: "Test", sentiment: "neutral" }],
      nap_am_1: "A",
      nap_am_2: "B",
    });
    expect(p?.apiVersion).toBe(2);
    expect(p?.score).toBeNull();
    expect(p?.showNumericScore).toBe(false);
  });

  it("v2 criteria: sentiment không tốt is negative not positive", () => {
    const p = hopTuoiPayloadToPanel({
      version: 2,
      verdict: "OK",
      criteria: [{ name: "Thử", sentiment: "Không tốt" }],
      nap_am_1: "A",
      nap_am_2: "B",
    });
    expect(p?.criteriaRows[0]?.sentiment).toBe("negative");
  });

  it("v2 criteria sort: negative before positive", () => {
    const p = hopTuoiPayloadToPanel({
      version: 2,
      verdict: "OK",
      criteria: [
        { name: "Tốt", sentiment: "positive" },
        { name: "Rủi ro", sentiment: "negative" },
        { name: "Vừa", sentiment: "neutral" },
      ],
      nap_am_1: "A",
      nap_am_2: "B",
    });
    expect(p?.criteriaRows.map((r) => r.name)).toEqual([
      "Rủi ro",
      "Vừa",
      "Tốt",
    ]);
  });

  it("v2: verdict_level maps when verdict absent", () => {
    const p = hopTuoiPayloadToPanel({
      version: 2,
      verdict_level: 2,
      nap_am_1: "A",
      nap_am_2: "B",
    });
    expect(p?.verdictLevel).toBe(2);
    expect(p?.gradLabel).toBe("Trung bình");
  });

  it("v2: verdict with rất + lưu ý grades as caution, not Rất hợp", () => {
    const p = hopTuoiPayloadToPanel({
      version: 2,
      verdict: "Rất cần lưu ý khi hợp tác",
      nap_am_1: "A",
      nap_am_2: "B",
    });
    expect(p?.gradLabel).toBe("Cần lưu ý");
  });

  it("v2: verdict rất rủi ro grades as caution", () => {
    const p = hopTuoiPayloadToPanel({
      version: 2,
      verdict: "Rất rủi ro về cam kết",
      nap_am_1: "A",
      nap_am_2: "B",
    });
    expect(p?.gradLabel).toBe("Cần lưu ý");
  });

  it("v2: plain Rất hợp in verdict stays top positive band", () => {
    const p = hopTuoiPayloadToPanel({
      version: 2,
      verdict: "Rất hợp trong công việc",
      nap_am_1: "A",
      nap_am_2: "B",
    });
    expect(p?.gradLabel).toBe("Rất hợp");
  });

  it("returns null for non-object", () => {
    expect(hopTuoiPayloadToPanel(null)).toBeNull();
  });
});
