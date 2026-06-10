/**
 * SEO landing at `/` — Direction C (c-landing.jsx).
 * Pre-rendered at build time via react-router.config.ts.
 */

import { LandingDirectionC } from "~/components/landing/LandingDirectionC";
import { TIEU_VAN_LUAN_ENABLED } from "~/lib/feature-flags";
import { LUAN_LUU_NIEN_NGUYET_TITLE } from "~/lib/luan-luu-nien-nguyet-labels";
import { PACKAGE_AMOUNT_VND } from "~/lib/package-amount-vnd";
import { formatVndDigits } from "~/lib/vnd-format";

import type { Route } from "./+types/landing";

const SITE_ORIGIN = "https://ngaylanhthangtot.vn";

const YEARLY_PRICE_LABEL = `${formatVndDigits(PACKAGE_AMOUNT_VND.goi_12thang)} ₫`;

const FAQS = [
  [
    "Lịch dùng thế nào?",
    "Sau 30 giây nhập ngày giờ sinh, lá số tứ trụ của bạn được lập. Mỗi sáng mở app, trang hôm nay đã chấm điểm theo mệnh bạn.",
  ],
  [
    "Có chính xác không?",
    "Hệ thống đối chiếu 4 nguồn cổ: Hiệp Kỷ Biện Phương, Ngọc Hạp Thông Thư, Tử Bình Chân Thuyên, Tam Mệnh Thông Hội.",
  ],
  [
    "Mua gói nào hợp lý nhất?",
    TIEU_VAN_LUAN_ENABLED
      ? `Gói năm ${YEARLY_PRICE_LABEL} — toàn bộ tính năng: Lịch cả năm + Luận giải Bát tự + ${LUAN_LUU_NIEN_NGUYET_TITLE}. Tiết kiệm hơn mua riêng từng phần.`
      : `Gói năm ${YEARLY_PRICE_LABEL} — toàn bộ tính năng: Lịch cả năm + Luận giải Bát tự. Tiết kiệm hơn mua riêng từng phần.`,
  ],
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
          "Lịch tờ điện tử cá nhân — 365 trang chấm điểm theo lá số tứ trụ của bạn. Mỗi sáng một trang.",
        applicationCategory: "LifestyleApplication",
        inLanguage: "vi",
        offers: {
          "@type": "Offer",
          name: "Lịch 1 năm",
          price: String(PACKAGE_AMOUNT_VND.goi_12thang),
          priceCurrency: "VND",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQS.map(([q, a]) => ({
          "@type": "Question",
          name: q,
          acceptedAnswer: { "@type": "Answer", text: a },
        })),
      },
    ],
  };
}

export const links: Route.LinksFunction = () => [];

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Ngày Lành Tháng Tốt — lịch tờ điện tử cá nhân theo lá số tứ trụ" },
    {
      name: "description",
      content:
        "365 trang lịch tờ — mỗi trang chấm sẵn theo mệnh bạn. Lập lịch 30 giây, không cần thẻ. Tra cứu ngày tốt, luận giải Bát tự.",
    },
    { property: "og:title", content: "Ngày Lành Tháng Tốt — lịch của bạn cả năm" },
    {
      property: "og:description",
      content: "Đây là lịch của bạn — không phải lịch in để chung. Mỗi sáng một trang.",
    },
    { property: "og:type", content: "website" },
    { property: "og:url", content: SITE_ORIGIN + "/" },
    { property: "og:image", content: SITE_ORIGIN + "/icons/icon-512.png" },
    { name: "theme-color", content: "#1d3129" },
  ];
}

export default function LandingRoute() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(landingJsonLd()) }}
      />
      <LandingDirectionC />
    </>
  );
}
