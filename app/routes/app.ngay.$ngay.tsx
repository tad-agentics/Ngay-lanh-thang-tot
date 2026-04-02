import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { Moon, Sun } from "lucide-react";
import { toast } from "sonner";

import { AiReadingBlock } from "~/components/AiReadingBlock";
import { Chip } from "~/components/Chip";
import { CreditsHeaderChip } from "~/components/CreditsHeaderChip";
import { ErrorBanner } from "~/components/ErrorBanner";
import { GrainOverlay } from "~/components/GrainOverlay";
import { ScreenHeader } from "~/components/ScreenHeader";
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
import { invokeReadingUnlock } from "~/lib/reading-unlock";
import { profileToBatTuPersonQuery } from "~/lib/bat-tu-birth";
import type { Database } from "~/lib/database.types";
import { formatIsoDateLichHeader } from "~/lib/tu-tru-dates";
import { useFeatureCosts } from "~/hooks/useFeatureCosts";
import { useProfile } from "~/hooks/useProfile";

import { Button } from "~/components/ui/button";
import { cn } from "~/components/ui/utils";

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
      className="border border-border bg-card px-4 py-5 space-y-4"
      style={{ borderRadius: "var(--radius-lg)" }}
    >
      <div>
        <p className="text-foreground text-sm font-medium mb-1">
          Cần ngày sinh trên hồ sơ
        </p>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Chi tiết ngày theo lá số cần ít nhất ngày sinh — mỗi lần xem không tốn lượng. Bổ sung trong Cài đặt rồi chọn lại ngày trên lịch.
        </p>
      </div>
      <Button asChild className="w-full sm:w-auto">
        <Link to="/app/cai-dat">Mở Cài đặt</Link>
      </Button>
    </div>
  );
}

