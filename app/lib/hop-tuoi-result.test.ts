import { describe, expect, it } from "vitest";

import { hopTuoiPayloadToPanel, scoreToGradLabel } from "./hop-tuoi-result";

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
  });

  it("maps v2: version 2 + verdict + criteria + reading + advice", () => {
    const p = hopTuoiPayloadToPanel({
      version: 2,
      overall_score: 80,
      verdict: "Khá hợp trong quan hệ đối tác",
      criteria: [
        { label: "Nạp Âm tương sinh" },
        "Địa Chi tam hợp",
      ],
      reading: "Hai bên bổ trợ trong giai đoạn đầu.",
      advice: "Nên chốt cam kết bằng văn bản.",
      nap_am_1: "Kim 1",
      nap_am_2: "Mộc 2",
    });
    expect(p?.apiVersion).toBe(2);
    expect(p?.chipLabel).toContain("Khá hợp");
    expect(p?.criteriaLines.length).toBeGreaterThanOrEqual(2);
    expect(p?.reading).toContain("bổ trợ");
    expect(p?.advice).toContain("văn bản");
  });

  it("v2: verdict with rất + lưu ý grades as caution, not Rất hợp", () => {
    const p = hopTuoiPayloadToPanel({
      version: 2,
      overall_score: 72,
      verdict: "Rất cần lưu ý khi hợp tác",
      nap_am_1: "A",
      nap_am_2: "B",
    });
    expect(p?.gradLabel).toBe("Cần lưu ý");
  });

  it("v2: verdict rất rủi ro grades as caution", () => {
    const p = hopTuoiPayloadToPanel({
      version: 2,
      overall_score: 55,
      verdict: "Rất rủi ro về cam kết",
      nap_am_1: "A",
      nap_am_2: "B",
    });
    expect(p?.gradLabel).toBe("Cần lưu ý");
  });

  it("v2: plain Rất hợp in verdict stays top positive band", () => {
    const p = hopTuoiPayloadToPanel({
      version: 2,
      overall_score: 90,
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
