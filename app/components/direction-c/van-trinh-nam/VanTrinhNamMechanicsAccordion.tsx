import { Mono } from "~/components/brand";
import { CT } from "~/lib/c-tokens";
import type { VanTrinhNamLuanContext } from "~/lib/van-trinh-nam-types";

export function VanTrinhNamMechanicsAccordion({
  ctx,
}: {
  ctx: VanTrinhNamLuanContext;
}) {
  const m = ctx.part_d.mechanics;
  const natal = m.natal ?? {};

  return (
    <details className="mt-6 border px-3 py-2" style={{ borderColor: CT.hairline }}>
      <summary className="cursor-pointer font-serif text-sm font-semibold" style={{ color: CT.ink2 }}>
        Xem thuật ngữ & cơ chế
      </summary>
      <div className="mt-2 space-y-2 pb-2 font-serif text-[12px] leading-relaxed" style={{ color: CT.muted }}>
        {Object.entries(natal).map(([k, v]) => (
          <p key={k}>
            <Mono className="text-[9px] uppercase">{k}</Mono>: {v}
          </p>
        ))}
        {m.dung_than ? <p>Dụng Thần: {m.dung_than}</p> : null}
        {m.ky_than ? <p>Kỵ Thần: {m.ky_than}</p> : null}
        {m.dai_van_current ? <p>Đại vận: {m.dai_van_current}</p> : null}
        {m.luu_nien_pillar ? <p>Lưu niên: {m.luu_nien_pillar}</p> : null}
        {m.framework_line_vi ? (
          <p className="mt-2 italic">{m.framework_line_vi}</p>
        ) : null}
      </div>
    </details>
  );
}
