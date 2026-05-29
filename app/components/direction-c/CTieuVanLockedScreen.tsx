import { Link } from "react-router";

import { BackBar, Mono } from "~/components/brand";
import { CT } from "~/lib/c-tokens";
import { UI_PACKAGES } from "~/lib/packages";

/** Direction C — Tiểu Vận paywall (addon `luan_tieu_van`). */
export function CTieuVanLockedScreen({ year }: { year: number }) {
  const pkg = UI_PACKAGES.find((p) => p.sku === "luan_tieu_van");
  const yearly = UI_PACKAGES.find((p) => p.sku === "goi_12thang");

  return (
    <main
      className="flex min-h-full flex-col"
      style={{ background: CT.paper, color: CT.ink, fontFamily: "var(--serif)" }}
    >
      <BackBar title={`Tiểu vận ${year}`} />

      <div className="flex flex-1 flex-col px-6 pb-10 pt-2">
        <div
          className="border px-4 py-3.5"
          style={{ background: "#fff", borderColor: CT.hairline }}
        >
          <Mono style={{ color: CT.muted, fontSize: 9.5 }}>Chưa mở khoá</Mono>
          <h2
            className="mt-1.5 font-[family-name:var(--display)] text-[19.5px] font-extrabold uppercase tracking-[-0.01em]"
          >
            Luận giải Tiểu vận
          </h2>
          <p className="mt-1 font-serif text-xs" style={{ color: CT.muted }}>
            vận hạn cát hung · phong thủy cát tường · luận giải 12 tháng tới
          </p>
          <p
            className="mt-2.5 font-[family-name:var(--display-2)] text-sm font-bold tabular-nums"
            style={{ color: CT.goldDeep }}
          >
            {pkg?.priceLabel ?? "199.000₫"}
            <span className="ml-2 font-serif text-[11.5px] font-normal" style={{ color: CT.muted }}>
              · hoặc kèm gói năm
            </span>
          </p>
        </div>

        <Link
          to="/luan/mua/xac-nhan?sku=luan_tieu_van"
          className="mt-5 block w-full py-3.5 text-center font-[family-name:var(--display-2)] text-[13.5px] font-extrabold uppercase tracking-[0.08em] no-underline"
          style={{ background: CT.forest, color: CT.cream }}
        >
          Mở khóa {pkg?.title ?? "luận giải Tiểu vận"}
        </Link>

        {yearly ? (
          <Link
            to="/dat-lich?plan=goi_12thang"
            className="mt-3 block w-full border py-3 text-center font-[family-name:var(--display-2)] text-xs font-bold uppercase tracking-[0.06em] no-underline"
            style={{ borderColor: CT.hairline, color: CT.ink }}
          >
            Nâng cấp {yearly.title} — Tặng kèm Tiểu vận
          </Link>
        ) : null}

        <p
          className="mt-6 text-center font-serif text-xs leading-relaxed"
          style={{ color: CT.ink2 }}
        >
          Thanh toán bảo mật một lần qua PayOS. Bản chủ có thể đọc lại bài luận giải bất cứ lúc nào trong mục Sổ tay (tab Tôi).
        </p>
      </div>
    </main>
  );
}
