import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";

import { CTodayReasoning } from "~/components/direction-c/CTodayReasoning";
import { CSavedPickMarkSheet } from "~/components/direction-c/CSavedPickMarkSheet";
import { LichToPageCard } from "~/components/direction-c/LichToPageCard";
import { useInlineDayReading } from "~/hooks/useInlineDayReading";
import type { LichDayData } from "~/hooks/useLichDayData";
import { useSavedPicks } from "~/hooks/useSavedPicks";
import { CT } from "~/lib/c-tokens";
import { verdictLabelFromScore } from "~/lib/c-score";
import { yearCanChiFromLunarDisplay } from "~/lib/home-bat-tu";
import {
  dayNumberFromIso,
  mastheadFromIso,
  weekdayFromIso,
} from "~/lib/lich-format";
import { buildLichNenTranhRows } from "~/lib/lich-nen-tranh-rows";
import { offerGoogleCalendarAfterSave } from "~/lib/saved-pick-calendar";
import { findSavedPickForDay } from "~/lib/saved-picks-upcoming";
import {
  intentToLabel,
  labelToIntent,
  resolveSavedPickSource,
} from "~/lib/saved-pick-mark";
import type { TuTruIntent } from "~/lib/api-types";
import { addDaysToIso } from "~/lib/tu-tru-dates";

type NgayNavState = {
  markLabel?: string;
  intentLabel?: string;
};

type LichSelectedDayCardProps = {
  iso: string;
  dayData: LichDayData;
  onSelectIso: (iso: string) => void;
};

