import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

import type { Route } from "./+types/landing";

import "~/styles/landing-marketing.css";

import { applyLandingPrefillToProfile } from "~/lib/apply-landing-prefill-profile";
import { useAuth } from "~/lib/auth";
import {
  ddMmYyyyInputToIsoDate,
  formatDdMmYyyyWithAutoSlash,
} from "~/lib/bat-tu-birth";
import {
  LANDING_GIO_SINH as GIO_SINH,
  landingSignupPrefillHasAny,
  parseLandingSignupPrefill,
} from "~/lib/landing-cta-constants";

const SITE_ORIGIN = "https://ngaylanhthangtot.vn";

export const links: Route.LinksFunction = () => [
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Montserrat:wght@700;800;900&family=Noto+Serif+SC:wght@400;600;700&display=swap",
  },
];

const PAINS = [
  {
    title: "Lịch vạn niên số hóa",
    desc: "Giống tờ lịch treo tường nhưng nằm trong điện thoại — ký hiệu viết tắt chẳng ai giải thích hộ. Chẳng nói được gì về tuổi của bạn hay việc bạn sắp làm.",
  },
  {
    title: "Kết quả không cá nhân hóa",
    desc: '"Ngày này lành" — lành cho ai? Chẳng rõ bạn sinh năm nào, đang lo chuyện gì. Một câu dùng chung cho mọi tuổi không phải câu cho riêng bạn.',
  },
  {
    title: "Không giải thích lý do",
    desc: "Biết là ngày \"lành\" mà không hiểu vì sao — chưa đủ để chốt việc, cũng khó kể cho người nhà nghe cho ra lẽ.",
  },
  {
    title: "Tìm thầy vừa tốn thời gian, vừa đắt",
    desc: "Một lần hỏi đã vài trăm nghìn tới cả triệu, lại phải hẹn trước. Nửa đêm cần quyết ngay thì chẳng kịp.",
  },
] as const;

const OFFERS = [
  {
    tag: "Cốt lõi",
    title: "Chọn ngày theo tuổi",
    desc: "Hai mươi sáu lựa chọn theo từng việc. Rà trong khoảng từ ba mươi tới chín mươi ngày. Những ngày đứng đầu theo từng mức điểm, có giờ đẹp cụ thể, lý do ghi thẳng tiếng Việt.",
    cr: "5–10 lượng",
    free: false,
  },
  {
    tag: "Nền tảng",
    title: "Lá số Tứ Trụ cá nhân",
    desc: "Nhật Chủ, Dụng Thần, Kỵ Thần, Đại Vận — làm một lần, các kết quả sau bám theo đúng mệnh của bạn.",
    cr: "",
    free: true,
  },
  {
    tag: "Hàng ngày",
    title: "Lịch hôm nay và tuần này",
    desc: "Ngày nào nên tránh, giờ nào đẹp — theo lá số của bạn. Mỗi sáng mở ra xem như dự báo trong ngày.",
    cr: "",
    free: true,
  },
  {
    tag: "Hôn nhân",
    title: "Hợp tuổi hai người",
    desc: "Coi Can Chi, Nạp Âm, ngũ hành đủ bề. Kết quả rõ ràng, gửi bà con trong nhóm Zalo cũng được.",
    cr: "8 lượng",
    free: false,
  },
  {
    tag: "Vận khí",
    title: "Dự báo vận tháng",
    desc: "Tháng này nên đẩy việc hay thu lại? Dựa trên trụ tháng và lá số — gợi ý ngắn gọn, không vòng vo.",
    cr: "3 lượng / tháng",
    free: false,
  },
  {
    tag: "Không gian",
    title: "Hướng và màu theo mệnh",
    desc: "Hướng kê bàn làm việc, màu sơn có kèm mã cho thợ — bám theo Dụng Thần của bạn. Đưa thẳng tay thợ, khỏi phiên dịch.",
    cr: "5 lượng",
    free: false,
  },
] as const;

const PACKAGES = [
  {
    name: "Mua lẻ",
    cr: "100 lượng",
    price: "99.000đ",
    desc: "Dùng đến đâu tính đến đó — hết thì mua thêm. Mỗi gói lượng có hiệu lực mười hai tháng.",
    tag: "",
    hot: false,
  },
  {
    name: "Gói 6 tháng",
    cr: "Dùng thoải mái",
    price: "789.000đ",
    desc: "Sáu tháng không trừ lượng — mọi tính năng cần dùng đều mở.",
    tag: "",
    hot: false,
  },
  {
    name: "Gói 12 tháng",
    cr: "Dùng thoải mái",
    price: "989.000đ",
    desc: "Mười hai tháng không trừ lượng — tiền chia ra tháng rẻ hơn khoảng ba bảy phần trăm so với gói sáu tháng.",
    tag: "Nhiều người chọn",
    hot: true,
  },
] as const;

