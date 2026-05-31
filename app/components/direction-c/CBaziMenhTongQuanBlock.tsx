import { Mono } from "~/components/brand";
import { CBaziNlttLuanProse } from "~/components/direction-c/CBaziNlttLuanRow";
import { BaziChapterEmpty } from "~/components/direction-c/BaziSectionHeading";
import type { LaSoJson } from "~/lib/api-types";
import { CT, DISPLAY, DISPLAY2 } from "~/lib/c-tokens";
import {
  buildLaSoFullPillarRows,
  extractMenhTagline,
  laSoJsonToChiTiet,
  laSoJsonToRevealProps,
} from "~/lib/la-so-ui";
import type { Profile } from "~/lib/profile-context";

const NGU_HANH_BAR: Record<string, string> = {
  kim: "#c8c5a0",
  moc: CT.greenMute,
  thuy: CT.forest,
  hoa: "#c5402a",
  tho: CT.goldDeep,
};

const NGU_HANH_LABEL: Record<string, string> = {
  kim: "Kim",
  moc: "Mộc",
  thuy: "Thủy",
  hoa: "Hỏa",
  tho: "Thổ",
};

type CBaziMenhTongQuanBlockProps = {
  profile: Profile;
  laSo?: LaSoJson | null;
  /** Gemini `menh_tong_quan` — tổng quan lá số (§01). */
  prose?: string | null;
  /** Show below §01 `h2` while luận giải is generating. */
  proseLoading?: boolean;
  /** Lá số có nhưng luận preview/full trống. */
  proseFailed?: boolean;
  instantProse?: boolean;
  emptyReason?: string | null;
  onRetryProse?: () => void;
};