export function LichSelectedDayCard({
  iso,
  dayData,
  onSelectIso,
}: LichSelectedDayCardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { savePick, updatePick, picks } = useSavedPicks();
  const [saving, setSaving] = useState(false);
  const [markSheetOpen, setMarkSheetOpen] = useState(false);

  const navState = location.state as NgayNavState | null;
  const savedPick = findSavedPickForDay(picks, iso);

  const {
    user,
    subActive,
    calendarLocked,
    personalized,
    online,
    menh,
    cardFromToday,
    detail,
    detailData,
    homNayData,
    inlineReadingPayload,
    inlineReadingPending,
    dayEngineFallback,
    detailLoading,
    isToday,
    ready,
  } = dayData;

  const inlineEndpoint = isToday ? "ngay-hom-nay" : "day-detail";

  const {
    text: readingText,
    loading: readingLoading,
    failed: readingFailed,
    instantTyping,
    markTypingSeen,
  } = useInlineDayReading({
    iso,
    endpoint: inlineEndpoint,
    batTuPayload: inlineReadingPayload,
    payloadPending: inlineReadingPending,
    enabled: Boolean(subActive && ready && personalized && user && online),
    subActive,
  });

  const inlineLuanPending =
    subActive && inlineReadingPending && !readingText?.trim();
  const showNlttLuanFailed =
    subActive &&
    Boolean(user && ready && inlineReadingPayload) &&
    !inlineReadingPending &&
    !readingLoading &&
    readingFailed;
  const calendarTeaserPending =
    calendarLocked && detailLoading && !dayEngineFallback;
  const followUpPrompt =
    Boolean(user) &&
    !readingLoading &&
    !readingText?.trim() &&
    !dayEngineFallback &&
    !calendarTeaserPending &&
    !inlineLuanPending;
  const showReasoning = Boolean(
    readingLoading ||
      readingText?.trim() ||
      dayEngineFallback ||
      calendarTeaserPending ||
      inlineLuanPending ||
      followUpPrompt,
  );

  const score = detail?.score ?? cardFromToday?.score ?? null;

  const cardProps = useMemo(() => {
    if (cardFromToday) return cardFromToday;
    if (!detail) return null;
    return {
      masthead: mastheadFromIso(
        iso,
        yearCanChiFromLunarDisplay(detail.lunarDate) ||
          (detail.canChi !== "—" ? detail.canChi : null),
      ),
      dayNumber: dayNumberFromIso(iso),
      weekday: weekdayFromIso(iso),
      lunarLine: (
        <>
          {detail.lunarDate || "—"}
          {detail.canChi && detail.canChi !== "—" ? (
            <>
              {" "}
              · ngày{" "}
              <strong style={{ color: CT.ink, fontWeight: 600 }}>
                {detail.canChi}
              </strong>
            </>
          ) : null}
          {detail.trucDisplay && detail.trucDisplay !== "—" ? (
            <> · tiết {detail.trucDisplay}</>
          ) : null}
        </>
      ),
      verdictLabel:
        score != null ? verdictLabelFromScore(score) : detail.grade || "—",
      verdictSub: menh ? <>cho bản mệnh {menh}</> : null,
      score,
      rows: buildLichNenTranhRows({
        goodFor:
          detail.goodFor.length > 0 ? detail.goodFor : detail.catThanLabels,
        avoidFor:
          detail.avoidFor.length > 0 ? detail.avoidFor : detail.hungSatLabels,
        gioTot: detail.gioTot || "—",
      }),
    };
  }, [cardFromToday, detail, iso, menh, score]);

  const prefillLabel =
    navState?.markLabel?.trim() ||
    navState?.intentLabel?.trim() ||
    intentToLabel(savedPick?.intent as TuTruIntent | null) ||
    "";

  async function handleMarkConfirm(values: {
    label: string;
    intent: TuTruIntent | null;
    note: string | null;
    addToGoogleCalendar: boolean;
  }) {
    const payload = detailData ?? homNayData ?? detail;
    if (!payload || !iso || saving || !user) return;
    setSaving(true);
    const r = savedPick
      ? await updatePick(savedPick.id, {
          ...values,
          source: resolveSavedPickSource(navState),
        })
      : await savePick({
          source_endpoint: isToday ? "ngay-hom-nay" : "day-detail",
          payload,
          label: values.label,
          day_iso: iso,
          score: score ?? undefined,
          intent: values.intent,
          note: values.note,
          source: resolveSavedPickSource(navState),
        });
    setSaving(false);
    if (r.ok) {
      setMarkSheetOpen(false);
      if (values.addToGoogleCalendar) {
        offerGoogleCalendarAfterSave({
          dayIso: iso,
          label: values.label,
          note: values.note,
          score,
        });
      } else {
        toast.success(
          savedPick ? "Đã cập nhật đánh dấu." : "Đã lưu ngày này vào sổ tay của bạn.",
        );
      }
    } else {
      toast.error(r.error ?? "Không lưu được.");
    }
  }

  const prevIso = addDaysToIso(iso, -1);
  const nextIso = addDaysToIso(iso, 1);

  if (!cardProps) return null;

  return (
    <>
      <LichToPageCard
        {...cardProps}
        prevLabel={`${prevIso.slice(8, 10)}.${prevIso.slice(5, 7)} hôm trước`}
        nextLabel={`${nextIso.slice(8, 10)}.${nextIso.slice(5, 7)} hôm sau`}
        onPrev={() => onSelectIso(prevIso)}
        onNext={() => onSelectIso(nextIso)}
        reasoning={
          !online ? (
            <p
              className="px-[18px] pb-3.5 font-serif text-xs italic leading-snug"
              style={{ color: CT.muted }}
            >
              Luận giải đầy đủ cần kết nối lại.
            </p>
          ) : showNlttLuanFailed ? (
            <p
              className="px-[18px] pb-3.5 font-serif text-sm italic leading-snug"
              style={{ color: CT.muted }}
            >
              Chưa tạo được luận giải NLTT cho ngày này. Tải lại trang hoặc mở{" "}
              <button
                type="button"
                className="cursor-pointer border-none bg-transparent p-0 font-serif italic underline"
                style={{ color: CT.goldDeep }}
                onClick={() => void navigate(`/luan-ai/day-${iso}`)}
              >
                luận chi tiết
              </button>
              .
            </p>
          ) : showReasoning ? (
            <CTodayReasoning
              text={readingText}
              fallbackText={dayEngineFallback}
              loading={
                (readingLoading && subActive) ||
                calendarTeaserPending ||
                inlineLuanPending
              }
              instant={instantTyping}
              onTypingComplete={markTypingSeen}
              onCtaClick={() =>
                void navigate(
                  calendarLocked && !isToday ? "/dat-lich" : `/luan-ai/day-${iso}`,
                )
              }
              emptyPrompt={
                followUpPrompt
                  ? isToday
                    ? "Bạn định làm việc cụ thể hôm nay? Hỏi NLTT xem ngày này có phù hợp không."
                    : "Bạn định làm việc cụ thể trong ngày này? Hỏi NLTT xem ngày này có phù hợp không."
                  : undefined
              }
              showCta={Boolean(user)}
              showCtaWithEngineFallback
            />
          ) : null
        }
      />

      {savedPick ? (
        <div
          className="mt-4 border-l-[3px] px-3 py-2.5 font-serif text-[13px] leading-snug"
          style={{
            borderColor: CT.goldDeep,
            background: "rgba(154,124,34,0.08)",
            color: CT.ink2,
          }}
        >
          Đánh dấu cho:{" "}
          <strong style={{ color: CT.ink, fontWeight: 600 }}>
            {savedPick.label}
          </strong>
          {savedPick.note ? (
            <div className="mt-1 text-[12px]" style={{ color: CT.muted }}>
              {savedPick.note}
            </div>
          ) : null}
        </div>
      ) : null}

      {user && personalized && (detail || cardFromToday) ? (
        <button
          type="button"
          disabled={saving}
          onClick={() => setMarkSheetOpen(true)}
          className="mt-4 flex min-h-[44px] w-full cursor-pointer items-center justify-center border-none uppercase tracking-widest disabled:cursor-default disabled:opacity-60"
          style={{
            padding: 12,
            background: savedPick ? "transparent" : CT.forest,
            color: savedPick ? CT.goldDeep : CT.cream,
            fontFamily: "var(--display-2)",
            fontWeight: 800,
            fontSize: 12.5,
            letterSpacing: "0.08em",
            border: savedPick ? `1px solid ${CT.goldDeep}` : "none",
          }}
        >
          {savedPick
            ? "Sửa đánh dấu"
            : saving
              ? "Đang lưu…"
              : "Lưu ngày lành · nhắc trước 1 ngày"}
        </button>
      ) : null}

      <CSavedPickMarkSheet
        open={markSheetOpen}
        mode={savedPick ? "edit" : "create"}
        dayIso={iso}
        score={score ?? undefined}
        suggestedLabels={detail?.goodFor ?? []}
        initialLabel={savedPick?.label ?? prefillLabel}
        initialNote={savedPick?.note}
        initialIntent={(savedPick?.intent as TuTruIntent | null) ?? labelToIntent(prefillLabel)}
        busy={saving}
        onClose={() => {
          if (!saving) setMarkSheetOpen(false);
        }}
        onConfirm={handleMarkConfirm}
      />
    </>
  );
}
