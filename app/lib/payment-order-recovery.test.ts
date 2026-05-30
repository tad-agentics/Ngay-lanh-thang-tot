import { describe, expect, it } from "vitest";

import {
  checkoutResponseFromOrder,
  isPaymentFlowExemptPath,
  isRecoverablePendingOrder,
  recoverySuccessPath,
} from "./payment-order-recovery";

describe("payment-order-recovery", () => {
  it("exempts active pay flow routes", () => {
    expect(isPaymentFlowExemptPath("/dat-lich/xac-nhan")).toBe(true);
    expect(isPaymentFlowExemptPath("/thanh-cong")).toBe(true);
    expect(isPaymentFlowExemptPath("/luan/mua/xac-nhan")).toBe(true);
    expect(isPaymentFlowExemptPath("/lich")).toBe(false);
  });

  it("allows recovery only in pending age window", () => {
    const now = Date.parse("2026-05-29T12:00:00.000Z");
    expect(
      isRecoverablePendingOrder(
        { status: "pending", created_at: "2026-05-29T11:59:40.000Z" },
        now,
      ),
    ).toBe(false);
    expect(
      isRecoverablePendingOrder(
        { status: "pending", created_at: "2026-05-29T11:58:00.000Z" },
        now,
      ),
    ).toBe(true);
    expect(
      isRecoverablePendingOrder(
        { status: "pending", created_at: "2026-05-29T11:54:00.000Z" },
        now,
      ),
    ).toBe(false);
    expect(
      isRecoverablePendingOrder(
        { status: "paid", created_at: "2026-05-29T11:00:00.000Z" },
        now,
      ),
    ).toBe(false);
  });

  it("hydrates checkout from raw_request PayOS response", () => {
    const checkout = checkoutResponseFromOrder({
      id: "ord-1",
      package_sku: "goi_12thang",
      status: "pending",
      checkout_url: "https://pay.payos.vn/web/abc",
      amount_vnd: 799_000,
      provider_order_code: "123",
      created_at: "2026-05-29T11:00:00.000Z",
      raw_request: {
        response: {
          data: {
            qrCode: "qr-data",
            bin: "970422",
            accountNumber: "123456",
            accountName: "NGAY TOT",
            amount: 799_000,
            description: "NDCK",
            orderCode: 123,
          },
        },
      },
    });
    expect(checkout?.order_id).toBe("ord-1");
    expect(checkout?.checkout_url).toContain("payos");
    expect(checkout?.transfer?.qr_code).toBe("qr-data");
  });

  it("builds success paths per flow", () => {
    expect(recoverySuccessPath("subscription", "goi_6thang", "x")).toBe(
      "/thanh-cong?order_id=x",
    );
    expect(recoverySuccessPath("addon", "luan_bat_tu", "x")).toContain(
      "/luan/mua/thanh-cong",
    );
  });
});
