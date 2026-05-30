import { Link } from "react-router";

import { Mono } from "~/components/brand";
import { CT } from "~/lib/c-tokens";

export default function OfflineRoute() {
  return (
    <div
      className="flex min-h-full flex-col items-center justify-center px-8 py-12 text-center"
      style={{ background: CT.paper, color: CT.ink, fontFamily: "var(--serif)" }}
    >
      <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden>
        <circle
          cx="36"
          cy="36"
          r="34"
          stroke={CT.muted}
          strokeWidth="1.4"
          fill="rgba(122,112,80,0.04)"
        />
        <path
          d="M20 36 H52 M36 20 V52"
          stroke={CT.muted}
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity="0.35"
        />
        <path
          d="M24 24 L48 48"
          stroke={CT.red}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>

      <Mono className="mt-5 text-[10.5px] tracking-[0.22em]" style={{ color: CT.goldDeep }}>
        Ngoại tuyến
      </Mono>
      <h2
        className="mt-2 font-[family-name:var(--display)] text-2xl font-extrabold uppercase tracking-[-0.01em]"
        style={{ color: CT.ink }}
      >
        Không có mạng
      </h2>
      <p className="mt-3 max-w-[280px] text-sm leading-snug" style={{ color: CT.ink2 }}>
        Khi có kết nối lại, lịch và lá số đã lưu sẽ đồng bộ. Bạn vẫn có thể xem một số
        trang đã mở gần đây.
      </p>

      <Link
        to="/lich"
        className="mt-8 inline-block px-6 py-3.5 font-[family-name:var(--display-2)] text-[13.5px] font-extrabold uppercase tracking-[0.08em] no-underline"
        style={{ background: CT.forest, color: CT.cream }}
      >
        Thử lại
      </Link>
    </div>
  );
}
