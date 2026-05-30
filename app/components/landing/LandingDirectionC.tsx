/**
 * Direction C marketing landing — port of c-landing.jsx
 */
import { useCallback, useState, type CSSProperties } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

import { GoogleIcon } from "~/components/auth/c-auth-ui";
import { LogoMark, Mono } from "~/components/brand";
import { scoreColorFromPoints } from "~/components/landing/landing-c-utils";
import { supabase } from "~/lib/supabase";

import "~/styles/landing-direction-c.css";

const T = {
  paper: "#f0ece2",
  paperWarm: "#ede7d3",
  ink: "#18150e",
  ink2: "#3a3220",
  forest: "#1d3129",
  forestDeep: "#0e1c14",
  cream: "#ede7d3",
  gold: "#c5a55a",
  goldDeep: "#9a7c22",
  muted: "#7a7050",
  greenMute: "#7a9a80",
  red: "#a3201f",
  hairline: "rgba(154,124,34,0.18)",
  hairline2: "rgba(154,124,34,0.10)",
} as const;

const NAV = [
  ["Lịch", "#lich"],
  ["Cá nhân hoá", "#ca-nhan-hoa"],
  ["Bảng giá", "#bang-gia"],
  ["Hỏi đáp", "#hoi-dap"],
] as const;

const FAQS = [
  [
    "Ứng dụng hoạt động như thế nào?",
    "Chỉ mất 30 giây để nhập ngày giờ sinh, hệ thống sẽ tự động lập lá số Tứ Trụ (Bát Tự) của riêng bạn. Mỗi sáng mở ứng dụng, trang lịch hôm nay đã chấm điểm cát hung và chỉ ra những thời điểm phù hợp nhất dựa trên bản mệnh của bạn. Ngoài ra, mục Lịch tháng sẽ giúp bạn có cái nhìn tổng quan cả tháng, và mục Tra cứu sẽ hỗ trợ đắc lực khi cần chọn ngày lành cho các việc đại sự cụ thể.",
  ],
  [
    "Nguồn gốc thông tin có đáng tin cậy không?",
    "Hệ thống đối chiếu chặt chẽ từ 4 nguồn trước tác kinh điển của nền cổ học Đông Phương: Hiệp Kỷ Biện Phương Thư, Ngọc Hạp Thông Thư, Tử Bình Chân Thuyên, và Tam Mệnh Thông Hội. Mỗi điểm số cát hung đều được lập luận khoa học và minh bạch — bạn có thể bấm vào điểm số để xem câu nguyên văn trích dẫn từ sách gốc.",
  ],
  [
    "Nên chọn gói dịch vụ nào phù hợp nhất?",
    "Gói năm 799.000đ là lựa chọn tối ưu và trọn vẹn nhất — mở khóa toàn bộ tính năng bao gồm: Lịch bản mệnh trọn năm + Luận giải lá số Bát Tự chi tiết + Luận giải Tiểu Vận hằng năm. Gói này giúp bạn tiết kiệm đáng kể so với việc đăng ký lẻ từng tính năng.",
  ],
  [
    "Tôi không am hiểu về tử vi, phong thủy có dùng được không?",
    "Hoàn toàn được. Bạn chỉ cần nhập giờ ngày tháng năm sinh, hệ thống tự động tính toán và an sao lập bản mệnh. Toàn bộ luận giải đều được diễn dịch sang tiếng Việt dung dị, đời thường, dễ hiểu, không lạm dụng các thuật ngữ Hán Việt nặng nề hay mang tính hù dọa.",
  ],
  [
    "Cách cài đặt ứng dụng lên điện thoại?",
    "Ứng dụng Ngày Lành Tháng Tốt sử dụng công nghệ hiện đại, cho phép bạn cài đặt trực tiếp lên màn hình chính của iPhone hoặc Android chỉ với một chạm mà không cần qua App Store hay Google Play. Cuốn lịch bản mệnh của bạn sẽ luôn được đồng bộ tức thì mọi lúc, mọi nơi.",
  ],
  [
    "Ứng dụng có tự động gia hạn và trừ tiền không?",
    "Tuyệt đối không. Khi hết hạn, bạn sẽ chủ động quyết định việc tiếp tục đồng hành hay không. Chúng tôi không bao giờ tự động lưu hay trừ tiền trong thẻ của bạn. Ngoài ra, cam kết hoàn tiền 100% trong vòng 7 ngày nếu trải nghiệm không làm bạn hài lòng.",
  ],
] as const;