const FAQS = [
  {
    q: "Làm sao biết ngày được chọn có đúng không?",
    a: "Chúng tôi bám theo Ngọc Hạp Thông Thư — sách lịch pháp người Việt dùng quen từ lâu. Hơn năm mươi công thức sao ngày, mười hai Trực, hai mươi tám Tú được cài cố định — không kiểu đoán bừa khiến lần này khác lần khác. Kết quả nhất quán và kể được từng bước cho bạn nghe.",
  },
  {
    q: "Chọn ngày trong ứng dụng hoạt động ra sao?",
    a: "Không phải ngày lành của người này là ngày lành của người kia. Ba bước: một — loại các ngày Nguyệt Kỵ, Tam Nương, Dương Công Kỵ mà ai cũng nên tránh; hai — so từng ngày với mệnh, Dụng Thần và Kỵ Thần trong lá số của bạn (ví dụ ngày hợp mệnh Kim có thể không hợp mệnh Mộc); ba — chấm điểm theo Trực, sao cát hung và ngũ hành thuận mệnh rồi chọn những ngày đẹp nhất, thường là ba ngày đứng đầu. Sau khi đăng nhập, mở mục Chọn ngày để xem giải thích đầy đủ trước khi tra.",
  },
  {
    q: "Tứ trụ là gì, có cần không?",
    a: "Tứ trụ còn gọi bát tự — lấy từ ngày, tháng, năm, giờ sinh, ra hành gốc của bạn (Nhật Chủ), hành nên bổ sung (Dụng Thần), hành nên tránh (Kỵ Thần). Có lá số rồi thì bộ tính toán ưu tiên những ngày Can Chi thuận với Dụng Thần của bạn — sâu hơn hẳn chỉ tra theo năm tuổi.",
  },
  {
    q: "Lượng có hết hạn không?",
    a: "Mỗi lần mua lượng, dùng trong mười hai tháng kể từ ngày mua. Dựng lá số tứ trụ lần đầu không trừ lượng. Mở tài khoản mới được hai mươi lượng — dùng cho chọn ngày, hợp tuổi, vận tháng và các tính năng trả phí khác.",
  },
  {
    q: "Một tài khoản dùng cho cả nhà được không?",
    a: "Được. Sau khi có lá số của mình, bạn thêm hồ sơ ông bà, bố mẹ, chồng con… trong cùng tài khoản. Coi hợp tuổi hai người hay chọn ngày cho từng người đều làm được.",
  },
  {
    q: "Tại sao ngày giờ sinh không đổi được?",
    a: "Mọi thứ từ chọn ngày tới phong thủy đều bám theo lá số đã dựng. Đổi giờ sinh là đổi cả bộ lá và mọi kết quả sau đó. Để khớp với lúc bạn đã bấm xác nhận, thông tin khóa lại sau khi xác nhận. Lỡ nhập sai thì nhắn bộ phận trợ giúp để xử lý.",
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
      title: "Ngày Lành Tháng Tốt — chọn ngày lành theo lá số tứ trụ",
    },
    {
      name: "description",
      content:
        "Lá số riêng của bạn, không phải lịch chung — khai trương, cưới hỏi, nhập trạch. Theo Ngọc Hạp Thông Thư, hai mươi sáu kiểu việc, lời giải tiếng Việt.",
    },
    { property: "og:title", content: "Ngày Lành Tháng Tốt" },
    {
      property: "og:description",
      content:
        "Theo lá số của bạn — không phải lịch in để chung. Nửa phút là có khung.",
    },
    { property: "og:type", content: "website" },
    { property: "og:url", content: SITE_ORIGIN + "/" },
    { property: "og:image", content: SITE_ORIGIN + "/icons/icon-512.png" },
    { name: "theme-color", content: "#1d3129" },
  ];
}

type CTAFormFields = { name: string; dob: string; gio: string; gender: string };

