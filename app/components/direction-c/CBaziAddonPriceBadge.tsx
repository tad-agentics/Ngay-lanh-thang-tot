import { CT } from "~/lib/c-tokens";
import { LUAN_LA_SO_BAT_TU_FREE_WITH_YEARLY } from "~/lib/luan-la-so-bat-tu-labels";

/** Góc phải card Bát Tự — giá addon + upsell Lịch năm (Direction C stamp). */
export function CBaziAddonPriceBadge({ priceLabel }: { priceLabel: string }) {
  return (
    <div
      className="absolute top-2.5 right-2.5 z-[1] max-w-[46%] border px-2 py-1.5 text-right"
      style={{
        borderColor: CT.goldDeep,
        background: CT.paperWarm,
      }}
    >
      <div
        className="font-[family-name:var(--display-2)] text-[11.5px] font-extrabold leading-none tabular-nums tracking-[-0.01em]"
        style={{ color: CT.goldDeep }}
      >
        {priceLabel}
      </div>
      <div
        className="mt-0.5 font-serif text-[9px] leading-snug"
        style={{ color: CT.muted }}
      >
        {LUAN_LA_SO_BAT_TU_FREE_WITH_YEARLY}
      </div>
    </div>
  );
}
