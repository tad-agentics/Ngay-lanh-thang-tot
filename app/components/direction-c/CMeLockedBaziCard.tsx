import { Link } from "react-router";

import { Mono } from "~/components/brand";
import { CT } from "~/lib/c-tokens";
import { UI_PACKAGES } from "~/lib/packages";

/** Direction C — Tôi tab: Bát tự locked card for monthly subscribers. */
export function CMeLockedBaziCard() {
  const pkg = UI_PACKAGES.find((p) => p.sku === "luan_bat_tu");
  const yearly = UI_PACKAGES.find((p) => p.sku === "goi_12thang");

  return (
    <div
      className="relative mt-5 block border px-4 py-3.5"
      style={{ background: "#fff", borderColor: CT.hairline }}
    >
      <div className="flex items-baseline gap-2">
        <span className="text-sm" style={{ color: CT.muted }}>
          ○
        </span>
        <Mono style={{ color: CT.muted, fontSize: 9 }}>Chưa mở khoá</Mono>
      </div>
      <div
        className="mt-1.5 font-[family-name:var(--font-display)] text-[19px] font-extrabold uppercase tracking-[-0.01em]"
        style={{ color: CT.ink }}
      >
        Luận giải Bát tự năm
      </div>
      <div className="mt-1 font-serif text-xs" style={{ color: CT.muted }}>
        tính cách · vận năm · phong thuỷ · quý nhân
      </div>
      <div className="mt-2.5 flex flex-wrap items-baseline gap-2">
        <span
          className="font-[family-name:var(--font-display-2)] text-sm font-bold tabular-nums"
          style={{ color: CT.goldDeep }}
        >
          {pkg?.priceLabel ?? "299.000₫"}
        </span>
        <span className="font-serif text-[11px]" style={{ color: CT.muted }}>
          · hoặc miễn phí với Lịch năm
        </span>
      </div>
      <Link
        to="/luan/mua/xac-nhan?sku=luan_bat_tu"
        className="mt-3 block w-full py-2.5 text-center font-[family-name:var(--font-display-2)] text-xs font-extrabold uppercase tracking-[0.08em] no-underline"
        style={{ background: CT.forest, color: CT.cream }}
      >
        Mở khóa luận giải
      </Link>
      {yearly ? (
        <Link
          to="/dat-lich?plan=goi_12thang"
          className="mt-2 block text-center font-serif text-[11.5px] no-underline"
          style={{ color: CT.goldDeep }}
        >
          Nâng lên lịch năm — tiết kiệm 498k →
        </Link>
      ) : null}
    </div>
  );
}
