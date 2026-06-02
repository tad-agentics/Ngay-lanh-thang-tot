import { useCallback, useEffect, useState } from "react";
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
import { formatProfileBirthSubline } from "~/lib/profile-birth-line";
import {
  LUAN_LUU_NIEN_NGUYET_TITLE,
  LUAN_LUU_NIEN_NGUYET_TITLE_SHORT,
} from "~/lib/luan-luu-nien-nguyet-labels";
import {
  mapTieuVanPayload,
  tieuVanSectionsFromGenerateReading,
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

function buildTieuVanFactSections(ui: TieuVanUi): ReadingSection[] {
  const sections: ReadingSection[] = [];
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
  const [aiSections, setAiSections] = useState<ReadingSection[]>([]);
  const [luanFailed, setLuanFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [retryKey, setRetryKey] = useState(0);
  const unlocked = canUseTieuVanReading(profile);
  const reveal = profile?.la_so ? laSoJsonToRevealProps(profile.la_so) : null;
  const month = `${year}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

  const loadTieuVan = useCallback(async () => {
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

    setLoading(true);
    setLuanFailed(false);

    const res = await invokeBatTu<unknown>({
      op: "tieu-van",
      body: { ...body, month },
    });
    if (!res.ok) {
      setLoading(false);
      toast.error(res.message ?? `Không tải ${LUAN_LUU_NIEN_NGUYET_TITLE_SHORT}.`);
      return;
    }

    const mapped = mapTieuVanPayload(res.data);
    setUi(mapped);

    const gen = await invokeGenerateReading({
      endpoint: "tieu-van",
      data: res.data,
    });
    const fromAi = tieuVanSectionsFromGenerateReading(
      gen.sections,
      gen.reading,
    );
    setAiSections(fromAi);

    if (gen.transportError) {
      setLuanFailed(true);
      if (fromAi.length === 0) {
        toast.error(
          gen.transportError === "gateway_timeout"
            ? "Luận giải mất quá lâu — thử tải lại."
            : "Không tạo luận giải được — thử tải lại.",
        );
      }
    } else if (fromAi.length === 0) {
      setLuanFailed(true);
      toast.error("Chưa tạo được luận giải — thử tải lại.");
    }

    setLoading(false);
  }, [profile, profileLoading, unlocked, month]);

  useEffect(() => {
    void loadTieuVan();
  }, [loadTieuVan, retryKey]);

  if (profileLoading) {
    return (
      <main className="min-h-full px-6 py-10 font-serif" style={{ background: CT.paper, color: CT.muted }}>
        Đang đối chiếu lá số lưu niên & lưu nguyệt…
      </main>
    );
  }

  if (!unlocked) {
    return <CTieuVanLockedScreen year={year} />;
  }

  const factSections = ui ? buildTieuVanFactSections(ui) : [];
  const aiIds = new Set(aiSections.map((s) => s.id));
  const factSupplement = factSections.filter((s) => !aiIds.has(s.id));
  const sections =
    aiSections.length > 0 ? [...aiSections, ...factSupplement] : factSections;

  return (
    <main
      className="flex min-h-full flex-col"
      style={{ background: CT.paper, color: CT.ink, fontFamily: "var(--serif)" }}
    >
      <BackBar
        title={`${LUAN_LUU_NIEN_NGUYET_TITLE} · ${year}`}
        endAdornment={<Mono style={{ color: CT.muted, fontSize: 9.5 }}>Học thuật cổ thư</Mono>}
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
            <strong style={{ color: CT.ink }}>Đã mở</strong> · lưu niên & lưu nguyệt theo lá số của bạn
          </p>
        </div>

        {profile ? (
          <p className="mt-4 font-serif text-[13px]" style={{ color: CT.muted }}>
            {formatProfileBirthSubline(profile)}
          </p>
        ) : null}

        {reveal ? (
          <div className="mt-3">
            <h2
              className="text-[26.5px] font-extrabold uppercase leading-none"
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

        {luanFailed && !loading ? (
          <div
            className="mt-6 rounded-sm border px-3.5 py-3"
            style={{
              borderColor: "rgba(180,120,80,0.35)",
              background: "rgba(180,120,80,0.08)",
            }}
          >
            <p className="text-sm leading-relaxed" style={{ color: CT.ink2 }}>
              Luận giải AI chưa tải xong
              {aiSections.length === 0
                ? " — bạn vẫn xem được dữ liệu lưu niên & lưu nguyệt cơ bản bên dưới."
                : " — một phần nội dung có thể thiếu."}
            </p>
            <button
              type="button"
              className="mt-3 font-mono text-[11px] uppercase tracking-widest underline underline-offset-2"
              style={{ color: CT.goldDeep }}
              onClick={() => setRetryKey((k) => k + 1)}
            >
              Tải lại luận giải
            </button>
          </div>
        ) : null}

        {loading ? (
          <p className="mt-8 text-sm" style={{ color: CT.muted }}>
            Đang luận lưu niên & lưu nguyệt…
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
                  className="font-mono text-[11.5px]"
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
                className="mt-3 text-[14px] leading-relaxed whitespace-pre-wrap"
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
