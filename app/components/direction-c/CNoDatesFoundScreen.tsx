import { Link, useLocation, useNavigate } from "react-router";

import { BackBar } from "~/components/brand";
import { CT } from "~/lib/c-tokens";
import type { TraCuuEmptyState } from "~/lib/tra-cuu-session";

type EmptyState = TraCuuEmptyState;

function formatRangeRecap(start?: string, end?: string): string {
  if (!start || !end) return "trong khoảng đã chọn";
  const fmt = (iso: string) => {
    const [, m, d] = iso.split("-");
    return `${d}.${m}`;
  };
  return `từ ${fmt(start)} đến ${fmt(end)}`;
}

export function CNoDatesFoundScreen({
  state: stateProp,
}: {
  state?: EmptyState;
} = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const raw =
    stateProp ?? (location.state as Partial<EmptyState> | null) ?? {};
  const intent = raw.intentLabel ?? "việc này";
  const range = formatRangeRecap(raw.rangeStart, raw.rangeEnd);
  const days = raw.daysInclusive ?? 30;

  return (
    <div
      className="flex min-h-full flex-col"
      style={{ background: CT.paper, color: CT.ink, fontFamily: "var(--serif)" }}
    >
      <BackBar
        title="Tra cứu · kết quả"
        onBack={() => navigate("/tra-cuu")}
      />

      <div className="flex-1 overflow-auto px-6 pb-6 pt-3">
        <div className="text-[12.5px] leading-snug" style={{ color: CT.muted }}>
          Cho việc{" "}
          <strong className="font-semibold" style={{ color: CT.ink }}>
            {intent.toLowerCase()}
          </strong>{" "}
          · {range} ·{" "}
          <Link to="/tra-cuu" className="no-underline" style={{ color: CT.goldDeep }}>
            sửa
          </Link>
        </div>

        <div className="mt-10 flex flex-col items-center px-4 py-6 text-center">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden>
            <rect
              x="6"
              y="12"
              width="52"
              height="44"
              rx="2"
              stroke={CT.muted}
              strokeWidth="1.4"
              fill="rgba(122,112,80,0.04)"
            />
            <path
              d="M6 22 H58 M16 6 V18 M48 6 V18"
              stroke={CT.muted}
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            <path
              d="M22 36 L42 50 M42 36 L22 50"
              stroke={CT.red}
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>

          <h2
            className="mt-5 text-[22px] font-extrabold uppercase tracking-[-0.005em]"
            style={{ fontFamily: "var(--display)", color: CT.ink }}
          >
            Không có ngày tốt
          </h2>
          <p
            className="mt-2 max-w-[300px] text-[13.5px] leading-snug"
            style={{ color: CT.ink2 }}
          >
            Trong {days} ngày tới, không ngày nào đạt điểm đủ cao cho{" "}
            <strong className="font-semibold" style={{ color: CT.ink }}>
              {intent.toLowerCase()}
            </strong>
            . Thử mở rộng phạm vi hoặc bỏ bớt tiêu chí khắt khe.
          </p>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          {[
            ["Mở rộng khoảng ngày", "tăng cơ hội tìm được ngày tốt"],
            ["Đổi sang việc khác", "một số việc có nhiều ngày hợp hơn"],
          ].map(([title, sub]) => (
            <button
              key={title}
              type="button"
              onClick={() => navigate("/tra-cuu")}
              className="flex cursor-pointer items-center justify-between gap-3 border bg-white px-4 py-3.5 text-left"
              style={{ borderColor: CT.hairline }}
            >
              <div className="flex-1">
                <div
                  className="font-[family-name:var(--font-display-2)] text-[13.5px] font-bold tracking-[-0.005em]"
                  style={{ color: CT.ink }}
                >
                  {title}
                </div>
                <div className="mt-0.5 text-xs" style={{ color: CT.muted }}>
                  {sub}
                </div>
              </div>
              <span style={{ color: CT.goldDeep }}>›</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
