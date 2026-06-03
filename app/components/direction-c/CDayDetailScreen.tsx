import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { toast } from "sonner";

import { ErrorBanner } from "~/components/ErrorBanner";
import { BackBar } from "~/components/brand";
import { COfflineBanner } from "~/components/direction-c/COfflineBanner";
import { CSavedPickMarkSheet } from "~/components/direction-c/CSavedPickMarkSheet";
import { CTodayReasoning } from "~/components/direction-c/CTodayReasoning";
import { useInlineDayReading } from "~/hooks/useInlineDayReading";
import { useOnlineStatus } from "~/hooks/useOnlineStatus";
import { useOptionalProfile } from "~/hooks/useOptionalProfile";
import { useSavedPicks } from "~/hooks/useSavedPicks";
import { LichToPageCard } from "~/components/direction-c/LichToPageCard";
import { invokeBatTu } from "~/lib/bat-tu";
import { profileToBatTuPersonQuery } from "~/lib/bat-tu-birth";
import { parseDayDetailForView } from "~/lib/day-detail-view";
import {
  canUseCalendar,
  isNewUserDayLuanTeaser,
  isSubscriptionLapsed,
} from "~/lib/entitlements";
import { neverSubFreeDayReading } from "~/lib/entitlements";
import {
  buildCalendarLockedDayTeaser,
  pickDayDetailInlineLuanFallback,
} from "~/lib/home-bat-tu";
import { todayIsoInVn } from "~/lib/today-reading-cache";
import { CT } from "~/lib/c-tokens";
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
import { addDaysToIso } from "~/lib/tu-tru-dates";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [markSheetOpen, setMarkSheetOpen] = useState(false);
  const [rawPayload, setRawPayload] = useState<unknown | null>(null);
  const [detail, setDetail] = useState<ReturnType<typeof parseDayDetailForView> | null>(
    null,
  );

  const iso = ngay ?? "";
  const navState = location.state as NgayNavState | null;
  const savedPick = iso ? findSavedPickForDay(picks, iso) : undefined;
  const birthQuery = useMemo(
    () => (profile ? profileToBatTuPersonQuery(profile) : null),
    [profile],
  );
  const personalized = Boolean(birthQuery?.birth_date);
  const subActive = profile ? canUseCalendar(profile) : false;
  const calendarLocked = Boolean(user && profile && !subActive);
  const newUserTeaser = profile ? isNewUserDayLuanTeaser(profile) : false;
  const subscriptionExpired = Boolean(
    user && profile && personalized && isSubscriptionLapsed(profile),
  );
  const todayIso = todayIsoInVn();
  const neverSubTodayFree = profile
    ? neverSubFreeDayReading(profile, iso, todayIso)
    : false;
  const expectNlttLuan = subActive || neverSubTodayFree;
  const dayEngineFallback =
    detail && !expectNlttLuan
      ? calendarLocked
        ? buildCalendarLockedDayTeaser(detail)
        : pickDayDetailInlineLuanFallback(detail) || null
      : null;
  const menh = profile ? laSoJsonToRevealProps(profile.la_so)?.menh ?? null : null;
  const birthDate = birthQuery?.birth_date ?? null;

  const {
    text: readingText,
    loading: readingLoading,
    instantTyping,
    markTypingSeen,
  } = useInlineDayReading({
    iso,
    endpoint: "day-detail",
    batTuPayload: rawPayload,
    enabled: Boolean(detail && rawPayload && personalized && user),
    subActive,
    newUserTeaser,
  });

  useEffect(() => {
    if (profileLoading || !iso) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

      void (async () => {
      const body =
        personalized && birthQuery
          ? { ...birthQuery, date: iso }
          : { date: iso, mode: "generic", tz: "Asia/Ho_Chi_Minh" };

      const res = await invokeBatTu<unknown>({
        op: "day-detail",
        body,
      });
      if (cancelled) return;
      if (!res.ok) {
        setError(res.message ?? "Không tải chi tiết ngày.");
        setDetail(null);
        setRawPayload(null);
      } else {
        setRawPayload(res.data);
        setDetail(parseDayDetailForView(res.data));
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [profileLoading, iso, personalized, birthDate, birthQuery]);

  const prevIso = iso ? addDaysToIso(iso, -1) : "";
  const nextIso = iso ? addDaysToIso(iso, 1) : "";
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

  if (!profileLoading && subscriptionExpired) {
    return <CSubExpired />;
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
                  <CTodayReasoning
                    text={readingText}
                    fallbackText={dayEngineFallback}
                    loading={readingLoading && expectNlttLuan}
                    instant={instantTyping}
                    onTypingComplete={markTypingSeen}
                    onCtaClick={() =>
                      void navigate(calendarLocked ? "/dat-lich" : `/luan-ai/day-${iso}`)
                    }
                    showCta={Boolean(user) && (expectNlttLuan || calendarLocked)}
                    showCtaWithEngineFallback={calendarLocked}
                  />
                ) : null
              }
              rows={[
                {
                  key: "Nên",
                  value:
                    detail.goodFor.length > 0
                      ? detail.goodFor.join(", ")
                      : detail.catThanLabels.join(", ") || "—",
                  color: CT.forest,
                },
                {
                  key: "Tránh",
                  value:
                    detail.avoidFor.length > 0
                      ? detail.avoidFor.join(", ")
                      : detail.hungSatLabels.join(", ") || "—",
                  color: CT.red,
                },
                {
                  key: "Giờ tốt",
                  value: detail.gioTot || "—",
                  color: CT.goldDeep,
                },
              ]}
              prevLabel={
                prevIso
                  ? `${prevIso.slice(8, 10)}.${prevIso.slice(5, 7)} hôm trước`
                  : undefined
              }
              nextLabel={
                nextIso
                  ? `${nextIso.slice(8, 10)}.${nextIso.slice(5, 7)} hôm sau`
                  : undefined
              }
              onPrev={() => void navigate(`/ngay/${prevIso}`)}
              onNext={() => void navigate(`/ngay/${nextIso}`)}
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