/** §01 Mệnh tổng quan — facts lá số (Direction C màn 18). */
export function CBaziMenhTongQuanBlock({
  profile,
  laSo: laSoProp,
  prose,
  proseLoading = false,
  proseFailed = false,
  instantProse = false,
  emptyReason,
  onRetryProse,
}: CBaziMenhTongQuanBlockProps) {
  const laSo = laSoProp ?? (profile.la_so as LaSoJson | null);
  const reveal = laSo ? laSoJsonToRevealProps(laSo) : null;
  const detail = laSoJsonToChiTiet(laSo);
  const pillars = laSo ? buildLaSoFullPillarRows(laSo, profile) : [];
  const tagline = laSo ? extractMenhTagline(laSo) : null;

  const nguEntries = (["moc", "hoa", "tho", "kim", "thuy"] as const).map((k) => ({
    key: k,
    label: NGU_HANH_LABEL[k] ?? k,
    v: Math.round(detail.nguHanh[k] ?? 0),
    color: NGU_HANH_BAR[k] ?? CT.muted,
  }));

  if (!reveal) {
    return emptyReason ? (
      <BaziChapterEmpty message={emptyReason} />
    ) : (
      <p className="mt-3 font-serif text-sm" style={{ color: CT.muted }}>
        Chưa có lá số trên hồ sơ.
      </p>
    );
  }

  return (
    <>
      <h2
        className="mt-3 text-[26.5px] font-extrabold uppercase leading-none tracking-[-0.015em]"
        style={{ ...DISPLAY, color: CT.ink }}
      >
        {reveal.nhatChu}
        {reveal.hanh !== "—" ? ` ${reveal.hanh}` : ""}
        {reveal.menh !== "—" ? (
          <>
            {" "}
            <span
              className="font-serif text-[26.5px] font-bold italic normal-case tracking-normal"
              style={{ color: CT.goldDeep }}
            >
              {reveal.menh}
            </span>
          </>
        ) : null}
      </h2>

      <CBaziNlttLuanProse
        text={prose}
        loading={proseLoading}
        instant={instantProse}
        loadingMessage="Đang luận tổng quan lá số…"
        failed={proseFailed || Boolean(emptyReason && !prose?.trim() && !proseLoading)}
        failedMessage={
          emptyReason ??
          "Chưa tải được luận tổng quan lá số. Thử lại sau vài giây."
        }
        onRetry={onRetryProse}
        className="mt-2"
        compact
      />
      {!proseLoading &&
      !prose?.trim() &&
      !proseFailed &&
      !emptyReason &&
      tagline ? (
        <p
          className="mt-2 font-serif text-[13.5px] italic leading-relaxed"
          style={{ color: CT.ink2 }}
        >
          {tagline}
        </p>
      ) : null}

      {pillars.length > 0 ? (
        <div className="mt-3.5 grid grid-cols-4 gap-1">
          {pillars.map((p) => (
            <div
              key={p.label}
              className="px-1 py-2 text-center"
              style={{
                background: p.isDayMaster ? "rgba(154,124,34,0.08)" : "transparent",
                border: `1px solid ${p.isDayMaster ? CT.goldDeep : CT.hairline2}`,
              }}
            >
              <div className="font-serif text-[9.5px]" style={{ color: CT.muted }}>
                {p.label}
              </div>
              <div
                className="mt-1 font-[family-name:var(--display-2)] text-xs font-bold tracking-tight"
                style={{ color: p.isDayMaster ? CT.goldDeep : CT.ink }}
              >
                {p.canChi}
              </div>
              {p.hanh !== "—" ? (
                <Mono
                  className="mt-0.5 text-[8px] tracking-wide"
                  style={{ color: CT.muted }}
                >
                  {p.hanh}
                </Mono>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {nguEntries.some((r) => r.v > 0) ? (
        <div className="mt-4">
          <Mono className="mb-2 text-[9.5px]" style={{ color: CT.muted }}>
            Ngũ hành trong lá số
          </Mono>
          <div className="flex h-[56px] items-end gap-1.5">
            {nguEntries.map((row) => (
              <div
                key={row.key}
                className="flex h-full flex-1 flex-col items-center justify-end"
              >
                <div
                  className="mb-0.5 font-mono text-[10px] font-semibold"
                  style={{ color: CT.ink }}
                >
                  {row.v}%
                </div>
                <div
                  style={{
                    width: "70%",
                    height: `${Math.max(8, row.v * 2)}%`,
                    background: row.color,
                    opacity: 0.85,
                  }}
                />
                <Mono className="mt-1 text-[9px]" style={{ color: CT.ink2 }}>
                  {row.label}
                </Mono>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {(reveal.dungThan !== "—" || reveal.kyThan !== "—") && (
        <div className="mt-3.5 grid grid-cols-2 gap-2">
          {reveal.dungThan !== "—" ? (
            <div
              className="px-3 py-2.5"
              style={{
                background: "rgba(122,154,128,0.08)",
                borderLeft: `2px solid ${CT.greenMute}`,
              }}
            >
              <Mono className="text-[9px]" style={{ color: CT.greenMute }}>
                Dụng thần
              </Mono>
              <div
                className="mt-0.5 font-[family-name:var(--display-2)] text-sm font-bold"
                style={{ color: CT.ink }}
              >
                {reveal.dungThan}
              </div>
            </div>
          ) : null}
          {reveal.kyThan !== "—" ? (
            <div
              className="px-3 py-2.5"
              style={{
                background: "rgba(163,32,31,0.05)",
                borderLeft: `2px solid ${CT.red}`,
              }}
            >
              <Mono className="text-[9px]" style={{ color: CT.red }}>
                Kỵ thần
              </Mono>
              <div
                className="mt-0.5 font-[family-name:var(--display-2)] text-sm font-bold"
                style={{ color: CT.ink }}
              >
                {reveal.kyThan}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {detail.daiVanList.length > 0 ? (
        <div className="mt-4">
          <Mono className="mb-2 text-[9.5px]" style={{ color: CT.muted }}>
            Đại vận
          </Mono>
          <div className="space-y-1">
            {detail.daiVanList.slice(0, 4).map((dv) => (
              <div
                key={dv.label + dv.years}
                className="flex items-baseline justify-between gap-2 border-b py-1.5"
                style={{
                  borderColor: CT.hairline2,
                  background: dv.isActive ? "rgba(154,124,34,0.06)" : undefined,
                }}
              >
                <span
                  className="font-[family-name:var(--display-2)] text-xs font-bold uppercase"
                  style={{
                    color: dv.isActive ? CT.goldDeep : CT.ink,
                    ...DISPLAY2,
                  }}
                >
                  {dv.label}
                </span>
                <Mono className="text-[9px]" style={{ color: CT.muted }}>
                  {dv.years}
                </Mono>
              </div>
            ))}
          </div>
        </div>
      ) : null}

    </>
  );
}