function purposeVerdictClass(v: DayDetailPurposeVerdict): string {
  switch (v) {
    case "nen_lam":
      return "bg-success/15 text-success";
    case "khong_nen":
      return "bg-destructive/12 text-destructive";
    case "trung_lap":
      return "bg-muted text-muted-foreground";
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
  const { costs } = useFeatureCosts();
  const unlockDayCost = costs.ai_reading_unlock?.credit_cost ?? 1;
  const onPayloadRef = useRef(onPayload);
  onPayloadRef.current = onPayload;

  useEffect(() => {
    setPurposeExpanded(false);
  }, [iso]);

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

  const readingBlock = dayReadingUnlocked ? (
    <AiReadingBlock
      title="Luận giải"
      showTitle={false}
      variant="on-card"
      loading={dayAiLoading}
      text={dayAiReading}
    />
  ) : (
    <section className="mt-2 rounded-lg border border-border/70 bg-muted/25 px-3 py-2.5 space-y-3">
      <p className="text-sm leading-relaxed text-foreground/90">
        Mở khóa để xem luận giải riêng cho ngày này.
      </p>
      <Button
        type="button"
        variant="secondary"
        className="border-0 bg-[#C9A64A] font-semibold text-black hover:bg-[#B8943F]"
        disabled={unlockingDayReading}
        onClick={() => void unlockDayReading()}
      >
        {unlockingDayReading
          ? "Đang mở khóa..."
          : `Mở khóa (${unlockDayCost} lượng)`}
      </Button>
    </section>
  );

  return (
    <div className="space-y-4">
      {view ? (
        <>
          <section className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-2">
            <p className="text-xs text-muted-foreground">Trực</p>
            <h2 className="text-base font-semibold text-foreground leading-snug">
              {view.trucTitle}
            </h2>
            {view.trucDescription ? (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {view.trucDescription}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">—</p>
            )}
          </section>

          <section className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-2">
            <p className="text-xs text-muted-foreground">Luận giải tổng quan</p>
            {readingBlock}
          </section>

          <section className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-4">
            <div className="flex gap-3 items-start">
              <Sun
                className="shrink-0 text-success mt-0.5"
                size={20}
                strokeWidth={1.75}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground mb-0.5">Giờ tốt</p>
                <p className="text-sm font-medium text-success">{view.gioTot}</p>
              </div>
            </div>
            <div className="h-px bg-border" />
            <div className="flex gap-3 items-start">
              <Moon
                className="shrink-0 text-destructive mt-0.5"
                size={20}
                strokeWidth={1.75}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground mb-0.5">Giờ xấu</p>
                <p className="text-sm font-medium text-destructive">{view.gioXau}</p>
              </div>
            </div>
          </section>

          {view.catThanLabels.length > 0 || view.hungSatLabels.length > 0 ? (
            <section className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
              <h2 className="text-base font-semibold text-foreground">Thần sát</h2>
              {view.catThanLabels.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {view.catThanLabels.map((label) => (
                    <span
                      key={label}
                      className="inline-flex px-2.5 py-1 text-xs font-medium rounded-full bg-success/15 text-success"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              ) : null}
              {view.hungSatLabels.length > 0 ? (
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">Hung sát</p>
                  <div className="flex flex-wrap gap-2">
                    {view.hungSatLabels.map((label) => (
                      <span
                        key={label}
                        className="inline-flex px-2.5 py-1 text-xs font-medium rounded-full bg-destructive/12 text-destructive"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}

          {view.purposeRows.length > 0 ? (
            <section className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-foreground flex-1 min-w-[12rem]">
                  Mục đích trong ngày
                </h2>
                {view.grade && view.grade !== "—" ? (
                  <Chip color={gradeChipColor(view.grade)} variant="flat" size="sm">
                    Hạng {view.grade}
                  </Chip>
                ) : null}
              </div>
              <ul className="space-y-2.5">
                {purposeVisible.map((row, idx) => (
                  <li
                    key={`${row.label}-${idx}`}
                    className="flex flex-wrap items-center justify-between gap-2 text-sm"
                  >
                    <span className="text-foreground font-medium min-w-0 flex-1">
                      {row.label}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 inline-flex px-2.5 py-1 text-xs font-medium rounded-full",
                        purposeVerdictClass(row.verdict),
                      )}
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
                  className="block w-full text-left text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
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
          <section className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-2">
            <p className="text-xs text-muted-foreground">Luận giải tổng quan</p>
            {readingBlock}
          </section>
          {dayReadingUnlocked && fallbackLines.length > 0 ? (
            <details className="rounded-xl border border-border bg-card p-4 shadow-sm group">
              <summary className="text-sm font-medium text-foreground cursor-pointer list-none flex items-center justify-between gap-2">
                Dữ liệu tham chiếu từ API
                <span className="text-muted-foreground text-xs font-normal group-open:hidden">
                  Xem chi tiết
                </span>
                <span className="text-muted-foreground text-xs font-normal hidden group-open:inline">
                  Thu gọn
                </span>
              </summary>
              <ul className="mt-3 list-disc pl-4 space-y-1.5 text-sm text-foreground border-t border-border pt-3">
                {fallbackLines.map((line, i) => (
                  <li key={i}>{line}</li>
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

  if (!iso) {
    return (
      <div className="px-4 pb-8 pt-6 space-y-4">
        <ErrorBanner message="Đường dẫn ngày không hợp lệ (cần YYYY-MM-DD)." />
        <Link to="/app" className="text-sm text-primary underline">
          Về trang chủ app
        </Link>
      </div>
    );
  }

  const dayTitle = formatIsoDateLichHeader(iso);

  return (
    <div className="pb-8">
      <div className="relative overflow-hidden bg-surface text-surface-foreground px-4 pt-3 pb-5">
        <GrainOverlay />
        <div className="relative">
          <ScreenHeader
            title={dayTitle}
            dark
            className="pt-2 pb-2"
            titleClassName="!text-primary"
            endAdornment={<CreditsHeaderChip forDarkSurface />}
          />
          {headerMeta?.subline || headerMeta?.chip ? (
            <div className="flex items-center justify-between gap-2 mt-1 pb-1">
              {headerMeta.subline ? (
                <p className="text-surface-foreground/70 text-xs min-w-0 flex-1 pr-2 leading-snug">
                  {headerMeta.subline}
                </p>
              ) : (
                <span className="flex-1 min-w-0" />
              )}
              {headerMeta.chip ? (
                <Chip
                  color={headerMeta.chip.color}
                  variant="flat"
                  size="sm"
                  radius="pill"
                  className={cn(
                    "shrink-0 border-0",
                    headerMeta.chip.color === "success" &&
                      "bg-black/25 text-emerald-300",
                    headerMeta.chip.color === "danger" &&
                      "bg-black/25 text-red-300",
                    headerMeta.chip.color === "default" &&
                      "bg-black/20 text-surface-foreground/80",
                  )}
                >
                  {headerMeta.chip.label}
                </Chip>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {headerMeta?.chip?.color === "danger" ? (
          <aside
            className="rounded-xl border border-border/80 bg-card/90 px-3.5 py-3 shadow-sm"
            aria-label="Vì sao ngày Hắc Đạo vẫn có thể phù hợp lá số"
          >
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              {HAC_DAO_LASO_EXPLAINER_COPY}
            </p>
          </aside>
        ) : null}
        {loading ? (
          <p className="text-sm text-muted-foreground">Đang tải hồ sơ…</p>
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
