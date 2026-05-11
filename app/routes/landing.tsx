/**
 * Landing page v2 — LandingV2 per b-landing-v2.jsx.
 * Desktop ≥1024px: header + hero + compare + how + method + pricing + testi + FAQ + CTA + footer.
 * Mobile <1024px: same sections stacked + sticky bottom CTA bar.
 * SEO meta + JSON-LD preserved and updated for new copy.
 */

import {
  useEffect,
  useState,
} from "react";
import { Link } from "react-router";

import type { Route } from "./+types/landing";

import "~/styles/landing-marketing.css";
import { Kanji, Logo, LogoMark, Mono, Stamp } from "~/components/brand";
import { LANDING_TOK } from "~/lib/maket-tokens";

const SITE_ORIGIN = "https://ngaylanhthangtot.vn";

export const links: Route.LinksFunction = () => [];

const TOK = LANDING_TOK;

const PACKAGES_V2 = [
  {
    id: "le",
    name: "Lẻ — gói nhỏ",
    kicker: "Dùng thử",
    credits: "100 lượng",
    price: "99.000₫",
    period: "một lần",
    items: ["100 lượng dùng dần", "Đủ cho 10–12 việc chọn ngày", "Không tự động nạp"],
    cta: "Mua lượng",
    featured: false,
  },
  {
    id: "goi_6thang",
    name: "Tháng An Cư",
    kicker: "Phổ biến",
    credits: "Dùng thoải mái",
    price: "789.000₫",
    period: "/ 6 tháng",
    items: [
      "Không trừ lượng từng việc",
      "Lá số tứ trụ chi tiết",
      "Cảnh báo Tam Tai · Tuế Phá",
      "Nhắc trước 7 ngày",
    ],
    cta: "Đăng ký 6 tháng",
    featured: true,
  },
  {
    id: "goi_12thang",
    name: "Năm Phú Quý",
    kicker: "Tiết kiệm ~37%",
    credits: "Dùng thoải mái",
    price: "989.000₫",
    period: "/ 12 tháng",
    items: [
      "Không trừ lượng từng việc",
      "Mọi tính năng Tháng An Cư",
      "Hỗ trợ ưu tiên",
      "Hóa đơn VAT",
    ],
    cta: "Đăng ký 12 tháng",
    featured: false,
  },
] as const;

const FAQS_V2 = [
  [
    "Có cần biết tử vi không?",
    "Không. Bạn nhập ngày giờ sinh, app tự tính tứ trụ. Phần luận giải viết bằng tiếng Việt thường ngày — không có Hán Việt nặng nếu bạn không bật.",
  ],
  [
    "Có chính xác không?",
    "Hệ thống đối chiếu 4 nguồn: Hiệp Kỷ Biện Phương, Ngọc Hạp Thông Thư, Bộ Tứ Trụ Hồ Điểu, Lịch Vạn Niên 2026. Mỗi điểm số đều có thể bấm vào xem câu nguyên văn.",
  ],
  [
    "Lượng có hết hạn không?",
    "Không. Mua một lần, dùng dần. Không tự gia hạn — bạn không bị trừ tiền nếu không chủ động mua thêm.",
  ],
  [
    "App có cài không?",
    "Có. Cài 1 chạm trên iPhone/Android (PWA — không qua App Store). Hoặc dùng trên web. Lá số đồng bộ.",
  ],
  [
    "Hợp tuổi cần tài khoản người kia không?",
    "Không. Trong Tra cứu → Hợp tuổi, nhập ngày sinh của người kia (không cần tài khoản của họ). Kết quả hiện ngay.",
  ],
] as const;

const TESTIMONIALS = [
  {
    name: "Chị Hằng · Đà Nẵng",
    body: "Tiệm tôi khai trương 17/06 đúng theo phiếu, ngày đó gấp đôi lượt khách so với hôm thử bán.",
    ev: "Khai trương cửa hàng",
  },
  {
    name: "Anh Tuấn · TP.HCM",
    body: "Mẹ vợ là người tin tử vi nặng nề. Tôi gửi phiếu qua Zalo, bà cụ duyệt liền — đỡ phải đi xem thầy.",
    ev: "Cưới hỏi",
  },
  {
    name: "Chị Linh · Hà Nội",
    body: "Lý do ghi tiếng Việt rõ — không phải đoán. Đặt cọc nhà 26/06 đúng giờ Mùi đã yên tâm.",
    ev: "Mua nhà",
  },
] as const;

function landingJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "Ngày Lành Tháng Tốt",
        url: SITE_ORIGIN,
        description:
          "Ứng dụng chọn ngày lành bám theo lá số tứ trụ của bạn. Khai trương, cưới hỏi, nhập trạch — tra theo đúng mệnh, không theo lịch chung.",
        applicationCategory: "LifestyleApplication",
        inLanguage: "vi",
        offers: PACKAGES_V2.map((p) => ({
          "@type": "Offer",
          name: p.name,
          price: p.price.replace(/[₫.]/g, ""),
          priceCurrency: "VND",
        })),
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQS_V2.map(([q, a]) => ({
          "@type": "Question",
          name: q,
          acceptedAnswer: { "@type": "Answer", text: a },
        })),
      },
    ],
  };
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Ngày Lành Tháng Tốt — chọn ngày lành theo lá số tứ trụ" },
    {
      name: "description",
      content:
        "Lá số riêng của bạn, không phải lịch chung — khai trương, cưới hỏi, nhập trạch. Theo Ngọc Hạp Thông Thư, hai mươi sáu kiểu việc, lời giải tiếng Việt.",
    },
    { property: "og:title", content: "Ngày Lành Tháng Tốt" },
    {
      property: "og:description",
      content: "Theo lá số của bạn — không phải lịch in để chung. Nửa phút là có khung.",
    },
    { property: "og:type", content: "website" },
    { property: "og:url", content: SITE_ORIGIN + "/" },
    { property: "og:image", content: SITE_ORIGIN + "/icons/icon-512.png" },
    { name: "theme-color", content: "#1d3129" },
  ];
}


