import { Link } from "react-router";

import { Mono } from "~/components/brand";
import { currentYearVn } from "~/lib/bazi-reading-session";
import { CT } from "~/lib/c-tokens";
import { UI_PACKAGES } from "~/lib/packages";

/** Direction C — Tôi / Lịch: Tiểu vận locked card for subscribers without entitlement. */
export function CMeLockedTieuVanCard() {
  const pkg = UI_PACKAGES.find((p) => p.sku === "luan_tieu_van");
  const tieuVanYear = currentYearVn();

  return (
    <Link
      to={`/toi/luan-tieu-van?year=${tieuVanYear}`}
      className="relative mt-[22px] block cursor-pointer border px-4 py-3.5 no-underline"
      style={{ background: "#fff", borderColor: CT.hairline, color: CT.ink }}
    >
      <div className="flex items-baseline gap-2">
        <span className="text-sm" style={{ color: CT.muted }}>
          ○
        </span>
        <Mono style={{ color: CT.muted, fontSize: 9.5 }}>Chưa mở khoá</Mono>
      </div>
      <div
        className="mt-1.5 font-[family-name:var(--display)] text-[19.5px] font-extrabold uppercase tracking-[-0.01em]"
        style={{ color: CT.ink }}
      >
        Luận giải Tiểu vận
      </div>
      <div className="mt-1 font-serif text-xs" style={{ color: CT.muted }}>
        vận hạn cát hung · phong thủy cát tường · luận giải tháng
      </div>
      <div className="mt-2.5 flex flex-wrap items-baseline gap-2">
        <span
          className="font-[family-name:var(--display-2)] text-sm font-bold tabular-nums"
          style={{ color: CT.goldDeep }}
        >
          {pkg?.priceLabel ?? "199.000₫"}
        </span>
        <span className="font-serif text-[11.5px]" style={{ color: CT.muted }}>
          · hoặc kèm gói 6 tháng / năm
        </span>
      </div>
    </Link>
  );
}
