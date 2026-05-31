import { Mono } from "~/components/brand";
import {
  CBaziNlttLuanInkLoading,
  CBaziNlttLuanProse,
} from "~/components/direction-c/CBaziNlttLuanRow";
import { BaziChapterEmpty } from "~/components/direction-c/BaziSectionHeading";
import { CT } from "~/lib/c-tokens";
import type { PhongThuyFactsView } from "~/lib/phong-thuy-facts-ui";
import { splitNlttLuanParagraphs } from "~/lib/nltt-luan-prose";

const PHI_COLOR = {
  good: CT.goldDeep,
  bad: CT.red,
  neutral: CT.muted,
} as const;

type CBaziPhongThuySectionProps = {
  facts: PhongThuyFactsView | null;
  huongLuan: string;
  mauLuan: string;
  phiTinhLuan: string;
  prose: string;
  proseLoading?: boolean;
  proseFailed?: boolean;
  instantProse?: boolean;
  emptyReason: string | null;
  onRetryLuan?: () => void;
};

function PhongThuyLuanBlock({
  luan,
  loading,
  loadingMessage,
  failed,
  onRetry,
}: {
  luan: string;
  loading: boolean;
  loadingMessage: string;
  failed: boolean;
  onRetry?: () => void;
}) {
  if (luan) {
    return (
      <div className="mt-3 space-y-2.5">
        {splitNlttLuanParagraphs(luan).map((para) => (
          <p
            key={para.slice(0, 48)}
            className="font-serif text-[12.5px] leading-relaxed"
            style={{ color: CT.ink2 }}
          >
            {para}
          </p>
        ))}
      </div>
    );
  }
  if (loading) {
    return (
      <div className="mt-3" role="status" aria-live="polite">
        <CBaziNlttLuanInkLoading message={loadingMessage} compact />
      </div>
    );
  }
  if (failed) {
    return (
      <div className="mt-3">
        <CBaziNlttLuanProse
          failed
          failedMessage="Mục này chưa luận được lần này — nhấn để thử lại."
          onRetry={onRetry}
          compact
        />
      </div>
    );
  }
  return null;
}

export function CBaziPhongThuySection({
  facts,
  huongLuan,
  mauLuan,
  phiTinhLuan,
  prose,
  proseLoading = false,
  proseFailed = false,
  instantProse = false,
  emptyReason,
  onRetryLuan,
}: CBaziPhongThuySectionProps) {
  const hasStructuredLuan = Boolean(huongLuan || mauLuan || phiTinhLuan);
  const legacyProse = !hasStructuredLuan ? prose.trim() : "";

  if (emptyReason && !facts && !legacyProse && !hasStructuredLuan && !proseLoading) {
    return (
      <div className="mt-3">
        <BaziChapterEmpty message={emptyReason} />
        {onRetryLuan ? (
          <button
            type="button"
            onClick={onRetryLuan}
            className="mt-3 cursor-pointer border bg-transparent px-3 py-1.5 font-[family-name:var(--display-2)] text-[10px] font-bold uppercase tracking-[0.06em]"
            style={{ borderColor: CT.goldDeep, color: CT.ink }}
          >
            Tải lại luận
          </button>
        ) : null}
      </div>
    );
  }

  const showHuong = (facts?.huongTot.length ?? 0) > 0;
  const showMau = (facts?.mauMay.length ?? 0) > 0;
  const showPhi = (facts?.phiTinh.length ?? 0) > 0;

  return (
    <div className="mt-3 space-y-4">
      {showHuong ? (
        <div>
          <Mono className="mb-1.5 text-[9px]" style={{ color: CT.muted }}>
            Hướng tốt cho bạn
          </Mono>
          <div className="grid grid-cols-2 gap-1.5">
            {facts!.huongTot.map((d) => (
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
          {facts!.huongXau.length > 0 ? (
            <p className="mt-2 font-serif text-[11.5px]" style={{ color: CT.muted }}>
              Tránh:{" "}
              <span style={{ color: CT.red, fontWeight: 600 }}>
                {facts!.huongXau.join(", ")}
              </span>
            </p>
          ) : null}
          <PhongThuyLuanBlock
            luan={huongLuan}
            loading={proseLoading && !huongLuan}
            loadingMessage="Đang luận hướng tốt"
            failed={proseFailed && !huongLuan}
            onRetry={onRetryLuan}
          />
        </div>
      ) : null}

      {showMau ? (
        <div>
          <Mono className="mb-2 text-[9px]" style={{ color: CT.muted }}>
            Màu sắc hợp
          </Mono>
          <div className="flex flex-wrap gap-2.5">
            {facts!.mauMay.map((c) => (
              <div key={c.name} className="w-[52px] shrink-0 text-center">
                <div
                  className="mx-auto size-10 border"
                  style={{ background: c.hex, borderColor: CT.hairline }}
                />
                <p
                  className="mt-1 font-serif text-[10px] leading-tight"
                  style={{ color: CT.ink2 }}
                >
                  {c.name}
                </p>
              </div>
            ))}
          </div>
          {facts!.mauKy.length > 0 ? (
            <p className="mt-2 font-serif text-[11.5px]" style={{ color: CT.muted }}>
              Tránh:{" "}
              <span style={{ color: CT.red, fontWeight: 600 }}>
                {facts!.mauKy.join(", ")}
              </span>
            </p>
          ) : null}
          <PhongThuyLuanBlock
            luan={mauLuan}
            loading={proseLoading && !mauLuan}
            loadingMessage="Đang luận màu sắc hợp"
            failed={proseFailed && !mauLuan}
            onRetry={onRetryLuan}
          />
        </div>
      ) : null}

      {showPhi ? (
        <div>
          <Mono className="mb-2 text-[9px]" style={{ color: CT.muted }}>
            Sao bay trong nhà
          </Mono>
          <div
            className="grid grid-cols-3 gap-0.5 border p-1"
            style={{ borderColor: CT.hairline, background: "#fff" }}
          >
            {facts!.phiTinh.map((cell) => (
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
          {facts!.phiTinhNote && !phiTinhLuan ? (
            <p
              className="mt-2 font-serif text-[11px] italic leading-relaxed"
              style={{ color: CT.muted }}
            >
              {facts!.phiTinhNote}
            </p>
          ) : null}
          <PhongThuyLuanBlock
            luan={phiTinhLuan}
            loading={proseLoading && !phiTinhLuan}
            loadingMessage="Đang luận sao bay trong nhà"
            failed={proseFailed && !phiTinhLuan}
            onRetry={onRetryLuan}
          />
        </div>
      ) : null}

      {legacyProse ? (
        <CBaziNlttLuanProse text={legacyProse} instant={instantProse} compact />
      ) : !hasStructuredLuan && proseLoading ? (
        <div role="status" aria-live="polite">
          <CBaziNlttLuanProse loading loadingMessage="Đang luận phong thủy năm" compact />
        </div>
      ) : !hasStructuredLuan && proseFailed ? (
        <CBaziNlttLuanProse
          failed
          failedMessage="Phong thủy chưa luận được lần này — nhấn để thử lại."
          onRetry={onRetryLuan}
          compact
        />
      ) : null}
      {!legacyProse &&
      !hasStructuredLuan &&
      !proseLoading &&
      !proseFailed &&
      !facts &&
      emptyReason ? (
        <BaziChapterEmpty message={emptyReason} />
      ) : null}
    </div>
  );
}
