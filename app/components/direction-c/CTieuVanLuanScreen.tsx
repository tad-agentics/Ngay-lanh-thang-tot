import { useEffect, useState } from "react";
import { toast } from "sonner";

import { CTieuVanLockedScreen } from "~/components/direction-c/CTieuVanLockedScreen";
import { BackBar, Mono } from "~/components/brand";
import { useProfile } from "~/hooks/useProfile";
import { profileToBatTuPersonQuery } from "~/lib/bat-tu-birth";
import { invokeBatTu } from "~/lib/bat-tu";
import { CT, DISPLAY } from "~/lib/c-tokens";
import { canUseTieuVanReading } from "~/lib/entitlements";
import { invokeGenerateReading } from "~/lib/generate-reading";
import { laSoJsonToRevealProps, profileHasLaso } from "~/lib/la-so-ui";
import {
  mapTieuVanPayload,
  tieuVanTongQuanDisplayOrNull,
  type TieuVanUi,
} from "~/lib/tieu-van-ui";

type CTieuVanLuanScreenProps = {
  year: number;
};

type ReadingSection = {
  id: string;
  title: string;
  text: string;
};

function birthLine(profile: {
  display_name: string | null;
  ngay_sinh: string | null;
  gio_sinh: string | null;
}): string {
  const parts: string[] = [];
  if (profile.display_name) parts.push(profile.display_name);
  if (profile.ngay_sinh) parts.push(`sinh ${profile.ngay_sinh}`);
  if (profile.gio_sinh) parts.push(`giờ ${profile.gio_sinh}`);
  return parts.join(" · ");
}

function buildTieuVanSections(ui: TieuVanUi, reading: string | null): ReadingSection[] {
  const sections: ReadingSection[] = [];
  const tongQuan =
    reading?.trim() ||
    tieuVanTongQuanDisplayOrNull(ui.elementRelationCode, ui.tongQuan) ||
    ui.tongQuan;
  if (tongQuan?.trim()) {
    sections.push({ id: "tong_quan", title: "Tổng quan", text: tongQuan.trim() });
  }
  if (ui.canLuu.trim() && ui.canLuu !== "—") {
    sections.push({ id: "can_luu", title: "Cần lưu ý", text: ui.canLuu.trim() });
  }
  if (ui.elementRelationLabel?.trim()) {
    sections.push({
      id: "element_relation",
      title: "Ngũ hành tháng",
      text: ui.elementRelationLabel.trim(),
    });
  }
  if (ui.pillarHint.trim() && ui.pillarHint !== "—") {
    const pillarParts = [ui.pillarHint.trim()];
    if (ui.thapThanOfMonth?.trim()) {
      pillarParts.push(`Thập thần tháng: ${ui.thapThanOfMonth.trim()}`);
    }
    sections.push({
      id: "pillar",
      title: "Trụ tháng",
      text: pillarParts.join(". "),
    });
  }
  for (const row of ui.linhVuc) {
    if (!row.title.trim() || !row.body.trim()) continue;
    sections.push({
      id: `linh_vuc_${row.title}`,
      title: row.title.trim(),
      text: row.body.trim(),
    });
  }
  return sections;
}

export function CTieuVanLuanScreen({ year }: CTieuVanLuanScreenProps) {
  const { profile, loading: profileLoading } = useProfile();
  const [ui, setUi] = useState<TieuVanUi | null>(null);
  const [reading, setReading] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const unlocked = canUseTieuVanReading(profile);
  const reveal = profile?.la_so ? laSoJsonToRevealProps(profile.la_so) : null;
  const month = `${year}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

  useEffect(() => {
    if (profileLoading || !profile) return;
    if (!unlocked || !profileHasLaso(profile.la_so)) {
      setLoading(false);
      return;
    }
    const body = profileToBatTuPersonQuery(profile);
    if (!body.birth_date) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      const res = await invokeBatTu<unknown>({
        op: "tieu-van",
        body: { ...body, month },
      });
      if (cancelled) return;
      if (!res.ok) {
        setLoading(false);
        toast.error(res.message ?? "Không tải tiểu vận.");
        return;
      }
      const mapped = mapTieuVanPayload(res.data);
      const gen = await invokeGenerateReading({
        endpoint: "tieu-van",
        data: res.data,
      });
      if (cancelled) return;
      setUi(mapped);
      setReading(gen.reading?.trim() || null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [profile, profileLoading, unlocked, month]);

  if (profileLoading) {
    return (
      <main className="min-h-full px-6 py-10 font-serif" style={{ background: CT.paper, color: CT.muted }}>
        Đang tải…
      </main>
    );
  }

  if (!unlocked) {
    return <CTieuVanLockedScreen year={year} />;
  }

  const sections = ui ? buildTieuVanSections(ui, reading) : [];

  return (
    <main
      className="flex min-h-full flex-col"
      style={{ background: CT.paper, color: CT.ink, fontFamily: "var(--serif)" }}
    >
      <BackBar
        title={`Luận giải Tiểu Vận · ${year}`}
        endAdornment={<Mono style={{ color: CT.muted, fontSize: 9 }}>AI · có nguồn</Mono>}
      />

      <div className="flex-1 overflow-auto px-6 pb-12 pt-1">
        <div
          className="mt-2 py-2.5 px-3.5"
          style={{
            background: "rgba(122,154,128,0.12)",
            borderLeft: `2px solid ${CT.greenMute}`,
          }}
        >
          <p className="font-serif text-xs leading-snug" style={{ color: CT.ink2 }}>
            <strong style={{ color: CT.ink }}>Đã mở</strong> · vận tháng theo lá số của bạn
          </p>
        </div>

        {profile ? (
          <p className="mt-4 font-serif text-[12.5px]" style={{ color: CT.muted }}>
            {birthLine(profile)}
          </p>
        ) : null}

        {reveal ? (
          <div className="mt-3">
            <h2
              className="text-[26px] font-extrabold uppercase leading-none"
              style={{ ...DISPLAY, letterSpacing: "-0.015em" }}
            >
              {reveal.nhatChu}
              {reveal.hanh !== "—" ? ` ${reveal.hanh}` : ""}
              {reveal.menh !== "—" ? (
                <>
                  {" "}
                  ·{" "}
                  <span
                    className="font-serif italic font-bold normal-case"
                    style={{ color: CT.goldDeep }}
                  >
                    {reveal.menh}
                  </span>
                </>
              ) : null}
            </h2>
          </div>
        ) : null}

        {loading ? (
          <p className="mt-8 text-sm" style={{ color: CT.muted }}>
            Đang soạn luận giải…
          </p>
        ) : sections.length === 0 ? (
          <p className="mt-8 text-sm" style={{ color: CT.muted }}>
            Chưa có luận giải cho tháng này.
          </p>
        ) : (
          sections.map((s, i) => (
            <section key={s.id} className="mt-6">
              <div
                className="flex items-baseline gap-2.5 pb-1.5"
                style={{ borderBottom: `1px solid ${CT.ink}` }}
              >
                <span
                  className="font-mono text-[11px]"
                  style={{ color: CT.goldDeep, letterSpacing: "0.18em" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className="text-lg font-extrabold uppercase tracking-tight"
                  style={DISPLAY}
                >
                  {s.title}
                </span>
              </div>
              <p
                className="mt-3 text-[13.5px] leading-relaxed whitespace-pre-wrap"
                style={{ color: CT.ink2 }}
              >
                {s.text}
              </p>
            </section>
          ))
        )}
      </div>
    </main>
  );
}
