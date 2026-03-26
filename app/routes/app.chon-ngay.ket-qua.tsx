import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";

const ChonNgayLoadingPanel = lazy(() =>
  import("~/components/chon-ngay/ChonNgayLoadingPanel").then((m) => ({
    default: m.ChonNgayLoadingPanel,
  })),
);
const ResultDayCard = lazy(() =>
  import("~/components/chon-ngay/ResultDayCard").then((m) => ({
    default: m.ResultDayCard,
  })),
);
import { chonNgayMethodologyHash } from "~/components/chon-ngay/ChonNgayMethodologyCollapsible";
import { ErrorBanner } from "~/components/ErrorBanner";
import { ScreenHeader } from "~/components/ScreenHeader";
import { Button } from "~/components/ui/button";
import { extractDetailReasonLines } from "~/lib/chon-ngay-detail";
import type { ChonNgayKetQuaState } from "~/lib/chon-ngay-flow";
import {
  mapChonNgayPayloadToResultDays,
  mergeReasonsIntoDays,
} from "~/lib/chon-ngay-result";
import { invokeBatTu } from "~/lib/bat-tu";
import { profileToBatTuPersonQuery } from "~/lib/bat-tu-birth";
import { isoDateToDdMmYyyy } from "~/lib/tu-tru-dates";
import { useFeatureCosts } from "~/hooks/useFeatureCosts";
import { useProfile } from "~/hooks/useProfile";
import type { ResultDay } from "~/lib/api-types";
import { laSoJsonToRevealProps, profileHasLaso } from "~/lib/la-so-ui";
import { subscriptionActive } from "~/lib/subscription";

type Phase = 0 | 1 | 2;

