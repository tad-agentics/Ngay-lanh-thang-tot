/**
 * /app/tra-cuu — Tab 4 · Tra cứu hub.
 * 4-tool grid (Hợp tuổi, Phong thủy, Hợp giờ, Tiểu Vận)
 * + Sổ ngày đã chọn list (placeholder until Wave 7).
 */

import { Link } from "react-router";
import { Kanji, Mono } from "~/components/brand";

const TOOLS = [
  {
    abbr: "HT",
    vi: "Hợp tuổi",
    en: "Age compatibility",
    sub: "Vợ chồng · đối tác · gia đình",
    badge: null,
    to: "/app/hop-tuoi",
  },
  {
    abbr: "PT",
    vi: "Phong thuỷ",
    en: "Feng-shui house",
    sub: "Hướng nhà · phòng · bếp",
    badge: "Mới",
    to: "/app/phong-thuy",
  },
  {
    abbr: "HG",
    vi: "Hợp giờ",
    en: "Hour finder",
    sub: "Tìm giờ tốt cho 1 việc cụ thể",
    badge: null,
    to: "/app/chon-ngay",
  },
  {
    abbr: "TV",
    vi: "Tiểu Vận",
    en: "Yearly fortune",
    sub: "Vận khí 12 tháng tới",
    badge: null,
    to: "/app/tieu-van",
  },
];

/** Placeholder saved-day events — replaced by Wave 7 DB query */
const PLACEHOLDER_EVENTS = [
  { d: "15", m: "11", label: "Khai trương cửa hàng", tag: "A · 92", state: "upcoming" as const },
  { d: "22", m: "11", label: "Cưới em gái", tag: "A · 88", state: "upcoming" as const },
  { d: "04", m: "12", label: "Ký hợp đồng", tag: "B · 76", state: "pending" as const },
];

