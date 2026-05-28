import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";

import { ErrorBanner } from "~/components/ErrorBanner";
import { CSubExpired } from "~/components/CSubExpired";
import { BackBar } from "~/components/brand";
import { COfflineBanner } from "~/components/direction-c/COfflineBanner";
import { CTodayReasoning } from "~/components/direction-c/CTodayReasoning";
import { DayScoreMethodologyCollapsible } from "~/components/direction-c/DayScoreMethodologyCollapsible";
import { useInlineDayReading } from "~/hooks/useInlineDayReading";
import { useOnlineStatus } from "~/hooks/useOnlineStatus";
import { useOptionalProfile } from "~/hooks/useOptionalProfile";
import { useSavedPicks } from "~/hooks/useSavedPicks";
import { LichToPageCard } from "~/components/direction-c/LichToPageCard";
import { invokeBatTu } from "~/lib/bat-tu";
import { profileToBatTuPersonQuery } from "~/lib/bat-tu-birth";
import { parseDayDetailForView } from "~/lib/day-detail-view";
import { canUseCalendar } from "~/lib/entitlements";
import { CT } from "~/lib/c-tokens";
import {
  dayNumberFromIso,
  mastheadFromIso,
  weekdayFromIso,
} from "~/lib/lich-format";
import { yearCanChiFromLunarDisplay } from "~/lib/home-bat-tu";
import { verdictLabelFromScore } from "~/lib/c-score";
import { laSoJsonToRevealProps } from "~/lib/la-so-ui";
import { addDaysToIso } from "~/lib/tu-tru-dates";

export function CDayDetailScreen() {
  const { ngay } = useParams();
  const navigate = useNavigate();
  const online = useOnlineStatus();
  const { user, profile, loading: profileLoading } = useOptionalProfile();
  const { savePick } = useSavedPicks();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [rawPayload, setRawPayload] = useState<unknown | null>(null);
  const [detail, setDetail] = useState<ReturnType<typeof parseDayDetailForView> | null>(
    null,
  );

  const iso = ngay ?? "";
  const birthQuery = useMemo(
    () => (profile ? profileToBatTuPersonQuery(profile) : null),
    [profile],
  );
  const personalized = Boolean(birthQuery?.birth_date);
  const calendarBlocked = Boolean(user && profile && personalized && !canUseCalendar(profile));
  const menh = profile ? laSoJsonToRevealProps(profile.la_so)?.menh ?? null : null;
  const birthDate = birthQuery?.birth_date ?? null;

  const { text: readingText, loading: readingLoading } = useInlineDayReading({
    iso,
    endpoint: "day-detail",
    batTuPayload: rawPayload,
    enabled: Boolean(detail && rawPayload && personalized && user),
  });

  useEffect(() => {
    if (profileLoading || !iso || calendarBlocked) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      const body =
        personalized && birthQuery
          ? { ...birthQuery, date: iso }
          : { date: iso };

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
  }, [profileLoading, iso, personalized, birthDate, birthQuery, calendarBlocked]);

  const prevIso = iso ? addDaysToIso(iso, -1) : "";
  const nextIso = iso ? addDaysToIso(iso, 1) : "";
  const monthNum = iso ? Number(iso.slice(5, 7)) : 0;

  const score = detail?.score ?? null;

  const verdictSub = useMemo(() => {
    if (menh) return <>cho mệnh {menh}</>;
    if (!personalized) {
      return (
        <Link to="/dang-nhap" className="underline" style={{ color: CT.goldDeep }}>
          Đăng nhập để xem cho mệnh bạn
        </Link>
      );
    }
    return null;
  }, [menh, personalized]);

  async function handleSavePick() {
    if (!detail || !iso || saving || !user) return;
    setSaving(true);
    const label =
      detail.goodFor[0] ??
      detail.catThanLabels[0] ??
      `Ngày ${iso.slice(8, 10)}.${iso.slice(5, 7)}`;
    const r = await savePick({
      source_endpoint: "day-detail",
      payload: detail,
      label,
      day_iso: iso,
      score: score ?? undefined,
    });
    setSaving(false);
    if (r.ok) toast.success("Đã lưu vào sổ ngày trên tab Tôi.");
    else toast.error(r.error ?? "Không lưu được.");
  }

  if (!profileLoading && calendarBlocked) {
    return <CSubExpired />;
  }

  return (
    <main
      className="flex min-h-full flex-col"
      style={{ background: CT.paper, color: CT.ink }}
    >
      {!online ? <COfflineBanner /> : null}
      <BackBar title={monthNum ? `Lịch tháng ${monthNum}` : "Chi tiết ngày"} />

      <div className="flex-1 overflow-y-auto px-[22px] pb-[100px] pt-[18px]">
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
                    fallbackText={detail.reasonLines[0] ?? null}
                    loading={readingLoading}
                    onCtaClick={() => void navigate(`/luan-ai/day-${iso}`)}
                    showCta={Boolean(user)}
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
                  ? `‹ ${prevIso.slice(8, 10)}.${prevIso.slice(5, 7)} hôm trước`
                  : undefined
              }
              nextLabel={
                nextIso
                  ? `${nextIso.slice(8, 10)}.${nextIso.slice(5, 7)} hôm sau ›`
                  : undefined
              }
              onPrev={() => void navigate(`/ngay/${prevIso}`)}
              onNext={() => void navigate(`/ngay/${nextIso}`)}
            />

            <DayScoreMethodologyCollapsible />

            {user && personalized ? (
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSavePick()}
                className="mt-4 flex min-h-[44px] w-full cursor-pointer items-center justify-center border-none uppercase tracking-widest disabled:opacity-60"
                style={{
                  padding: 12,
                  background: CT.forest,
                  color: CT.cream,
                  fontFamily: "var(--display-2)",
                  fontWeight: 800,
                  fontSize: 12,
                  letterSpacing: "0.08em",
                }}
              >
                {saving ? "Đang lưu…" : "Đánh dấu để nhắc trước 1 ngày"}
              </button>
            ) : null}
          </>
        ) : null}
      </div>
    </main>
  );
}
