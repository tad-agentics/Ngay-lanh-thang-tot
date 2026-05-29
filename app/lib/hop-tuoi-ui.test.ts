import { describe, expect, it } from "vitest";

import {
  buildHopTuoiNextStepCopy,
  purposeLabelToTraCuuIntent,
} from "./hop-tuoi-ui";

describe("purposeLabelToTraCuuIntent", () => {
  it("maps wedding purpose to DAM_CUOI", () => {
    const p = purposeLabelToTraCuuIntent("cưới hỏi");
    expect(p?.intent).toBe("DAM_CUOI");
  });

  it("maps partnership purpose to KY_HOP_DONG", () => {
    const p = purposeLabelToTraCuuIntent("hợp tác");
    expect(p?.intent).toBe("KY_HOP_DONG");
  });
});

describe("buildHopTuoiNextStepCopy", () => {
  it("uses wedding-specific CTA copy", () => {
    const copy = buildHopTuoiNextStepCopy({
      purposeLabel: "cưới hỏi",
      naphAm1: "Thổ A",
      naphAm2: "Kim B",
    });
    expect(copy.cta).toContain("cưới");
    expect(copy.preset?.intent).toBe("DAM_CUOI");
    expect(copy.body).toContain("Thổ A × Kim B");
  });
});
