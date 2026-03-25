import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { Link } from "react-router";

import type { Route } from "./+types/landing";
import { useInstallPrompt } from "~/hooks/useInstallPrompt";

import "~/styles/landing-marketing.css";

import { LANDING_GIO_SINH as GIO_SINH } from "~/lib/landing-cta-constants";

const SITE_ORIGIN = "https://ngaylanhthangtot.vn";

export const links: Route.LinksFunction = () => [
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Noto+Serif+SC:wght@400;600;700&display=swap",
  },
];

const PAINS = [
  {
    title: "Lịch vạn niên số hóa",
    desc: "Hiển thị đúng y lịch in — bảng ký hiệu viết tắt không ai giải thích. Không liên quan gì đến tuổi hay loại việc bạn đang cần.",
  },
  {
    title: "Kết quả không cá nhân hóa",
    desc: '"Ngày này tốt" — tốt cho ai? Không biết bạn sinh năm nào, cần làm gì. Một câu trả lời cho tất cả mọi người không phải câu trả lời của bạn.',
  },
  {
    title: "Không giải thích lý do",
    desc: "Biết ngày tốt nhưng không biết tại sao — không đủ để tự tin quyết định, không thể giải thích cho người thân.",
  },
  {
    title: "Tìm thầy vừa tốn thời gian, vừa đắt",
    desc: "500K–2M một lần, cần đặt lịch trước. Không thể hỏi lúc 10 giờ đêm khi bạn cần ra quyết định ngay.",
  },
] as const;

const OFFERS = [
  {
    tag: "Cốt lõi",
    title: "Chọn ngày theo tuổi",
    desc: "26 loại sự kiện. Quét 30–90 ngày. Top ngày với điểm A/B/C, giờ tốt cụ thể, lý do rõ ràng bằng tiếng Việt.",
    cr: "5–10 lượng",
    free: false,
  },
  {
    tag: "Nền tảng",
    title: "Lá số Tứ Trụ cá nhân",
    desc: "Nhật Chủ, Dụng Thần, Kỵ Thần, Đại Vận — lập một lần, mọi kết quả từ đó cá nhân hóa sâu theo đúng mệnh của bạn.",
    cr: "15 lượng · lưu vĩnh viễn",
    free: false,
  },
  {
    tag: "Hàng ngày",
    title: "Lịch hôm nay & tuần này",
    desc: "Ngày tốt/xấu theo lá số, giờ vàng trong ngày. Mở mỗi sáng như xem thời tiết.",
    cr: "",
    free: true,
  },
  {
    tag: "Hôn nhân",
    title: "Xem hợp không hai người",
    desc: "Phân tích Can Chi, Nạp Âm, ngũ hành đầy đủ. Kết quả đủ rõ để chia sẻ cho cả gia đình qua Zalo.",
    cr: "8 lượng",
    free: false,
  },
  {
    tag: "Vận khí",
    title: "Dự báo vận tháng",
    desc: "Tháng này nên đẩy hay cẩn thận? Phân tích trụ tháng theo lá số — hướng dẫn thực tế, không triết lý.",
    cr: "3 lượng / tháng",
    free: false,
  },
  {
    tag: "Không gian",
    title: "Hướng & màu theo mệnh",
    desc: "Hướng đặt bàn làm việc, màu sơn (kèm mã hex) theo Dụng Thần. Đưa thẳng cho thợ mà không cần dịch lại.",
    cr: "5 lượng",
    free: false,
  },
] as const;

const PACKAGES = [
  {
    name: "Mua lẻ",
    cr: "100 lượng",
    price: "99.000đ",
    desc: "Dùng theo nhu cầu — mua thêm khi cần. Hiệu lực 12 tháng.",
    tag: "",
    hot: false,
  },
  {
    name: "Gói 6 tháng",
    cr: "Dùng thoải mái",
    price: "789.000đ",
    desc: "Không giới hạn lượng trong 6 tháng — mọi tính năng, không tính lượng.",
    tag: "",
    hot: false,
  },
  {
    name: "Gói 12 tháng",
    cr: "Dùng thoải mái",
    price: "989.000đ",
    desc: "Không giới hạn trong 12 tháng — tiết kiệm hơn 37% so với gói 6 tháng.",
    tag: "Tốt nhất",
    hot: true,
  },
] as const;

