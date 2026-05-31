import { Mono } from "~/components/brand";
import {
  CBaziNlttLuanInkLoading,
  CBaziNlttLuanProse,
} from "~/components/direction-c/CBaziNlttLuanRow";
import { BaziChapterEmpty } from "~/components/direction-c/BaziSectionHeading";
import { CT } from "~/lib/c-tokens";
import type {
  DaiVanNextView,
  LuuNienQuyNhanFacts,
} from "~/lib/luu-nien-facts-ui";
import { splitNlttLuanParagraphs } from "~/lib/nltt-luan-prose";

type CBaziQuyNhanSectionProps = {
  quyNhan: LuuNienQuyNhanFacts | null;
  daiVanNext: DaiVanNextView | null;
  prose: string;
  proseLoading?: boolean;
  proseFailed?: boolean;
  emptyReason: string | null;
  onRetryLuan?: () => void;
};

export function CBaziQuyNhanSection({
  quyNhan,
  daiVanNext,
  prose,
  proseLoading = false,
  proseFailed = false,
  emptyReason,
  onRetryLuan,
}: CBaziQuyNhanSectionProps) {
  const hop = quyNhan?.tuoiHop ?? [];
  const xung = quyNhan?.tuoiXung ?? [];
  const hasCards = hop.length > 0 || xung.length > 0;
  const hasFacts = Boolean(quyNhan || daiVanNext);

  if (emptyReason && !hasFacts && !prose && !proseLoading) {
    return <BaziChapterEmpty message={emptyReason} />;
  }

  return (
    <div className="mt-3 space-y-3.5">
      {hasCards ? (
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

      {prose ? (
        <div className="space-y-2.5">
          {splitNlttLuanParagraphs(prose).map((para) => (
            <p
              key={para.slice(0, 48)}
              className="font-serif text-[12.5px] leading-relaxed"
              style={{ color: CT.ink2 }}
            >
              {para}
            </p>
          ))}
        </div>
      ) : proseLoading ? (
        <div role="status" aria-live="polite">
          <CBaziNlttLuanInkLoading message="Đang luận quý nhân · lưu ý" compact />
        </div>
      ) : proseFailed ? (
        <CBaziNlttLuanProse
          failed
          failedMessage="Quý nhân chưa luận được lần này — nhấn để thử lại."
          onRetry={onRetryLuan}
          compact
        />
      ) : null}
      {!prose && !proseLoading && !proseFailed && !hasFacts && emptyReason ? (
        <BaziChapterEmpty message={emptyReason} />
      ) : null}
    </div>
  );
}
