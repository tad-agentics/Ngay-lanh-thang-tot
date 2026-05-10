import { type CSSProperties, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { Moon, Sun } from "lucide-react";
import { toast } from "sonner";

import { AiReadingBlock } from "~/components/AiReadingBlock";
import { Chip } from "~/components/Chip";
import { CreditsHeaderChip } from "~/components/CreditsHeaderChip";
import { ErrorBanner } from "~/components/ErrorBanner";
import { BackBar } from "~/components/brand";
import { extractDetailReasonLines } from "~/lib/chon-ngay-detail";
import {
  type DayDetailHeaderMeta,
  extractDayDetailHeaderMeta,
} from "~/lib/day-detail-header";
import {
  parseDayDetailForView,
  sortPurposeRowsForDisplay,
  type DayDetailPurposeVerdict,
} from "~/lib/day-detail-view";
import { invokeBatTu } from "~/lib/bat-tu";
import { invokeGenerateReading } from "~/lib/generate-reading";
import { fetchIsPinned, invokePin } from "~/lib/pin-reading";
import { invokeReadingUnlock } from "~/lib/reading-unlock";
import { profileToBatTuPersonQuery } from "~/lib/bat-tu-birth";
import type { Database } from "~/lib/database.types";
import { formatIsoDateLichHeader } from "~/lib/tu-tru-dates";
import { useFeatureCosts } from "~/hooks/useFeatureCosts";
import { useProfile } from "~/hooks/useProfile";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

function gradeChipColor(grade: string): "success" | "warning" | "danger" | "default" {
  const g = grade.toUpperCase();
  if (g === "A") return "success";
  if (g === "B") return "warning";
  if (g === "C" || g === "D" || g === "E" || g === "F") return "danger";
  return "default";
}

function purposeVerdictLabel(v: DayDetailPurposeVerdict): string {
  switch (v) {
    case "nen_lam":
      return "Nên làm";
    case "khong_nen":
      return "Không nên";
    case "trung_lap":
      return "Cân nhắc";
    default: {
      const _x: never = v;
      return _x;
    }
  }
}

/** Hiển thị khi chi tiết ngày gắn nhãn Hắc Đạo — giải thích lớp lịch chung vs Bát Tự cá nhân. */
const HAC_DAO_LASO_EXPLAINER_COPY =
  "Ngày hắc đạo cũng có thể là ngày đẹp nhất cho một lá số. Theo thuật phong thủy truyền thống, đây là một quyết định có chủ ý — vì Bát Tự cá nhân (mệnh, dụng thần, kỵ thần) được coi là quan trọng hơn Hoàng Đạo/Hắc Đạo chung.";

/** Một khối paywall: chỉ rào khi thiếu hồ sơ; không trừ lượng từng ngày. */
function NgayChiTietProfilePaywall() {
  return (
    <div
      style={{
        background: "rgba(237,231,211,0.06)",
        border: "1px solid rgba(197,165,90,0.3)",
        borderRadius: 12,
        padding: "16px 16px 20px",
      }}
    >
      <p
        style={{
          fontFamily: "var(--serif)",
          fontSize: 16,
          color: "var(--cream, #ede7d3)",
          marginBottom: 8,
          fontWeight: 600,
        }}
      >
        Cần ngày sinh trên hồ sơ
      </p>
      <p
        style={{
          fontFamily: "var(--serif)",
          fontSize: 16,
          color: "rgba(237,231,211,0.72)",
          lineHeight: 1.55,
          marginBottom: 16,
        }}
      >
        Chi tiết ngày theo lá số cần ít nhất ngày sinh — mỗi lần xem không tốn lượng. Bổ sung trong hồ sơ rồi chọn lại ngày trên lịch.
      </p>
      <Link
        to="/app/toi"
        style={{
          display: "inline-block",
          background: "var(--cream, #ede7d3)",
          color: "var(--ink, #18150e)",
          borderRadius: 8,
          padding: "10px 18px",
          fontFamily: "var(--mono)",
          fontSize: 13,
          fontWeight: 700,
          textDecoration: "none",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        Mở hồ sơ
      </Link>
    </div>
  );
}

function purposeVerdictStyle(v: DayDetailPurposeVerdict): CSSProperties {
  switch (v) {
    case "nen_lam":
      return { background: "rgba(74,163,97,0.18)", color: "#6fcf97" };
    case "khong_nen":
      return { background: "rgba(220,80,80,0.15)", color: "#f08080" };
    case "trung_lap":
      return { background: "rgba(237,231,211,0.1)", color: "rgba(237,231,211,0.55)" };
    default: {
      const _x: never = v;
      return _x;
    }
  }
}

function sanitizeDayDetailReading(raw: string | null): string | null {
  if (!raw) return null;
  let t = raw.trim();
  if (!t) return null;
  for (let i = 0; i < 8; i++) {
    const next = t.replace(/\*\*([^*]+)\*\*/g, "$1");
    if (next === t) break;
    t = next;
  }
  t = t.replace(/^#{1,6}\s+/gm, "");
  t = t.replace(/^\s*[-*•]\s+/gm, "");
  t = t.replace(/\*\*([^*]*)$/g, "$1");
  t = t.replace(/[_`~]{1,3}([^_`~]*)$/g, "$1");
  t = t.replace(/\s{2,}/g, " ");
  const sentenceChunks = t
    .split(/(?<=[.!?…])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const zodiacHourRegex =
    /(tý|sửu|dần|mão|thìn|tỵ|ngọ|mùi|thân|dậu|tuất|hợi)/gi;
  const filteredChunks = sentenceChunks.filter((chunk) => {
    const lower = chunk.toLowerCase();
    if (
      lower.includes("điểm số") ||
      lower.includes("/100") ||
      lower.includes("xếp hạng") ||
      lower.includes("hạng a") ||
      lower.includes("hạng b") ||
      lower.includes("hạng c")
    ) {
      return false;
    }
    if (lower.includes("giờ tốt") || lower.includes("giờ xấu")) {
      return false;
    }
    const hourMentions = chunk.match(zodiacHourRegex)?.length ?? 0;
    if (hourMentions >= 5) {
      return false;
    }
    return true;
  });
  t = (filteredChunks.length > 0 ? filteredChunks : sentenceChunks).join(" ");
  t = t.trim();
  if (!/[.!?…]["')\]]?\s*$/.test(t)) {
    const lastBoundary = Math.max(
      t.lastIndexOf("."),
      t.lastIndexOf("!"),
      t.lastIndexOf("?"),
      t.lastIndexOf("…"),
    );
    if (lastBoundary > 40) {
      t = t.slice(0, lastBoundary + 1).trim();
    }
  }
  return t || null;
}

function DayDetailFetched({
  iso,
  profile,
  onPayload,
}: {
  iso: string;
  profile: ProfileRow;
  onPayload?: (data: unknown | null) => void;
}) {
  const [purposeExpanded, setPurposeExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [payload, setPayload] = useState<unknown>(null);
  const [dayAiReading, setDayAiReading] = useState<string | null>(null);
  const [dayAiLoading, setDayAiLoading] = useState(false);
  const [dayReadingUnlocked, setDayReadingUnlocked] = useState(false);
  const [unlockingDayReading, setUnlockingDayReading] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [pinBusy, setPinBusy] = useState(false);
  const { costs } = useFeatureCosts();
  const unlockDayCost = costs.ai_reading_unlock?.credit_cost ?? 1;
  const onPayloadRef = useRef(onPayload);
  onPayloadRef.current = onPayload;

  useEffect(() => {
    setPurposeExpanded(false);
    setIsPinned(false);
  }, [iso]);

  useEffect(() => {
    if (!dayReadingUnlocked) return;
    void fetchIsPinned({ scope: "day_detail", day_iso: iso }).then(setIsPinned);
  }, [dayReadingUnlocked, iso]);

  useEffect(() => {
    let cancelled = false;
    const q = profileToBatTuPersonQuery(profile);
    if (!q.birth_date) {
      setLoading(false);
      setErr("Thiếu ngày sinh trong hồ sơ.");
      onPayloadRef.current?.(null);
      return;
    }
    setLoading(true);
    setErr(null);
    setDayAiReading(null);
    setDayAiLoading(false);
    setUnlockingDayReading(false);
    setDayReadingUnlocked(false);
    try {
      localStorage.removeItem(
        `ngaytot_day_reading_unlock:${profile.id}:${iso}`,
      );
    } catch {
      /* legacy client-only unlock flag */
    }
    onPayloadRef.current?.(null);
    void (async () => {
      const res = await invokeBatTu({
        op: "day-detail",
        body: { ...q, date: iso },
      });
      if (cancelled) return;
      setLoading(false);
      if (!res.ok) {
        setErr(res.message);
        setPayload(null);
        onPayloadRef.current?.(null);
        return;
      }
      setPayload(res.data);
      onPayloadRef.current?.(res.data);
      const unlock = await invokeReadingUnlock({
        dry_run: true,
        scope: "day_detail",
        day_iso: iso,
      });
      if (cancelled) return;
      const serverAllows = Boolean(
        unlock.ok &&
          (unlock.unlocked === true ||
            unlock.already_unlocked === true ||
            unlock.subscription_free === true),
      );
      setDayReadingUnlocked(serverAllows);
      if (serverAllows) {
        setDayAiLoading(true);
        setDayAiReading(null);
        void invokeGenerateReading({
          endpoint: "day-detail",
          data: res.data,
        }).then((r) => {
          if (!cancelled) {
            setDayAiReading(sanitizeDayDetailReading(r.reading));
            setDayAiLoading(false);
          }
        });
      } else {
        setDayAiReading(null);
        setDayAiLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [iso, profile]);

  async function unlockDayReading() {
    if (!payload || unlockingDayReading) return;
    setUnlockingDayReading(true);
    setDayAiLoading(true);
    const unlock = await invokeReadingUnlock({
      scope: "day_detail",
      day_iso: iso,
    });
    if (!unlock.ok) {
      toast.error(unlock.message);
      setDayAiLoading(false);
      setUnlockingDayReading(false);
      return;
    }
    if (unlock.charged || unlock.subscription_free) {
      window.dispatchEvent(new CustomEvent("ngaytot:profile-refresh"));
    }
    const r = await invokeGenerateReading({
      endpoint: "day-detail",
      data: payload,
    });
    setDayAiReading(sanitizeDayDetailReading(r.reading));
    setDayAiLoading(false);
    setUnlockingDayReading(false);
    setDayReadingUnlocked(true);
    toast.success(
      unlock.charged
        ? "Đã mở khóa luận giải ngày (đã trừ lượng)."
        : unlock.subscription_free
          ? "Đã mở khóa luận giải (gói đang hoạt động)."
          : "Đã mở khóa luận giải ngày.",
    );
  }

  async function handlePin() {
    if (pinBusy) return;
    setPinBusy(true);
    const action = isPinned ? "unpin" : "pin";
    const result = await invokePin({
      action,
      scope: "day_detail",
      day_iso: iso,
      reading_snapshot: dayAiReading ?? undefined,
    });
    if (result.ok) {
      setIsPinned(result.pinned);
      toast.success(result.pinned ? "Đã ghim luận giải." : "Đã bỏ ghim.");
    } else {
      toast.error(result.message);
    }
    setPinBusy(false);
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground py-4">Đang tải chi tiết…</p>;
  }
  if (err) {
    return <ErrorBanner message={err} />;
  }

  const view = parseDayDetailForView(payload);
  const fallbackLines = extractDetailReasonLines(payload ?? {});

  if (!view && fallbackLines.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        Không có nội dung chi tiết cho ngày này.
      </p>
    );
  }

  const purposeSorted =
    view != null ? sortPurposeRowsForDisplay(view.purposeRows) : [];
  const purposeVisible = purposeExpanded
    ? purposeSorted
    : purposeSorted.slice(0, 3);

  const CREAM = "var(--cream, #ede7d3)";
  const CREAM60 = "rgba(237,231,211,0.6)";
  const GOLD = "var(--gold, #c5a55a)";
  const CARD_BG = "rgba(237,231,211,0.05)";
  const CARD_BORDER = "rgba(197,165,90,0.22)";

  const readingBlock = dayReadingUnlocked ? (
    <AiReadingBlock
      title="Luận giải"
      showTitle={false}
      variant="on-card"
      loading={dayAiLoading}
      text={dayAiReading}
      scope="day_detail"
      dayIso={iso}
      isPinned={isPinned}
      onPin={() => void handlePin()}
      pinBusy={pinBusy}
    />
  ) : (
    <div
      style={{
        marginTop: 8,
        background: CARD_BG,
        border: `1px solid ${CARD_BORDER}`,
        borderRadius: 10,
        padding: "12px 14px",
      }}
    >
      <p
        style={{
          fontFamily: "var(--serif)",
          fontSize: 14,
          color: CREAM60,
          lineHeight: 1.6,
          marginBottom: 12,
        }}
      >
        Mở khóa để xem luận giải riêng cho ngày này.
      </p>
      <button
        type="button"
        disabled={unlockingDayReading}
        onClick={() => void unlockDayReading()}
        style={{
          background: unlockingDayReading ? "rgba(197,165,90,0.4)" : GOLD,
          color: "var(--ink, #18150e)",
          border: "none",
          borderRadius: 8,
          padding: "10px 16px",
          fontFamily: "var(--mono)",
          fontSize: 13,
          fontWeight: 700,
          cursor: unlockingDayReading ? "not-allowed" : "pointer",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
        }}
      >
        {unlockingDayReading
          ? "Đang mở khóa…"
          : `Mở khóa (${unlockDayCost} lượng)`}
      </button>
    </div>
  );

  const cardStyle: CSSProperties = {
    background: CARD_BG,
    border: `1px solid ${CARD_BORDER}`,
    borderRadius: 14,
    padding: "16px",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {view ? (
        <>
          <section style={cardStyle}>
            <p style={{ fontFamily: "var(--mono)", fontSize: 12, color: CREAM60, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Trực</p>
            <h2 style={{ fontFamily: "var(--display-2)", fontWeight: 700, fontSize: 17, color: CREAM, marginBottom: 6 }}>
              {view.trucTitle}
            </h2>
            <p style={{ fontFamily: "var(--serif)", fontSize: 14, color: CREAM60, lineHeight: 1.6 }}>
              {view.trucDescription || "—"}
            </p>
          </section>

          <section style={cardStyle}>
            <p style={{ fontFamily: "var(--mono)", fontSize: 12, color: CREAM60, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Luận giải tổng quan</p>
            {readingBlock}
          </section>

          <section style={cardStyle}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 14 }}>
              <Sun size={18} color="#6fcf97" strokeWidth={1.75} aria-hidden />
              <div>
                <p style={{ fontFamily: "var(--mono)", fontSize: 12, color: CREAM60, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>Giờ tốt</p>
                <p style={{ fontFamily: "var(--serif)", fontSize: 14, color: "#6fcf97", fontWeight: 600 }}>{view.gioTot}</p>
              </div>
            </div>
            <div style={{ height: 1, background: "rgba(197,165,90,0.2)", marginBottom: 14 }} />
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <Moon size={18} color="#f08080" strokeWidth={1.75} aria-hidden />
              <div>
                <p style={{ fontFamily: "var(--mono)", fontSize: 12, color: CREAM60, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>Giờ xấu</p>
                <p style={{ fontFamily: "var(--serif)", fontSize: 14, color: "#f08080", fontWeight: 600 }}>{view.gioXau}</p>
              </div>
            </div>
          </section>

          {view.catThanLabels.length > 0 || view.hungSatLabels.length > 0 ? (
            <section style={cardStyle}>
              <h2 style={{ fontFamily: "var(--display-2)", fontWeight: 700, fontSize: 16, color: CREAM, marginBottom: 12 }}>Thần sát</h2>
              {view.catThanLabels.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: view.hungSatLabels.length > 0 ? 12 : 0 }}>
                  {view.catThanLabels.map((label) => (
                    <span
                      key={label}
                      style={{ background: "rgba(74,163,97,0.18)", color: "#6fcf97", borderRadius: 999, padding: "4px 10px", fontFamily: "var(--mono)", fontSize: 12, fontWeight: 600 }}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              ) : null}
              {view.hungSatLabels.length > 0 ? (
                <>
                  <p style={{ fontFamily: "var(--mono)", fontSize: 12, color: CREAM60, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Hung sát</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {view.hungSatLabels.map((label) => (
                      <span
                        key={label}
                        style={{ background: "rgba(220,80,80,0.15)", color: "#f08080", borderRadius: 999, padding: "4px 10px", fontFamily: "var(--mono)", fontSize: 12, fontWeight: 600 }}
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </>
              ) : null}
            </section>
          ) : null}

          {view.purposeRows.length > 0 ? (
            <section style={cardStyle}>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <h2 style={{ fontFamily: "var(--display-2)", fontWeight: 700, fontSize: 16, color: CREAM, flex: 1, minWidth: "12rem" }}>
                  Mục đích trong ngày
                </h2>
                {view.grade && view.grade !== "—" ? (
                  <Chip color={gradeChipColor(view.grade)} variant="flat" size="sm">
                    Hạng {view.grade}
                  </Chip>
                ) : null}
              </div>
              <ul style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {purposeVisible.map((row, idx) => (
                  <li
                    key={`${row.label}-${idx}`}
                    style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8 }}
                  >
                    <span style={{ fontFamily: "var(--serif)", fontSize: 14, color: CREAM, fontWeight: 500, flex: 1, minWidth: 0 }}>
                      {row.label}
                    </span>
                    <span
                      style={{
                        ...purposeVerdictStyle(row.verdict),
                        borderRadius: 999,
                        padding: "4px 10px",
                        fontFamily: "var(--mono)",
                        fontSize: 12,
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      {purposeVerdictLabel(row.verdict)}
                    </span>
                  </li>
                ))}
              </ul>
              {view.purposeRows.length > 3 ? (
                <button
                  type="button"
                  onClick={() => setPurposeExpanded((e) => !e)}
                  style={{ marginTop: 12, background: "none", border: "none", padding: 0, fontFamily: "var(--serif)", fontSize: 13, color: CREAM60, textDecoration: "underline", cursor: "pointer" }}
                >
                  {purposeExpanded
                    ? "Thu gọn"
                    : `Xem đầy đủ ${view.purposeRows.length} mục đích`}
                </button>
              ) : null}
            </section>
          ) : null}
        </>
      ) : (
        <>
          <section style={cardStyle}>
            <p style={{ fontFamily: "var(--mono)", fontSize: 12, color: CREAM60, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Luận giải tổng quan</p>
            {readingBlock}
          </section>
          {dayReadingUnlocked && fallbackLines.length > 0 ? (
            <details style={{ ...cardStyle }}>
              <summary style={{ fontFamily: "var(--serif)", fontSize: 14, color: CREAM, cursor: "pointer", listStyle: "none", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                Dữ liệu tham chiếu
                <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: CREAM60 }}>Xem</span>
              </summary>
              <ul style={{ marginTop: 12, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6 }}>
                {fallbackLines.map((line, i) => (
                  <li key={i} style={{ fontFamily: "var(--serif)", fontSize: 14, color: CREAM60, lineHeight: 1.55 }}>{line}</li>
                ))}
              </ul>
            </details>
          ) : null}
        </>
      )}
    </div>
  );
}

export default function AppNgayChiTiet() {
  const { ngay } = useParams();
  const { profile, loading } = useProfile();
  const iso = ngay && /^\d{4}-\d{2}-\d{2}$/.test(ngay) ? ngay : null;
  const [headerMeta, setHeaderMeta] = useState<DayDetailHeaderMeta | null>(
    null,
  );

  useEffect(() => {
    setHeaderMeta(null);
  }, [iso]);

  const CREAM = "var(--cream, #ede7d3)";
  const CREAM60 = "rgba(237,231,211,0.6)";

  if (!iso) {
    return (
      <div
        style={{
          background: "radial-gradient(ellipse at 50% 0%, #2a4738 0%, #1d3129 50%, #131f1a 100%)",
          minHeight: "100svh",
          padding: "24px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <ErrorBanner message="Đường dẫn ngày không hợp lệ (cần YYYY-MM-DD)." />
        <Link
          to="/app"
          style={{ fontFamily: "var(--serif)", fontSize: 14, color: CREAM60, textDecoration: "underline" }}
        >
          Về trang chủ
        </Link>
      </div>
    );
  }

  const dayTitle = formatIsoDateLichHeader(iso);

  const chipColorMap: Record<string, string> = {
    success: "#6fcf97",
    danger: "#f08080",
    default: CREAM60,
  };

  return (
    <div
      style={{
        background: "radial-gradient(ellipse at 50% 0%, #2a4738 0%, #1d3129 50%, #131f1a 100%)",
        minHeight: "100svh",
        color: CREAM,
      }}
    >
      {/* Header */}
      <div style={{ padding: "12px 16px 16px" }}>
        <BackBar
          title={dayTitle}
          dark
          endAdornment={<CreditsHeaderChip forDarkSurface />}
        />
        {headerMeta?.subline || headerMeta?.chip ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 4 }}>
            {headerMeta.subline ? (
              <p style={{ fontFamily: "var(--serif)", fontSize: 13, color: CREAM60, flex: 1, minWidth: 0, lineHeight: 1.5 }}>
                {headerMeta.subline}
              </p>
            ) : (
              <span style={{ flex: 1 }} />
            )}
            {headerMeta.chip ? (
              <span
                style={{
                  background: "rgba(0,0,0,0.3)",
                  color: chipColorMap[headerMeta.chip.color] ?? CREAM60,
                  borderRadius: 999,
                  padding: "4px 10px",
                  fontFamily: "var(--mono)",
                  fontSize: 12,
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {headerMeta.chip.label}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      <div style={{ padding: "0 16px 32px", display: "flex", flexDirection: "column", gap: 14 }}>
        {headerMeta?.chip?.color === "danger" ? (
          <aside
            style={{
              background: "rgba(237,231,211,0.05)",
              border: "1px solid rgba(197,165,90,0.2)",
              borderRadius: 12,
              padding: "12px 14px",
            }}
            aria-label="Vì sao ngày Hắc Đạo vẫn có thể phù hợp lá số"
          >
            <p style={{ fontFamily: "var(--serif)", fontSize: 13, color: CREAM60, lineHeight: 1.6 }}>
              {HAC_DAO_LASO_EXPLAINER_COPY}
            </p>
          </aside>
        ) : null}
        {loading ? (
          <p style={{ fontFamily: "var(--serif)", fontSize: 14, color: CREAM60 }}>Đang tải hồ sơ…</p>
        ) : !profile?.ngay_sinh ? (
          <NgayChiTietProfilePaywall />
        ) : (
          <DayDetailFetched
            iso={iso}
            profile={profile}
            onPayload={(data) =>
              setHeaderMeta(
                data == null ? null : extractDayDetailHeaderMeta(data),
              )
            }
          />
        )}
      </div>
    </div>
  );
}
