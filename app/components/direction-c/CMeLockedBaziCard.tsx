import { Link } from "react-router";

import { Mono } from "~/components/brand";
import { CT } from "~/lib/c-tokens";
import {
  LUAN_LA_SO_BAT_TU_TAGLINE,
  LUAN_LA_SO_BAT_TU_TITLE,
} from "~/lib/luan-la-so-bat-tu-labels";
import { catalogPriceLabel, UI_PACKAGES } from "~/lib/packages";

/** Direction C — Tôi tab: Bát tự locked card for monthly subscribers (CMeLocked maket). */
export function CMeLockedBaziCard() {
  const pkg = UI_PACKAGES.find((p) => p.sku === "luan_bat_tu");

  return (
    <Link
      to="/toi/luan-bat-tu"
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
        {LUAN_LA_SO_BAT_TU_TITLE}
      </div>
      <div className="mt-1 font-serif text-xs" style={{ color: CT.muted }}>
        {LUAN_LA_SO_BAT_TU_TAGLINE}
      </div>
      <div className="mt-2.5 flex flex-wrap items-baseline gap-2">
        <span
          className="font-[family-name:var(--display-2)] text-sm font-bold tabular-nums"
          style={{ color: CT.goldDeep }}
        >
          {pkg?.priceLabel ?? catalogPriceLabel("luan_bat_tu")}
        </span>
        <span className="font-serif text-[11.5px]" style={{ color: CT.muted }}>
          · hoặc miễn phí với Lịch năm
        </span>
      </div>
    </Link>
  );
}