export default function AppTraCuu() {
  return (
    <div
      style={{
        background: "var(--paper, #f0ece2)",
        minHeight: "100%",
        color: "var(--ink, #1a1a1a)",
        fontFamily: "var(--serif)",
      }}
    >
      {/* Header */}
      <div
        className="px-5 pt-4 pb-3"
        style={{ borderBottom: "1px solid rgba(154,124,34,0.18)" }}
      >
        <h1
          style={{
            fontFamily: "var(--display-2)",
            fontWeight: 800,
            fontSize: 16,
            textTransform: "uppercase",
            letterSpacing: "-0.005em",
            color: "var(--ink, #1a1a1a)",
            lineHeight: 1.1,
          }}
        >
          Tra cứu
        </h1>
        <Mono style={{ color: "#7a7050", marginTop: 2, display: "block" }} size={12}>
          Công cụ · sổ ngày · việc đã chọn
        </Mono>
      </div>

      <div className="pb-8">
        {/* Tools grid */}
        <div className="px-5 pt-4">
          <div className="flex items-baseline justify-between mb-3">
            <Mono style={{ color: "var(--gold-deep, #7d6219)" }}>Công cụ tra cứu</Mono>
            <Mono style={{ color: "#7a7050" }}>4 / 4</Mono>
          </div>

          <div className="grid grid-cols-2 gap-[10px]">
            {TOOLS.map((tool) => (
              <Link
                key={tool.vi}
                to={tool.to}
                style={{
                  background: "#fff",
                  border: "1px solid rgba(154,124,34,0.22)",
                  textAlign: "left",
                  padding: "14px 14px 12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  minHeight: 130,
                  fontFamily: "inherit",
                  textDecoration: "none",
                  transition: "opacity 0.15s",
                }}
              >
                <div className="flex items-center justify-between">
                  <span
                    style={{
                      fontFamily: "var(--display-2)",
                      fontSize: 18,
                      fontWeight: 800,
                      color: "var(--gold-deep, #7d6219)",
                      lineHeight: 1,
                      letterSpacing: "0.04em",
                    }}
                  >
                    {tool.abbr}
                  </span>
                  {tool.badge ? (
                    <Mono
                      style={{
                        color: tool.badge === "Mới" ? "#fff" : "#7a7050",
                        background: tool.badge === "Mới" ? "#3d6b4a" : "transparent",
                        padding: tool.badge === "Mới" ? "2px 6px" : undefined,
                      }}
                    >
                      {tool.badge.toUpperCase()}
                    </Mono>
                  ) : null}
                </div>

                <div>
                  <div
                    style={{
                      fontFamily: "var(--display-2)",
                      fontWeight: 700,
                      fontSize: 14,
                      textTransform: "uppercase",
                      letterSpacing: "-0.005em",
                      color: "var(--ink, #1a1a1a)",
                    }}
                  >
                    {tool.vi}
                  </div>
                  <Mono style={{ color: "#7a7050", marginTop: 2 }}>
                    {tool.en.toUpperCase()}
                  </Mono>
                </div>

                <p
                  style={{
                    fontFamily: "var(--serif)",
                    fontSize: 15,
                    color: "#5a5040",
                    lineHeight: 1.4,
                    marginTop: "auto",
                    marginBottom: 0,
                  }}
                >
                  {tool.sub}
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* Saved events list */}
        <div className="px-5 pt-6">
          <div className="flex items-baseline justify-between mb-3">
            <Mono style={{ color: "var(--gold-deep, #7d6219)" }}>Sổ của tôi · việc sắp tới</Mono>
            <Link
              to="/app/so-viec"
              style={{
                fontFamily: "var(--mono)",
                fontSize: 12,
                color: "var(--gold-deep, #7d6219)",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                textDecoration: "underline",
                textUnderlineOffset: 3,
              }}
            >
              Xem tất cả ›
            </Link>
          </div>

          <div className="flex flex-col gap-2">
            {PLACEHOLDER_EVENTS.map((e, i) => (
              <div
                key={i}
                style={{
                  background: "#fff",
                  border: "1px solid rgba(154,124,34,0.22)",
                  padding: "12px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                <div
                  style={{
                    width: 44,
                    textAlign: "center",
                    borderRight: "1px solid rgba(154,124,34,0.2)",
                    paddingRight: 12,
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--display-2)",
                      fontSize: 22,
                      fontWeight: 800,
                      color: "var(--ink, #1a1a1a)",
                      lineHeight: 1,
                    }}
                  >
                    {e.d}
                  </div>
                  <Mono style={{ color: "var(--gold-deep, #7d6219)", marginTop: 2 }}>
                    TH {e.m}
                  </Mono>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: "var(--serif)",
                      fontSize: 16,
                      color: "var(--ink, #1a1a1a)",
                      fontWeight: 500,
                      lineHeight: 1.25,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {e.label}
                  </div>
                  <Mono style={{ color: "#7a7050", marginTop: 4 }}>
                    {e.state === "upcoming"
                      ? `CÒN ${15 - i * 3} NGÀY`
                      : "CHƯA XÁC NHẬN"}
                  </Mono>
                </div>

                <div
                  style={{
                    background: e.tag.startsWith("A")
                      ? "var(--forest, #2d5a3d)"
                      : "var(--gold-deep, #7d6219)",
                    color: e.tag.startsWith("A") ? "#ede7d3" : "#1d1810",
                    padding: "6px 10px",
                    fontFamily: "var(--mono)",
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    flexShrink: 0,
                  }}
                >
                  {e.tag}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Saved-day pile teaser */}
        <div className="px-5 pt-5">
          <div
            style={{
              background: "#1d3129",
              color: "#ede7d3",
              padding: "14px 16px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Kanji
              ch="冊"
              size={120}
              drift
              style={{
                position: "absolute",
                right: -10,
                top: -20,
                color: "rgba(197,165,90,0.1)",
              }}
            />
            <Mono style={{ color: "var(--gold, #c5a55a)" }}>Sổ ngày đã chọn</Mono>
            <div
              className="flex items-baseline gap-3 mt-2"
            >
              <span
                style={{
                  fontFamily: "var(--display-2)",
                  fontSize: 32,
                  fontWeight: 800,
                  lineHeight: 1,
                }}
              >
                —
              </span>
              <span
                style={{
                  fontFamily: "var(--serif)",
                  fontSize: 16,
                  color: "#c8bc98",
                }}
              >
                ngày đã lưu · sắp có trong Wave 7
              </span>
            </div>
            <Link
              to="/app/so-viec"
              style={{
                display: "inline-block",
                marginTop: 12,
                fontFamily: "var(--mono)",
                fontSize: 12,
                fontWeight: 700,
                color: "var(--ink, #18150e)",
                background: "var(--gold, #c5a55a)",
                border: "none",
                padding: "12px 16px",
                minHeight: 44,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                textDecoration: "none",
                lineHeight: 1.2,
              }}
            >
              Mở sổ →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
