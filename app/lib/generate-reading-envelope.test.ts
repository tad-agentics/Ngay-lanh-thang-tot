import { describe, expect, it, vi } from "vitest";

vi.mock("~/lib/supabase", () => ({
  supabase: {
    auth: { getSession: vi.fn() },
    functions: { invoke: vi.fn() },
  },
}));

import {
  coalesceGenerateReadingSections,
  expandEmbeddedSectionsEnvelope,
  laSoSectionsFromGenerateReadingResponse,
  mergeLaSoChiTietSectionsById,
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

describe("mergeLaSoChiTietSectionsById", () => {
  it("merges waves by section id (van-trinh-nam load)", () => {
    const merged = mergeLaSoChiTietSectionsById(
      [{ id: "a1_hook", title: "A1", text: "x".repeat(100) }],
      [{ id: "b1_theme", title: "B1", text: "Tháng một." }],
    );
    expect(merged).toHaveLength(2);
    expect(merged.map((s) => s.id).sort()).toEqual(["a1_hook", "b1_theme"]);
  });
});

describe("laSoSectionsFromGenerateReadingResponse", () => {
  it("reads sections from reading JSON envelope", () => {
    const json = JSON.stringify({
      sections: [{ id: "a1_hook", title: "Hook", text: "Nội dung đủ dài." }],
    });
    const out = laSoSectionsFromGenerateReadingResponse({
      sections: null,
      reading: json,
    });
    expect(out[0]?.id).toBe("a1_hook");
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
