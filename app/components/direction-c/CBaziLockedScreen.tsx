import { Link } from "react-router";

import { BackBar, Mono } from "~/components/brand";
import type { PackageSku } from "~/lib/api-types";
import { CT } from "~/lib/c-tokens";
import { UI_PACKAGES } from "~/lib/packages";

type CBaziLockedScreenProps = {
  title?: string;
  sku?: PackageSku;
};

/** Direction C — Bát tự reading paywall (artboard locked variant). */
export function CBaziLockedScreen({
  title = "Luận giải Bát tự · 2026",
  sku = "luan_bat_tu",
}: CBaziLockedScreenProps) {
  const pkg = UI_PACKAGES.find((p) => p.sku === sku);
  const yearly = UI_PACKAGES.find((p) => p.sku === "goi_12thang");

  return (
    <main
      className="flex min-h-[100svh] flex-col"
      style={{ background: CT.paper, color: CT.ink, fontFamily: "var(--serif)" }}
    >
      <BackBar title="Luận giải Bát tự" />

      <div className="flex flex-1 flex-col px-6 pb-10 pt-2">
        <div
          className="border px-4 py-3.5"
          style={{ background: "#fff", borderColor: CT.hairline }}
        >
          <div className="flex items-baseline gap-2">
            <span className="text-sm" style={{ color: CT.muted }}>
              ○
            </span>
            <Mono style={{ color: CT.muted, fontSize: 9 }}>Chưa mở khoá</Mono>
          </div>
          <h2
            className="mt-1.5 font-[family-name:var(--font-display)] text-[19px] font-extrabold uppercase tracking-[-0.01em]"
            style={{ color: CT.ink }}
          >
            {title}
          </h2>
          <p className="mt-1 font-serif text-xs" style={{ color: CT.muted }}>
            tính cách · vận năm · phong thuỷ · quý nhân
          </p>
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
        </div>

        <Link
          to={`/luan/mua/xac-nhan?sku=${sku}`}
          className="mt-5 block w-full py-3.5 text-center font-[family-name:var(--font-display-2)] text-[13px] font-extrabold uppercase tracking-[0.08em] no-underline"
          style={{ background: CT.forest, color: CT.cream }}
        >
          Mở khóa {pkg?.title ?? "luận giải"}
        </Link>

        {yearly ? (
          <Link
            to="/dat-lich?plan=goi_12thang"
            className="mt-3 block w-full border py-3 text-center font-[family-name:var(--font-display-2)] text-xs font-bold uppercase tracking-[0.06em] no-underline"
            style={{ borderColor: CT.hairline, color: CT.ink }}
          >
            Nâng lên {yearly.title} — kèm luận giải
          </Link>
        ) : null}

        <p
          className="mt-6 text-center font-serif text-xs leading-relaxed"
          style={{ color: CT.ink2 }}
        >
          Thanh toán một lần qua PayOS. Sau khi mở khóa, đọc lại bất cứ lúc nào trong mục Tôi.
        </p>
      </div>
    </main>
  );
}
