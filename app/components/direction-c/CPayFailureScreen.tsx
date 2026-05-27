import { Link, useNavigate } from "react-router";

import { BackBar, Mono } from "~/components/brand";
import { CT } from "~/lib/c-tokens";

export function CPayFailureScreen() {
  const navigate = useNavigate();

  return (
    <div
      className="flex min-h-full flex-col"
      style={{ background: CT.paper, color: CT.ink, fontFamily: "var(--serif)" }}
    >
      <BackBar title="Thanh toán" />

      <div className="flex flex-1 flex-col items-center justify-center px-8 py-6 text-center">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden>
          <circle
            cx="40"
            cy="40"
            r="38"
            stroke={CT.red}
            strokeWidth="1.5"
            fill="rgba(163,32,31,0.05)"
          />
          <path
            d="M28 28 L52 52 M52 28 L28 52"
            stroke={CT.red}
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>

        <Mono className="mt-5 text-[10px] tracking-[0.22em]" style={{ color: CT.red }}>
          Thanh toán không thành công
        </Mono>
        <h2
          className="mt-2.5 max-w-[300px] font-[family-name:var(--font-display)] text-[26px] font-extrabold uppercase leading-[1.05] tracking-[-0.01em]"
          style={{ color: CT.ink }}
        >
          Giao dịch
          <br />
          <span
            className="font-serif text-[26px] font-bold normal-case not-italic tracking-normal"
            style={{ color: CT.red }}
          >
            chưa hoàn tất
          </span>
        </h2>
        <p className="mt-3 max-w-[300px] text-[13.5px] leading-snug" style={{ color: CT.ink2 }}>
          Có thể số dư ví không đủ hoặc bạn đã huỷ thanh toán.{" "}
          <strong className="font-semibold" style={{ color: CT.ink }}>
            Lịch của bạn chưa bị trừ tiền.
          </strong>
        </p>

        <button
          type="button"
          onClick={() => navigate("/dat-lich")}
          className="mt-7 w-full max-w-[320px] cursor-pointer border-none py-3.5 font-[family-name:var(--font-display-2)] text-[13px] font-extrabold uppercase tracking-[0.08em]"
          style={{ background: CT.forest, color: CT.cream }}
        >
          Thử lại
        </button>
        <Link
          to="/lich"
          className="mt-2.5 block w-full max-w-[320px] border py-3 text-center font-[family-name:var(--font-display-2)] text-xs font-bold uppercase tracking-[0.08em] no-underline"
          style={{ borderColor: CT.goldDeep, color: CT.ink }}
        >
          Về lịch
        </Link>
      </div>
    </div>
  );
}
