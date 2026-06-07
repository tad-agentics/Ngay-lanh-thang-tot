import { Mono } from "~/components/brand";
import { CT } from "~/lib/c-tokens";
import {
  buildBaziNguHanhBarRows,
  type BaziNguHanhPercents,
} from "~/lib/bazi-ngu-hanh-display";

type CBaziNguHanhBarsProps = {
  nguHanh: BaziNguHanhPercents;
  /** `full` — màn luận; `compact` — home preview card. */
  variant?: "full" | "compact";
  label?: string;
};

export function CBaziNguHanhBars({
  nguHanh,
  variant = "full",
  label = variant === "full" ? "Ngũ hành trong lá số" : "Ngũ hành",
}: CBaziNguHanhBarsProps) {
  const rows = buildBaziNguHanhBarRows(nguHanh);
  if (!rows.some((r) => r.v > 0)) return null;

  const compact = variant === "compact";

  return (
    <div className={compact ? "mt-3" : "mt-4"}>
      <Mono className={compact ? "mb-1.5 text-[9px]" : "mb-2 text-[9.5px]"} style={{ color: CT.muted }}>
        {label}
      </Mono>
      <div
        className={`flex items-end gap-1${compact ? "" : ".5"}`}
        style={{ height: compact ? 40 : 56 }}
      >
        {rows.map((row) => (
          <div
            key={row.key}
            className="flex h-full flex-1 flex-col items-center justify-end"
          >
            <div
              className={`mb-0.5 font-mono font-semibold ${compact ? "text-[9px]" : "text-[10px]"}`}
              style={{ color: compact ? CT.ink2 : CT.ink }}
            >
              {row.v}%
            </div>
            <div
              style={{
                width: compact ? "72%" : "70%",
                height: `${Math.max(compact ? 6 : 8, row.v * (compact ? 1.6 : 2))}%`,
                background: row.color,
                opacity: compact ? 0.88 : 0.85,
              }}
            />
            <Mono
              className={`mt-0.5 ${compact ? "text-[8px]" : "text-[9px]"}`}
              style={{ color: compact ? CT.muted : CT.ink2 }}
            >
              {row.label}
            </Mono>
          </div>
        ))}
      </div>
    </div>
  );
}