export default function AppChonNgayKetQua() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as ChonNgayKetQuaState | null;

  const { profile, loading: profileLoading, refresh } = useProfile();
  const { costs } = useFeatureCosts();

  const [phase, setPhase] = useState<Phase>(0);
  const [showResults, setShowResults] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [resultDays, setResultDays] = useState<ResultDay[]>([]);
  const [unlockedDetail, setUnlockedDetail] = useState(false);
  const [detailBusy, setDetailBusy] = useState(false);

  useEffect(() => {
    if (!state?.payload) {
      navigate("/app/chon-ngay", { replace: true });
    }
  }, [state, navigate]);

  const parsedDays = useMemo(
    () => (state?.payload ? mapChonNgayPayloadToResultDays(state.payload, 5) : []),
    [state?.payload],
  );

  useEffect(() => {
    if (!state?.payload) return;
    setResultDays(parsedDays);
    setUnlockedDetail(false);
    setPhase(0);
    setShowResults(false);
    setShowShare(false);
  }, [state?.payload, parsedDays]);

  useEffect(() => {
    if (!state?.payload) return;
    const t1 = window.setTimeout(() => setPhase(1), 800);
    const t2 = window.setTimeout(() => setPhase(2), 1800);
    const t3 = window.setTimeout(() => setShowResults(true), 2600);
    const t4 = window.setTimeout(() => setShowShare(true), 4600);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.clearTimeout(t4);
    };
  }, [state?.payload]);

  const perDetail = costs["chon_ngay_detail"]?.credit_cost ?? 2;
  const detailTotal = perDetail * Math.max(1, resultDays.length);
  const hasSub = subscriptionActive(profile?.subscription_expires_at);
  const canBulkDetail =
    hasSub || (profile?.credits_balance ?? 0) >= detailTotal;
  const anyNeedsDetail = resultDays.some((d) => d.reasons.length === 0);

  async function runDetailUnlock() {
    if (!state || !profile?.ngay_sinh) return;
    if (!canBulkDetail) {
      navigate("/app/mua-luong");
      return;
    }
    const base = profileToBatTuPersonQuery(profile);
    setDetailBusy(true);
    let next = [...resultDays];
    for (const d of resultDays) {
      if (d.reasons.length > 0) continue;
      const dateDm = isoDateToDdMmYyyy(d.isoDate);
      if (!dateDm) continue;
      const res = await invokeBatTu({
        op: "chon-ngay/detail",
        body: {
          ...base,
          intent: state.intent,
          date: dateDm,
        },
      });
      if (!res.ok) {
        toast.error(res.message);
        setDetailBusy(false);
        return;
      }
      const lines = extractDetailReasonLines(res.data);
      next = mergeReasonsIntoDays(
        next,
        d.isoDate,
        lines.length
          ? lines
          : ["Không có lý do chi tiết trong phản hồi API."],
      );
    }
    setResultDays(next);
    setUnlockedDetail(true);
    await refresh();
    setDetailBusy(false);
    toast.success("Đã tải lý do chi tiết.");
  }

  if (!state) {
    return null;
  }

  const bestDay = resultDays[0];
  const menhLabel =
    profile && profileHasLaso(profile.la_so)
      ? (laSoJsonToRevealProps(profile.la_so)?.menh ?? null)
      : null;

  return (
    <div className="min-h-[50vh] px-4 pb-10 bg-[#E9E5DE]">
      <ScreenHeader
        title={state.intentLabel}
        subtitle={`${state.daysInclusive} ngày tới`}
        centerTitle
        className="pb-2"
      />

      {!showResults ? (
        <ChonNgayLoadingPanel
          dayCount={state.daysInclusive}
          menh={menhLabel}
          resultCount={Math.max(parsedDays.length, 3)}
          phase={phase}
        />
      ) : (
        <div className="flex flex-col gap-3.5">
          {parsedDays.length === 0 ? (
            <div className="space-y-3">
              <ErrorBanner message="Chưa đọc được danh sách ngày từ API — xem JSON gốc bên dưới để chỉnh mapper." />
              <pre className="text-xs bg-card border border-border rounded-xl p-4 overflow-x-auto whitespace-pre-wrap break-words">
                {JSON.stringify(state.payload, null, 2)}
              </pre>
            </div>
          ) : (
            <>
              <p className="text-[#6b6558] text-[13px] leading-relaxed pb-0.5">
                {resultDays.length} ngày phù hợp — sắp theo độ ưu tiên
              </p>
              <p className="text-[#6b6558] text-[12px] leading-relaxed pb-0.5 -mt-0.5">
                <Link
                  to={`/app/chon-ngay#${chonNgayMethodologyHash()}`}
                  className="underline font-medium text-[#5c574a] hover:text-foreground"
                >
                  Cách chúng tôi chọn ngày cho bạn
                </Link>
                {" "}
                — lọc ngày dữ chung, đối chiếu lá số, rồi xếp hạng theo mệnh.
              </p>

              <Suspense
                fallback={
                  <p className="text-muted-foreground text-sm py-4">
                    Đang tải kết quả…
                  </p>
                }
              >
                {resultDays.map((day, i) => (
                  <ResultDayCard
                    key={day.isoDate}
                    grade={day.grade}
                    dateLabel={day.dateLabel}
                    lunarLabel={day.lunarLabel}
                    truc={day.truc}
                    bestHour={day.bestHour}
                    bestHourSlots={day.bestHourSlots}
                    reasons={unlockedDetail ? day.reasons : []}
                    animationIndex={i}
                    detailHref={`/app/ngay/${day.isoDate}`}
                    menh={menhLabel ?? undefined}
                  />
                ))}
              </Suspense>

              {!unlockedDetail && anyNeedsDetail ? (
                <div
                  className="border border-[#D8D4CC] bg-white px-4 py-5 rounded-[18px] shadow-sm"
                >
                  {profileLoading ? (
                    <p className="text-muted-foreground text-sm text-center">
                      Đang tải hồ sơ…
                    </p>
                  ) : canBulkDetail ? (
                    <>
                      <p className="text-foreground text-sm leading-relaxed text-center mb-4 px-1">
                        Xem lý do chi tiết cho {resultDays.length} ngày trên
                      </p>
                      <Button
                        type="button"
                        disabled={detailBusy}
                        onClick={() => void runDetailUnlock()}
                        className="w-full min-h-12 rounded-2xl border-0 bg-[#C9A64A] font-bold text-black shadow-none hover:bg-[#B8943F] disabled:opacity-60"
                      >
                        {detailBusy
                          ? "Đang tải…"
                          : `+${detailTotal} lượng`}
                      </Button>
                      <p className="text-[11px] text-muted-foreground text-center mt-2.5">
                        {perDetail} lượng × {resultDays.length} ngày
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-muted-foreground text-sm leading-relaxed text-center mb-4">
                        Cần{" "}
                        <span className="text-foreground font-medium tabular-nums">
                          {detailTotal} lượng
                        </span>{" "}
                        để xem lý do. Số dư:{" "}
                        <span className="text-foreground font-medium">
                          {subscriptionActive(profile?.subscription_expires_at)
                            ? "Không giới hạn lượng"
                            : `${profile?.credits_balance ?? 0} lượng`}
                        </span>
                        .
                      </p>
                      <Button
                        size="cta_sm"
                        asChild
                        className="w-full rounded-2xl border-0 bg-[#C9A64A] font-bold text-black shadow-none hover:bg-[#B8943F]"
                      >
                        <Link to="/app/mua-luong">Mua thêm lượng</Link>
                      </Button>
                    </>
                  )}
                </div>
              ) : null}

              {showShare && bestDay ? (
                <div className="mt-1">
                  <Button variant="outline" size="cta_sm" asChild>
                    <Link
                      to="/app/chia-se"
                      state={{
                        resultType: "day_pick",
                        suKien: state.intentLabel,
                        day: {
                          dateLabel: bestDay.dateLabel,
                          lunarLabel: bestDay.lunarLabel,
                          reasons:
                            bestDay.reasons.length > 0
                              ? bestDay.reasons
                              : [
                                  `${bestDay.truc} · giờ tốt ${bestDay.bestHour}`,
                                ],
                        },
                        grade: bestDay.grade,
                      }}
                    >
                      Chia sẻ ngày lành
                    </Link>
                  </Button>
                </div>
              ) : null}

              {unlockedDetail && bestDay ? (
                <p
                  className="text-muted-foreground text-xs text-center pt-1"
                  style={{ fontFamily: "var(--font-ibm-mono)" }}
                >
                  Đã mở lý do chi tiết — giờ tốt gợi ý: {bestDay.bestHour}.
                </p>
              ) : null}
            </>
          )}
        </div>
      )}
    </div>
  );
}