function CTAForm({ id }: { id: string }) {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<CTAFormFields>({
    name: "",
    dob: "",
    gio: GIO_SINH[0]!,
    gender: "",
  });
  const [dobError, setDobError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setDobError(null);
    const dobTrim = form.dob.trim();
    if (!dobTrim) {
      setDobError("Vui lòng nhập ngày sinh.");
      return;
    }
    const iso = ddMmYyyyInputToIsoDate(dobTrim);
    if (!iso) {
      setDobError(
        "Nhập đúng DD/MM/YYYY và ngày phải có thật (ví dụ 20/05/1990).",
      );
      return;
    }
    if (!form.name.trim() || !form.gender) return;
    if (authLoading) return;

    const params = new URLSearchParams({
      name: form.name.trim(),
      dob: iso,
      gio: form.gio,
      gender: form.gender,
    });
    const prefill = parseLandingSignupPrefill(params);

    const uid = session?.user?.id;
    if (uid && landingSignupPrefillHasAny(prefill)) {
      setBusy(true);
      const err = await applyLandingPrefillToProfile(uid, prefill);
      setBusy(false);
      if (err) {
        toast.error(
          "Chưa lưu được hồ sơ từ form — mở Cài đặt trong app để nhập lại.",
        );
        return;
      }
      toast.success("Đã cập nhật hồ sơ.");
      void navigate("/app/la-so");
      return;
    }

    void navigate({ pathname: "/dang-ky", search: `?${params.toString()}` });
  }

  const set =
    (k: keyof CTAFormFields) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const submitBusy = authLoading || busy;
  const submitLabel = submitBusy
    ? busy
      ? "Đang lưu…"
      : "Đang tải…"
    : session
      ? "Lưu hồ sơ & vào lá số →"
      : "Tiếp tục — tạo tài khoản →";

  return (
    <div className="lp-cta-card" id={id === "hero-form" ? "main-form" : undefined}>
      <div className="lp-cta-card-inner">
        <div className="lp-cta-label">Lá số tứ trụ của bạn</div>
        <h2 className="lp-cta-heading">
          Ngày lành tháng tốt
          <br />
          khớp mệnh của bạn
        </h2>
        <p className="lp-cta-sub">
          Cho biết ngày giờ sinh — dựng lá số một lần, rồi mỗi lần chọn ngày đều bám
          theo đó.
        </p>
        <form
          onSubmit={(e) => void handleSubmit(e)}
          aria-label="Nhập thông tin để dựng lá số tứ trụ"
        >
          <div className="lp-form-row">
            <label className="lp-form-label" htmlFor={`${id}-name`}>
              Họ tên
            </label>
            <p className="lp-form-hint">Hiển thị trên lá số và lời chào của bạn.</p>
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
            <p className="lp-form-hint">
              Tính Can Chi và toàn bộ trụ — theo lịch dương bạn hay dùng. Định dạng DD/MM/YYYY
              (ví dụ 20/05/1990); gõ số sẽ tự thêm dấu / như trong app.
            </p>
            <input
              id={`${id}-dob`}
              type="text"
              name="birthday-ddmmyyyy"
              autoComplete="off"
              placeholder="DD/MM/YYYY"
              maxLength={10}
              inputMode="numeric"
              className={
                dobError
                  ? "lp-form-input-invalid lp-form-input-dob"
                  : "lp-form-input-dob"
              }
              value={form.dob}
              onChange={(e) => {
                setDobError(null);
                setForm((f) => ({
                  ...f,
                  dob: formatDdMmYyyyWithAutoSlash(e.target.value),
                }));
              }}
              aria-invalid={dobError ? true : undefined}
              aria-describedby={
                dobError ? `${id}-dob-hint ${id}-dob-error` : `${id}-dob-hint`
              }
            />
            <p id={`${id}-dob-hint`} className="sr-only">
              Định dạng DD/MM/YYYY; chỉ nhập chữ số, dấu gạch chéo tự chèn sau ngày và tháng.
            </p>
            {dobError ? (
              <p id={`${id}-dob-error`} className="lp-form-field-error" role="alert">
                {dobError}
              </p>
            ) : null}
          </div>
          <div className="lp-form-row lp-form-row-2">
            <div>
              <label className="lp-form-label" htmlFor={`${id}-gio`}>
                Giờ sinh
              </label>
              <p className="lp-form-hint">Theo khung mười hai giờ địa chi.</p>
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
              <p className="lp-form-hint">Dùng trong công thức bát tự khi đọc lá.</p>
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
          <button type="submit" className="lp-btn-submit" disabled={submitBusy}>
            {submitLabel}
          </button>
        </form>
        <div className="lp-form-note">
          Ngày giờ sinh được mã hóa — không bán cho bên ngoài
          <br />
          Hai mươi lượng tặng · Dùng trong mười hai tháng
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

function readStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true
  );
}

