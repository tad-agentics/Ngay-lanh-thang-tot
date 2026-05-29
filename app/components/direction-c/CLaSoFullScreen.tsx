import { Link } from "react-router";
import { useEffect, useState } from "react";

import { BackBar, Mono } from "~/components/brand";
import { useProfile } from "~/hooks/useProfile";
import { invokeBatTu } from "~/lib/bat-tu";
import { profileToBatTuPersonQuery } from "~/lib/bat-tu-birth";
import { CT, DISPLAY2 } from "~/lib/c-tokens";
import { normalizeLaSoPayload } from "~/lib/la-so-normalize";
import {
  buildLaSoFullPillarRows,
  buildLaSoNlttTeaser,
  extractLaSoChiTietEnrichment,
  extractMenhMoTa,
  laSoJsonToChiTiet,
  laSoJsonToRevealProps,
  mergeLaSoJsonForChiTietDisplay,
  profileHasLaso,
  thanColorsHintVi,
} from "~/lib/la-so-ui";
import type { LaSoJson } from "~/lib/api-types";

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

function birthLine(profile: {
  display_name: string | null;
  gioi_tinh: string | null;
  ngay_sinh: string | null;
  gio_sinh: string | null;
}): string {
  const parts: string[] = [];
  if (profile.display_name) parts.push(profile.display_name);
  if (profile.gioi_tinh === "nam") parts.push("Nam");
  if (profile.gioi_tinh === "nu") parts.push("Nữ");
  if (profile.ngay_sinh) parts.push(`sinh ${profile.ngay_sinh}`);
  if (profile.gio_sinh) parts.push(`giờ ${profile.gio_sinh}`);
  return parts.join(" · ");
}

