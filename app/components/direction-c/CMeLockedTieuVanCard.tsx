import { Link } from "react-router";

import { Mono } from "~/components/brand";
import { CT } from "~/lib/c-tokens";
import { UI_PACKAGES } from "~/lib/packages";

/** Direction C — Tôi tab: Tiểu Vận locked card. */
export function CMeLockedTieuVanCard() {
  const pkg = UI_PACKAGES.find((p) => p.sku === "luan_tieu_van");

  return (
    <Link
      to="/luan/mua/xac-nhan?sku=luan_tieu_van"
      className="mt-4 block border px-4 py-3.5 no-underline"
      style={{ background: "#fff", borderColor: CT.hairline, color: CT.ink }}
    >
      <Mono style={{ color: CT.muted, fontSize: 9 }}>Luận Tiểu Vận</Mono>
      <div
        className="mt-1.5 font-[family-name:var(--font-display)] text-base font-bold uppercase tracking-[-0.005em]"
      >
        Mở vận năm · 12 tháng
      </div>
      <div className="mt-1 font-serif text-xs" style={{ color: CT.muted }}>
        từ {pkg?.priceLabel ?? "199.000₫"} · hoặc kèm gói năm
      </div>
    </Link>
  );
}
