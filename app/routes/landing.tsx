import { useEffect } from "react";
import { Link } from "react-router";

import type { Route } from "./+types/landing";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { Button } from "~/components/ui/button";
import { useInstallPrompt } from "~/hooks/useInstallPrompt";

const FAQ_ITEMS = [
  {
    q: "App này có chính xác không?",
    a: "Dựa trên Bát Tự Tử Trụ — hệ thống được sử dụng hơn 1.000 năm. Engine xử lý 3 tầng: lọc theo lịch vạn niên, loại ngày xung khắc với lá số cá nhân, chấm điểm theo đúng loại sự kiện.",
  },
  {
    q: "Có cần biết giờ sinh không?",
    a: "Có giờ sinh sẽ chính xác hơn — tính được Nhật Chủ đúng. Không biết giờ thì app vẫn tính được dựa trên ngày tháng năm sinh.",
  },
  {
    q: "Khác gì với lịch vạn niên thường?",
    a: "Lịch vạn niên cho kết quả chung cho tất cả mọi người. App này lọc theo đúng mệnh và Dụng Thần của bạn — mỗi người một kết quả khác nhau.",
  },
  {
    q: "Có phải trả tiền không?",
    a: "Xem lịch hôm nay và tuần này miễn phí. Tính năng cá nhân hóa dùng lượng — mua một lần, không subscription, không tự trừ tiền.",
  },
  {
    q: "Thông tin cá nhân có an toàn không?",
    a: "Ngày sinh dùng để tính lá số, lưu trên server bảo mật. Không chia sẻ với bên thứ ba. Thẻ chia sẻ không chứa ngày sinh của bạn.",
  },
] as const;

const SITE_ORIGIN = "https://ngaylanhthangtot.vn";

function faqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
}