export function CLaSoFullScreen() {
  const { profile, loading } = useProfile();
  const [displayLaSo, setDisplayLaSo] = useState<LaSoJson | null | undefined>(
    undefined,
  );

  useEffect(() => {
    if (loading || !profile || !profileHasLaso(profile.la_so)) {
      setDisplayLaSo(undefined);
      return;
    }
    const body = profileToBatTuPersonQuery(profile);
    if (!body.birth_date || body.birth_time == null) {
      setDisplayLaSo(profile.la_so as LaSoJson);
      return;
    }

    let cancelled = false;
    void invokeBatTu<unknown>({ op: "la-so", body }).then((res) => {
      if (cancelled) return;
      if (!res.ok) {
        setDisplayLaSo(profile.la_so as LaSoJson);
        return;
      }
      const liveNorm = normalizeLaSoPayload(res.data);
      const enrichment =
        liveNorm && typeof liveNorm === "object" && !Array.isArray(liveNorm)
          ? (liveNorm as Record<string, unknown>)
          : extractLaSoChiTietEnrichment(res.data);
      const merged = mergeLaSoJsonForChiTietDisplay(
        profile.la_so as LaSoJson,
        enrichment,
      );
      setDisplayLaSo(merged ?? (profile.la_so as LaSoJson));
    });

    return () => {
      cancelled = true;
    };
  }, [profile, loading]);

  const laSo =
    displayLaSo !== undefined ? displayLaSo : (profile?.la_so as LaSoJson | null);
  const hasLaso = profileHasLaso(laSo);
  const reveal = laSo ? laSoJsonToRevealProps(laSo) : null;
  const detail = laSoJsonToChiTiet(laSo as LaSoJson | null | undefined);
  const menhMoTa = laSo ? extractMenhMoTa(laSo) : null;
  const pillars = laSo ? buildLaSoFullPillarRows(laSo, profile) : [];
  const nlttTeaser =
    laSo && reveal ? buildLaSoNlttTeaser(laSo, reveal, detail) : "";
  const dungColors = reveal ? thanColorsHintVi(reveal.dungThan) : null;
  const kyColors = reveal ? thanColorsHintVi(reveal.kyThan) : null;

  if (loading) {
    return (
      <main className="min-h-[100svh]" style={{ background: CT.paper }}>
        <BackBar title="Lá số tứ trụ" />
        <p className="px-6 font-serif text-sm" style={{ color: CT.muted }}>
          Đang tải…
        </p>
      </main>
    );
  }

  if (!hasLaso || !reveal) {
    return (
      <main className="min-h-[100svh]" style={{ background: CT.paper }}>
        <BackBar title="Lá số tứ trụ" />
        <div className="px-6 py-8 text-center">
          <p className="font-serif text-sm" style={{ color: CT.ink2 }}>
            Chưa có dữ liệu lá số. Hoàn thành nhập giờ sinh để lập lá số Tứ Trụ riêng biệt của bạn.
          </p>
          <Link
            to="/gio-sinh"
            className="mt-4 inline-block py-3 px-6 font-[family-name:var(--display-2)] text-xs font-extrabold uppercase tracking-wider no-underline"
            style={{ ...DISPLAY2, background: CT.forest, color: CT.cream }}
          >
            Lập lá số Tứ Trụ →
          </Link>
        </div>
      </main>
    );
  }

  const nguEntries = (["moc", "hoa", "tho", "kim", "thuy"] as const).map((k) => ({
    key: k,
    label: NGU_HANH_LABEL[k] ?? k,
    v: Math.round(detail.nguHanh[k] ?? 0),
    color: NGU_HANH_BAR[k] ?? CT.muted,
  }));

  return (
    <main
      className="min-h-[100svh] flex flex-col"
      style={{ background: CT.paper, color: CT.ink }}
    >
      <BackBar title="Lá số tứ trụ" />

      <div className="flex-1 overflow-auto px-6 pb-8 pt-1">
        <p className="font-serif text-[12.5px] mt-1.5" style={{ color: CT.muted }}>
          {profile ? birthLine(profile) : ""}
        </p>

        <div className="mt-3.5">
          <Mono style={{ color: CT.goldDeep, fontSize: 9 }}>Mệnh</Mono>
          <h1
            className="mt-1.5 font-[family-name:var(--display)] text-[32px] font-extrabold uppercase leading-none"
            style={{ letterSpacing: "-0.015em" }}
          >
            {reveal.nhatChu}
            {reveal.hanh !== "—" ? ` ${reveal.hanh}` : ""} ·{" "}
            <span
              className="font-serif italic font-bold normal-case"
              style={{ color: CT.goldDeep }}
            >
              {reveal.menh}
            </span>
          </h1>
          {menhMoTa ? (
            <p
              className="mt-2 font-serif text-[13px] italic leading-relaxed"
              style={{ color: CT.ink2 }}
            >
              &ldquo;{menhMoTa}&rdquo;
            </p>
          ) : null}
        </div>

        <div className="mt-6">
          <Mono style={{ color: CT.muted, fontSize: 9, marginBottom: 8 }}>Bốn trụ</Mono>
          <div className="grid grid-cols-4 gap-1">
            {pillars.map((p) => (
              <div
                key={p.label}
                className="text-center py-2.5 px-1"
                style={{
                  background: p.isDayMaster
                    ? "rgba(154,124,34,0.1)"
                    : "transparent",
                  border: `1px solid ${p.isDayMaster ? CT.goldDeep : CT.hairline2}`,
                }}
              >
                <Mono style={{ color: CT.muted, fontSize: 10 }}>{p.label}</Mono>
                <div
                  className="mt-1.5 font-[family-name:var(--display-2)] text-[13px] font-extrabold uppercase"
                  style={{
                    color: p.isDayMaster ? CT.goldDeep : CT.ink,
                    letterSpacing: "-0.005em",
                    ...DISPLAY2,
                  }}
                >
                  {p.canChi}
                </div>
                {p.hanh !== "—" ? (
                  <Mono
                    style={{
                      color: CT.muted,
                      fontSize: 10,
                      marginTop: 6,
                      display: "block",
                    }}
                  >
                    {p.hanh}
                  </Mono>
                ) : null}
                <Mono
                  style={{
                    color: CT.muted,
                    fontSize: 9,
                    marginTop: 4,
                    display: "block",
                    lineHeight: 1.3,
                  }}
                >
                  {p.subline}
                </Mono>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <Mono style={{ color: CT.muted, fontSize: 9, marginBottom: 10 }}>
            Ngũ hành · sức mạnh trong lá số
          </Mono>
          <div className="flex items-end gap-2 h-[70px]">
            {nguEntries.map((row) => (
              <div
                key={row.key}
                className="flex-1 flex flex-col items-center h-full justify-end"
              >
                <div
                  className="font-mono text-[10px] font-semibold mb-0.5"
                  style={{ color: CT.ink }}
                >
                  {row.v}%
                </div>
                <div
                  style={{
                    width: "70%",
                    height: `${Math.max(8, row.v * 2.4)}%`,
                    background: row.color,
                    opacity: 0.85,
                  }}
                />
                <Mono style={{ color: CT.ink2, marginTop: 4, fontSize: 9 }}>
                  {row.label}
                </Mono>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <div
            className="p-3"
            style={{
              background: "rgba(122,154,128,0.1)",
              border: "1px solid rgba(122,154,128,0.3)",
            }}
          >
            <Mono style={{ color: "#5e7d5e", fontSize: 9 }}>Dụng thần</Mono>
            <div
              className="mt-1 font-[family-name:var(--display-2)] text-base font-bold"
              style={DISPLAY2}
            >
              {reveal.dungThan}
            </div>
            {dungColors ? (
              <div
                className="mt-0.5 font-serif text-[11.5px] leading-snug"
                style={{ color: CT.ink2 }}
              >
                {dungColors}
              </div>
            ) : null}
          </div>
          <div
            className="p-3"
            style={{
              background: "rgba(163,32,31,0.06)",
              border: "1px solid rgba(163,32,31,0.25)",
            }}
          >
            <Mono style={{ color: CT.red, fontSize: 9 }}>Kỵ thần</Mono>
            <div
              className="mt-1 font-[family-name:var(--display-2)] text-base font-bold"
              style={DISPLAY2}
            >
              {reveal.kyThan}
            </div>
            {kyColors ? (
              <div
                className="mt-0.5 font-serif text-[11.5px] leading-snug"
                style={{ color: CT.ink2 }}
              >
                {kyColors}
              </div>
            ) : null}
          </div>
        </div>

        {detail.daiVanList.length > 0 ? (
          <div className="mt-5">
            <Mono style={{ color: CT.muted, fontSize: 9, marginBottom: 8 }}>
              Đại vận
            </Mono>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {detail.daiVanList.map((row) => (
                <div
                  key={`${row.label}-${row.years}`}
                  className="min-w-[72px] shrink-0 px-2 py-2 text-center"
                  style={{
                    background: row.isActive
                      ? "rgba(154,124,34,0.1)"
                      : "transparent",
                    border: `1px solid ${row.isActive ? CT.goldDeep : CT.hairline2}`,
                  }}
                >
                  <div
                    className="font-[family-name:var(--display-2)] text-[11px] font-bold uppercase tracking-[-0.005em]"
                    style={{
                      color: row.isActive ? CT.goldDeep : CT.ink,
                      ...DISPLAY2,
                    }}
                  >
                    {row.label}
                  </div>
                  {row.years !== "—" ? (
                    <Mono
                      style={{
                        color: CT.muted,
                        fontSize: 9,
                        marginTop: 4,
                        display: "block",
                      }}
                    >
                      {row.years}
                    </Mono>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div
          className="mt-6 p-3.5"
          style={{
            background: "rgba(154,124,34,0.06)",
            borderLeft: `2px solid ${CT.goldDeep}`,
          }}
        >
          <Mono style={{ color: CT.goldDeep, fontSize: 9 }}>Tóm tắt bản mệnh</Mono>
          <p
            className="mt-1.5 font-serif italic text-[13px] leading-relaxed"
            style={{ color: CT.ink }}
          >
            &ldquo;{nlttTeaser}&rdquo;
          </p>
          <Link
            to="/toi/luan-bat-tu"
            className="mt-3.5 inline-block w-full py-2.5 text-center font-[family-name:var(--display-2)] text-xs font-extrabold uppercase tracking-wider no-underline"
            style={{ ...DISPLAY2, background: CT.forest, color: CT.cream }}
          >
            Đọc luận giải Bát Tự đầy đủ →
          </Link>
        </div>
      </div>
    </main>
  );
}
