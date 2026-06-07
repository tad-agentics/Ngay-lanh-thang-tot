import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { toast } from "sonner";

import { ErrorBanner } from "~/components/ErrorBanner";
import { BackBar } from "~/components/brand";
import { COfflineBanner } from "~/components/direction-c/COfflineBanner";
import { CSavedPickMarkSheet } from "~/components/direction-c/CSavedPickMarkSheet";
import { CTodayReasoning } from "~/components/direction-c/CTodayReasoning";
import { useBatTuQuery } from "~/hooks/useBatTuQuery";
import { useInlineDayReading } from "~/hooks/useInlineDayReading";
import { useOnlineStatus } from "~/hooks/useOnlineStatus";
import { useOptionalProfile } from "~/hooks/useOptionalProfile";
import { useSavedPicks } from "~/hooks/useSavedPicks";
import { LichToPageCard } from "~/components/direction-c/LichToPageCard";
import { profileToBatTuPersonQuery } from "~/lib/bat-tu-birth";
import { parseDayDetailForView } from "~/lib/day-detail-view";
import { canAccessPaidCalendar, canUseCalendar } from "~/lib/entitlements";
import {
  buildCalendarLockedDayTeaser,
  pickDayDetailInlineLuanFallback,
} from "~/lib/home-bat-tu";
import { todayIsoInVn } from "~/lib/today-reading-cache";
import { CT } from "~/lib/c-tokens";
import { buildLichNenTranhRows } from "~/lib/lich-nen-tranh-rows";
import {
  dayNumberFromIso,
  mastheadFromIso,
  weekdayFromIso,
} from "~/lib/lich-format";
import { yearCanChiFromLunarDisplay } from "~/lib/home-bat-tu";
import { verdictLabelFromScore } from "~/lib/c-score";
import { laSoJsonToRevealProps } from "~/lib/la-so-ui";
import {
  intentToLabel,
  labelToIntent,
  resolveSavedPickSource,
} from "~/lib/saved-pick-mark";
import type { TuTruIntent } from "~/lib/api-types";
import { offerGoogleCalendarAfterSave } from "~/lib/saved-pick-calendar";
import { findSavedPickForDay } from "~/lib/saved-picks-upcoming";
import { resolveInlineReadingPayload } from "~/lib/today-inline-reading-payload";

type NgayNavState = {
  markLabel?: string;
  intentLabel?: string;
};

