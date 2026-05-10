import { useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";

import { BackBar, Mono } from "~/components/brand";
import { usePollPaymentOrderPaid } from "~/hooks/usePollPaymentOrderPaid";
import { useProfile } from "~/hooks/useProfile";
import {
  creditsBalanceFootnote,
} from "~/lib/subscription";

export default function AppMuaLuongThanhCong() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");
  const { profile, loading, reload } = useProfile();
  const [confirmed, setConfirmed] = useState(false);
  const [longWait, setLongWait] = useState(false);
  const balanceBefore = useRef<number | null>(null);

  if (!loading && profile && balanceBefore.current === null) {
    balanceBefore.current = profile.credits_balance ?? 0;
  }

  usePollPaymentOrderPaid(orderId, Boolean(orderId), {
    onPaid: async () => {
      await new Promise((r) => setTimeout(r, 600));
      await reload();
      setConfirmed(true);
      setLongWait(false);
      toast.success("Đã nhận thanh toán — số dư đã cập nhật.");
    },
    onGiveUp: () => {
      setLongWait(true);
    },
  });

  const balanceAfter = profile?.credits_balance ?? 0;
  const hasSub = profile?.subscription_expires_at
    ? new Date(profile.subscription_expires_at) > new Date()
    : false;
  const creditsFootnote = profile ? creditsBalanceFootnote(profile) : null;

  const shortOrderId = orderId ? orderId.slice(-8).toUpperCase() : null;

  const CREAM = "var(--cream, #ede7d3)";
  const CREAM60 = "rgba(237,231,211,0.6)";
  const GOLD = "var(--gold, #c5a55a)";

  return (
    <div
      style={{
        background: "radial-gradient(ellipse at 50% 0%, #2a4738 0%, #1d3129 50%, #131f1a 100%)",
        minHeight: "100svh",
        color: CREAM,
        fontFamily: "var(--serif)",
      }}
    >
      <BackBar dark title="Thanh toán thành công" onBack={() => navigate("/app")} />

      <div style={{ padding: "8px 20px 48px" }}>
        {/* Kanji stamp */}
        <div style={{ textAlign: "center", padding: "32px 0 12px" }}>
          <span
            style={{
              fontFamily: "var(--hanzi)",
              fontSize: 64,
              color: GOLD,
              fontWeight: 700,
              opacity: 0.6,
            }}
          >
            完
          </span>
        </div>

        {/* Headline */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              fontFamily: "var(--display-2)",
              fontWeight: 800,
              fontSize: 24,
              textTransform: "uppercase",
              letterSpacing: "-0.005em",
              color: CREAM,
            }}
          >
            Đã nhận thanh toán
          </div>
          {shortOrderId ? (
            <Mono style={{ color: CREAM60, marginTop: 8, display: "block" }}>
              {shortOrderId}
            </Mono>
          ) : null}
        </div>

        {/* Balance before → after */}
        {!loading && profile ? (
          <div
            style={{
              padding: "16px 0",
              borderTop: `1px dashed rgba(197,165,90,0.35)`,
              borderBottom: `1px dashed rgba(197,165,90,0.35)`,
              display: "flex",
              justifyContent: "space-around",
              alignItems: "center",
              marginBottom: 28,
            }}
          >
            {hasSub ? (
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontFamily: "var(--display-2)",
                    fontWeight: 800,
                    fontSize: 28,
                    color: GOLD,
                  }}
                >
                  ∞
                </div>
                <Mono style={{ color: CREAM60 }}>Gói đang hoạt động</Mono>
              </div>
            ) : (
              <>
                <div style={{ textAlign: "center" }}>
                  <Mono style={{ color: CREAM60 }}>Trước</Mono>
                  <div
                    style={{
                      fontFamily: "var(--display-2)",
                      fontWeight: 800,
                      fontSize: 20,
                      color: CREAM60,
                    }}
                  >
                    {balanceBefore.current ?? "—"}
                  </div>
                </div>
                <span
                  style={{
                    color: GOLD,
                    fontFamily: "var(--display-2)",
                    fontWeight: 800,
                    fontSize: 20,
                  }}
                >
                  →
                </span>
                <div style={{ textAlign: "center" }}>
                  <Mono style={{ color: GOLD }}>Mới</Mono>
                  <div
                    style={{
                      fontFamily: "var(--display-2)",
                      fontWeight: 800,
                      fontSize: 28,
                      color: GOLD,
                    }}
                  >
                    {balanceAfter}
                  </div>
                </div>
              </>
            )}
          </div>
        ) : loading ? (
          <Mono style={{ color: CREAM60, display: "block", textAlign: "center", marginBottom: 28 }}>
            Đang xác nhận…
          </Mono>
        ) : null}

        {creditsFootnote ? (
          <p
            style={{
              fontFamily: "var(--serif)",
              fontStyle: "italic",
              fontSize: 14,
              color: CREAM60,
              marginBottom: 20,
              textAlign: "center",
              lineHeight: 1.55,
            }}
          >
            {creditsFootnote}
          </p>
        ) : null}

        {!orderId ? (
          <p
            style={{
              fontFamily: "var(--serif)",
              fontSize: 16,
              color: CREAM60,
              marginBottom: 20,
              padding: "12px 16px",
              background: "rgba(237,231,211,0.06)",
              borderRadius: 8,
              lineHeight: 1.55,
            }}
          >
            Không tìm thấy mã đơn. Nếu bạn vừa chuyển khoản thành công, lượng sẽ tự cập nhật trong vài phút — hoặc nhấn &quot;Tải lại&quot; bên dưới.
          </p>
        ) : null}

        {longWait && !confirmed ? (
          <p
            style={{
              fontFamily: "var(--serif)",
              fontSize: 16,
              color: CREAM,
              marginBottom: 20,
              padding: "12px 16px",
              background: "rgba(237,231,211,0.06)",
              border: "1px dashed rgba(197,165,90,0.45)",
              borderRadius: 8,
              lineHeight: 1.55,
            }}
          >
            Chưa thấy cập nhật tự động. Vui lòng thử tải lại, hoặc liên hệ{" "}
            <a href="mailto:hotro@ngaylanhthangtot.vn" style={{ color: GOLD, textDecoration: "underline" }}>
              hotro@ngaylanhthangtot.vn
            </a>{" "}
            kèm mã đơn để được hỗ trợ trong vòng 2 giờ.
          </p>
        ) : null}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            type="button"
            style={{
              background: "rgba(237,231,211,0.12)",
              color: CREAM,
              border: `1px solid rgba(237,231,211,0.25)`,
              borderRadius: 8,
              padding: "12px 20px",
              fontFamily: "var(--mono)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
            onClick={() => {
              void reload().then(() => toast.message("Đã tải lại số dư."));
            }}
          >
            Tải lại
          </button>
          <Link
            to="/app"
            style={{
              display: "block",
              textAlign: "center",
              background: CREAM,
              color: "var(--ink, #18150e)",
              borderRadius: 8,
              padding: "13px 20px",
              fontFamily: "var(--mono)",
              fontSize: 13,
              fontWeight: 700,
              textDecoration: "none",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