const FAQS = [
  {
    q: "Làm sao biết ngày được chọn có đúng không?",
    a: "Hệ thống dựa trên Ngọc Hạp Thông Thư — tài liệu lịch pháp kinh điển được người Việt sử dụng hàng trăm năm. Toàn bộ logic (hơn 50 công thức sao ngày, 12 Trực, 28 Tú) được mã hóa cố định, không phải AI đoán — kết quả nhất quán và có thể giải thích từng bước.",
  },
  {
    q: "Tứ Trụ là gì, cần thiết không?",
    a: "Tứ Trụ (Bát Tự) tính từ ngày tháng năm giờ sinh, xác định hành cốt lõi của bạn (Nhật Chủ), hành cần bổ sung (Dụng Thần), và hành cần tránh (Kỵ Thần). Khi đã có lá số, bộ máy ưu tiên ngày có Can Chi hỗ trợ Dụng Thần của bạn — cá nhân hóa sâu hơn nhiều so với chỉ xem năm sinh.",
  },
  {
    q: "Lượng có hết hạn không?",
    a: "Lượng có hiệu lực 12 tháng từ ngày mua. Khi tạo tài khoản, bạn nhận ngay 20 lượng miễn phí — đủ để lập lá số Tứ Trụ (15 lượng) và thử chọn ngày lần đầu (5 lượng).",
  },
  {
    q: "Có dùng cho nhiều người trong gia đình không?",
    a: "Có. Sau khi lập lá số cho bản thân, bạn thêm được thông tin chồng, ba mẹ, em gái... vào cùng tài khoản. Tính năng xem hợp không hai người và chọn ngày đều dùng được với bất kỳ người nào.",
  },
  {
    q: "Tại sao ngày giờ sinh không đổi được?",
    a: "Toàn bộ cá nhân hóa — từ chọn ngày đến phong thủy — được tính từ lá số. Thay đổi ngày giờ sinh đồng nghĩa thay đổi toàn bộ lá số và mọi kết quả. Để đảm bảo tính nhất quán, thông tin được khóa sau khi xác nhận. Nhập sai thì liên hệ hỗ trợ để tạo lại.",
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
          "Ứng dụng chọn ngày tốt theo tuổi cá nhân hóa theo lá số Tứ Trụ. Chọn ngày khai trương, cưới hỏi, nhập trạch theo đúng mệnh của bạn.",
        applicationCategory: "LifestyleApplication",
        inLanguage: "vi",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "VND",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQS.map(({ q, a }) => ({
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
    {
      title:
        "Ngày Lành Tháng Tốt — chọn ngày tốt theo tuổi (Bát Tự Tứ Trụ)",
    },
    {
      name: "description",
      content:
        "Chọn ngày tốt theo lá số Tứ Trụ riêng — khai trương, cưới hỏi, nhập trạch. Ngọc Hạp Thông Thư, 26 loại sự kiện, kết quả tiếng Việt.",
    },
    { property: "og:title", content: "Ngày Lành Tháng Tốt" },
    {
      property: "og:description",
      content:
        "Cá nhân hóa theo Tứ Trụ — không phải lịch chung. Trong 30 giây.",
    },
    { property: "og:type", content: "website" },
    { property: "og:url", content: SITE_ORIGIN + "/" },
    { property: "og:image", content: SITE_ORIGIN + "/icons/icon-512.png" },
    { name: "theme-color", content: "#1d3129" },
  ];
}

type CTAFormFields = { name: string; dob: string; gio: string; gender: string };

function CTAForm({ id }: { id: string }) {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<CTAFormFields>({
    name: "",
    dob: "",
    gio: GIO_SINH[0]!,
    gender: "",
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name || !form.dob || !form.gender) return;
    setSubmitted(true);
  }

  const set =
    (k: keyof CTAFormFields) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const signupSearch = new URLSearchParams({
    name: form.name,
    dob: form.dob,
    gio: form.gio,
    gender: form.gender,
  }).toString();

  if (submitted) {
    return (
      <div className="lp-cta-card">
        <div className="lp-cta-card-inner" style={{ textAlign: "center", padding: "1rem 0" }}>
          <div
            style={{
              fontFamily: "var(--font-noto), 'Noto Serif SC', serif",
              fontSize: "2rem",
              color: "var(--lp-gold)",
              marginBottom: "1rem",
            }}
          >
            吉
          </div>
          <h2 className="lp-cta-heading" style={{ marginBottom: "0.75rem" }}>
            Lá số của {form.name} đã sẵn sàng
          </h2>
          <p className="lp-cta-sub" style={{ marginBottom: "1.5rem" }}>
            Tạo tài khoản để xem đầy đủ Nhật Chủ, Dụng Thần và ngày tốt được cá nhân
            hóa theo mệnh của bạn.
          </p>
          <Link
            to={{ pathname: "/dang-ky", search: `?${signupSearch}` }}
            className="lp-btn-submit"
          >
            Xem lá số &amp; nhận ngày lành →
          </Link>
          <div className="lp-form-note">20 lượng miễn phí khi tạo tài khoản</div>
        </div>
        <div className="lp-kanji-bg" aria-hidden>
          吉
        </div>
      </div>
    );
  }

  return (
    <div className="lp-cta-card" id={id === "hero-form" ? "main-form" : undefined}>
      <div className="lp-cta-card-inner">
        <div className="lp-cta-label">Lập lá số Tứ Trụ của bạn</div>
        <h2 className="lp-cta-heading">
          Nhận ngày lành tháng tốt
          <br />
          riêng cho mệnh của bạn
        </h2>
        <p className="lp-cta-sub">
          Nhập ngày giờ sinh — bộ máy tính lá số và tìm ngày phù hợp với đúng bạn.
        </p>
        <form onSubmit={handleSubmit} aria-label="Form lập lá số Tứ Trụ">
          <div className="lp-form-row">
            <label className="lp-form-label" htmlFor={`${id}-name`}>
              Họ tên
            </label>
            <input
              id={`${id}-name`}
              type="text"
              placeholder="Nguyễn Thị Minh"
              value={form.name}
              onChange={set("name")}
              required
              autoComplete="name"
            />
          </div>
          <div className="lp-form-row">
            <label className="lp-form-label" htmlFor={`${id}-dob`}>
              Ngày sinh
            </label>
            <input id={`${id}-dob`} type="date" value={form.dob} onChange={set("dob")} required />
          </div>
          <div className="lp-form-row lp-form-row-2">
            <div>
              <label className="lp-form-label" htmlFor={`${id}-gio`}>
                Giờ sinh
              </label>
              <select id={`${id}-gio`} value={form.gio} onChange={set("gio")}>
                {GIO_SINH.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="lp-form-label" htmlFor={`${id}-gender`}>
                Giới tính
              </label>
              <select
                id={`${id}-gender`}
                value={form.gender}
                onChange={set("gender")}
                required
              >
                <option value="">Chọn</option>
                <option value="nam">Nam</option>
                <option value="nu">Nữ</option>
              </select>
            </div>
          </div>
          <button type="submit" className="lp-btn-submit">
            Xem ngày lành của tôi →
          </button>
        </form>
        <div className="lp-form-note">
          Ngày giờ sinh được mã hóa — không chia sẻ với bên thứ ba
          <br />
          20 lượng miễn phí · Hiệu lực 12 tháng
        </div>
      </div>
      <div className="lp-kanji-bg" aria-hidden>
        吉
      </div>
    </div>
  );
}

function LandingFaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lp-faq-item">
      <button
        type="button"
        className="lp-faq-btn"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>{q}</span>
        <span className={`lp-faq-icon${open ? " lp-open" : ""}`}>+</span>
      </button>
      <div className={`lp-faq-ans${open ? " lp-open" : ""}`}>
        <div>{a}</div>
      </div>
    </div>
  );
}

export default function Landing() {
  const install = useInstallPrompt();

  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 120) install.markEngaged();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [install.markEngaged]);

  const navCtaHref = install.isStandalone ? "/app" : "/dang-ky";
  const navCtaLabel = install.isStandalone ? "Mở ứng dụng" : "Lập lá số miễn phí";

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(landingJsonLd()) }}
      />

      <div id="lp">
        <nav>
          <Link to="/" className="lp-nav-logo">
            Ngày Lành <span>Tháng Tốt</span>
          </Link>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            <Link
              to="/dang-nhap"
              className="lp-ft-link"
              style={{ color: "var(--lp-ink)", opacity: 0.85 }}
            >
              Đăng nhập
            </Link>
            {install.isStandalone ? (
              <Link to="/app" className="lp-nav-cta">
                Mở ứng dụng
              </Link>
            ) : (
              <a href="#main-form" className="lp-nav-cta">
                Lập lá số miễn phí
              </a>
            )}
          </div>
        </nav>

        <section className="lp-hero" aria-labelledby="hero-h1">
          <div>
            <div className="lp-hero-kicker lp-au">
              Cá nhân hóa theo Tứ Trụ · 26 loại sự kiện
            </div>
            <h1 id="hero-h1" className="lp-au lp-d1">
              Chọn ngày đúng
              <br />
              <span className="lp-g">mệnh của bạn.</span>
              <br />
              Trong 30 giây.
            </h1>
            <p className="lp-hero-sub lp-au lp-d2">
              Ngày khai trương, cưới hỏi, nhập trạch, ký hợp đồng — được tính theo{" "}
              <strong>lá số Tứ Trụ riêng của bạn</strong>, không phải thông tin chung
              chung. Kết quả bằng tiếng Việt, có lý do rõ ràng, chia sẻ được ngay.
            </p>
            <div className="lp-hero-social-proof lp-au lp-d3">
              {[
                "Nguồn: Ngọc Hạp Thông Thư",
                "26 loại sự kiện",
                "Bộ máy tính 3 tầng",
                "Kết quả tiếng Việt tự nhiên",
              ].map((t) => (
                <span className="lp-proof-tag" key={t}>
                  {t}
                </span>
              ))}
            </div>
            <div className="lp-scroll-hint lp-au lp-d4">Nhập ngày sinh để bắt đầu</div>
          </div>

          <div className="lp-au lp-d2">
            <CTAForm id="hero-form" />
          </div>
        </section>

        <div className="lp-pains" aria-label="Vấn đề hiện tại">
          <div className="lp-pains-inner">
            <div className="lp-pains-head">
              Tại sao các cách hiện tại
              <br />
              <span>chưa đủ?</span>
            </div>
            <ul className="lp-pain-list">
              {PAINS.map(({ title, desc }, i) => (
                <li className="lp-pain-item" key={i}>
                  <span className="lp-pain-x" aria-hidden>
                    ✕
                  </span>
                  <div>
                    <div className="lp-pain-title">{title}</div>
                    <div className="lp-pain-desc">{desc}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <section className="lp-how" aria-labelledby="how-h2">
          <div className="lp-sec-label">Cách hoạt động</div>
          <h2 className="lp-sec-h2" id="how-h2">
            Ba bước — từ ngày sinh
            <br />
            đến ngày lành
          </h2>
          <div className="lp-steps">
            {[
              {
                n: "01",
                title: "Lập lá số một lần",
                desc: "Nhập ngày giờ sinh. Bộ máy tính Tứ Trụ — Nhật Chủ, Dụng Thần, Kỵ Thần. Lưu vĩnh viễn vào hồ sơ.",
              },
              {
                n: "02",
                title: "Chọn loại sự kiện",
                desc: "Khai trương, cưới hỏi, nhập trạch, ký hợp đồng — 26 loại, mỗi loại bộ quy tắc riêng.",
              },
              {
                n: "03",
                title: "Nhận kết quả & chia sẻ",
                desc: "Top ngày với điểm A/B/C, giờ tốt cụ thể, lý do tiếng Việt tự nhiên. Gửi ngay qua Zalo.",
              },
            ].map(({ n, title, desc }) => (
              <div className="lp-step" key={n}>
                <span className="lp-step-n">{n}</span>
                <div className="lp-step-title">{title}</div>
                <p className="lp-step-desc">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="lp-offerings" aria-labelledby="offer-h2">
          <div className="lp-offerings-inner">
            <div className="lp-sec-label" style={{ color: "var(--lp-green-muted)" }}>
              Tính năng
            </div>
            <h2
              className="lp-sec-h2"
              id="offer-h2"
              style={{ color: "var(--lp-cream)", marginBottom: 0 }}
            >
              Mọi quyết định gắn
              <br />
              <span style={{ color: "var(--lp-gold)" }}>với ngày tháng</span>
            </h2>
            <div className="lp-offerings-grid">
              {OFFERS.map(({ tag, title, desc, cr, free }) => (
                <article className="lp-offer-cell" key={title}>
                  <div className="lp-offer-tag">{tag}</div>
                  <div className="lp-offer-title">{title}</div>
                  <p className="lp-offer-desc">{desc}</p>
                  {free ? (
                    <div className="lp-offer-free">MIỄN PHÍ</div>
                  ) : (
                    <div className="lp-offer-cr">{cr}</div>
                  )}
                </article>
              ))}
            </div>
          </div>
        </div>

        <section className="lp-pricing" aria-labelledby="price-h2">
          <div className="lp-sec-label">Bảng giá</div>
          <h2 className="lp-sec-h2" id="price-h2">
            Trả khi cần.
            <br />
            Không subscription.
          </h2>
          <div className="lp-pkg-grid">
            {PACKAGES.map(({ name, cr, price, desc, hot, tag }) => (
              <article className={`lp-pkg${hot ? " lp-hot" : ""}`} key={name}>
                {tag ? (
                  <div className="lp-pkg-badge">
                    ★ {tag}
                  </div>
                ) : null}
                <div className="lp-pkg-name">{name}</div>
                <div className="lp-pkg-cr">{cr}</div>
                <div className="lp-pkg-price">{price}</div>
                <p className="lp-pkg-desc">{desc}</p>
              </article>
            ))}
          </div>
          <div className="lp-khoi-dau-box">
            <strong>Tạo tài khoản → nhận ngay 20 lượng miễn phí.</strong> Đủ để lập lá số
            (15 lượng) + 1 lần chọn ngày (5 lượng). Gói tháng không tính lượng — dùng thoải
            mái.
          </div>
        </section>

        <div className="lp-faq-section" aria-labelledby="faq-h2">
          <div className="lp-faq-inner">
            <div className="lp-sec-label" style={{ color: "var(--lp-green-muted)" }}>
              Câu hỏi thường gặp
            </div>
            <h2
              className="lp-sec-h2"
              id="faq-h2"
              style={{ color: "var(--lp-cream)", marginBottom: 0 }}
            >
              Câu hỏi thường gặp
            </h2>
            <div className="lp-faq-list">
              {FAQS.map((item, i) => (
                <LandingFaqItem key={i} {...item} />
              ))}
            </div>
          </div>
        </div>

        <section className="lp-bottom-cta" aria-labelledby="bcta-h2">
          <div className="lp-bottom-cta-inner">
            <div className="lp-bottom-cta-text">
              <h2 id="bcta-h2">
                Sự kiện sắp tới
                <br />
                của bạn xứng đáng được
                <br />
                <span>chuẩn bị đúng cách.</span>
              </h2>
              <p>
                Lập lá số Tứ Trụ miễn phí — nhận ngày tốt được tính riêng cho mệnh của bạn.
              </p>
            </div>
            <CTAForm id="bottom-form" />
          </div>
        </section>

        <footer>
          <Link to="/" className="lp-ft-logo">
            Ngày Lành Tháng Tốt
          </Link>
          <nav className="lp-ft-links" aria-label="Footer">
            <a href="#offer-h2" className="lp-ft-link">
              Tính năng
            </a>
            <a href="#price-h2" className="lp-ft-link">
              Bảng giá
            </a>
            <Link to="/chinh-sach-bao-mat" className="lp-ft-link">
              Chính sách
            </Link>
            <Link to="/dieu-khoan" className="lp-ft-link">
              Điều khoản
            </Link>
            <Link to="/dang-nhap" className="lp-ft-link">
              Đăng nhập
            </Link>
          </nav>
          <span className="lp-ft-note">© 2026 ngaylanhthangtot.vn</span>
        </footer>
      </div>

      {install.engaged &&
      !install.isStandalone &&
      (install.canInstall || install.showIosInstructions) ? (
        <div
          className="fixed bottom-0 inset-x-0 z-[1000] border-t px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          style={{
            borderColor: "var(--lp-border)",
            background: "rgba(228,223,214,.95)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div className="mx-auto max-w-3xl flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <p className="text-sm" style={{ color: "var(--lp-muted)" }}>
              Cài đặt nhanh — mở lại không cần gõ địa chỉ.
            </p>
            <div className="flex gap-2">
              {install.canInstall ? (
                <button
                  type="button"
                  className="lp-nav-cta"
                  onClick={() => void install.promptInstall()}
                >
                  Cài ứng dụng
                </button>
              ) : null}
              <Link to="/dang-ky" className="lp-nav-cta">
                {navCtaLabel}
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {install.showIosInstructions && !install.isStandalone ? (
        <p
          className="mx-auto max-w-3xl px-4 pb-6 text-sm text-center"
          style={{ color: "var(--lp-muted)" }}
        >
          Trên iPhone/iPad: mở menu Share trong Safari, chọn{" "}
          <strong style={{ color: "var(--lp-ink)" }}>Thêm vào Màn hình chính</strong> để cài
          PWA.
        </p>
      ) : null}
    </>
  );
}