const landingGoogleBtnClass =
  "inline-flex items-center justify-center gap-2 border-0 cursor-pointer font-display font-bold uppercase no-underline";

function useLandingGoogleSignIn() {
  const [busy, setBusy] = useState(false);
  const signInGoogle = useCallback(async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setBusy(false);
    if (error) toast.error(error.message);
  }, []);
  return { busy, signInGoogle };
}

function LandingGoogleSignInButton({
  className,
  style,
  onAfterClick,
}: {
  className: string;
  style?: CSSProperties;
  onAfterClick?: () => void;
}) {
  const { busy, signInGoogle } = useLandingGoogleSignIn();
  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => {
        void signInGoogle();
        onAfterClick?.();
      }}
      className={className}
      style={style}
    >
      <GoogleIcon />
      {busy ? "Đang chuyển…" : "Đăng nhập bằng Google"}
    </button>
  );
}

function LHeader({ onMenu }: { onMenu: () => void }) {
  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between"
      style={{
        background: "rgba(240,236,226,0.94)",
        backdropFilter: "blur(16px) saturate(140%)",
        borderBottom: `1px solid ${T.hairline}`,
        padding: "14px 6vw",
      }}
    >
      <div className="flex items-center gap-3">
        <LogoMark size={36} />
        <div style={{ lineHeight: 1.1 }}>
          <div
            className="font-display font-extrabold text-base uppercase"
            style={{ color: T.ink, letterSpacing: "-0.005em" }}
          >
            Ngày Lành
          </div>
          <div
            className="font-display font-semibold text-[9.5px] uppercase"
            style={{ color: T.goldDeep, letterSpacing: "0.32em" }}
          >
            Tháng Tốt
          </div>
        </div>
      </div>
      <nav className="ldc-nav-desktop flex items-center gap-8">
        {NAV.map(([t, h]) => (
          <a
            key={t}
            href={h}
            className="font-display font-semibold text-[13.5px] uppercase no-underline"
            style={{ color: T.ink2, letterSpacing: "0.06em" }}
          >
            {t}
          </a>
        ))}
        <Link
          to="/dang-nhap"
          className="font-display font-semibold text-[13.5px] uppercase no-underline"
          style={{ color: T.goldDeep, letterSpacing: "0.06em" }}
        >
          Mở lịch
        </Link>
        <LandingGoogleSignInButton
          className={`${landingGoogleBtnClass} px-5 py-2.5 text-xs`}
          style={{ background: T.forest, color: T.cream, letterSpacing: "0.1em" }}
        />
      </nav>
      <button
        type="button"
        className="ldc-nav-mobile border-0 bg-transparent cursor-pointer p-2"
        style={{ display: "none" }}
        onClick={onMenu}
        aria-label="Menu"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={T.ink} strokeWidth="1.8" strokeLinecap="round">
          <path d="M3 6h18 M3 12h18 M3 18h18" />
        </svg>
      </button>
    </header>
  );
}

function LMobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[100] flex justify-end"
      style={{ background: "rgba(24,21,14,0.65)" }}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="h-full flex flex-col"
        style={{ width: "78%", maxWidth: 320, background: T.paper, padding: "24px 24px 32px" }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal
      >
        <div className="flex justify-end">
          <button type="button" onClick={onClose} className="border-0 bg-transparent cursor-pointer text-2xl p-1" style={{ color: T.ink }} aria-label="Đóng">
            ×
          </button>
        </div>
        <nav className="mt-3.5 flex flex-col gap-5">
          {NAV.map(([t, h]) => (
            <a key={t} href={h} onClick={onClose} className="font-display font-bold text-xl uppercase no-underline" style={{ color: T.ink }}>
              {t}
            </a>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-2.5">
          <Link to="/dang-nhap" onClick={onClose} className="text-center py-3 font-display font-semibold text-[13.5px] uppercase no-underline" style={{ color: T.goldDeep }}>
            Mở lịch của tôi
          </Link>
          <LandingGoogleSignInButton
            className={`${landingGoogleBtnClass} w-full py-3.5 text-[13.5px]`}
            style={{ background: T.forest, color: T.cream, letterSpacing: "0.08em" }}
            onAfterClick={onClose}
          />
        </div>
      </div>
    </div>
  );
}

function LHeroStack() {
  const pages = [
    { d: 28, m: 6, wd: "CN", chi: "Quý Mão", score: 84, rot: 8, off: [120, 80] as const },
    { d: 17, m: 6, wd: "T4", chi: "Canh Thìn", score: 85, rot: 5, off: [80, 40] as const },
    { d: 14, m: 6, wd: "CN", chi: "Đinh Sửu", score: 88, rot: -3, off: [40, 20] as const },
    { d: 23, m: 6, wd: "T3", chi: "Bính Tuất", score: 78, rot: -6, off: [-20, 60] as const },
    { d: 25, m: 6, wd: "T5", chi: "Mậu Tý", score: 73, rot: 10, off: [-50, 110] as const },
  ];
  return (
    <div className="ldc-hero-stack relative" style={{ height: 540 }}>
      {pages.map((p, i) => (
        <div
          key={i}
          className="absolute overflow-hidden"
          style={{
            top: 100 + p.off[1],
            left: 60 + p.off[0],
            width: 180,
            height: 220,
            background: "#fff",
            border: `1px solid ${T.hairline2}`,
            boxShadow: "0 12px 24px rgba(0,0,0,0.1)",
            transform: `rotate(${p.rot}deg)`,
            padding: "8px 12px",
            zIndex: 1,
          }}
        >
          <div className="font-serif text-[10.5px]" style={{ color: T.muted }}>
            Tháng {p.m} · 2026
          </div>
          <div className="mt-1.5 flex items-end gap-2">
            <div className="font-display font-extrabold text-[76.5px] leading-[0.85] tabular-nums" style={{ color: T.red, letterSpacing: "-0.045em" }}>
              {p.d}
            </div>
            <div className="pb-2 font-display font-extrabold text-base uppercase leading-none" style={{ color: T.red }}>
              {p.wd}
            </div>
          </div>
          <div className="mt-3 pt-2 flex justify-between items-baseline" style={{ borderTop: `1px solid ${T.hairline2}` }}>
            <Mono style={{ color: T.muted, fontSize: 9.5, letterSpacing: "0.06em" }}>{p.chi}</Mono>
            <span className="font-display font-extrabold text-[22.5px] leading-none" style={{ color: scoreColorFromPoints(p.score) }}>
              {p.score}
            </span>
          </div>
        </div>
      ))}
      <div
        className="ldc-hero-front absolute"
        style={{
          top: 30,
          left: "20%",
          width: 280,
          height: 380,
          background: "#fff",
          border: `1px solid ${T.hairline}`,
          boxShadow: "0 36px 60px rgba(0,0,0,0.2), 0 6px 12px rgba(0,0,0,0.08)",
          zIndex: 10,
          transform: "rotate(-2deg)",
        }}
      >
        <div className="px-[22px] pt-3.5 pb-1.5" style={{ borderBottom: `1px solid ${T.hairline2}` }}>
          <span className="font-serif text-[13px]" style={{ color: T.muted }}>
            Tháng 5 · 2026 · Bính Ngọ
          </span>
        </div>
        <div className="px-[22px] py-3 flex items-end gap-3.5">
          <div className="font-display font-extrabold text-[130.5px] leading-[0.84] tabular-nums" style={{ color: T.red, letterSpacing: "-0.045em" }}>
            26
          </div>
          <div className="pb-4 font-display font-black text-[28.5px] uppercase leading-[0.95]" style={{ color: T.red }}>
            Thứ Ba
          </div>
        </div>
        <p className="px-[22px] pb-3.5 font-serif text-[13px] leading-snug" style={{ color: T.ink2 }}>
          Mùng 10 tháng Tư · ngày <strong style={{ color: T.ink, fontWeight: 600 }}>Mậu Tuất</strong> · tiết Tiểu Mãn
        </p>
        <div className="px-[22px] py-3.5 flex justify-between items-baseline" style={{ borderTop: `1px solid ${T.hairline}`, background: "rgba(154,124,34,0.04)" }}>
          <div>
            <div className="font-display font-extrabold text-base uppercase" style={{ color: T.goldDeep }}>
              Ngày khá
            </div>
            <div className="font-serif text-[11.5px] mt-0.5" style={{ color: T.muted }}>
              cho mệnh Quý Thủy
            </div>
          </div>
          <div className="flex items-baseline gap-0.5">
            <span className="font-display font-extrabold text-[40.5px] leading-none tabular-nums" style={{ color: T.goldDeep }}>
              76
            </span>
            <span className="font-serif text-xs" style={{ color: T.muted }}>
              /100
            </span>
          </div>
        </div>
        <p className="px-[22px] py-3 font-serif italic text-[13px] leading-snug" style={{ color: T.ink2 }}>
          &ldquo;Mộc khí vượng đến trưa, hợp ký kết và mở việc.&rdquo;
        </p>
      </div>
      <div
        className="absolute top-2.5 right-2.5 z-[11] px-3 py-1.5 font-mono text-[9.5px] font-extrabold uppercase"
        style={{ background: T.ink, color: T.gold, letterSpacing: "0.22em" }}
      >
        365 trang · cả năm
      </div>
    </div>
  );
}

function SectionKicker({ children, dark }: { children: string; dark?: boolean }) {
  return (
    <div className="flex items-baseline gap-3.5 mb-8">
      <Mono style={{ color: dark ? T.gold : T.goldDeep, fontSize: 11.5, letterSpacing: "0.22em" }}>
        {children}
      </Mono>
      <span className="flex-1 h-px" style={{ background: dark ? "rgba(197,165,90,0.25)" : T.hairline }} />
    </div>
  );
}

export function LandingDirectionC() {
  const [menu, setMenu] = useState(false);
  const [faqOpen, setFaqOpen] = useState(0);

  return (
    <div className="ldc-root" style={{ background: T.paper, fontFamily: "var(--serif)", color: T.ink }}>
      <LHeader onMenu={() => setMenu(true)} />
      <LMobileDrawer open={menu} onClose={() => setMenu(false)} />

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: T.paper, padding: "64px 6vw 80px" }}>
        <div className="ldc-hero-grid max-w-[1200px] mx-auto grid items-center gap-14" style={{ gridTemplateColumns: "1.05fr 1fr" }}>
          <div>
            <Mono style={{ color: T.goldDeep, fontSize: 11.5, letterSpacing: "0.22em" }}>
              LỊCH BẢN MỆNH CÁ NHÂN · 2026
            </Mono>
            <h1 className="ldc-hero-h1 font-display font-extrabold uppercase leading-[0.9] my-5" style={{ fontSize: 96.5, letterSpacing: "-0.03em", color: T.ink }}>
              Đây là
              <br />
              lịch
              <br />
              <span className="font-serif italic font-bold normal-case" style={{ color: T.goldDeep }}>
                của bạn
              </span>
              .
            </h1>
            <p className="font-serif text-[19.5px] leading-relaxed m-0 max-w-[460px]" style={{ color: T.ink2 }}>
              Không chỉ để tra cứu những khi có sự vụ. Không mang tính công cụ sáo mòn.
              <br />
              <strong style={{ color: T.ink, fontWeight: 600 }}>365 trang lịch tờ truyền thống</strong> — mỗi tờ mở ra đều đã được chấm sẵn cát hung dựa trên lá số Tứ Trụ bản mệnh của riêng bạn.
            </p>
            <div className="mt-7 px-[18px] py-4" style={{ background: "rgba(154,124,34,0.06)", borderLeft: `3px solid ${T.goldDeep}` }}>
              <Mono style={{ color: T.goldDeep, fontSize: 10.5, letterSpacing: "0.18em" }}>MỖI SỚM MAI</Mono>
              <p className="font-serif italic text-sm mt-1 mb-0 leading-snug" style={{ color: T.ink }}>
                &ldquo;Nhẹ nhàng lật tờ lịch mới. Thấu suốt năng lượng ngày hôm nay để làm chủ nhân duyên, đón lành tránh dữ.&rdquo;
              </p>
            </div>
            <div className="mt-7 flex flex-wrap gap-3.5 items-center">
              <Link
                to="/dang-ky"
                className="px-8 py-[18px] font-display font-bold text-[15.5px] uppercase no-underline"
                style={{ background: T.forest, color: T.cream, letterSpacing: "0.1em", boxShadow: "0 12px 24px rgba(29,49,41,0.18)" }}
              >
                Khởi tạo lịch bản mệnh
              </Link>
              <div className="font-serif text-[13.5px] leading-snug" style={{ color: T.muted }}>
                Khởi tạo trong 30 giây · Trải nghiệm ngay miễn phí
              </div>
            </div>
          </div>
          <LHeroStack />
        </div>
      </section>

      {/* Ritual */}
      <section id="lich" style={{ background: T.forest, color: T.cream, padding: "88px 6vw", borderTop: "1px solid rgba(197,165,90,0.15)" }}>
        <div className="max-w-[1200px] mx-auto">
          <SectionKicker dark>Nếp lịch tờ truyền thống</SectionKicker>
          <h2 className="ldc-ritual-h2 font-display font-extrabold uppercase leading-none max-w-[800px]" style={{ fontSize: 64.5, letterSpacing: "-0.02em" }}>
            Như lật{" "}
            <span className="font-serif italic font-bold normal-case" style={{ color: T.gold }}>
              trang lịch tờ
            </span>
            <br />
            trên tường — nhưng{" "}
            <em className="font-serif font-bold not-italic" style={{ color: T.gold }}>
              của riêng bạn
            </em>
            .
          </h2>
          <p className="font-serif text-[17.5px] leading-relaxed mt-5 max-w-[640px]" style={{ color: "rgba(237,231,211,0.72)" }}>
            Thói quen lật tờ lịch mới mỗi sớm mai — nay được viết riêng cho bản mệnh của bạn.{" "}
            <strong style={{ color: T.cream, fontWeight: 600 }}>Không còn mò mẫm sách cổ, không cần tự bấm đốt ngón tay, cát hung ngày mới hiển thị tỏ tường hằng ngày.</strong>
          </p>
          <div className="ldc-ritual-pages mt-14 grid gap-6" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            {[
              { d: 25, wd: "T2", verdict: "Bình thường", score: 62, current: false },
              { d: 26, wd: "T3", verdict: "Ngày khá", score: 76, current: true },
              { d: 27, wd: "T4", verdict: "Ngày tốt", score: 82, current: false },
            ].map((p) => (
              <div
                key={p.d}
                className="relative bg-white text-left"
                style={{
                  border: p.current ? `1.5px solid ${T.gold}` : `1px solid ${T.hairline2}`,
                  transform: p.current ? "scale(1.03)" : undefined,
                  boxShadow: p.current ? "0 24px 48px rgba(0,0,0,0.3)" : "0 8px 18px rgba(0,0,0,0.1)",
                }}
              >
                {p.current ? (
                  <div className="absolute -top-2.5 left-3.5 px-2.5 py-0.5 font-mono text-[9.5px] font-extrabold" style={{ background: T.gold, color: T.forest, letterSpacing: "0.18em" }}>
                    HÔM NAY
                  </div>
                ) : null}
                <div className="px-[18px] pt-3.5 pb-1.5" style={{ borderBottom: `1px solid ${T.hairline2}` }}>
                  <span className="font-serif text-[11.5px]" style={{ color: T.muted }}>
                    Tháng 5 · 2026
                  </span>
                </div>
                <div className="px-[18px] py-3.5 flex items-end gap-3">
                  <div className="font-display font-extrabold text-[96.5px] leading-[0.85] tabular-nums" style={{ color: p.current ? T.red : "rgba(163,32,31,0.45)" }}>
                    {p.d}
                  </div>
                  <div className="pb-3 font-display font-extrabold text-[22.5px] uppercase leading-[0.95]" style={{ color: p.current ? T.red : "rgba(163,32,31,0.5)" }}>
                    {p.wd}
                  </div>
                </div>
                <div className="px-[18px] py-3.5 flex justify-between items-baseline" style={{ borderTop: `1px solid ${T.hairline2}`, background: p.current ? "rgba(154,124,34,0.05)" : undefined }}>
                  <div className="font-display font-bold text-[13.5px] uppercase" style={{ color: p.current ? T.goldDeep : T.muted }}>
                    {p.verdict}
                  </div>
                  <span className="font-display font-extrabold text-[22.5px]" style={{ color: scoreColorFromPoints(p.score) }}>
                    {p.score}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Personalization */}
      <section id="ca-nhan-hoa" style={{ background: T.paper, padding: "88px 6vw", borderTop: `1px solid ${T.hairline}` }}>
        <div className="max-w-[1200px] mx-auto">
          <SectionKicker>Cá nhân hoá bản mệnh</SectionKicker>
          <h2 className="ldc-personal-h2 font-display font-extrabold uppercase leading-none max-w-[920px]" style={{ fontSize: 64.5, letterSpacing: "-0.02em" }}>
            Cùng <span style={{ color: T.red }}>một sớm mai</span> —<br />
            khác bản mệnh,{" "}
            <em className="font-serif font-bold not-italic" style={{ color: T.goldDeep }}>
              khác hanh thông lành dữ
            </em>
            .
          </h2>
          <div className="ldc-personal-grid mt-12 grid gap-6" style={{ gridTemplateColumns: "1fr 1fr" }}>
            {[
              { kind: "Bạn", menh: "Quý Thủy", verdict: "Ngày khá", score: 76, why: "Mộc khí vượng đến trưa — hợp ký kết, mở việc.", accent: T.goldDeep },
              { kind: "Người khác", menh: "Bính Hỏa", verdict: "Không thuận", score: 38, why: "Mậu Tuất khắc Hỏa — tránh giao dịch lớn.", accent: T.red },
            ].map((p, i) => (
              <div key={p.menh} className="bg-white" style={{ border: `1px solid ${T.hairline}` }}>
                <div className="px-[22px] py-3.5" style={{ background: i === 0 ? "rgba(154,124,34,0.06)" : "rgba(163,32,31,0.04)", borderBottom: `1px solid ${T.hairline2}` }}>
                  <Mono style={{ color: T.muted, fontSize: 10.5, letterSpacing: "0.18em" }}>{p.kind}</Mono>
                  <div className="mt-1 font-display font-extrabold text-[22.5px] uppercase">Mệnh {p.menh}</div>
                </div>
                <div className="px-[22px] pt-6 pb-2 flex items-end gap-3.5">
                  <div className="font-display font-extrabold text-[112.5px] leading-[0.84] tabular-nums" style={{ color: T.red }}>
                    26
                  </div>
                  <div className="pb-3.5 font-display font-black text-[26.5px] uppercase leading-[0.95]" style={{ color: T.red }}>
                    Thứ Ba
                  </div>
                </div>
                <div className="px-[22px] pb-4 font-serif text-[13px]" style={{ color: T.muted }}>
                  Mùng 10 tháng Tư · ngày Mậu Tuất
                </div>
                <div className="px-[22px] py-3.5 flex justify-between items-baseline" style={{ borderTop: `1px solid ${T.hairline}` }}>
                  <div className="font-display font-extrabold text-[17.5px] uppercase" style={{ color: p.accent }}>
                    {p.verdict}
                  </div>
                  <span className="font-display font-extrabold text-[40.5px] tabular-nums" style={{ color: p.accent }}>
                    {p.score}
                  </span>
                </div>
                <p className="px-[22px] py-3 font-serif italic text-[13.5px] leading-snug" style={{ color: T.ink2 }}>
                  &ldquo;{p.why}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Year spread */}
      <section style={{ background: T.paper, padding: "88px 6vw", borderTop: `1px solid ${T.hairline}` }}>
        <div className="max-w-[1200px] mx-auto">
          <SectionKicker>Tỏ tường bốn mùa</SectionKicker>
          <h2 className="ldc-year-h2 font-display font-extrabold uppercase leading-[1.02] max-w-[880px]" style={{ fontSize: 56.5, letterSpacing: "-0.02em" }}>
            365 ngày cát hung ·{" "}
            <span className="font-serif italic font-bold normal-case" style={{ color: T.goldDeep }}>
              định vị tỏ tường
            </span>{" "}
            cho riêng bạn.
          </h2>
          <div className="ldc-year-grid mt-12 grid gap-4" style={{ gridTemplateColumns: "repeat(6, 1fr)" }}>
            {[
              "Giêng", "Hai", "Ba", "Tư", "Năm", "Sáu", "Bảy", "Tám", "Chín", "Mười", "M.Một", "Chạp",
            ].map((name, i) => {
              const m = i + 1;
              const current = m === 5;
              const dots = Array.from({ length: 28 }, (_, j) => {
                const s = Math.sin(m * 13.37 + j * 7.7) * 10000;
                const score = 35 + Math.floor((s - Math.floor(s)) * 60);
                return scoreColorFromPoints(score);
              });
              return (
                <div
                  key={name}
                  className="p-3"
                  style={{
                    background: current ? "#fff" : T.paperWarm,
                    border: current ? `1.5px solid ${T.goldDeep}` : `1px solid ${T.hairline2}`,
                  }}
                >
                  <Mono style={{ color: current ? T.goldDeep : T.muted, fontSize: 9.5 }}>Tháng {m}</Mono>
                  <div className="mt-1 font-display font-extrabold text-sm uppercase" style={{ color: current ? T.ink : T.ink2 }}>
                    {name}
                  </div>
                  <div className="mt-2 grid gap-0.5" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
                    {dots.map((c, j) => (
                      <span key={j} className="aspect-square rounded-[1px]" style={{ background: c, opacity: current ? 1 : 0.55 }} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="bang-gia" style={{ background: T.paper, padding: "88px 6vw", borderTop: `1px solid ${T.hairline}` }}>
        <div className="max-w-[1200px] mx-auto">
          <SectionKicker>Gói đồng hành bản mệnh</SectionKicker>
          <div
            className="relative ldc-pricing-hero"
            style={{
              background: T.forest,
              color: T.cream,
              padding: "48px 56px",
              border: `1.5px solid ${T.gold}`,
              boxShadow: "0 24px 48px rgba(29,49,41,0.25)",
            }}
          >
            <div className="absolute -top-3 left-8 px-3.5 py-1 font-mono text-[10.5px] font-extrabold" style={{ background: T.gold, color: T.forest, letterSpacing: "0.22em" }}>
              ★ KHUYẾN NGHỊ
            </div>
            <div className="ldc-pricing-tier-grid grid items-center gap-12" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
              <div>
                <Mono style={{ color: T.gold, fontSize: 11.5, letterSpacing: "0.22em" }}>LỊCH ĐINH MÙI 2027 · TRỌN NĂM</Mono>
                <h3 className="ldc-pricing-h3 font-display font-extrabold uppercase leading-[0.96] mt-2.5" style={{ fontSize: 56.5, letterSpacing: "-0.02em" }}>
                  Lịch bản mệnh
                  <br />
                  <span className="font-serif italic font-bold normal-case" style={{ color: T.gold }}>
                    cho cả năm
                  </span>
                </h3>
                <Link
                  to="/dat-lich"
                  className="mt-7 inline-block w-full max-w-md py-[18px] text-center font-display font-extrabold text-sm uppercase no-underline"
                  style={{ background: T.gold, color: T.forest, letterSpacing: "0.1em" }}
                >
                  Đăng ký lịch năm
                </Link>
              </div>
              <div>
                <Mono style={{ color: T.gold, fontSize: 10.5, letterSpacing: "0.18em" }}>CHI PHÍ ĐỒNG HÀNH</Mono>
                <div className="flex items-baseline gap-1.5 mt-2">
                  <span className="ldc-hero-price font-display font-extrabold leading-[0.9] tabular-nums" style={{ fontSize: 72.5, color: T.gold, letterSpacing: "-0.03em" }}>
                    799.000
                  </span>
                  <span className="font-display font-bold text-[24.5px]" style={{ color: T.gold }}>
                    đ
                  </span>
                </div>
                <div className="mt-2">
                  <Mono style={{ color: T.gold, fontSize: 10.5, letterSpacing: "0.14em" }}>
                    TIẾT KIỆM 298.000Đ · TỐI ƯU TRỌN VẸN
                  </Mono>
                </div>
              </div>
            </div>
          </div>
          <div className="ldc-other-tiers mt-9 grid gap-4" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
            {[
              { name: "3 tháng", sub: "Trải nghiệm lịch bản mệnh · Dùng thử", price: "299.000", per: "3 tháng" },
              { name: "6 tháng", sub: "Lịch bản mệnh + Luận giải Tiểu vận", price: "499.000", per: "6 tháng", save: "tiết kiệm 298.000đ" },
            ].map((t) => (
              <Link
                key={t.name}
                to="/dat-lich"
                className="flex justify-between items-center gap-4 p-5 bg-white no-underline"
                style={{ border: `1px solid ${T.hairline}`, color: T.ink }}
              >
                <div>
                  <div className="font-display font-extrabold text-[22.5px] uppercase">{t.name}</div>
                  <div className="font-serif text-xs mt-1" style={{ color: T.muted }}>
                    {t.sub}
                    {"save" in t && t.save ? ` · ${t.save}` : ""}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display font-extrabold text-[26.5px] tabular-nums" style={{ color: T.goldDeep }}>
                    {t.price}
                  </div>
                  <div className="font-serif text-[11.5px]" style={{ color: T.muted }}>
                    đ · {t.per}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="hoi-dap" style={{ background: T.paper, padding: "88px 6vw", borderTop: `1px solid ${T.hairline}` }}>
        <div className="max-w-[800px] mx-auto">
          <SectionKicker>Giải đáp thắc mắc</SectionKicker>
          <h2 className="font-display font-extrabold uppercase leading-tight mb-8" style={{ fontSize: 48.5, letterSpacing: "-0.015em" }}>
            Vài điều{" "}
            <span className="font-serif italic font-bold normal-case" style={{ color: T.goldDeep }}>
              tỏ tường thắc mắc
            </span>
          </h2>
          {FAQS.map(([q, a], i) => (
            <div
              key={q}
              role="button"
              tabIndex={0}
              onClick={() => setFaqOpen(faqOpen === i ? -1 : i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setFaqOpen(faqOpen === i ? -1 : i);
              }}
              className="cursor-pointer py-5"
              style={{ borderTop: `1px solid ${T.hairline}` }}
            >
              <div className="flex items-center gap-4">
                <Mono style={{ color: T.muted, fontSize: 11.5, minWidth: 32 }}>{String(i + 1).padStart(2, "0")}</Mono>
                <span className="flex-1 font-display font-bold text-[19.5px] uppercase">{q}</span>
                <span className="font-serif text-lg transition-transform duration-200" style={{ color: T.goldDeep, transform: faqOpen === i ? "rotate(45deg)" : undefined }}>
                  +
                </span>
              </div>
              {faqOpen === i ? (
                <p className="font-serif text-[15px] leading-relaxed mt-3.5 pl-12 mb-0" style={{ color: T.ink2 }}>
                  {a}
                </p>
              ) : null}
            </div>
          ))}
          <div style={{ borderTop: `1px solid ${T.hairline}` }} />
        </div>
      </section>

      {/* CTA */}
      <section className="text-center relative overflow-hidden" style={{ background: T.forest, color: T.cream, padding: "96px 6vw" }}>
        <div className="relative max-w-[800px] mx-auto">
          <Mono style={{ color: T.gold, fontSize: 11.5, letterSpacing: "0.24em" }}>BẮT ĐẦU</Mono>
          <h2 className="ldc-cta-h2 font-display font-extrabold uppercase leading-[0.94] mt-4" style={{ fontSize: 88.5, letterSpacing: "-0.02em" }}>
            Trải nghiệm miễn phí
            <br />
            <span className="font-serif italic font-bold normal-case" style={{ color: T.gold }}>
              khởi tạo trong 30 giây
            </span>
            .
          </h2>
          <Link
            to="/dang-ky"
            className="inline-block mt-8 px-10 py-5 font-display font-bold text-base uppercase no-underline"
            style={{ background: T.gold, color: T.forest, letterSpacing: "0.1em", boxShadow: "0 16px 32px rgba(197,165,90,0.25)" }}
          >
            Khởi tạo lịch bản mệnh →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: T.forestDeep, color: "rgba(237,231,211,0.6)", padding: "56px 6vw 88px", borderTop: "1px solid rgba(197,165,90,0.15)" }}>
        <div className="ldc-footer-grid max-w-[1200px] mx-auto grid gap-12" style={{ gridTemplateColumns: "1.5fr 1fr 1fr 1fr" }}>
          <div>
            <div className="flex items-center gap-3">
              <LogoMark size={36} dark />
              <div>
                <div className="font-display font-extrabold text-base uppercase" style={{ color: T.cream }}>
                  Ngày Lành
                </div>
                <div className="font-display font-semibold text-[9.5px] uppercase" style={{ color: T.gold, letterSpacing: "0.32em" }}>
                  Tháng Tốt
                </div>
              </div>
            </div>
            <p className="font-serif mt-5 text-[14px] leading-relaxed max-w-xs" style={{ color: "rgba(237,231,211,0.55)" }}>
              Lịch tờ điện tử cá nhân — chấm điểm theo lá số tứ trụ riêng của bạn.
            </p>
          </div>
        </div>
        <div className="max-w-[1200px] mx-auto mt-12 pt-7 flex justify-between flex-wrap gap-3 font-mono text-[11px]" style={{ borderTop: "1px solid rgba(197,165,90,0.12)", color: "rgba(237,231,211,0.5)" }}>
          <span>© 2026 Ngày Lành Tháng Tốt · ngaylanhthangtot.vn</span>
        </div>
      </footer>

      <div
        className="ldc-sticky-mobile-cta fixed left-0 right-0 bottom-0 z-40 items-center gap-2.5"
        style={{ display: "none", background: "rgba(240,236,226,0.96)", borderTop: `1px solid ${T.hairline}`, padding: "12px 18px" }}
      >
        <div className="flex-1 min-w-0">
          <Mono style={{ color: T.muted, fontSize: 9.5 }}>Khởi tạo nhanh chóng · Trải nghiệm ngay</Mono>
          <div className="font-display font-bold text-[13.5px] uppercase">Lịch bản mệnh Tứ Trụ</div>
        </div>
        <Link to="/dang-ky" className="px-[18px] py-3 font-display font-bold text-xs uppercase no-underline" style={{ background: T.forest, color: T.cream }}>
          Bắt đầu →
        </Link>
      </div>
    </div>
  );
}
