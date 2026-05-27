import { Link } from "react-router";

import { BackBar, Mono } from "~/components/brand";
import { useProfile } from "~/hooks/useProfile";
import { CT } from "~/lib/c-tokens";
import {
  laSoJsonToChiTiet,
  laSoJsonToRevealProps,
  profileHasLaso,
} from "~/lib/la-so-ui";
import type { LaSoJson } from "~/lib/api-types";
import { canUseBaziReading } from "~/lib/entitlements";

const PILLAR_LABELS = ["Niên", "Nguyệt", "Nhật", "Thời"] as const;
const PILLAR_IDX = [3, 2, 1, 0] as const;

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
  const hasLaso = profileHasLaso(profile?.la_so);
  const reveal = profile?.la_so ? laSoJsonToRevealProps(profile.la_so) : null;
  const detail = laSoJsonToChiTiet(profile?.la_so as LaSoJson | null | undefined);
  const baziUnlocked = canUseBaziReading(profile);

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
            Chưa có lá số. Hoàn thành lập lịch để xem tứ trụ.
          </p>
          <Link
            to="/gio-sinh"
            className="mt-4 inline-block py-3 px-6 font-display text-xs font-extrabold uppercase tracking-wider"
            style={{ background: CT.forest, color: CT.cream }}
          >
            Lập lịch →
          </Link>
        </div>
      </main>
    );
  }

  const pillars = PILLAR_IDX.map((idx, i) => {
    const can = detail.thienCan[idx] ?? "—";
    const chi = detail.diaChi[idx] ?? "—";
    const vn = can !== "—" && chi !== "—" ? `${can} ${chi}` : can;
    return {
      l: PILLAR_LABELS[i]!,
      vn,
      ng: reveal.hanh || "—",
      hide: i === 2,
    };
  });

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
            className="mt-1.5 font-display text-[32px] font-extrabold uppercase leading-none"
            style={{ letterSpacing: "-0.015em" }}
          >
            {reveal.nhatChu} ·{" "}
            <span
              className="font-serif italic font-bold normal-case"
              style={{ color: CT.goldDeep }}
            >
              {reveal.menh}
            </span>
          </h1>
          {reveal.daiVan !== "—" ? (
            <p className="mt-2 font-serif text-[13px] leading-relaxed" style={{ color: CT.ink2 }}>
              Đại vận hiện tại: <strong style={{ color: CT.ink }}>{reveal.daiVan}</strong>
            </p>
          ) : null}
        </div>

        <div className="mt-6">
          <Mono style={{ color: CT.muted, fontSize: 9, marginBottom: 8 }}>Bốn trụ</Mono>
          <div className="grid grid-cols-4 gap-1">
            {pillars.map((p) => (
              <div
                key={p.l}
                className="text-center py-2.5 px-1"
                style={{
                  background: p.hide ? "rgba(154,124,34,0.1)" : "transparent",
                  border: `1px solid ${p.hide ? CT.goldDeep : CT.hairline2}`,
                }}
              >
                <Mono style={{ color: CT.muted, fontSize: 8 }}>{p.l}</Mono>
                <div
                  className="mt-1.5 font-display text-[13px] font-extrabold uppercase"
                  style={{ color: p.hide ? CT.goldDeep : CT.ink, letterSpacing: "-0.005em" }}
                >
                  {p.vn}
                </div>
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
                <div className="font-mono text-[10px] font-semibold mb-0.5" style={{ color: CT.ink }}>
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
                <Mono style={{ color: CT.ink2, marginTop: 4, fontSize: 9 }}>{row.label}</Mono>
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
            <div className="mt-1 font-display text-base font-bold">{reveal.dungThan}</div>
          </div>
          <div
            className="p-3"
            style={{
              background: "rgba(163,32,31,0.06)",
              border: "1px solid rgba(163,32,31,0.25)",
            }}
          >
            <Mono style={{ color: CT.red, fontSize: 9 }}>Kỵ thần</Mono>
            <div className="mt-1 font-display text-base font-bold">{reveal.kyThan}</div>
          </div>
        </div>

        <div
          className="mt-6 p-3.5"
          style={{
            background: "rgba(154,124,34,0.06)",
            borderLeft: `2px solid ${CT.goldDeep}`,
          }}
        >
          <Mono style={{ color: CT.goldDeep, fontSize: 9 }}>NLTT luận</Mono>
          <p
            className="mt-1.5 font-serif italic text-[13px] leading-relaxed"
            style={{ color: CT.ink }}
          >
            Lá số của bạn đã sẵn sàng — đọc luận giải Bát tự đầy đủ để hiểu tính cách, vận năm
            và gợi ý thực tế.
          </p>
          {baziUnlocked ? (
            <Link
              to="/toi/luan-bat-tu"
              className="mt-3.5 inline-block w-full py-2.5 text-center font-display text-xs font-extrabold uppercase tracking-wider no-underline"
              style={{ background: CT.forest, color: CT.cream }}
            >
              Đọc luận giải Bát tự đầy đủ →
            </Link>
          ) : (
            <Link
              to="/dat-lich"
              className="mt-3.5 inline-block w-full py-2.5 text-center font-display text-xs font-extrabold uppercase tracking-wider no-underline"
              style={{ background: CT.forest, color: CT.cream }}
            >
              Mở luận giải · xem gói →
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
