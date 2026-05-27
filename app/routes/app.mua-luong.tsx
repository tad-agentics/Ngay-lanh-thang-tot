import { useState } from "react";
import { toast } from "sonner";

import { PayCheckoutSheet } from "~/components/PayCheckoutSheet";
import { BackBar, Kanji, Mono } from "~/components/brand";
import type { CreatePayosCheckoutResponse, PackageSku } from "~/lib/api-types";
import { createPayosCheckout } from "~/lib/payos";
import { UI_PACKAGES } from "~/lib/packages";
import { useProfile } from "~/hooks/useProfile";
import { subscriptionActive } from "~/lib/subscription";

export default function AppMuaLuong() {
  const { profile, loading } = useProfile();
  const [busySku, setBusySku] = useState<PackageSku | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [checkoutPayload, setCheckoutPayload] = useState<CreatePayosCheckoutResponse | null>(null);
  const [failedSku, setFailedSku] = useState<PackageSku | null>(null);

  const hasSub = profile ? subscriptionActive(profile.subscription_expires_at) : false;
  const creditsBalance = loading ? "…" : hasSub ? "∞" : String(profile?.credits_balance ?? 0);

  async function checkout(sku: PackageSku) {
    setFailedSku(null);
    setBusySku(sku);
    const origin = window.location.origin;
    const result = await createPayosCheckout({
      package_sku: sku,
      return_url: `${origin}/app/mua-luong/thanh-cong`,
      cancel_url: `${origin}/app/mua-luong`,
    });
    setBusySku(null);
    if (!result.ok) {
      setFailedSku(sku);
      toast.error(result.message);
      return;
    }
    setCheckoutPayload(result.data);
    setSheetOpen(true);
  }

  function handleSheetOpen(open: boolean) {
    setSheetOpen(open);
    if (!open) setCheckoutPayload(null);
  }

  return (
    <div
      style={{
        background: "var(--paper, #f0ece2)",
        minHeight: "100%",
        color: "var(--ink, #1a1a1a)",
        fontFamily: "var(--serif)",
      }}
    >
      <BackBar title="Đặt lịch" subtitle="Gia hạn lịch · không tự gia hạn" />

      {/* Current balance */}
      <div className="px-5 pt-4">
        <div
          style={{
            background: "var(--forest, #1d3129)",
            padding: "18px 20px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Kanji
            ch="財"
            size={140}
            style={{
              position: "absolute",
              right: -16,
              bottom: -28,
              color: "rgba(197,165,90,0.08)",
              pointerEvents: "none",
            }}
          />
          <Mono style={{ color: "rgba(197,165,90,0.7)", display: "block" }}>Số dư hiện tại</Mono>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 6, position: "relative" }}>
            <span
              style={{
                fontFamily: "var(--display-2)",
                fontWeight: 800,
                fontSize: 44,
                lineHeight: 1,
                color: "var(--gold, #c5a55a)",
              }}
            >
              {creditsBalance}
            </span>
            <span
              style={{
                fontFamily: "var(--display-2)",
                fontWeight: 600,
                fontSize: 14,
                color: "rgba(197,165,90,0.7)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              lượng
            </span>
          </div>
          <Mono
            style={{ color: "rgba(237,231,211,0.55)", display: "block", marginTop: 6 }}
            size={10}
          >
            Thanh toán qua PayOS · MoMo · VietQR · thẻ ngân hàng
          </Mono>
        </div>
      </div>

      {/* Anchored math explainer */}
      <div className="px-5 pt-4">
        <div
          style={{
            background: "rgba(154,124,34,0.06)",
            borderLeft: "3px solid rgba(154,124,34,0.5)",
            padding: "12px 14px",
          }}
        >
          <Mono style={{ color: "var(--gold-deep, #7d6219)", display: "block", marginBottom: 6 }}>
            Lượng dùng như thế nào?
          </Mono>
          {[
            ["Chọn ngày (tìm 30 ngày)", "10 lượng / lần"],
            ["Dựng lá số tứ trụ", "0 lượng — miễn phí"],
            ["Xem hôm nay / lịch tuần", "0 lượng — miễn phí"],
            ["Hợp tuổi 2 người", "8 lượng / lần"],
          ].map(([task, cost]) => (
            <div
              key={task}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "6px 0",
                borderBottom: "1px dashed rgba(154,124,34,0.2)",
                fontFamily: "var(--mono)",
                fontSize: 11,
              }}
            >
              <span style={{ color: "var(--ink-2, #3a3220)" }}>{task}</span>
              <span style={{ color: "var(--gold-deep, #7d6219)", fontWeight: 700 }}>{cost}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Packages */}
      <div className="px-5 pt-5 pb-8">
        <Mono style={{ color: "var(--muted-warm, #7a7050)", display: "block", marginBottom: 14 }}>
          Chọn gói
        </Mono>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {UI_PACKAGES.map((pkg) => {
            const isFailed = failedSku === pkg.sku;
            const isBusy = busySku === pkg.sku;

            return (
              <div
                key={pkg.sku}
                style={{
                  position: "relative",
                  background: pkg.featured ? "var(--forest, #1d3129)" : "#fff",
                  color: pkg.featured ? "var(--cream, #ede7d3)" : "var(--ink, #1a1a1a)",
                  border: pkg.featured
                    ? "1px solid var(--gold, #c5a55a)"
                    : "1px solid rgba(125,98,25,0.26)",
                  padding: "22px 20px",
                  overflow: "hidden",
                }}
              >
                {pkg.featured ? (
                  <span
                    style={{
                      position: "absolute",
                      top: -9,
                      left: 18,
                      padding: "3px 10px",
                      background: "var(--gold, #c5a55a)",
                      color: "var(--forest, #1d3129)",
                      fontFamily: "var(--display-2)",
                      fontWeight: 800,
                      fontSize: 9,
                      letterSpacing: "0.18em",
                    }}
                  >
                    {pkg.badge ?? "PHỔ BIẾN"}
                  </span>
                ) : null}

                <Kanji
                  ch={
                    pkg.sku === "goi_1thang"
                      ? "月"
                      : pkg.sku === "goi_6thang"
                        ? "安"
                        : pkg.sku === "goi_12thang"
                          ? "富"
                          : pkg.sku === "luan_bat_tu"
                            ? "命"
                            : "運"
                  }
                  size={120}
                  style={{
                    position: "absolute",
                    right: -12,
                    bottom: -24,
                    color: pkg.featured ? "rgba(197,165,90,0.08)" : "rgba(125,98,25,0.05)",
                    pointerEvents: "none",
                  }}
                />

                <div style={{ position: "relative" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: "var(--display-2)",
                          fontWeight: 800,
                          fontSize: 18,
                          textTransform: "uppercase",
                          letterSpacing: "-0.005em",
                          marginTop: pkg.featured ? 10 : 0,
                        }}
                      >
                        {pkg.title}
                      </div>
                      <p
                        style={{
                          fontSize: 13,
                          lineHeight: 1.6,
                          marginTop: 8,
                          color: pkg.featured ? "rgba(237,231,211,0.75)" : "var(--ink-2, #3a3220)",
                          fontFamily: "var(--serif)",
                        }}
                      >
                        {pkg.subtitle}
                      </p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div
                        style={{
                          fontFamily: "var(--display-2)",
                          fontWeight: 800,
                          fontSize: 22,
                          color: pkg.featured ? "var(--gold, #c5a55a)" : "var(--gold-deep, #7d6219)",
                          lineHeight: 1,
                        }}
                      >
                        {pkg.priceLabel}
                      </div>
                      <Mono
                        style={{
                          color: pkg.featured ? "rgba(197,165,90,0.7)" : "var(--muted-warm, #7a7050)",
                          display: "block",
                          marginTop: 4,
                        }}
                      >
                        {pkg.kind === "subscription" ? "Lịch cá nhân" : "Mở khóa luận"}
                      </Mono>
                    </div>
                  </div>

                  <Mono
                    style={{
                      color: pkg.featured ? "rgba(197,165,90,0.6)" : "var(--muted-warm, #7a7050)",
                      display: "block",
                      marginTop: 10,
                      paddingTop: 10,
                      borderTop: pkg.featured ? "1px dashed rgba(197,165,90,0.25)" : "1px dashed rgba(125,98,25,0.2)",
                    }}
                  >
                    {pkg.priceLabel}
                  </Mono>

                  {/* PayOS recovery state */}
                  {isFailed ? (
                    <div
                      style={{
                        marginTop: 12,
                        padding: "10px 12px",
                        background: "rgba(139,26,26,0.08)",
                        border: "1px solid rgba(139,26,26,0.25)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 10,
                      }}
                    >
                      <Mono style={{ color: "#8b1a1a", fontSize: 10 }}>
                        Đơn tạm thời — PayOS chưa phản hồi
                      </Mono>
                      <button
                        type="button"
                        onClick={() => void checkout(pkg.sku)}
                        style={{
                          padding: "6px 14px",
                          background: "#8b1a1a",
                          color: "#fff",
                          border: "none",
                          fontFamily: "var(--display-2)",
                          fontWeight: 700,
                          fontSize: 11,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          cursor: "pointer",
                          flexShrink: 0,
                        }}
                      >
                        Thử lại
                      </button>
                    </div>
                  ) : null}

                  <button
                    type="button"
                    disabled={busySku !== null}
                    onClick={() => void checkout(pkg.sku)}
                    style={{
                      display: "block",
                      width: "100%",
                      marginTop: 16,
                      padding: "13px",
                      background: pkg.featured ? "var(--gold, #c5a55a)" : "transparent",
                      color: pkg.featured ? "var(--forest, #1d3129)" : "var(--ink, #1a1a1a)",
                      border: pkg.featured ? "none" : "1px solid rgba(125,98,25,0.5)",
                      fontFamily: "var(--display-2)",
                      fontWeight: 800,
                      fontSize: 13,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      cursor: busySku !== null ? "wait" : "pointer",
                      opacity: busySku !== null && !isBusy ? 0.5 : 1,
                    }}
                  >
                    {isBusy ? "Đang tạo đơn…" : "Thanh toán →"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <p
          style={{
            fontFamily: "var(--mono)",
            fontSize: 9,
            color: "var(--muted-warm, #7a7050)",
            letterSpacing: "0.1em",
            textAlign: "center",
            marginTop: 20,
            lineHeight: 1.6,
          }}
        >
          Thanh toán qua PayOS · VND · Hủy bất cứ lúc nào · Hoàn tiền trong 7 ngày
        </p>
      </div>

      <PayCheckoutSheet open={sheetOpen} onOpenChange={handleSheetOpen} payload={checkoutPayload} />
    </div>
  );
}