export function CDayDetailScreen() {
  const { ngay } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const online = useOnlineStatus();
  const { user, profile, loading: profileLoading } = useOptionalProfile();
  const { savePick, updatePick, picks } = useSavedPicks();
  const [saving, setSaving] = useState(false);
  const [markSheetOpen, setMarkSheetOpen] = useState(false);

  const iso = ngay ?? "";
  const navState = location.state as NgayNavState | null;
  const savedPick = iso ? findSavedPickForDay(picks, iso) : undefined;
  const birthQuery = useMemo(
    () => (profile ? profileToBatTuPersonQuery(profile) : null),
    [profile],
  );
  const personalized = Boolean(birthQuery?.birth_date);
  const subActive = profile ? canUseCalendar(profile) : false;
  const calendarLocked = Boolean(
    user && profile && !canAccessPaidCalendar(profile),
  );
  const todayIso = todayIsoInVn();

  const dayDetailBody = useMemo(() => {
    if (!iso) return { date: "", tz: "Asia/Ho_Chi_Minh" };
    return personalized && birthQuery
      ? { ...birthQuery, date: iso }
      : { date: iso, mode: "generic", tz: "Asia/Ho_Chi_Minh" };
  }, [iso, personalized, birthQuery]);

  const dayDetailFetchEnabled =
    !profileLoading &&
    Boolean(iso) &&
    online &&
    (!personalized || Boolean(user?.id));
  const luanFetchEnabled =
    dayDetailFetchEnabled && personalized && Boolean(user?.id);

  const detailQuery = useBatTuQuery<unknown>(user?.id, "day-detail", dayDetailBody, {
    enabled: dayDetailFetchEnabled,
  });
  const luanQuery = useBatTuQuery<unknown>(user?.id, "day-luan-context", dayDetailBody, {
    enabled: luanFetchEnabled,
  });

  const rawPayload = detailQuery.data;
  const loading = detailQuery.isPending;
  const error = detailQuery.error?.message ?? null;

  const { payload: inlineReadingPayload, pending: inlineReadingPending } = useMemo(
    () =>
      resolveInlineReadingPayload({
        fetchEnabled: luanFetchEnabled && subActive,
        luanPending: Boolean(luanFetchEnabled && luanQuery.isPending),
        luanData: luanQuery.data,
        detailData: rawPayload,
        homNayData: null,
      }),
    [
      luanFetchEnabled,
      subActive,
      luanQuery.isPending,
      luanQuery.data,
      rawPayload,
    ],
  );

  const detail = useMemo(
    () => (rawPayload != null ? parseDayDetailForView(rawPayload) : null),
    [rawPayload],
  );

  const dayEngineFallback =
    detail && !subActive
      ? calendarLocked
        ? buildCalendarLockedDayTeaser(detail)
        : pickDayDetailInlineLuanFallback(detail) || null
      : null;
  const menh = profile ? laSoJsonToRevealProps(profile.la_so)?.menh ?? null : null;

  const {
    text: readingText,
    loading: readingLoading,
    failed: readingFailed,
    instantTyping,
    markTypingSeen,
  } = useInlineDayReading({
    iso,
    endpoint: "day-detail",
    batTuPayload: inlineReadingPayload,
    payloadPending: inlineReadingPending,
    enabled: Boolean(subActive && detail && personalized && user),
    subActive,
  });

  const inlineLuanPending =
    subActive && inlineReadingPending && !readingText?.trim();
  const showInlineLuanFailed =
    subActive &&
    personalized &&
    Boolean(inlineReadingPayload) &&
    !inlineReadingPending &&
    !readingLoading &&
    readingFailed;
  const followUpPrompt =
    Boolean(user) &&
    !readingLoading &&
    !readingText?.trim() &&
    !dayEngineFallback &&
    !inlineLuanPending;
  const showDayReasoning = Boolean(
    readingLoading ||
      readingText?.trim() ||
      dayEngineFallback ||
      inlineLuanPending ||
      followUpPrompt,
  );

  const monthNum = iso ? Number(iso.slice(5, 7)) : 0;

  const score = detail?.score ?? null;

  const verdictSub = useMemo(() => {
    if (menh) return <>cho bản mệnh {menh}</>;
    if (!personalized) {
      return (
        <Link to="/dang-nhap" className="underline" style={{ color: CT.goldDeep }}>
          Đăng nhập để xem theo bản mệnh của bạn
        </Link>
      );
    }
    return null;
  }, [menh, personalized]);

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
    if (!detail || !iso || saving || !user) return;
    setSaving(true);
    const payload = rawPayload ?? detail;
    const r = savedPick
      ? await updatePick(savedPick.id, {
          ...values,
          source: resolveSavedPickSource(navState),
        })
      : await savePick({
          source_endpoint: "day-detail",
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

  return (
    <main
      className="flex min-h-full flex-col"
      style={{ background: CT.paper, color: CT.ink }}
    >
      {!online ? <COfflineBanner /> : null}
      <BackBar title={monthNum ? `Lịch tháng ${monthNum}` : "Chi tiết ngày"} />

      <div className="flex-1 overflow-y-auto px-[22px] pb-[100px] pt-1">
        {error ? <ErrorBanner message={error} /> : null}
        {loading ? (
          <p className="py-12 text-center font-serif text-sm" style={{ color: CT.muted }}>
            Đang tải…
          </p>
        ) : null}

        {detail ? (
          <>
            <LichToPageCard
              masthead={mastheadFromIso(
                iso,
                yearCanChiFromLunarDisplay(detail.lunarDate) ||
                  (detail.canChi !== "—" ? detail.canChi : null),
              )}
              showTodayBadge={iso === todayIso}
              dayNumber={dayNumberFromIso(iso)}
              weekday={weekdayFromIso(iso)}
              lunarLine={
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
              }
              verdictLabel={
                score != null ? verdictLabelFromScore(score) : detail.grade || "—"
              }
              verdictSub={verdictSub}
              score={score}
              reasoning={
                personalized ? (
                  !online ? (
                    <p
                      className="px-[18px] pb-3.5 font-serif text-xs italic leading-snug"
                      style={{ color: CT.muted }}
                    >
                      Luận giải đầy đủ cần kết nối lại.
                    </p>
                  ) : showInlineLuanFailed ? (
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
                  ) : showDayReasoning ? (
                    <CTodayReasoning
                      text={readingText}
                      fallbackText={dayEngineFallback}
                      loading={
                        (readingLoading && subActive) || inlineLuanPending
                      }
                      instant={instantTyping}
                      onTypingComplete={markTypingSeen}
                      onCtaClick={() =>
                        void navigate(
                          calendarLocked && iso !== todayIso
                            ? "/dat-lich"
                            : `/luan-ai/day-${iso}`,
                        )
                      }
                      emptyPrompt={
                        followUpPrompt
                          ? "Bạn định làm việc cụ thể trong ngày này? Hỏi NLTT xem ngày này có phù hợp không."
                          : undefined
                      }
                      showCta={Boolean(user)}
                      showCtaWithEngineFallback
                    />
                  ) : null
                ) : null
              }
              rows={buildLichNenTranhRows({
                goodFor:
                  detail.goodFor.length > 0
                    ? detail.goodFor
                    : detail.catThanLabels,
                avoidFor:
                  detail.avoidFor.length > 0
                    ? detail.avoidFor
                    : detail.hungSatLabels,
                gioTot: detail.gioTot || "—",
              })}
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

            {user && personalized ? (
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

          </>
        ) : null}
      </div>

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
    </main>
  );
}
