import { Mono } from "~/components/brand";
import {
  BaziChapterEmpty,
  BaziChapterProse,
} from "~/components/direction-c/BaziSectionHeading";
import { CT } from "~/lib/c-tokens";
import type { PhongThuyFactsView } from "~/lib/phong-thuy-facts-ui";

const PHI_COLOR = {
  good: CT.goldDeep,
  bad: CT.red,
  neutral: CT.muted,
} as const;

type CBaziPhongThuySectionProps = {
  facts: PhongThuyFactsView | null;
  prose: string;
  emptyReason: string | null;
};

export function CBaziPhongThuySection({
  facts,
  prose,
  emptyReason,
}: CBaziPhongThuySectionProps) {
  if (emptyReason && !facts && !prose) {
    return <BaziChapterEmpty message={emptyReason} />;
  }

  return (
    <div className="mt-3 space-y-4">
      {facts && facts.huongTot.length > 0 ? (
        <div>
          <Mono className="mb-1.5 text-[9px]" style={{ color: CT.muted }}>
            Hướng tốt cho bạn
          </Mono>
          <div className="grid grid-cols-2 gap-1.5">
            {facts.huongTot.map((d) => (
              <div
                key={d.name}
                className="px-3 py-2.5"
                style={{
                  background: "#fff",
                  border: `1px solid ${d.highlight ? CT.goldDeep : CT.hairline}`,
                }}
              >
                <div
                  className="font-[family-name:var(--display-2)] text-[13px] font-bold uppercase tracking-tight"
                  style={{ color: d.highlight ? CT.goldDeep : CT.ink }}
                >
                  {d.name}
                </div>
                {d.sub ? (
                  <p className="mt-0.5 font-serif text-[11px]" style={{ color: CT.muted }}>
                    {d.sub}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
          {facts.huongXau.length > 0 ? (
            <p className="mt-2 font-serif text-[11.5px]" style={{ color: CT.muted }}>
              Tránh:{" "}
              <span style={{ color: CT.red, fontWeight: 600 }}>
                {facts.huongXau.join(", ")}
              </span>
            </p>
          ) : null}
        </div>
      ) : null}

      {facts && facts.mauMay.length > 0 ? (
        <div>
          <Mono className="mb-2 text-[9px]" style={{ color: CT.muted }}>
            Màu sắc hợp
          </Mono>
          <div className="flex gap-2">
            {facts.mauMay.map((c) => (
              <div key={c.name} className="flex-1 text-center">
                <div
                  className="aspect-square w-full border"
                  style={{ background: c.hex, borderColor: CT.hairline }}
                />
                <p className="mt-1 font-serif text-[10.5px]" style={{ color: CT.ink2 }}>
                  {c.name}
                </p>
              </div>
            ))}
          </div>
          {facts.mauKy.length > 0 ? (
            <p className="mt-2 font-serif text-[11.5px]" style={{ color: CT.muted }}>
              Tránh:{" "}
              <span style={{ color: CT.red, fontWeight: 600 }}>
                {facts.mauKy.join(", ")}
              </span>
            </p>
          ) : null}
        </div>
      ) : null}

      {facts && facts.phiTinh.length > 0 ? (
        <div>
          <Mono className="mb-2 text-[9px]" style={{ color: CT.muted }}>
            Sao bay trong nhà
          </Mono>
          <div
            className="grid grid-cols-3 gap-0.5 border p-1"
            style={{ borderColor: CT.hairline, background: "#fff" }}
          >
            {facts.phiTinh.map((cell) => (
              <div
                key={`${cell.direction}-${cell.star}`}
                className="px-1 py-1.5 text-center"
                style={{ border: `1px solid ${CT.hairline2}` }}
              >
                <Mono
                  className="text-[9px] uppercase tracking-wide"
                  style={{ color: CT.muted }}
                >
                  {cell.direction}
                </Mono>
                <div
                  className="mt-0.5 font-[family-name:var(--display-2)] text-[11px] font-bold"
                  style={{ color: PHI_COLOR[cell.tone] }}
                >
                  {cell.star}
                </div>
              </div>
            ))}
          </div>
          {facts.phiTinhNote ? (
            <p
              className="mt-2 font-serif text-[11px] italic leading-relaxed"
              style={{ color: CT.muted }}
            >
              {facts.phiTinhNote}
            </p>
          ) : null}
        </div>
      ) : null}

      {prose ? <BaziChapterProse text={prose} /> : null}
      {!prose && !facts && emptyReason ? (
        <BaziChapterEmpty message={emptyReason} />
      ) : null}
    </div>
  );
}
