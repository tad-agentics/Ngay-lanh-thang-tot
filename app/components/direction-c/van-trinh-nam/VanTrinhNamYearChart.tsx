import { Mono } from "~/components/brand";
import { CT } from "~/lib/c-tokens";

const TONE_BAR: Record<string, string> = {
  good: CT.greenMute,
  mid: CT.goldDeep,
  low: CT.muted,
  bad: CT.red,
};

function barTone(score: number): string {
  if (score >= 70) return TONE_BAR.good ?? CT.greenMute;
  if (score >= 55) return TONE_BAR.mid ?? CT.goldDeep;
  if (score >= 45) return TONE_BAR.low ?? CT.muted;
  return TONE_BAR.bad ?? CT.red;
}

export function VanTrinhNamYearChart({ values }: { values: number[] }) {
  if (values.length < 12) return null;
  return (
    <div>
      <Mono className="mb-1.5 text-[9px]" style={{ color: CT.muted }}>
        Đường vận 12 tháng (ngày tốt trong tháng)
      </Mono>
      <div className="flex h-14 items-end gap-0.5">
        {values.map((v, i) => (
          <div
            key={i}
            className="flex h-full flex-1 flex-col items-center justify-end"
          >
            <div
              className="w-full"
              style={{
                height: `${Math.max(12, Math.min(100, v))}%`,
                background: barTone(v),
                opacity: 0.88,
              }}
            />
            <Mono className="mt-1 text-[9.5px]" style={{ color: CT.muted }}>
              {i + 1}
            </Mono>
          </div>
        ))}
      </div>
    </div>
  );
}
