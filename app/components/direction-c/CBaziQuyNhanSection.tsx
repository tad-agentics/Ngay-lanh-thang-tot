import { Mono } from "~/components/brand";
import {
  BaziChapterEmpty,
  BaziChapterProse,
} from "~/components/direction-c/BaziSectionHeading";
import { CT } from "~/lib/c-tokens";
import type {
  DaiVanNextView,
  LuuNienQuyNhanFacts,
} from "~/lib/luu-nien-facts-ui";

type CBaziQuyNhanSectionProps = {
  quyNhan: LuuNienQuyNhanFacts | null;
  daiVanNext: DaiVanNextView | null;
  prose: string;
  emptyReason: string | null;
};

function daiVanNextSentence(dv: DaiVanNextView): string {
  const head = dv.display.trim();
  const tail = dv.themeVi?.trim() ?? "";
  if (head && tail) return `${head} — ${tail}`;
  return head || tail;
}

export function CBaziQuyNhanSection({
  quyNhan,
  daiVanNext,
  prose,
  emptyReason,
}: CBaziQuyNhanSectionProps) {
  if (emptyReason && !quyNhan && !daiVanNext && !prose) {
    return <BaziChapterEmpty message={emptyReason} />;
  }

  const facts = quyNhan;

  const hop = facts?.tuoiHop ?? [];
  const xung = facts?.tuoiXung ?? [];

  return (
    <div className="mt-3 space-y-3.5">
      {hop.length > 0 || xung.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {hop.length > 0 ? (
            <div
              className="px-3 py-2.5"
              style={{ background: "#fff", border: `1px solid ${CT.hairline}` }}
            >
              <Mono className="text-[9px]" style={{ color: CT.greenMute }}>
                Tuổi hợp
              </Mono>
              <div
                className="mt-1 font-[family-name:var(--display-2)] text-[13px] font-bold tracking-tight"
                style={{ color: CT.ink }}
              >
                {hop.join(" · ")}
              </div>
            </div>
          ) : null}
          {xung.length > 0 ? (
            <div
              className="px-3 py-2.5"
              style={{ background: "#fff", border: `1px solid ${CT.hairline}` }}
            >
              <Mono className="text-[9px]" style={{ color: CT.red }}>
                Tuổi xung
              </Mono>
              <div
                className="mt-1 font-[family-name:var(--display-2)] text-[13px] font-bold tracking-tight"
                style={{ color: CT.ink }}
              >
                {xung.join(" · ")}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {facts?.huongQuyNhan ? (
        <p className="font-serif text-[12.5px]" style={{ color: CT.ink2 }}>
          Quý nhân thường đến từ phương{" "}
          <strong style={{ color: CT.ink }}>{facts.huongQuyNhan}</strong>.
        </p>
      ) : null}

      {facts?.note ? (
        <p className="font-serif text-[12.5px] leading-relaxed" style={{ color: CT.ink2 }}>
          {facts.note}
        </p>
      ) : null}

      {daiVanNext ? (
        <p className="font-serif text-[12.5px] leading-relaxed" style={{ color: CT.ink2 }}>
          <strong style={{ color: CT.ink, fontWeight: 600 }}>Đại vận năm tới</strong>
          {" — "}
          {daiVanNextSentence(daiVanNext)}
          {daiVanNext.yearsLabel ? (
            <span style={{ color: CT.muted }}> ({daiVanNext.yearsLabel})</span>
          ) : null}
        </p>
      ) : null}

      {prose ? <BaziChapterProse text={prose} /> : null}
      {!prose && !facts && !daiVanNext && emptyReason ? (
        <BaziChapterEmpty message={emptyReason} />
      ) : null}
    </div>
  );
}
