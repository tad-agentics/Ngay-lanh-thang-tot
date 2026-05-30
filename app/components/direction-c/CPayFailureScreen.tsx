import { Link, useNavigate } from "react-router";

import { BackBar, Mono } from "~/components/brand";
import { PayFailureMark } from "~/components/direction-c/PayCommerceMarks";
import { PayFailureDetails } from "~/components/direction-c/PayFailureDetails";
import { CT } from "~/lib/c-tokens";
import {
  formatPayFailureTimestamp,
  PAY_DISPLAY,
  PAY_DISPLAY2,
} from "~/lib/pay-commerce-ui";

type CPayFailureScreenProps = {
  retryTo?: string;
  backTo?: string;
  changeMethodTo?: string;
  errorCode?: string;
};

export function CPayFailureScreen({
  retryTo = "/dat-lich",
  backTo = "/lich",
  changeMethodTo = "/dat-lich",
  errorCode = "PAYOS_CANCELLED",
}: CPayFailureScreenProps) {
  const navigate = useNavigate();
  const errorAt = formatPayFailureTimestamp();

  return (
    <div
      className="flex min-h-full flex-col"
      style={{ background: CT.paper, color: CT.ink, fontFamily: "var(--serif)" }}
    >
      <BackBar title="Thanh toán" />

      <div className="flex flex-1 flex-col items-center justify-center px-8 py-6 text-center">
        <PayFailureMark />

        <Mono className="mt-[22px] text-[10.5px] tracking-[0.22em]" style={{ color: CT.red }}>
          Thanh toán không thành công
        </Mono>
        <h2
          className="mt-2.5 max-w-[300px] text-[26.5px] font-extrabold uppercase leading-[1.05] tracking-[-0.01em]"
          style={{ ...PAY_DISPLAY, color: CT.ink }}
        >
          Giao dịch
          <br />
          <span
            className="font-serif text-[26.5px] font-bold italic normal-case tracking-normal"
            style={{ color: CT.red }}
          >
            chưa hoàn tất
          </span>
        </h2>
        <p className="mt-3 max-w-[300px] text-[14px] leading-snug" style={{ color: CT.ink2 }}>
          Có thể số dư không đủ, bạn đã huỷ, hoặc lệnh đã hết hạn.{" "}
          <strong className="font-semibold" style={{ color: CT.ink }}>
            Lịch của bạn chưa bị trừ tiền.
          </strong>
        </p>

        <PayFailureDetails errorCode={errorCode} errorAt={errorAt} />

        <button
          type="button"
          onClick={() => navigate(retryTo)}
          className="mt-7 w-full max-w-[320px] cursor-pointer border-none py-3.5 text-[13.5px] font-extrabold uppercase tracking-[0.08em]"
          style={{ ...PAY_DISPLAY2, background: CT.forest, color: CT.cream }}
        >
          Thử lại
        </button>
        <Link
          to={changeMethodTo}
          className="mt-2.5 block w-full max-w-[320px] border py-[13px] text-center text-xs font-bold uppercase tracking-[0.08em] no-underline"
          style={{ ...PAY_DISPLAY2, borderColor: CT.goldDeep, color: CT.ink }}
        >
          Đổi cách thanh toán
        </Link>
        <Link
          to={backTo}
          className="mt-2.5 block w-full max-w-[320px] py-1 text-center font-serif text-[13px] no-underline"
          style={{ color: CT.muted }}
        >
          Quay lại
        </Link>
      </div>
    </div>
  );
}
