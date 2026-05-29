import { Link } from "react-router";

import { Mono } from "~/components/brand";
import { useSubscription } from "~/hooks/useSubscription";
import { CT } from "~/lib/c-tokens";
import { subscriptionDaysUntil, subscriptionExpiryUrgent } from "~/lib/entitlements";

/** G2 — amber banner on `/lich` when subscription expires within 7 days. */
export function CSubscriptionExpiryBanner() {
  const { expiresAt, expiryFormatted, isActive } = useSubscription();
  const urgent = subscriptionExpiryUrgent(expiresAt);
  const days = subscriptionDaysUntil(expiresAt);

  if (!isActive || !urgent || days == null || !expiryFormatted) return null;

  const copy =
    days <= 1
      ? `Lịch hết hạn ${days === 0 ? "hôm nay" : "ngày mai"} · gia hạn ngay`
      : `Lịch sắp hết hạn · còn ${days} ngày`;

  return (
    <Link
      to="/dat-lich"
      className="mx-[22px] mb-2 mt-1 block border-l-[3px] px-3 py-2.5 no-underline"
      style={{
        borderColor: CT.goldDeep,
        background: "rgba(154,124,34,0.12)",
      }}
    >
      <Mono className="text-[9.5px] tracking-[0.14em]" style={{ color: CT.goldDeep }}>
        {copy}
      </Mono>
      <p className="m-0 mt-1 font-serif text-[13px]" style={{ color: CT.ink2 }}>
        Dùng đến {expiryFormatted} ·{" "}
        <span style={{ color: CT.goldDeep }}>Đặt lịch →</span>
      </p>
    </Link>
  );
}
