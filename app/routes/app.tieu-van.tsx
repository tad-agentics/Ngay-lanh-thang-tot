/**
 * Tiểu Vận — monthly personal forecast, forest-default (dark).
 * Split from app.van-thang.tsx per wave4-tieu-van.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link } from "react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

import { AiReadingBlock } from "~/components/AiReadingBlock";
import { CreditsHeaderChip } from "~/components/CreditsHeaderChip";
import { BackBar, Kanji, Mono } from "~/components/brand";
import { Button } from "~/components/ui/button";
import { useProfile } from "~/hooks/useProfile";
import { useFeatureCosts } from "~/hooks/useFeatureCosts";
import {
  profileToBatTuPersonQuery,
  tieVanUnlockIdentityKey,
} from "~/lib/bat-tu-birth";
import { invokeBatTu } from "~/lib/bat-tu";
import { supabase } from "~/lib/supabase";
import {
  invokeGenerateReading,
  type LaSoChiTietSection,
} from "~/lib/generate-reading";
import { toDbFeatureKey } from "~/lib/constants";
import { laSoJsonToRevealProps, profileHasLaso } from "~/lib/la-so-ui";
import {
  formatDaiVanContextLineForVanThangDisplay,
  mapTieuVanPayload,
  tieuVanTongQuanDisplayOrNull,
  type TieuVanUi,
} from "~/lib/tieu-van-ui";
import { subscriptionActive } from "~/lib/subscription";
import {
  buildVanThangMonthHeading,
  parseConvertDateLunarTucLine,
  solarYmToTitleLabel,
  stripRedundantSolarMonthPrefix,
} from "~/lib/van-thang-month-label";

const VAN_FEATURE = toDbFeatureKey("van_thang");

const F = "#1d3129";
const C = "#ede7d3";
const M_MUTED = "#7a9a80";
const ACCENT = "#c5a55a";
const ACCENT_DIM = "rgba(197,165,90,0.18)";

function monthOptions(count: number): { ym: string; solarLabel: string }[] {
  const out: { ym: string; solarLabel: string }[] = [];
  const d = new Date();
  for (let i = 0; i < count; i++) {
    const x = new Date(d.getFullYear(), d.getMonth() + i, 1);
    const y = x.getFullYear();
    const m = x.getMonth() + 1;
    const ym = `${y}-${String(m).padStart(2, "0")}`;
    const solarLabel = solarYmToTitleLabel(ym) ?? `Tháng ${m} Năm ${y}`;
    out.push({ ym, solarLabel });
  }
  return out;
}

export default function AppTieuVan() {
  const { profile, loading, refresh } = useProfile();
  const { costs, loading: costsLoading } = useFeatureCosts();
  const months = useMemo(() => monthOptions(6), []);
  const [monthIdx, setMonthIdx] = useState(0);
  const [unlocked, setUnlocked] = useState<Record<string, TieuVanUi>>({});
  const [unlocking, setUnlocking] = useState(false);
  const [lunarTucByYm, setLunarTucByYm] = useState<Record<string, string | null>>({});
  const [lunarPrefetch, setLunarPrefetch] = useState<"idle" | "loading" | "done">("idle");
  const [tieuVanAiReading, setTieuVanAiReading] = useState<Record<string, string | null>>({});
  const [tieuVanAiSections, setTieuVanAiSections] = useState<Record<string, LaSoChiTietSection[] | null>>({});
  const [tieuVanAiLoading, setTieuVanAiLoading] = useState<Record<string, boolean>>({});
  const tieuVanAiGenRef = useRef<Record<string, number>>({});

  const costRow = costs[VAN_FEATURE];
  const cost = costRow?.credit_cost ?? 24;
  const hasLaso = profile ? profileHasLaso(profile.la_so) : false;
  const q = profileToBatTuPersonQuery(profile ?? null);
  const prefetchLunarLabels = !loading && !costsLoading && hasLaso && Boolean(q.birth_date);

  useEffect(() => {
    if (!prefetchLunarLabels) { setLunarPrefetch("idle"); return; }
    let cancelled = false;
    setLunarPrefetch("loading");
    void (async () => {
      const entries = await Promise.all(
        months.map(async ({ ym }) => {
          const res = await invokeBatTu<unknown>({ op: "convert-date", body: { solar: `${ym}-01` } });
          if (!res.ok) return [ym, null] as const;
          const line = parseConvertDateLunarTucLine(res.data);
          return [ym, line] as const;
        }),
      );
      if (!cancelled) {
        setLunarTucByYm(Object.fromEntries(entries));
        setLunarPrefetch("done");
      }
    })();
    return () => { cancelled = true; };
  }, [prefetchLunarLabels, months]);

  const vanIdentityKey = useMemo(
    () => (q.birth_date ? tieVanUnlockIdentityKey(q) : ""),
    [q.birth_date, q.birth_time, q.gender, q.tz],
  );

  const startTieuVanAiForMonth = useCallback((ymKey: string, raw: unknown) => {
    const nextGen = (tieuVanAiGenRef.current[ymKey] ?? 0) + 1;
    tieuVanAiGenRef.current[ymKey] = nextGen;
    setTieuVanAiReading((prev) => ({ ...prev, [ymKey]: null }));
    setTieuVanAiSections((prev) => ({ ...prev, [ymKey]: null }));
    setTieuVanAiLoading((prev) => ({ ...prev, [ymKey]: true }));
    void invokeGenerateReading({ endpoint: "tieu-van", data: raw }).then((r) => {
      if (tieuVanAiGenRef.current[ymKey] !== nextGen) return;
      const secs = r.sections && r.sections.length > 0 ? r.sections : null;
      if (secs) {
        setTieuVanAiSections((prev) => ({ ...prev, [ymKey]: secs }));
        setTieuVanAiReading((prev) => ({ ...prev, [ymKey]: null }));
      } else {
        setTieuVanAiReading((prev) => ({ ...prev, [ymKey]: r.reading?.trim() ? r.reading : null }));
        setTieuVanAiSections((prev) => ({ ...prev, [ymKey]: null }));
      }
      setTieuVanAiLoading((prev) => ({ ...prev, [ymKey]: false }));
    });
  }, []);

  useEffect(() => {
    if (!profile?.id || !hasLaso || !vanIdentityKey) return;
    let cancelled = false;
    void (async () => {
      const { data, error } = await supabase
        .from("tieu_van_unlocks")
        .select("year_month, payload")
        .eq("identity_key", vanIdentityKey);
      if (cancelled || error) return;
      const nextUnlocked: Record<string, TieuVanUi> = {};
      for (const row of data ?? []) {
        nextUnlocked[row.year_month] = mapTieuVanPayload(row.payload);
      }
      if (cancelled) return;
      setUnlocked((prev) => ({ ...prev, ...nextUnlocked }));
      for (const row of data ?? []) {
        if (cancelled) break;
        startTieuVanAiForMonth(row.year_month, row.payload as unknown);
      }
    })();
    return () => { cancelled = true; };
  }, [profile?.id, hasLaso, vanIdentityKey, startTieuVanAiForMonth]);

  const reveal = laSoJsonToRevealProps(profile?.la_so ?? undefined);
  const nhatChuProfile = reveal?.nhatChu ?? "";
  const current = months[monthIdx] ?? months[0]!;
  const ym = current.ym;
  const lunarLine = lunarTucByYm[ym];
  const monthHeading = buildVanThangMonthHeading(current.solarLabel, lunarLine);
  const isUnlocked = Boolean(unlocked[ym]);

  async function runTieuVan() {
    if (!q.birth_date || unlocking) {
      if (!q.birth_date) toast.error("Cần ngày sinh trong lá số / hồ sơ.");
      return;
    }
    setUnlocking(true);
    try {
      const res = await invokeBatTu<unknown>({ op: "tieu-van", body: { ...q, month: ym } });
      if (!res.ok) { toast.error(res.message); return; }
      const ui = mapTieuVanPayload(res.data);
      setUnlocked((prev) => ({ ...prev, [ym]: ui }));
      startTieuVanAiForMonth(ym, res.data);
      await refresh();
    } finally {
      setUnlocking(false);
    }
  }

  if (loading || costsLoading) {
    return (
      <div style={{ background: F, minHeight: "100%", color: C }}>
        <BackBar dark title="Tiểu Vận" subtitle="Vận tháng theo lá số" endAdornment={<CreditsHeaderChip />} />
        <p style={{ padding: "24px 20px", fontFamily: "var(--mono)", fontSize: 12, color: M_MUTED }}>Đang tải…</p>
      </div>
    );
  }

  if (!hasLaso) {
    return (
      <div style={{ background: F, minHeight: "100%", color: C }}>
        <BackBar dark title="Tiểu Vận" subtitle="Vận tháng theo lá số" />
        <div style={{ padding: "32px 20px" }}>
          <Mono style={{ color: ACCENT, display: "block", marginBottom: 12 }}>Cần lá số trước</Mono>
          <p style={{ fontSize: 14, lineHeight: 1.65, color: "rgba(237,231,211,0.75)", marginBottom: 20, fontFamily: "var(--serif)" }}>
            Cần lá số tứ trụ trước khi xem vận tháng cá nhân hoá.
          </p>
          <Button asChild>
            <Link to="/app/la-so">Lập lá số</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!q.birth_date) {
    return (
      <div style={{ background: F, minHeight: "100%", color: C }}>
        <BackBar dark title="Tiểu Vận" subtitle="Vận tháng theo lá số" />
        <div style={{ padding: "32px 20px" }}>
          <p style={{ fontSize: 14, lineHeight: 1.65, color: "rgba(237,231,211,0.75)", marginBottom: 20, fontFamily: "var(--serif)" }}>
            Thiếu ngày sinh trên hồ sơ.
          </p>
          <Button variant="secondary" asChild>
            <Link to="/app/toi">Hồ sơ</Link>
          </Button>
        </div>
      </div>
    );
  }

  const detail = unlocked[ym];
  const subActive = subscriptionActive(profile?.subscription_expires_at);
  const nhatChuLine = detail?.nhatChuApi?.trim() ? detail.nhatChuApi : nhatChuProfile;
  const hasTuTruMeta = detail && (detail.dungThanApi || detail.chartStrength || detail.thapThanOfMonth);
  const tongQuanStripped = detail ? stripRedundantSolarMonthPrefix(detail.tongQuan, ym) : "";
  const tongQuanDisplay = detail != null ? tieuVanTongQuanDisplayOrNull(detail.elementRelationCode, tongQuanStripped) : null;
  const canLuuDisplay = detail ? formatDaiVanContextLineForVanThangDisplay(stripRedundantSolarMonthPrefix(detail.canLuu, ym)) : "";
  const tieuVanAiLoad = tieuVanAiLoading[ym] ?? false;
  const tieuVanAiText = tieuVanAiReading[ym] ?? null;
  const tieuVanAiSecs = tieuVanAiSections[ym] ?? null;

  return (
    <div style={{ background: F, minHeight: "100%", color: C, fontFamily: "var(--serif)", position: "relative" }}>
      <Kanji
        ch="運"
        size={480}
        style={{ position: "absolute", top: 80, left: -140, color: "rgba(197,165,90,0.05)", pointerEvents: "none" }}
      />
      <BackBar dark title="Tiểu Vận" subtitle="Vận tháng · theo lá số" endAdornment={<CreditsHeaderChip />} />

      {/* Month navigator */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 20px",
          borderBottom: `1px solid ${ACCENT_DIM}`,
          position: "relative",
        }}
      >
        <button
          type="button"
          aria-label="Tháng trước"
          onClick={() => setMonthIdx((i) => Math.max(0, i - 1))}
          disabled={monthIdx === 0}
          style={{ background: "transparent", border: "none", color: monthIdx === 0 ? "rgba(237,231,211,0.2)" : ACCENT, cursor: monthIdx === 0 ? "default" : "pointer", padding: "6px 8px" }}
        >
          <ChevronLeft size={18} strokeWidth={1.5} aria-hidden />
        </button>

        <div style={{ textAlign: "center", flex: 1, minWidth: 0, padding: "0 8px" }}>
          <div style={{ fontFamily: "var(--display-2)", fontWeight: 700, fontSize: 16, textTransform: "uppercase", letterSpacing: "-0.005em", color: C }}>
            {current.solarLabel}
          </div>
          {lunarLine ? (
            <Mono style={{ color: M_MUTED, display: "block", marginTop: 3 }}>{lunarLine}</Mono>
          ) : lunarPrefetch === "loading" ? (
            <Mono style={{ color: "rgba(237,231,211,0.3)", display: "block", marginTop: 3 }}>Đang tra âm lịch…</Mono>
          ) : null}
        </div>

        <button
          type="button"
          aria-label="Tháng sau"
          onClick={() => setMonthIdx((i) => Math.min(months.length - 1, i + 1))}
          disabled={monthIdx === months.length - 1}
          style={{ background: "transparent", border: "none", color: monthIdx === months.length - 1 ? "rgba(237,231,211,0.2)" : ACCENT, cursor: monthIdx === months.length - 1 ? "default" : "pointer", padding: "6px 8px" }}
        >
          <ChevronRight size={18} strokeWidth={1.5} aria-hidden />
        </button>
      </div>

      <div style={{ padding: "16px 20px 32px", position: "relative" }}>
        {isUnlocked && detail ? (
          <>
            {/* Pillar display */}
            {detail.pillarHint && detail.pillarHint !== "—" ? (
              <div style={{ textAlign: "center", padding: "16px 0 20px" }}>
                <Mono style={{ color: ACCENT }}>Trụ Tháng</Mono>
                <div style={{ marginTop: 10, fontFamily: "var(--display-2)", fontWeight: 700, fontSize: 16, color: C, textTransform: "uppercase" }}>
                  {detail.pillarHint}
                </div>
              </div>
            ) : null}

            {/* Element relation */}
            {detail.elementRelationCode ? (
              <div
                style={{
                  padding: 16,
                  background: "rgba(197,165,90,0.08)",
                  border: `1px solid ${ACCENT}`,
                  marginBottom: 14,
                }}
              >
                <div style={{ display: "flex", gap: 14, alignItems: "center", justifyContent: "center" }}>
                  <div style={{ textAlign: "center" }}>
                    <Mono style={{ color: ACCENT, display: "block" }}>Mệnh</Mono>
                    {detail.userMenhLabel ? (
                      <div style={{ fontFamily: "var(--display-2)", fontWeight: 700, fontSize: 13, color: C, marginTop: 4, textTransform: "uppercase" }}>
                        {detail.userMenhLabel}
                      </div>
                    ) : null}
                  </div>
                  <div style={{ flex: 1, textAlign: "center" }}>
                    <Mono style={{ color: ACCENT, fontSize: 11, letterSpacing: "0.14em" }}>{detail.elementRelationCode}</Mono>
                    <div style={{ marginTop: 4, fontFamily: "var(--mono)", color: M_MUTED, fontSize: 16 }}>→</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <Mono style={{ color: ACCENT, display: "block" }}>Tháng</Mono>
                  </div>
                </div>
                {detail.tags.length > 0 ? (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px dashed rgba(197,165,90,0.25)", display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {detail.tags.map((t) => (
                      <span key={t} style={{ padding: "3px 10px", border: `1px solid ${ACCENT}`, fontFamily: "var(--mono)", fontSize: 9, color: ACCENT, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700 }}>
                        {t}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Narrative */}
            <Mono style={{ color: ACCENT, display: "block", marginBottom: 8 }}>Lời luận</Mono>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {nhatChuLine ? (
                <p style={{ fontSize: 13, color: "rgba(237,231,211,0.75)", fontFamily: "var(--serif)" }}>
                  <span style={{ color: M_MUTED }}>Nhật Chủ: </span>
                  <span style={{ color: C }}>{nhatChuLine}</span>
                </p>
              ) : null}
              {hasTuTruMeta ? (
                <div style={{ padding: "12px 14px", background: "rgba(237,231,211,0.04)", border: `1px solid ${ACCENT_DIM}` }}>
                  {detail.dungThanApi ? (
                    <p style={{ fontSize: 13, color: "rgba(237,231,211,0.75)", marginBottom: 6, fontFamily: "var(--serif)" }}>
                      Dụng Thần: <span style={{ color: ACCENT }}>{detail.dungThanApi}</span>
                    </p>
                  ) : null}
                  {detail.chartStrength ? (
                    <p style={{ fontSize: 13, color: "rgba(237,231,211,0.75)", marginBottom: 6, fontFamily: "var(--serif)" }}>
                      Thế lá số: <span style={{ color: C }}>{detail.chartStrength}</span>
                    </p>
                  ) : null}
                  {detail.thapThanOfMonth ? (
                    <p style={{ fontSize: 13, color: "rgba(237,231,211,0.75)", fontFamily: "var(--serif)" }}>
                      Thập Thần trụ tháng: <span style={{ color: C }}>{detail.thapThanOfMonth}</span>
                    </p>
                  ) : null}
                </div>
              ) : null}

              {tongQuanDisplay && tongQuanDisplay.length > 0 ? (
                <p style={{ fontSize: 13, lineHeight: 1.65, color: "rgba(237,231,211,0.85)", fontStyle: "italic", fontFamily: "var(--serif)" }}>
                  "{tongQuanDisplay}"
                </p>
              ) : null}

              {canLuuDisplay.trim().length > 0 ? (
                <div style={{ paddingTop: 12, borderTop: `1px dashed ${ACCENT_DIM}` }}>
                  <Mono style={{ color: M_MUTED, display: "block", marginBottom: 6 }}>Đại vận hiện tại</Mono>
                  <p style={{ fontSize: 13, lineHeight: 1.65, color: "rgba(237,231,211,0.7)", fontFamily: "var(--serif)" }}>{canLuuDisplay}</p>
                </div>
              ) : null}

              <AiReadingBlock
                showTitle={false}
                variant="on-card"
                loading={tieuVanAiLoad}
                text={tieuVanAiText}
                sections={tieuVanAiSecs}
              />
            </div>

            {detail.linhVuc.length > 0 ? (
              <div style={{ marginTop: 18 }}>
                <Mono style={{ color: ACCENT, display: "block", marginBottom: 10 }}>Gợi ý theo lĩnh vực</Mono>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {detail.linhVuc.map((row, idx) => (
                    <div key={`${ym}-linh-${idx}`} style={{ padding: "14px 16px", background: "rgba(237,231,211,0.04)", border: `1px solid ${ACCENT_DIM}` }}>
                      <Mono style={{ color: ACCENT, display: "block", marginBottom: 6 }}>{row.title}</Mono>
                      <p style={{ fontSize: 13, lineHeight: 1.65, color: "rgba(237,231,211,0.75)", fontFamily: "var(--serif)" }}>{row.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <p style={{ marginTop: 18, fontFamily: "var(--mono)", fontSize: 11, color: M_MUTED }}>
              Có việc lớn trong tháng? →{" "}
              <Link to="/app/chon-ngay" style={{ color: ACCENT, textDecoration: "none" }}>
                Chọn ngày lành →
              </Link>
            </p>
          </>
        ) : (
          /* Locked state */
          <div style={{ marginTop: 8, padding: "20px", background: "rgba(237,231,211,0.04)", border: `1px solid ${ACCENT_DIM}` }}>
            <Mono style={{ color: M_MUTED, display: "block", marginBottom: 10 }}>
              {isUnlocked ? "LÁ SỐ CỦA BẠN" : "KHUNG THÁNG"}
            </Mono>
            <p style={{ fontSize: 13, lineHeight: 1.65, color: "rgba(237,231,211,0.75)", fontFamily: "var(--serif)", marginBottom: 20 }}>
              {monthHeading} — mở khóa để xem luận giải theo trụ tháng, mệnh, quan hệ ngũ hành và Đại Vận từ lá số.
            </p>

            {subActive || (profile?.credits_balance ?? 0) >= cost ? (
              <button
                type="button"
                disabled={unlocking}
                onClick={() => void runTieuVan()}
                style={{
                  padding: "13px 20px",
                  background: ACCENT,
                  color: F,
                  border: "none",
                  fontFamily: "var(--display-2)",
                  fontWeight: 800,
                  fontSize: 12,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  cursor: unlocking ? "wait" : "pointer",
                  opacity: unlocking ? 0.65 : 1,
                  width: "100%",
                }}
              >
                {unlocking ? "Đang mở khóa…" : `Mở khóa — ${cost} lượng`}
              </button>
            ) : (
              <>
                <p style={{ fontSize: 13, color: M_MUTED, fontFamily: "var(--mono)", marginBottom: 12 }}>
                  Cần {cost} lượng · Số dư: {subActive ? "∞" : (profile?.credits_balance ?? 0)} lượng
                </p>
                <Button type="button" asChild>
                  <Link to="/dat-lich" state={{ returnTo: "/app/tieu-van" }}>Đặt lịch</Link>
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