export function meta({}: Route.MetaArgs) {
  return [
    {
      title:
        "Ngày Lành Tháng Tốt — chọn ngày tốt theo tuổi (Bát Tự Tử Trụ)",
    },
    {
      name: "description",
      content:
        "Chọn ngày tốt theo đúng tuổi của bạn — trong 30 giây. Khai trương, đám cưới, nhập trạch, ký hợp đồng. Dựa trên Bát Tự Tử Trụ, kết quả cá nhân hóa.",
    },
    { property: "og:title", content: "Ngày Lành Tháng Tốt" },
    {
      property: "og:description",
      content:
        "Dành cho người Việt tin vào ngày giờ nhưng không có thầy để hỏi — khai trương, đám cưới, nhập trạch, ký hợp đồng.",
    },
    { property: "og:type", content: "website" },
    { property: "og:url", content: SITE_ORIGIN + "/" },
    { property: "og:image", content: SITE_ORIGIN + "/icons/icon-512.png" },
    { name: "theme-color", content: "#C5A55A" },
  ];
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

  const primaryCta = install.isStandalone ? (
    <Button asChild size="lg" className="w-full sm:w-auto">
      <Link to="/app">Mở ứng dụng</Link>
    </Button>
  ) : (
    <Button asChild size="lg" className="w-full sm:w-auto">
      <Link to="/dang-ky">Lập lá số miễn phí</Link>
    </Button>
  );

  return (
    <div className="min-h-svh bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd()) }}
      />

      <header className="border-b border-border/80 bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <Link
            to="/"
            className="font-medium text-foreground tracking-tight text-sm sm:text-base"
          >
            Ngày Lành Tháng Tốt
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dang-nhap">Đăng nhập</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/dang-ky">Bắt đầu</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-3xl px-4 pt-10 pb-14">
          <div className="grid gap-10 sm:grid-cols-[1fr_minmax(0,200px)] sm:items-center">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
                ngaylanhthangtot.vn · Bát Tự Tử Trụ
              </p>
              <h1 className="text-3xl sm:text-4xl font-semibold leading-tight text-balance tracking-tight">
                Chọn ngày tốt theo đúng tuổi của bạn — trong 30 giây
              </h1>
              <p className="mt-4 text-muted-foreground text-base leading-relaxed">
                Dành cho người Việt tin vào ngày giờ nhưng không có thầy để
                hỏi — khai trương, đám cưới, nhập trạch, ký hợp đồng.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:items-center">
                {primaryCta}
                <p className="text-sm text-muted-foreground">
                  Không cần App Store · Chỉ mất 30 giây · Tặng 20 lượng dùng
                  ngay
                </p>
              </div>
            </div>
            <div className="flex justify-center sm:justify-end">
              <img
                src="/icons/icon-512.png"
                width={512}
                height={512}
                alt=""
                decoding="async"
                fetchPriority="high"
                loading="eager"
                className="w-40 h-40 sm:w-48 sm:h-48 object-contain drop-shadow-md rounded-2xl"
              />
            </div>
          </div>
        </section>

        <section
          aria-label="Tín hiệu tin cậy"
          className="border-y border-border bg-surface text-surface-foreground"
        >
          <div className="mx-auto max-w-3xl px-4 py-8 grid gap-4 sm:grid-cols-2 text-sm leading-relaxed">
            <p>
              <strong className="text-surface-foreground">①</strong> Dựa trên
              Bát Tự Tử Trụ — hệ thống hơn 1.000 năm
            </p>
            <p>
              <strong className="text-surface-foreground">②</strong> Kết quả
              cá nhân hóa theo đúng lá số của bạn
            </p>
            <p>
              <strong className="text-surface-foreground">③</strong> Star rating
              + số người dùng (khi có data thực)
            </p>
            <p>
              <strong className="text-surface-foreground">④</strong> Không
              subscription · Mua lượng khi cần, dùng khi nào muốn
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-14">
          <h2 className="text-xl font-semibold tracking-tight">
            Vì sao dùng app này
          </h2>
          <ul className="mt-6 space-y-3 text-muted-foreground list-disc pl-5">
            <li>
              Kết quả theo đúng lá số của bạn — không phải lịch chung cho mọi
              người.
            </li>
            <li>
              Phân loại sự kiện: khai trương, cưới hỏi, nhập trạch, ký hợp đồng
              — chấm điểm theo từng loại.
            </li>
            <li>
              Miễn phí xem hôm nay và tuần này; chỉ trả khi cần tính năng sâu,
              không subscription.
            </li>
          </ul>
        </section>

        <section className="mx-auto max-w-3xl px-4 pb-14">
          <h2 className="text-xl font-semibold tracking-tight">Cách hoạt động</h2>
          <ol className="mt-6 space-y-3 text-muted-foreground list-decimal pl-5">
            <li>Lọc theo lịch vạn niên.</li>
            <li>Loại ngày xung khắc với lá số cá nhân của bạn.</li>
            <li>Chấm điểm theo đúng loại sự kiện bạn chọn.</li>
          </ol>
        </section>

        <section
          aria-label="Phản hồi người dùng"
          className="bg-muted/40 border-y border-border"
        >
          <div className="mx-auto max-w-3xl px-4 py-14 space-y-10">
            <blockquote className="text-base leading-relaxed">
              <p className="italic text-foreground">
                &ldquo;Lần đầu tiên hiểu lá số của mình bằng tiếng Việt — không
                phải bảng số khó hiểu.&rdquo;
              </p>
              <footer className="mt-3 text-sm text-muted-foreground not-italic">
                — Chị Lan, 34 tuổi, chủ quán cà phê, TP.HCM
              </footer>
            </blockquote>
            <blockquote className="text-base leading-relaxed">
              <p className="italic text-foreground">
                &ldquo;Gửi kết quả hợp tuổi cho mẹ chồng, bà hài lòng luôn.
                Không cần đi thầy.&rdquo;
              </p>
              <footer className="mt-3 text-sm text-muted-foreground not-italic">
                — Chị Hương, 29 tuổi, nhân viên văn phòng, Hà Nội
              </footer>
            </blockquote>
            <blockquote className="text-base leading-relaxed">
              <p className="italic text-foreground">
                &ldquo;Mã màu hex gửi thẳng cho thợ sơn. Không app nào cho kết
                quả cụ thể vậy.&rdquo;
              </p>
              <footer className="mt-3 text-sm text-muted-foreground not-italic">
                — Anh Tuấn, 41 tuổi, chủ thầu xây dựng, Đà Nẵng
              </footer>
            </blockquote>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-14">
          <h2 className="text-xl font-semibold tracking-tight mb-6">
            Câu hỏi thường gặp
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {FAQ_ITEMS.map((item, i) => (
              <AccordionItem key={item.q} value={`faq-${i}`}>
                <AccordionTrigger className="text-left text-base font-medium">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <section className="mx-auto max-w-3xl px-4 pb-24 text-center">
          <h2 className="text-xl font-semibold tracking-tight">
            Sẵn sàng lập lá số?
          </h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            Không cần App Store · Chỉ mất 30 giây · Tặng 20 lượng dùng ngay
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            {install.isStandalone ? (
              <Button asChild size="lg">
                <Link to="/app">Mở ứng dụng</Link>
              </Button>
            ) : (
              <Button asChild size="lg">
                <Link to="/dang-ky">Lập lá số miễn phí</Link>
              </Button>
            )}
          </div>

          {install.showIosInstructions ? (
            <p className="mt-6 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              Trên iPhone/iPad: mở menu Share trong Safari, chọn{" "}
              <strong className="text-foreground">Thêm vào Màn hình chính</strong>{" "}
              để cài PWA.
            </p>
          ) : null}
        </section>
      </main>

      {install.engaged &&
      !install.isStandalone &&
      (install.canInstall || install.showIosInstructions) ? (
        <div className="fixed bottom-0 inset-x-0 z-50 border-t border-border bg-card/95 backdrop-blur-md px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto max-w-3xl flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Cài đặt nhanh — mở lại không cần gõ địa chỉ.
            </p>
            <div className="flex gap-2">
              {install.canInstall ? (
                <Button size="sm" onClick={() => void install.promptInstall()}>
                  Cài ứng dụng
                </Button>
              ) : null}
              <Button size="sm" variant="secondary" asChild>
                <Link to="/dang-ky">Lập lá số</Link>
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <footer className="border-t border-border bg-muted/20">
        <div className="mx-auto max-w-3xl px-4 py-8 flex flex-wrap gap-x-6 gap-y-2 justify-center text-xs text-muted-foreground">
          <Link
            to="/chinh-sach-bao-mat"
            className="hover:text-foreground underline-offset-4 hover:underline"
          >
            Chính sách bảo mật
          </Link>
          <Link
            to="/dieu-khoan"
            className="hover:text-foreground underline-offset-4 hover:underline"
          >
            Điều khoản sử dụng
          </Link>
        </div>
      </footer>
    </div>
  );
}
