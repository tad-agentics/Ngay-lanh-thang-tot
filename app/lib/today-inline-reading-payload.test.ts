import { describe, expect, it } from "vitest";

import { resolveInlineReadingPayload } from "~/lib/today-inline-reading-payload";

const homNay = { date: "2026-06-01", score: 70 };
const detail = { date_iso: "2026-06-01", score: 72 };
const luan = { date_iso: "2026-06-01", breakdown_summary: [] };

describe("resolveInlineReadingPayload", () => {
  it("pending while luan query in flight", () => {
    expect(
      resolveInlineReadingPayload({
        fetchEnabled: true,
        luanPending: true,
        luanData: null,
        detailData: null,
        homNayData: homNay,
      }),
    ).toEqual({ payload: null, pending: true });
  });

  it("prefers luan when settled", () => {
    expect(
      resolveInlineReadingPayload({
        fetchEnabled: true,
        luanPending: false,
        luanData: luan,
        detailData: detail,
        homNayData: homNay,
      }),
    ).toEqual({ payload: luan, pending: false });
  });

  it("falls back to homNay when luan missing", () => {
    expect(
      resolveInlineReadingPayload({
        fetchEnabled: true,
        luanPending: false,
        luanData: null,
        detailData: null,
        homNayData: homNay,
      }),
    ).toEqual({ payload: homNay, pending: false });
  });

  it("idle when fetch disabled", () => {
    expect(
      resolveInlineReadingPayload({
        fetchEnabled: false,
        luanPending: false,
        luanData: luan,
        detailData: detail,
        homNayData: homNay,
      }),
    ).toEqual({ payload: null, pending: false });
  });
});
