/**
 * NO_DATES error screen — shown when /app/chon-ngay/ket-qua finds 0 results.
 * Forest-default (dark) per FE-HANDOFF §4.
 */

import { Link, useLocation, useNavigate } from "react-router";
import { BackBar, Kanji, Mono } from "~/components/brand";

const F = "#1d3129";
const C = "#ede7d3";
const M_MUTED = "#7a9a80";
const ACCENT = "#c5a55a";

export default function AppLoiKhongTimThayNgay() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { intentLabel?: string; daysInclusive?: number } | null;

  const intentLabel = state?.intentLabel ?? "việc của bạn";
  const daysInclusive = state?.daysInclusive ?? 30;

  return (
    <div
      style={{
        background: F,
        minHeight: "100%",
        color: C,
        fontFamily: "var(--serif)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Kanji
        ch="空"
        size={480}
        style={{
          position: "absolute",
          top: 40,
          left: -140,
          color: "rgba(197,165,90,0.05)",
          pointerEvents: "none",
        }}
      />

      <BackBar dark title="Kết quả" subtitle={intentLabel} onBack={() => void navigate(-1)} />

      <div style={{ padding: "32px 20px 48px", position: "relative" }}>
        <Mono style={{ color: ACCENT, display: "block", marginBottom: 16 }}>
          Không tìm thấy ngày phù hợp
        </Mono>

        <h1
          style={{
            fontFamily: "var(--display-2)",
            fontWeight: 800,
            fontSize: 28,
            lineHeight: 1.1,
            textTransform: "uppercase",
            letterSpacing: "-0.01em",
            color: C,
            marginBottom: 16,
          }}
        >
          Trong {daysInclusive} ngày tới,
          <br />
          <span style={{ color: ACCENT }}>chưa có ngày lành</span>
          <br />
          đủ điểm cho việc này.
        </h1>

        <p style={{ fontSize: 14, lineHeight: 1.7, color: "rgba(237,231,211,0.72)", marginBottom: 28, fontFamily: "var(--serif)", maxWidth: 340 }}>
          Điều kiện cho {intentLabel} khá cụ thể. Bạn có thể thử lại với khoảng thời gian dài hơn hoặc điều chỉnh loại việc.
        </p>

        {/* Suggestions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
          {[
            { label: "Chọn khoảng 60 hoặc 90 ngày", action: () => void navigate("/app/chon-ngay") },
            { label: "Thử loại việc khác", action: () => void navigate("/app/chon-ngay") },
            { label: "Xem lịch tháng theo lá số", action: () => void navigate("/app/thang") },
          ].map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={s.action}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                background: "rgba(197,165,90,0.06)",
                border: "1px solid rgba(197,165,90,0.22)",
                color: C,
                fontFamily: "var(--serif)",
                fontSize: 14,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span>{s.label}</span>
              <span style={{ fontFamily: "var(--mono)", color: ACCENT, fontSize: 14 }}>→</span>
            </button>
          ))}
        </div>

        {/* Note */}
        <div style={{ padding: "16px", background: "rgba(197,165,90,0.06)", borderLeft: `3px solid ${ACCENT}` }}>
          <Mono style={{ color: M_MUTED, display: "block", marginBottom: 8 }}>Tại sao không có ngày?</Mono>
          <p style={{ fontSize: 13, lineHeight: 1.65, color: "rgba(237,231,211,0.72)", fontFamily: "var(--serif)" }}>
            Một số loại việc đòi hỏi Can Chi và Trực rất nghiêm — Tam Nương, Nguyệt Kỵ, hay ngày Can Chi xung với mệnh bạn có thể loại hết ngày trong cửa sổ tìm kiếm. Mở rộng khoảng thời gian thường giải quyết được.
          </p>
        </div>

        <div style={{ marginTop: 28 }}>
          <Link
            to="/app/chon-ngay"
            style={{
              display: "block",
              padding: "14px",
              background: ACCENT,
              color: F,
              textDecoration: "none",
              textAlign: "center",
              fontFamily: "var(--display-2)",
              fontWeight: 800,
              fontSize: 13,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Tìm lại →
          </Link>
        </div>
      </div>
    </div>
  );
}
