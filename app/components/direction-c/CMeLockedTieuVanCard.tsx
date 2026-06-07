import { Link } from "react-router";

import { Mono } from "~/components/brand";
import { currentYearVn } from "~/lib/bazi-reading-session";
import { CT } from "~/lib/c-tokens";
import { TIEU_VAN_LUAN_ENABLED } from "~/lib/feature-flags";
import { LUAN_LUU_NIEN_NGUYET_TAGLINE, LUAN_LUU_NIEN_NGUYET_TITLE } from "~/lib/luan-luu-nien-nguyet-labels";
import { catalogPriceLabel, UI_PACKAGES } from "~/lib/packages";

/** Direction C — Tôi / Lịch: lưu niên & lưu nguyệt locked card when addon not unlocked. */
export function CMeLockedTieuVanCard() {
  if (!TIEU_VAN_LUAN_ENABLED) return null;

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
        {LUAN_LUU_NIEN_NGUYET_TITLE}
      </div>
      <div className="mt-1 font-serif text-xs" style={{ color: CT.muted }}>
        {LUAN_LUU_NIEN_NGUYET_TAGLINE}
      </div>
      <div className="mt-2.5 flex flex-wrap items-baseline gap-2">
        <span
          className="font-[family-name:var(--display-2)] text-sm font-bold tabular-nums"
          style={{ color: CT.goldDeep }}
        >
          {pkg?.priceLabel ?? catalogPriceLabel("luan_tieu_van")}
        </span>
        <span className="font-serif text-[11.5px]" style={{ color: CT.muted }}>
          · hoặc kèm gói 6 tháng / năm
        </span>
      </div>
    </Link>
  );
}