function FaqItem({ q, a, index, open, onToggle }: { q: string; a: string; index: number; open: boolean; onToggle: () => void }) {
  return (
    <div
      onClick={onToggle}
      style={{ borderTop: `1px solid ${TOK.border}`, padding: "20px 0", cursor: "pointer" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Mono size={11} style={{ color: TOK.muted, letterSpacing: "0.14em", minWidth: 32 }}>
          {String(index + 1).padStart(2, "0")}
        </Mono>
        <span
          style={{
            flex: 1,
            fontFamily: "var(--display-2)",
            fontWeight: 700,
            fontSize: "clamp(15px, 2.2vw, 20px)",
            textTransform: "uppercase",
            color: TOK.ink,
            letterSpacing: "-0.005em",
          }}
        >
          {q}
        </span>
        <span
          style={{
            fontFamily: "var(--mono)",
            fontSize: 16,
            color: TOK.goldDeep,
            transform: open ? "rotate(45deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
            flexShrink: 0,
          }}
        >
          +
        </span>
      </div>
      {open ? (
        <p
          style={{
            fontFamily: "var(--serif)",
            fontSize: 15,
            lineHeight: 1.65,
            marginTop: 12,
            color: TOK.ink2,
            paddingLeft: "clamp(0px, 4vw, 48px)",
          }}
        >
          {a}
        </p>
      ) : null}
    </div>
  );
}

function readStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export default function Landing() {
  const [isStandalone, setIsStandalone] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [showStickyBar, setShowStickyBar] = useState(false);

  useEffect(() => {
    setIsStandalone(readStandalonePwa());
    // Sticky bottom bar appears after user scrolls 200px on mobile
    const handleScroll = () => setShowStickyBar(window.scrollY > 200);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(landingJsonLd()) }}
      />

      <div id="lp" style={{ background: TOK.paper, fontFamily: "var(--serif)", color: TOK.ink }}>
        {/* ── Sticky header ── */}
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 50,
            background: "rgba(240,236,226,0.92)",
            backdropFilter: "blur(16px) saturate(140%)",
            WebkitBackdropFilter: "blur(16px) saturate(140%)",
            borderBottom: `1px solid ${TOK.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px clamp(18px, 5vw, 64px)",
          }}
        >
          <Logo size={42} />
          <nav style={{ display: "flex", alignItems: "center", gap: "clamp(12px, 3vw, 32px)" }}>
            {([["Vì sao", "#compare"], ["Cách dùng", "#how"], ["Bảng giá", "#pricing"], ["Hỏi đáp", "#faq"]] as const).map(([n, href]) => (
              <a
                key={n}
                href={href}
                style={{
                  fontFamily: "var(--display-2)",
                  fontWeight: 600,
                  fontSize: 13,
                  color: TOK.ink2,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  textDecoration: "none",
                  display: "none",
                }}
                className="lp-nav-desktop-link"
              >
                {n}
              </a>
            ))}
            <Link
              to="/dang-nhap"
              style={{
                fontFamily: "var(--display-2)",
                fontWeight: 600,
                fontSize: 12,
                color: TOK.goldDeep,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                textDecoration: "none",
              }}
            >
              Đăng nhập
            </Link>
            {isStandalone ? (
              <Link to="/app" className="lp-nav-cta">Vào ngay</Link>
            ) : (
              <a
                href="#main-form"
                style={{
                  padding: "9px 16px",
                  background: TOK.forest,
                  color: TOK.cream,
                  border: "none",
                  fontFamily: "var(--display-2)",
                  fontWeight: 700,
                  fontSize: 11,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  borderRadius: 999,
                }}
              >
                Mở quẻ — 30 giây
              </a>
            )}
          </nav>
        </header>

        {/* ── Hero ── */}
        <section
          style={{
            background: TOK.paper,
            padding: "clamp(32px,6vw,64px) clamp(18px,5vw,64px) clamp(48px,8vw,96px)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Kanji
            ch="吉"
            size={680}
            drift
            style={{
              position: "absolute",
              right: "clamp(-40px,-5vw,-120px)",
              top: -40,
              color: "rgba(197,165,90,0.06)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "clamp(280px,55%,1fr) 1fr",
              gap: "clamp(24px,4vw,64px)",
              alignItems: "center",
              position: "relative",
              maxWidth: 1280,
              margin: "0 auto",
            }}
            className="lp-hero-grid"
          >
            <div>
              <Mono style={{ color: TOK.goldDeep, letterSpacing: "0.22em", fontSize: 11 }}>
                —— Niên giám điện tử · 2026 Bính Ngọ
              </Mono>
              <h1
                style={{
                  fontFamily: "var(--display-2)",
                  fontWeight: 800,
                  fontSize: "clamp(42px,7vw,88px)",
                  lineHeight: 0.92,
                  letterSpacing: "-0.025em",
                  textTransform: "uppercase",
                  color: TOK.ink,
                  margin: "20px 0 12px",
                }}
              >
                Một ngày<br />
                <span style={{ color: TOK.goldDeep, fontStyle: "italic", fontWeight: 700 }}>cho riêng</span>
                <br />
                mệnh của bạn.
              </h1>
              <p
                style={{
                  fontSize: "clamp(14px,1.8vw,19px)",
                  lineHeight: 1.7,
                  color: TOK.ink2,
                  maxWidth: 520,
                  margin: "22px 0 32px",
                  fontFamily: "var(--serif)",
                }}
              >
                Lịch in chung nói "ngày này lành" — lành cho ai? Ở đây mỗi gợi ý đứng trên ngày giờ sinh của bạn, kèm lý do gửi được cho cả nhà.
              </p>
              <div style={{ display: "flex", gap: 22, alignItems: "center", flexWrap: "wrap" }}>
                <a
                  href="#main-form"
                  style={{
                    padding: "16px 28px",
                    background: TOK.forest,
                    color: TOK.cream,
                    textDecoration: "none",
                    fontFamily: "var(--display-2)",
                    fontWeight: 800,
                    fontSize: "clamp(12px,1.4vw,15px)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    boxShadow: "0 12px 24px rgba(29,49,41,0.22)",
                  }}
                >
                  Mở quẻ — 30 giây →
                </a>
                <div>
                  <Mono style={{ color: TOK.goldDeep, fontSize: 11 }}>★★★★★   1.842 hộ</Mono>
                  <p style={{ fontFamily: "var(--serif)", fontSize: 12, color: TOK.muted, marginTop: 2 }}>Đã dựng lá số tứ trụ tuần qua</p>
                </div>
              </div>
            </div>

            {/* Hero phiếu artifact */}
            <div style={{ position: "relative", height: "clamp(280px,40vw,540px)" }}>
              <div style={{ position: "absolute", top: 30, left: 30, right: 0, bottom: 0, background: "#e1d8b8", boxShadow: "0 18px 30px rgba(0,0,0,0.12)", transform: "rotate(-3deg)" }} />
              <div style={{ position: "absolute", top: 14, left: 14, right: 14, bottom: 14, background: "#e8dec1", boxShadow: "0 14px 28px rgba(0,0,0,0.1)", transform: "rotate(-1.5deg)" }} />
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 14,
                  bottom: 14,
                  background: TOK.paperWarm,
                  boxShadow: "0 30px 50px rgba(0,0,0,0.18)",
                  overflow: "hidden",
                }}
              >
                <div style={{ height: 12, background: "repeating-linear-gradient(90deg, transparent 0 6px, rgba(122,112,80,0.08) 6px 10px)", borderBottom: "1px dashed rgba(122,112,80,0.45)" }} />
                <div style={{ position: "absolute", top: 38, left: -7, width: 14, height: 14, borderRadius: "50%", background: TOK.paper }} />
                <div style={{ position: "absolute", top: 38, right: -7, width: 14, height: 14, borderRadius: "50%", background: TOK.paper }} />
                <div style={{ padding: "18px 24px 8px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <Mono style={{ color: TOK.goldDeep, fontSize: 9 }}>Phiếu chọn ngày · v.1</Mono>
                    <div style={{ fontFamily: "var(--display-2)", fontWeight: 800, fontSize: "clamp(16px,2.5vw,24px)", lineHeight: 1, marginTop: 6, textTransform: "uppercase" }}>Khai trương</div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: TOK.muted, marginTop: 4 }}>NGUYỄN MINH ANH · 1992</div>
                  </div>
                  <Stamp ch="吉日" style={{ fontSize: 18 }} />
                </div>
                <div style={{ padding: "0 24px", display: "flex", alignItems: "flex-end", gap: 14 }}>
                  <div style={{ fontFamily: "var(--display-2)", fontWeight: 800, fontSize: "clamp(72px,10vw,132px)", color: TOK.goldDeep, lineHeight: 0.85, letterSpacing: "-0.04em" }}>15</div>
                  <div style={{ paddingBottom: 14 }}>
                    <div style={{ fontFamily: "var(--display-2)", fontWeight: 700, fontSize: "clamp(14px,2vw,22px)", lineHeight: 1, textTransform: "uppercase" }}>Tháng năm</div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: TOK.muted, marginTop: 4 }}>2026 · Bính Ngọ</div>
                    <div style={{ fontFamily: "var(--hanzi)", fontWeight: 700, fontSize: 16, color: TOK.goldDeep, marginTop: 4 }}>三月二十八</div>
                  </div>
                </div>
                <div style={{ padding: "14px 24px 0" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontFamily: "var(--mono)", fontSize: 10, color: TOK.muted }}>
                    {[["Trực", "Định"], ["Sao", "Thiên Đức"], ["Giờ", "7–9h Thìn"], ["Điểm", "92/100"]].map(([k, v]) => (
                      <div key={k} style={{ borderTop: `1px solid ${TOK.border}`, paddingTop: 6 }}>
                        <div style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}>{k}</div>
                        <div style={{ fontFamily: "var(--display-2)", fontWeight: 700, fontSize: 13, color: TOK.ink, marginTop: 2, letterSpacing: "0.02em" }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Bottom perforation + stub */}
                <div style={{ position: "absolute", bottom: 56, left: 0, right: 0, height: 1, borderTop: "1px dashed rgba(122,112,80,0.45)" }} />
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "14px 24px", background: "rgba(122,112,80,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Mono style={{ color: TOK.muted }}>Đối chiếu · NLTT-2026-0042</Mono>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: TOK.goldDeep, letterSpacing: "0.18em" }}>·11/05·</span>
                </div>
              </div>
              <div
                style={{
                  position: "absolute",
                  top: -16,
                  right: -16,
                  width: 86,
                  height: 86,
                  borderRadius: "50%",
                  background: TOK.forest,
                  color: TOK.gold,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 12px 24px rgba(29,49,41,0.3)",
                  border: `2px solid ${TOK.gold}`,
                }}
              >
                <span style={{ fontFamily: "var(--display-2)", fontWeight: 800, fontSize: 32, lineHeight: 1 }}>92</span>
                <Mono size={8.5}>/100</Mono>
              </div>
            </div>
          </div>

          {/* Trust band */}
          <div
            style={{
              marginTop: 48,
              paddingTop: 24,
              borderTop: `1px solid ${TOK.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
              maxWidth: 1280,
              margin: "48px auto 0",
              position: "relative",
            }}
          >
            <Mono style={{ color: TOK.muted, fontSize: 10 }}>Đối chiếu với</Mono>
            {["Hiệp Kỷ Biện Phương", "Ngọc Hạp Thông Thư", "Bộ Tứ Trụ Hồ Điểu", "Lịch Vạn Niên 2026"].map((n, i) => (
              <span key={i} style={{ fontFamily: "var(--display-2)", fontWeight: 600, fontSize: "clamp(11px,1.4vw,14px)", color: TOK.ink2, textTransform: "uppercase", letterSpacing: "0.06em", opacity: 0.7 }}>
                {n}
              </span>
            ))}
          </div>

          {/* Hero CTA button */}
          <div style={{ marginTop: 48 }} id="main-form">
            <Link
              to="/dang-ky"
              style={{
                display: "inline-block",
                padding: "20px 36px",
                background: TOK.gold,
                color: TOK.forest,
                textDecoration: "none",
                borderRadius: 8,
                fontFamily: "var(--display-2)",
                fontWeight: 800,
                fontSize: "clamp(13px,1.5vw,16px)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                boxShadow: "0 16px 32px rgba(197,165,90,0.25)",
              }}
            >
              Mở quẻ ngay →
            </Link>
          </div>
        </section>

        {/* ── Compare 3-up ── */}
        <section
          id="compare"
          style={{
            background: TOK.paper,
            padding: "clamp(48px,6vw,72px) clamp(18px,5vw,64px)",
            borderTop: `1px solid ${TOK.border}`,
          }}
        >
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 32 }}>
              <Mono style={{ color: TOK.goldDeep, letterSpacing: "0.22em", fontSize: 11 }}>Vì sao</Mono>
              <span style={{ flex: 1, height: 1, background: TOK.border }} />
              <Mono style={{ color: TOK.muted, fontSize: 10 }}>Lịch chung nói "ngày này lành" — lành cho ai?</Mono>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 24 }}>
              {[
                {
                  tag: "Lịch in",
                  title: "Một câu trả lời cho 90 triệu người",
                  body: "Lịch in của các nhà xuất bản gộp chung mọi tuổi để vừa quyển sách — không sai, nhưng cũng không đủ.",
                  items: ['"Ngày 17/06 hợp khai trương"', "Không biết mệnh của bạn", "Không có giờ đẹp riêng", "Không lý giải được"],
                  pro: false,
                  featured: false,
                },
                {
                  tag: "Thầy bốc",
                  title: "Đắt, chậm, khó kiểm chứng",
                  body: "500k–2tr một lần, đợi 2–7 ngày, ngồi nghe 2 tiếng. Một việc — một lần.",
                  items: ["Khó hẹn lịch", "Mỗi thầy một kiểu", "Trả tiền theo việc", "Không lưu lại được"],
                  pro: false,
                  featured: false,
                },
                {
                  tag: "Ngày Lành Tháng Tốt",
                  title: "Một câu trả lời cho riêng bạn",
                  body: "Lá số tứ trụ bám theo ngày giờ sinh — mọi gợi ý sau đều tự khớp với mệnh của bạn.",
                  items: ["92/100 với mệnh Quý Thủy", "Lý do tiếng Việt rõ ràng", "Giờ đẹp kèm phiếu", "Lưu và gửi cho cả nhà"],
                  pro: true,
                  featured: true,
                },
              ].map((c, i) => (
                <div
                  key={i}
                  style={{
                    position: "relative",
                    background: c.featured ? TOK.forest : TOK.paperWarm,
                    color: c.featured ? TOK.cream : TOK.ink,
                    padding: "32px 28px",
                    border: c.featured ? `1px solid ${TOK.gold}` : `1px solid ${TOK.border}`,
                    boxShadow: c.featured ? "0 24px 48px rgba(29,49,41,0.2)" : "0 4px 12px rgba(0,0,0,0.04)",
                    transform: c.featured ? "translateY(-8px)" : "none",
                    overflow: "hidden",
                    transition: "transform 0.2s ease",
                  }}
                >
                  {c.featured ? (
                    <Kanji ch="新" size={220} style={{ position: "absolute", right: -40, bottom: -60, color: "rgba(197,165,90,0.08)" }} />
                  ) : null}
                  <Mono style={{ color: c.featured ? TOK.gold : TOK.goldDeep, fontSize: 10 }}>{c.tag}</Mono>
                  <h3
                    style={{
                      fontFamily: "var(--display-2)",
                      fontWeight: 800,
                      fontSize: "clamp(16px,2vw,24px)",
                      lineHeight: 1.1,
                      marginTop: 10,
                      textTransform: "uppercase",
                      letterSpacing: "-0.005em",
                      position: "relative",
                    }}
                  >
                    {c.title}
                  </h3>
                  <p style={{ fontSize: 14, lineHeight: 1.6, marginTop: 12, color: c.featured ? "rgba(237,231,211,0.78)" : TOK.ink2, position: "relative" }}>
                    {c.body}
                  </p>
                  <ul style={{ listStyle: "none", padding: 0, margin: "20px 0 0", position: "relative" }}>
                    {c.items.map((x, j) => (
                      <li key={j} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "6px 0", fontSize: 13, fontFamily: "var(--mono)", color: c.featured ? "rgba(237,231,211,0.85)" : TOK.ink2, borderBottom: j < c.items.length - 1 ? `1px dashed ${c.featured ? "rgba(197,165,90,0.2)" : TOK.border}` : "none" }}>
                        <span style={{ color: c.pro ? TOK.gold : "#b34a3a", flexShrink: 0 }}>{c.pro ? "✓" : "×"}</span>
                        <span>{x}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works (dark) ── */}
        <section
          id="how"
          style={{
            background: TOK.forest,
            color: TOK.cream,
            padding: "clamp(48px,6vw,72px) clamp(18px,5vw,64px)",
            borderTop: "1px solid rgba(197,165,90,0.15)",
          }}
        >
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 48 }}>
              <Mono style={{ color: TOK.gold, letterSpacing: "0.22em", fontSize: 11 }}>Cách dùng</Mono>
              <span style={{ flex: 1, height: 1, background: "rgba(197,165,90,0.25)" }} />
              <Mono style={{ color: "rgba(237,231,211,0.55)", fontSize: 10 }}>30 giây đến phiếu đầu tiên</Mono>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 32,
                position: "relative",
              }}
            >
              {/* Connecting dotted line between circles */}
              <div style={{ position: "absolute", top: 64, left: "14%", right: "14%", height: 1, backgroundImage: "repeating-linear-gradient(90deg, transparent 0 4px, rgba(197,165,90,0.4) 4px 8px)", pointerEvents: "none" }} className="lp-how-connector" />
              {[
                { n: "01", ch: "命", t: "Dựng lá số", d: "Ngày, tháng, năm, giờ sinh — chúng tôi tính tứ trụ và mệnh." },
                { n: "02", ch: "事", t: "Chọn việc", d: "Khai trương, cưới hỏi, ký kết… 26 kiểu việc, mỗi kiểu có quy tắc riêng." },
                { n: "03", ch: "吉", t: "Nhận phiếu", d: "Top 1 + lý do tiếng Việt + giờ đẹp. Lưu lịch hoặc gửi cả nhà." },
              ].map((s, i) => (
                <div key={i} style={{ position: "relative", textAlign: "center", padding: "0 12px" }}>
                  <div
                    style={{
                      width: "clamp(80px,12vw,128px)",
                      height: "clamp(80px,12vw,128px)",
                      borderRadius: "50%",
                      background: TOK.forestDeep,
                      border: `2px solid ${TOK.gold}`,
                      margin: "0 auto",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                    }}
                  >
                    <span style={{ fontFamily: "var(--hanzi)", fontWeight: 700, fontSize: "clamp(36px,6vw,60px)", color: TOK.gold, lineHeight: 1 }}>{s.ch}</span>
                    <span style={{ position: "absolute", bottom: -12, left: "50%", transform: "translateX(-50%)", padding: "3px 14px", background: TOK.gold, color: TOK.forest, fontFamily: "var(--mono)", fontWeight: 700, fontSize: 11, letterSpacing: "0.18em", borderRadius: 999, whiteSpace: "nowrap" }}>
                      Bước {s.n}
                    </span>
                  </div>
                  <h3 style={{ fontFamily: "var(--display-2)", fontWeight: 800, fontSize: "clamp(18px,2.5vw,28px)", marginTop: 28, textTransform: "uppercase", color: TOK.cream }}>{s.t}</h3>
                  <p style={{ fontSize: 14, lineHeight: 1.6, marginTop: 10, color: "rgba(237,231,211,0.7)" }}>{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Methodology ── */}
        <section
          style={{
            background: TOK.paper,
            padding: "clamp(48px,6vw,72px) clamp(18px,5vw,64px)",
            borderTop: `1px solid ${TOK.border}`,
          }}
        >
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 40 }}>
              <Mono style={{ color: TOK.goldDeep, letterSpacing: "0.22em", fontSize: 11 }}>Cách tính</Mono>
              <span style={{ flex: 1, height: 1, background: TOK.border }} />
              <Mono style={{ color: TOK.muted, fontSize: 10 }}>Đối chiếu được — không phải hộp đen</Mono>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr clamp(240px,45%,560px)", gap: "clamp(24px,4vw,56px)", alignItems: "center" }}>
              <div>
                <h2
                  style={{
                    fontFamily: "var(--display-2)",
                    fontWeight: 800,
                    fontSize: "clamp(28px,5vw,56px)",
                    lineHeight: 1.04,
                    textTransform: "uppercase",
                    letterSpacing: "-0.015em",
                  }}
                >
                  Mỗi điểm số đều{" "}
                  <span style={{ color: TOK.goldDeep, fontStyle: "italic", fontWeight: 700 }}>trỏ về</span>{" "}
                  một câu trong sách cũ.
                </h2>
                <p style={{ fontSize: 15, lineHeight: 1.65, color: TOK.ink2, marginTop: 18, maxWidth: 480 }}>
                  Hệ chấm điểm theo 4 lớp:{" "}
                  <strong>trực ngày</strong> (Hiệp Kỷ),{" "}
                  <strong>nhị thập bát tú</strong>,{" "}
                  <strong>can chi tương sinh tương khắc</strong> với tứ trụ của bạn, và{" "}
                  <strong>thần sát</strong> (Thiên Đức, Nguyệt Đức, Tam Sát…).
                </p>
                <p style={{ fontSize: 14, lineHeight: 1.65, color: TOK.muted, marginTop: 14, fontStyle: "italic" }}>
                  1 lần chọn ngày (30 ngày tìm kiếm) = 10 lượng. Dựng lá số lần đầu = 0 lượng.
                </p>
              </div>
              <div style={{ background: TOK.paperWarm, border: `1px solid ${TOK.border}`, padding: "28px 28px" }}>
                <Mono style={{ color: TOK.goldDeep }}>Bóc tách điểm 92/100</Mono>
                <div style={{ marginTop: 18 }}>
                  {[
                    { label: "Trực Định", src: "Hiệp Kỷ Biện Phương · q.4", score: "+24" },
                    { label: "Sao Thiên Đức", src: "Ngọc Hạp Thông Thư", score: "+20" },
                    { label: "Can chi tương sinh", src: "Bính Tuất → Nhâm Thân", score: "+28" },
                    { label: "Giờ Thìn 7–9h", src: "Tứ trụ chủ — Mộc vượng", score: "+20" },
                  ].map((r, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < 3 ? `1px dashed ${TOK.border}` : "none" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "var(--display-2)", fontWeight: 700, fontSize: 14, textTransform: "uppercase" }}>{r.label}</div>
                        <Mono size={10} style={{ color: TOK.muted, marginTop: 2 }}>{r.src}</Mono>
                      </div>
                      <span style={{ fontFamily: "var(--display-2)", fontWeight: 800, fontSize: 18, color: TOK.goldDeep }}>{r.score}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 14, padding: "10px 0 2px", borderTop: `2px solid ${TOK.ink}`, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontFamily: "var(--display-2)", fontWeight: 800, fontSize: 16, textTransform: "uppercase" }}>Tổng</span>
                    <span style={{ fontFamily: "var(--display-2)", fontWeight: 800, fontSize: 36, color: TOK.goldDeep }}>92<span style={{ fontSize: 14, color: TOK.muted }}>/100</span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Pricing ── */}
        <section
          id="pricing"
          style={{
            background: TOK.paperWarm,
            padding: "clamp(48px,6vw,72px) clamp(18px,5vw,64px)",
            borderTop: `1px solid ${TOK.border}`,
          }}
        >
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 40 }}>
              <Mono style={{ color: TOK.goldDeep, letterSpacing: "0.22em", fontSize: 11 }}>Bảng giá</Mono>
              <span style={{ flex: 1, height: 1, background: TOK.border }} />
              <Mono style={{ color: TOK.muted, fontSize: 10 }}>Trả theo lượng · không gói nào ép buộc</Mono>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
              {PACKAGES_V2.map((p) => (
                <div
                  key={p.id}
                  style={{
                    position: "relative",
                    background: p.featured ? TOK.forest : "#fff",
                    color: p.featured ? TOK.cream : TOK.ink,
                    padding: "28px 22px",
                    border: p.featured ? `1px solid ${TOK.gold}` : `1px solid ${TOK.border}`,
                    overflow: "hidden",
                  }}
                >
                  {p.featured ? (
                    <span
                      style={{
                        position: "absolute",
                        top: -10,
                        left: 22,
                        padding: "3px 10px",
                        background: TOK.gold,
                        color: TOK.forest,
                        fontFamily: "var(--display-2)",
                        fontWeight: 800,
                        fontSize: 9,
                        letterSpacing: "0.18em",
                      }}
                    >
                      PHỔ BIẾN
                    </span>
                  ) : null}
                  <Mono style={{ color: p.featured ? "rgba(197,165,90,0.7)" : TOK.goldDeep, marginTop: p.featured ? 10 : 0 }}>{p.kicker}</Mono>
                  <div style={{ fontFamily: "var(--display-2)", fontWeight: 800, fontSize: "clamp(16px,2vw,22px)", marginTop: 8, textTransform: "uppercase" }}>{p.name}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 14 }}>
                    <span style={{ fontFamily: "var(--display-2)", fontWeight: 800, fontSize: "clamp(28px,4vw,44px)", lineHeight: 1, color: p.featured ? TOK.gold : TOK.goldDeep }}>{p.price}</span>
                    <Mono style={{ color: p.featured ? "rgba(197,165,90,0.7)" : TOK.muted }}>{p.period}</Mono>
                  </div>
                  <Mono style={{ color: p.featured ? "rgba(197,165,90,0.7)" : TOK.muted, fontSize: 11, marginTop: 4 }}>{p.credits}</Mono>
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: p.featured ? "1px solid rgba(197,165,90,0.2)" : `1px solid ${TOK.border}` }}>
                    {p.items.map((it, j) => (
                      <div key={j} style={{ display: "flex", gap: 8, padding: "5px 0", fontSize: 13, fontFamily: "var(--mono)", color: p.featured ? "rgba(237,231,211,0.85)" : TOK.ink2 }}>
                        <span style={{ color: p.featured ? TOK.gold : TOK.goldDeep }}>✓</span>{it}
                      </div>
                    ))}
                  </div>
                  <Link
                    to="/dang-ky"
                    style={{
                      display: "block",
                      marginTop: 20,
                      padding: "12px",
                      background: p.featured ? TOK.gold : "transparent",
                      color: p.featured ? TOK.forest : TOK.ink,
                      border: p.featured ? "none" : `1px solid ${TOK.borderStrong}`,
                      fontFamily: "var(--display-2)",
                      fontWeight: 800,
                      fontSize: 12,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      textDecoration: "none",
                      textAlign: "center",
                    }}
                  >
                    {p.cta} →
                  </Link>
                </div>
              ))}
            </div>
            <div
              style={{
                marginTop: 24,
                padding: "16px 20px",
                background: "rgba(125,98,25,0.06)",
                borderLeft: `3px solid ${TOK.goldDeep}`,
                fontFamily: "var(--serif)",
                fontSize: 14,
                color: TOK.ink2,
                lineHeight: 1.65,
              }}
            >
              <strong>Mở tài khoản — được 20 lượng tặng.</strong> Dựng lá số tứ trụ không trừ lượng. Gói theo tháng/năm thì không trừ lượng từng việc — dùng trong thời hạn gói. Lượng mua lẻ có hiệu lực 12 tháng kể từ ngày mua.
            </div>
          </div>
        </section>

        {/* ── Testimonials (dark) ── */}
        <section
          style={{
            background: TOK.forest,
            color: TOK.cream,
            padding: "clamp(48px,6vw,72px) clamp(18px,5vw,64px)",
            borderTop: "1px solid rgba(197,165,90,0.15)",
          }}
        >
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 40 }}>
              <Mono style={{ color: TOK.gold, letterSpacing: "0.22em", fontSize: 11 }}>Khách nói gì</Mono>
              <span style={{ flex: 1, height: 1, background: "rgba(197,165,90,0.25)" }} />
              <Mono style={{ color: "rgba(237,231,211,0.55)", fontSize: 10 }}>1.842 hộ đã dựng lá số · từ tháng 3 / 2025</Mono>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24 }}>
              {TESTIMONIALS.map((t, i) => (
                <div
                  key={i}
                  style={{
                    background: TOK.forestDeep,
                    border: "1px solid rgba(197,165,90,0.18)",
                    padding: "28px 26px",
                    position: "relative",
                  }}
                >
                  <span style={{ position: "absolute", top: 12, right: 14, fontFamily: "var(--hanzi)", fontWeight: 700, fontSize: 56, color: "rgba(197,165,90,0.1)", lineHeight: 1 }}>"</span>
                  <Mono style={{ color: TOK.gold }}>{t.ev}</Mono>
                  <p style={{ fontSize: 15, lineHeight: 1.65, marginTop: 14, color: "rgba(237,231,211,0.88)", fontStyle: "italic", position: "relative", fontFamily: "var(--serif)" }}>
                    "{t.body}"
                  </p>
                  <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px dashed rgba(197,165,90,0.2)", fontFamily: "var(--mono)", fontSize: 11, color: "rgba(237,231,211,0.6)", letterSpacing: "0.06em" }}>
                    {t.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section
          id="faq"
          style={{
            background: TOK.paper,
            padding: "clamp(48px,6vw,72px) clamp(18px,5vw,64px)",
            borderTop: `1px solid ${TOK.border}`,
          }}
        >
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 40 }}>
              <Mono style={{ color: TOK.goldDeep, letterSpacing: "0.22em", fontSize: 11 }}>Hỏi đáp</Mono>
              <span style={{ flex: 1, height: 1, background: TOK.border }} />
              <Mono style={{ color: TOK.muted, fontSize: 10 }}>5 câu hay gặp nhất</Mono>
            </div>
            {FAQS_V2.map(([q, a], i) => (
              <FaqItem
                key={i}
                q={q}
                a={a}
                index={i}
                open={openFaq === i}
                onToggle={() => setOpenFaq((prev) => (prev === i ? -1 : i))}
              />
            ))}
            <div style={{ borderTop: `1px solid ${TOK.border}`, paddingTop: 20 }} />
          </div>
        </section>

        {/* ── Bottom CTA (forest) ── */}
        <section
          style={{
            background: TOK.forest,
            color: TOK.cream,
            padding: "clamp(64px,8vw,96px) clamp(18px,5vw,64px)",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Kanji ch="日" size={520} drift style={{ position: "absolute", left: -100, top: "50%", transform: "translateY(-50%)", color: "rgba(197,165,90,0.06)", pointerEvents: "none" }} />
          <Kanji ch="月" size={520} style={{ position: "absolute", right: -100, top: "50%", transform: "translateY(-50%)", color: "rgba(197,165,90,0.06)", pointerEvents: "none" }} />
          <div style={{ position: "relative", maxWidth: 800, margin: "0 auto" }}>
            <Mono style={{ color: TOK.gold }}>Bắt đầu</Mono>
            <h2
              style={{
                fontFamily: "var(--display-2)",
                fontWeight: 800,
                fontSize: "clamp(36px,7vw,88px)",
                lineHeight: 0.96,
                marginTop: 16,
                textTransform: "uppercase",
                letterSpacing: "-0.02em",
              }}
            >
              Phiếu đầu tiên
              <br />
              <span style={{ color: TOK.gold }}>miễn phí — 30 giây.</span>
            </h2>
            <p style={{ fontSize: "clamp(14px,1.8vw,18px)", color: "rgba(237,231,211,0.72)", marginTop: 18 }}>
              20 lượng tặng · không cần thẻ
            </p>
            <Link
              to="/dang-ky"
              style={{
                display: "inline-block",
                marginTop: 32,
                padding: "20px 36px",
                background: TOK.gold,
                color: TOK.forest,
                textDecoration: "none",
                borderRadius: 8,
                fontFamily: "var(--display-2)",
                fontWeight: 800,
                fontSize: "clamp(13px,1.5vw,16px)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                boxShadow: "0 16px 32px rgba(197,165,90,0.25)",
              }}
            >
              Mở quẻ ngay →
            </Link>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer
          style={{
            background: TOK.forestDeep,
            color: "rgba(237,231,211,0.6)",
            padding: "clamp(32px,5vw,48px) clamp(18px,5vw,64px) clamp(20px,3vw,32px)",
            borderTop: "1px solid rgba(197,165,90,0.15)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "clamp(160px,30%,320px) repeat(auto-fit, minmax(120px, 1fr))",
              gap: "clamp(24px,4vw,48px)",
              maxWidth: 1280,
              margin: "0 auto",
            }}
            className="lp-footer-grid"
          >
            <div>
              <Logo dark size={32} showUrl />
              <p style={{ marginTop: 18, fontFamily: "var(--serif)", fontSize: 13, lineHeight: 1.65, maxWidth: 320 }}>
                Niên giám điện tử cho người Việt — chọn ngày dựa trên lá số tứ trụ, không phải lịch chung.
              </p>
            </div>
            {[
              ["Sản phẩm", [
                { label: "Mở quẻ hôm nay", to: "/dang-ky" },
                { label: "Lá số tứ trụ", to: "/dang-ky" },
                { label: "Bảng giá", href: "#pricing" },
                { label: "PWA — cài lên điện thoại", href: undefined },
              ]],
              ["Công ty", [
                { label: "Vì sao NLTT", href: "#compare" },
                { label: "Câu hỏi thường gặp", href: "#faq" },
                { label: "Liên hệ", href: "mailto:hotro@ngaylanhthangtot.vn" },
                { label: "Tuyển dụng", href: "mailto:hotro@ngaylanhthangtot.vn" },
              ]],
              ["Pháp lý", [
                { label: "Điều khoản", to: "/dieu-khoan" },
                { label: "Bảo mật dữ liệu", to: "/chinh-sach-bao-mat" },
                { label: "Chính sách hoàn tiền", href: "mailto:hotro@ngaylanhthangtot.vn" },
                { label: "GPKD 0317…", href: undefined },
              ]],
            ].map(([title, links]) => (
              <div key={title as string}>
                <Mono style={{ color: TOK.gold }}>{title as string}</Mono>
                <ul style={{ listStyle: "none", padding: 0, margin: "14px 0 0" }}>
                  {(links as { label: string; to?: string; href?: string }[]).map((x) => (
                    <li key={x.label} style={{ padding: "4px 0" }}>
                      {x.to ? (
                        <Link to={x.to} style={{ fontSize: 13, fontFamily: "var(--serif)", color: "rgba(237,231,211,0.6)", textDecoration: "none" }}>{x.label}</Link>
                      ) : x.href ? (
                        <a href={x.href} style={{ fontSize: 13, fontFamily: "var(--serif)", color: "rgba(237,231,211,0.6)", textDecoration: "none" }}>{x.label}</a>
                      ) : (
                        <span style={{ fontSize: 13, fontFamily: "var(--serif)" }}>{x.label}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: "clamp(24px,3vw,40px)",
              paddingTop: 24,
              borderTop: "1px solid rgba(197,165,90,0.12)",
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 8,
              fontFamily: "var(--mono)",
              fontSize: 10,
              color: "rgba(237,231,211,0.5)",
              letterSpacing: "0.08em",
              maxWidth: 1280,
              margin: "clamp(24px,3vw,40px) auto 0",
            }}
          >
            <span>© 2026 Ngày Lành Tháng Tốt — ngaylanhthangtot.vn</span>
            <span>Made in Sài Gòn · với lá số của bạn</span>
          </div>
        </footer>

        {/* ── Sticky mobile bottom bar ── */}
        <div
          aria-hidden={!showStickyBar}
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            background: "rgba(240,236,226,0.95)",
            backdropFilter: "blur(12px) saturate(140%)",
            WebkitBackdropFilter: "blur(12px) saturate(140%)",
            borderTop: `1px solid ${TOK.border}`,
            padding: "12px 18px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            transform: showStickyBar ? "translateY(0)" : "translateY(100%)",
            transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
          }}
          className="lp-sticky-bar"
        >
          <LogoMark size={24} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "var(--display-2)", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.02em" }}>Ngày Lành Tháng Tốt</div>
            <Mono style={{ color: TOK.muted, display: "block" }} size={9}>20 lượng tặng · không cần thẻ</Mono>
          </div>
          <a
            href="#main-form"
            onClick={() => setShowStickyBar(false)}
            style={{
              padding: "11px 18px",
              background: TOK.forest,
              color: TOK.cream,
              fontFamily: "var(--display-2)",
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              textDecoration: "none",
              flexShrink: 0,
              borderRadius: 999,
            }}
          >
            Mở quẻ →
          </a>
        </div>
      </div>
    </>
  );
}
