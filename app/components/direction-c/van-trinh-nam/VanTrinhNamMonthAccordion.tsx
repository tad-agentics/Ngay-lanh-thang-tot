import { CBaziLuanSubsectionWithState } from "~/components/direction-c/CBaziLuanSubsection";
import {
  CBaziNlttLuanInkLoading,
  CBaziNlttLuanProse,
} from "~/components/direction-c/CBaziNlttLuanRow";
import { Mono } from "~/components/brand";
import { VanTrinhNamB3Calendar } from "~/components/direction-c/van-trinh-nam/VanTrinhNamB3Calendar";
import { CT } from "~/lib/c-tokens";
import {
  proseForMonth,
  type VanTrinhNamDisplayBlock,
} from "~/lib/van-trinh-nam-outline";
import {
  emphasisSignalLabel,
  monthArchetypeLabel,
} from "~/lib/van-trinh-nam-signals";

export function VanTrinhNamMonthAccordion({
  block,
  year,
  instantProse,
  onRetryLuan,
}: {
  block: Extract<VanTrinhNamDisplayBlock, { kind: "month" }>;
  year: number;
  instantProse?: boolean;
  onRetryLuan?: () => void;
}) {
  const { month, sections, chapterLoad } = block;
  const n = month.month_num;
  const loadKey = `month_${n}` as const;
  const loading = chapterLoad[loadKey] === "loading";
  const failed = chapterLoad[loadKey] === "failed";
  const theme = proseForMonth(sections, n, "theme");
  const emphasis = proseForMonth(sections, n, "emphasis");
  const actions = proseForMonth(sections, n, "actions");
  const arch = monthArchetypeLabel(month.b1_month_theme.month_archetype);

  return (
    <details
      id={`thang-${n}`}
      className="mt-4 border px-3 py-2"
      style={{ borderColor: CT.hairline, background: "#fff" }}
      open={n <= 2}
    >
      <summary className="cursor-pointer list-none font-[family-name:var(--display-2)] text-sm font-bold uppercase tracking-tight">
        <span style={{ color: CT.ink }}>{month.title_vi}</span>
        <span className="ml-2 font-serif text-[11px] font-normal normal-case" style={{ color: CT.muted }}>
          {month.b1_month_theme.luu_nguyet_display}
          {arch ? ` · ${arch}` : ""}
        </span>
      </summary>
      <div className="mt-2 pb-2">
        <Mono className="text-[9px]" style={{ color: CT.muted }}>
          {month.solar_range}
        </Mono>

        {theme ? (
          <CBaziNlttLuanProse text={theme} instant={instantProse} compact />
        ) : loading ? (
          <CBaziNlttLuanInkLoading message={`Đang luận tháng ${n}`} compact />
        ) : null}

        {month.b2_month_emphasis.length > 0 ? (
          <div className="mt-2 space-y-1">
            {month.b2_month_emphasis.map((em) => (
              <p
                key={em.aspect_id}
                className="font-serif text-[12px]"
                style={{ color: CT.ink2 }}
              >
                <strong>{em.label_vi}</strong>
                {emphasisSignalLabel(em.emphasis_signal)
                  ? ` — ${emphasisSignalLabel(em.emphasis_signal)}`
                  : ""}
              </p>
            ))}
            {emphasis ? (
              <CBaziNlttLuanProse text={emphasis} instant={instantProse} compact />
            ) : loading ? (
              <CBaziNlttLuanInkLoading message="Đang luận mảng nổi bật" compact />
            ) : failed ? (
              <CBaziNlttLuanProse
                failed
                failedMessage="Chưa luận được mảng tháng — thử Tải lại."
                onRetry={onRetryLuan}
                compact
              />
            ) : null}
          </div>
        ) : null}

        <VanTrinhNamB3Calendar month={month} year={year} />

        {actions ? (
          <div className="mt-3">
            <Mono className="text-[9px]" style={{ color: CT.goldDeep }}>
              Nên / Tránh
            </Mono>
            <CBaziNlttLuanProse text={actions} instant={instantProse} compact />
          </div>
        ) : loading ? (
          <CBaziNlttLuanInkLoading message="Đang luận hành động tháng" compact />
        ) : null}
      </div>
    </details>
  );
}
