import { CT } from "~/lib/c-tokens";
import { PAY_MONO } from "~/lib/pay-commerce-ui";

type PayFailureDetailsProps = {
  errorCode: string;
  errorAt: string;
};

export function PayFailureDetails({ errorCode, errorAt }: PayFailureDetailsProps) {
  return (
    <div
      className="mt-[22px] w-full max-w-[320px] border px-4 py-3 text-left"
      style={{ borderColor: CT.hairline, background: "#fff" }}
    >
      <div className="flex justify-between text-xs" style={{ color: CT.muted }}>
        <span>Mã lỗi</span>
        <span style={{ ...PAY_MONO, color: CT.ink2 }}>{errorCode}</span>
      </div>
      <div className="mt-1.5 flex justify-between text-xs" style={{ color: CT.muted }}>
        <span>Thời gian</span>
        <span style={{ color: CT.ink2 }}>{errorAt}</span>
      </div>
    </div>
  );
}
