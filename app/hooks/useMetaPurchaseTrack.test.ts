/** @vitest-environment jsdom */
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useMetaPurchaseTrack } from "~/hooks/useMetaPurchaseTrack";

const trackMetaPurchaseOnce = vi.fn();

vi.mock("~/lib/meta-pixel", () => ({
  trackMetaPurchaseOnce: (...args: unknown[]) => trackMetaPurchaseOnce(...args),
}));

describe("useMetaPurchaseTrack", () => {
  beforeEach(() => {
    trackMetaPurchaseOnce.mockClear();
    vi.stubEnv("PROD", "true");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("fires with pre-resolved valueVnd (coupon-aware)", async () => {
    renderHook(() =>
      useMetaPurchaseTrack(
        true,
        {
          orderId: "ord-1",
          packageSku: "goi_12thang",
          valueVnd: 7_990,
        },
        "Lịch năm",
      ),
    );

    await waitFor(() => {
      expect(trackMetaPurchaseOnce).toHaveBeenCalledWith({
        orderId: "ord-1",
        valueVnd: 7_990,
        contentName: "Lịch năm",
        contentIds: ["goi_12thang"],
      });
    });
  });

  it("does not fire when unpaid", async () => {
    renderHook(() =>
      useMetaPurchaseTrack(false, {
        orderId: "ord-1",
        packageSku: "goi_12thang",
        valueVnd: 7_990,
      }),
    );
    await waitFor(() => {
      expect(trackMetaPurchaseOnce).not.toHaveBeenCalled();
    });
  });
});