export default function Landing() {
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsStandalone(readStandalonePwa());
  }, []);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(landingJsonLd()) }}
      />

      <div id="lp">
        <nav className="lp-nav" aria-label="Chính">
          <Link to="/" className="lp-nav-logo">
            <img
              src="/logo-mark.svg"
              alt=""
              width={44}
              height={44}
              className="lp-nav-logo-mark"
              decoding="async"
            />
            <span className="lp-nav-logo-divider" aria-hidden />
            <span className="lp-nav-logo-text">
              <span className="lp-nav-logo-line1">Ngày Lành</span>
              <span className="lp-nav-logo-line2">Tháng Tốt</span>
            </span>
          </Link>
          <div className="lp-nav-actions">
            <Link to="/dang-nhap" className="lp-nav-login">
              Đăng nhập
            </Link>
            {isStandalone ? (
              <Link to="/app" className="lp-nav-cta">
                <span className="lp-nav-cta-long">Mở ứng dụng</span>
                <span className="lp-nav-cta-short">Vào ngay</span>
              </Link>
            ) : (
              <a href="#main-form" className="lp-nav-cta">
                <span className="lp-nav-cta-long">Dựng lá số miễn phí</span>
                <span className="lp-nav-cta-short">Thử ngay</span>
              </a>
            )}
          </div>
        </nav>

        <section className="lp-hero" aria-labelledby="hero-h1">
          <div>
            <div className="lp-hero-kicker lp-au">
              Theo lá số tứ trụ · Hai mươi sáu kiểu việc
            </div>
            <h1 id="hero-h1" className="lp-au lp-d1">
              Chọn ngày đúng
              <br />
              <span className="lp-g">mệnh của bạn.</span>
              <br />
              Chừng nửa phút.
            </h1>
            <p className="lp-hero-sub lp-au lp-d2">
              Khai trương, cưới hỏi, nhập trạch, ký kết… đều tính trên{" "}
              <strong>lá số riêng của bạn</strong>, không phải lịch chung cho cả làng.
              Lý do ghi tiếng Việt, kèm giờ đẹp — gửi Zalo trong nhà cũng được.
            </p>
            <div className="lp-hero-social-proof lp-au lp-d3">
              {[
                "Bám Ngọc Hạp Thông Thư",
                "Hai mươi sáu kiểu việc",
                "Ba lớp luận chồng nhau",
                "Lời giải dễ đọc",
              ].map((t) => (
                <span className="lp-proof-tag" key={t}>
                  {t}
                </span>
              ))}
            </div>
            <div className="lp-scroll-hint lp-au lp-d4">Điền khung bên cạnh để dựng lá</div>
          </div>

          <div className="lp-au lp-d2">
            <CTAForm id="hero-form" />
          </div>
        </section>

        <div className="lp-pains" aria-label="Vấn đề hiện tại">
          <div className="lp-pains-inner">
            <div className="lp-pains-head">
              Xem ngày kiểu cũ
              <br />
              <span>vẫn thiếu điều gì?</span>
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
            tới ngày lành
          </h2>
          <div className="lp-steps">
            {[
              {
                n: "01",
                title: "Dựng lá số một lần",
                desc: "Cho ngày giờ sinh — Nhật Chủ, Dụng Thần, Kỵ Thần hiện ra. Lưu trong hồ sơ, khỏi nhập lại.",
              },
              {
                n: "02",
                title: "Chọn việc sắp làm",
                desc: "Khai trương, cưới hỏi, nhập trạch, ký kết… hai mươi sáu kiểu, mỗi kiểu một bộ luật riêng.",
              },
              {
                n: "03",
                title: "Nhận kết quả và gửi đi",
                desc: "Ngày đứng đầu theo từng mức điểm, có giờ đẹp, lý do viết dễ hiểu. Chia Zalo cho nhà chồng cũng tiện.",
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
                    <div className="lp-offer-free">Miễn phí</div>
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
            Trả khi dùng.
            <br />
            Không bắt buộc đăng ký gói tháng.
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
            <strong>Mở tài khoản — được hai mươi lượng tặng.</strong> Dựng lá số không trừ
            lượng; hai mươi lượng dùng cho chọn ngày và các tính năng trả phí. Gói theo tháng
            thì không trừ lượng từng việc — dùng trong thời hạn gói.
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
                Việc sắp tới
                <br />
                của bạn cũng nên
                <br />
                <span>chọn ngày cho chắc.</span>
              </h2>
              <p>
                Dựng lá số tứ trụ không mất phí — từ đó mỗi ngày lành đều bám theo mệnh của
                bạn.
              </p>
            </div>
            <CTAForm id="bottom-form" />
          </div>
        </section>

        <footer>
          <Link to="/" className="lp-ft-logo">
            <img
              src="/logo-mark-reversed.svg"
              alt=""
              width={40}
              height={40}
              className="lp-ft-logo-mark"
              decoding="async"
            />
            <span className="lp-ft-logo-divider" aria-hidden />
            <span className="lp-ft-logo-text">
              <span className="lp-ft-logo-line1">Ngày Lành</span>
              <span className="lp-ft-logo-line2">Tháng Tốt</span>
            </span>
          </Link>
          <nav className="lp-ft-links" aria-label="Liên kết chân trang">
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
            <Link to="/dang-ky" className="lp-ft-link">
              Đăng ký
            </Link>
            <Link to="/dang-nhap" className="lp-ft-link">
              Đăng nhập
            </Link>
          </nav>
          <span className="lp-ft-note">© 2026 ngaylanhthangtot.vn</span>
        </footer>
      </div>
    </>
  );
}
