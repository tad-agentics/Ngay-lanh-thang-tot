import { describe, expect, it } from "vitest";

import {
  coalesceGenerateReadingSections,
  expandEmbeddedSectionsEnvelope,
  parseSectionsEnvelopeFromReadingJson,
} from "~/lib/generate-reading";

describe("parseSectionsEnvelopeFromReadingJson", () => {
  it("expands sections array from reading JSON", () => {
    const json = JSON.stringify({
      sections: [
        { id: "tinh_cach_trait_a", title: "A", text: "Luận trait đủ dài." },
      ],
    });
    const out = parseSectionsEnvelopeFromReadingJson(json);
    expect(out[0]?.id).toBe("tinh_cach_trait_a");
  });
});

describe("expandEmbeddedSectionsEnvelope", () => {
  it("unwraps JSON blob in section text", () => {
    const blob = JSON.stringify({
      sections: [
        {
          id: "phong_thuy_huong",
          title: "Hướng",
          text: "Đông Nam thuận.",
        },
      ],
    });
    const out = expandEmbeddedSectionsEnvelope([
      { id: "phong_thuy_van", title: "Legacy", text: blob },
    ]);
    expect(out[0]?.id).toBe("phong_thuy_huong");
    expect(out[0]?.text).toContain("Đông Nam");
  });
});

describe("coalesceGenerateReadingSections", () => {
  it("does not wrap JSON reading as tong_hop", () => {
    const json = JSON.stringify({
      sections: [{ id: "menh_tong_quan", title: "M", text: "Menh prose." }],
    });
    const out = coalesceGenerateReadingSections(null, json);
    expect(out[0]?.id).toBe("menh_tong_quan");
    expect(out.some((s) => s.id === "tong_hop")).toBe(false);
  });
});
