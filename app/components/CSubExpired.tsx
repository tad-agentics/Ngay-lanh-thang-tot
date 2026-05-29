import { Link } from "react-router";

import { Mono } from "~/components/brand";
import { useAuth } from "~/lib/auth";
import { useLastPaidSubscriptionSku } from "~/hooks/useLastPaidSubscriptionSku";
import { useSubscription } from "~/hooks/useSubscription";
import { CT } from "~/lib/c-tokens";
import { UI_PACKAGES } from "~/lib/packages";

/** Direction C — subscription expired full-screen blocker (artboard 38). */
export function CSubExpired() {
  const { user } = useAuth();
  const { expiryFormatted } = useSubscription();
  const lastPaidSku = useLastPaidSubscriptionSku(user?.id);
  const renewSku = lastPaidSku ?? "goi_12thang";
  const yearly = UI_PACKAGES.find((p) => p.sku === "goi_12thang");
  const renewPkg = UI_PACKAGES.find((p) => p.sku === renewSku) ?? yearly;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-auto"
      style={{ background: CT.paper, color: CT.ink, fontFamily: "var(--serif)" }}
      role="dialog"
      aria-labelledby="sub-expired-title"
    >
      <div className="flex flex-1 flex-col items-center justify-center px-7 py-10 text-center">
        <svg width="84" height="92" viewBox="0 0 84 92" fill="none" aria-hidden>
          <rect
            x="6"
            y="14"
            width="72"
            height="68"
            rx="2"
            stroke={CT.muted}
            strokeWidth="1.4"
            fill="rgba(122,112,80,0.04)"
          />
          <path
            d="M6 28 H78 M22 6 V20 M62 6 V20"
            stroke={CT.muted}
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          {[0, 1, 2].map((i) =>
            [0, 1, 2, 3, 4, 5, 6].map((j) => (
              <circle
                key={`${i}-${j}`}
                cx={14 + j * 10}
                cy={42 + i * 12}
                r="1.5"
                fill="rgba(122,112,80,0.25)"
              />
            )),
          )}
          <circle cx="62" cy="68" r="14" fill={CT.paper} />
          <path
            d="M58 68 V64 C58 62, 60 60, 62 60 C64 60, 66 62, 66 64 V68"
            stroke={CT.goldDeep}
            strokeWidth="1.4"
            fill="none"
          />
          <rect x="55" y="68" width="14" height="10" rx="1" fill={CT.goldDeep} />
        </svg>

        <Mono
          className="mt-5 text-[10px] tracking-[0.22em]"
          style={{ color: CT.goldDeep }}
        >
          Lịch cát tường hết hạn
        </Mono>
        <h2
          id="sub-expired-title"
          className="mt-2.5 max-w-[320px] font-[family-name:var(--display)] text-[28px] font-extrabold uppercase leading-[1.05] tracking-[-0.01em]"
          style={{ color: CT.ink }}
        >
          Lịch cát tường
          <br />
          <span
            className="font-serif text-[28px] font-bold normal-case not-italic tracking-normal"
            style={{ color: CT.goldDeep }}
          >
            {expiryFormatted ? `tạm dừng từ ngày ${expiryFormatted}` : "đã hết hạn"}
          </span>
        </h2>
        <p
          className="mt-3.5 max-w-[320px] text-[13.5px] leading-snug"
          style={{ color: CT.ink2 }}
        >
          Gia hạn để tiếp tục xem trang ngày cát lành, tra cứu vạn sự và khai mở{" "}
          <strong className="font-semibold" style={{ color: CT.ink }}>
            luận giải Bát Tự + Tiểu vận
          </strong>
          . Thông tin lá số Tứ Trụ của bản chủ vẫn được lưu trữ an toàn, không cần lập lại sau khi gia hạn.
        </p>

        {renewPkg ? (
          <div
            className="relative mt-5 w-full max-w-[320px] px-4 py-3.5 text-left"
            style={{ background: CT.forest, color: CT.cream }}
          >
            <Mono className="text-[9px]" style={{ color: CT.gold }}>
              {renewSku === "goi_12thang" ? "Gói cát tường khuyên dùng" : "Gói đăng ký trước đây"}
            </Mono>
            <div className="mt-1 font-[family-name:var(--display)] text-lg font-extrabold uppercase tracking-[-0.005em]">
              {renewPkg.title}
            </div>
            <div
              className="mt-1.5 font-[family-name:var(--display-2)] text-[22px] font-extrabold tabular-nums"
              style={{ color: CT.gold }}
            >
              {renewPkg.priceLabel}
            </div>
            <Link
              to={`/dat-lich?plan=${renewSku}`}
              className="mt-3 block w-full py-2.5 text-center font-[family-name:var(--display-2)] text-xs font-extrabold uppercase tracking-[0.08em] no-underline"
              style={{ background: CT.gold, color: CT.forest }}
            >
              Tiến hành gia hạn
            </Link>
          </div>
        ) : null}

        <Link
          to="/dat-lich"
          className="mt-3 text-[12.5px] no-underline"
          style={{ color: CT.muted }}
        >
          Xem các gói lịch khác →
        </Link>

        <Link
          to="/toi/cai-dat"
          className="mt-5 block text-[12.5px] no-underline"
          style={{ color: CT.goldDeep }}
        >
          Cài đặt tài khoản →
        </Link>
      </div>
    </div>
  );
}
