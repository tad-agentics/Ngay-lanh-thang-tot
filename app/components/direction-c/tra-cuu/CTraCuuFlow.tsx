import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";

import { DirectionCScreenBoundary } from "~/components/direction-c/DirectionCScreenBoundary";
import { CTraCuuDayScreen } from "~/components/direction-c/tra-cuu/CTraCuuDayScreen";
import { CTraCuuEntryScreen } from "~/components/direction-c/tra-cuu/CTraCuuEntryScreen";
import { CTraCuuResultsScreen } from "~/components/direction-c/tra-cuu/CTraCuuResultsScreen";
import { CTraCuuThinkingScreen } from "~/components/direction-c/tra-cuu/CTraCuuThinkingScreen";
import { useDayLuanDailyQuota } from "~/hooks/useDayLuanDailyQuota";
import { useTraCuuFlowPick } from "~/hooks/useTraCuuFlowPick";
import { useProfile } from "~/hooks/useProfile";
import type { TuTruIntent } from "~/lib/api-types";
import type { ChonNgayKetQuaState } from "~/lib/chon-ngay-flow";
import { canUseCalendar } from "~/lib/entitlements";
import { laSoJsonToRevealProps } from "~/lib/la-so-ui";
import { CT } from "~/lib/c-tokens";
import { loadTraCuuIntroReading } from "~/lib/tra-cuu-readings-load";
import type { TraCuuRefineFilter, TraCuuScreen } from "~/lib/tra-cuu-flow-types";
import {
  TRA_CUU_DEFAULT_RANGE_LABEL,
  traCuuRangeLabelForDays,
  traCuuWeekendRangeLabel,
} from "~/lib/tra-cuu-range-label";
import {
  clearTraCuuFlow,
  consumeTraCuuFormPreset,
  loadTraCuuFlow,
  persistTraCuuFlow,
} from "~/lib/tra-cuu-session";
import { delayMs } from "~/lib/tra-cuu-pick";
import { setTraCuuThinkingOverlayActive } from "~/lib/tra-cuu-thinking-overlay";

const WEEKEND_FLASH_MS = 1250;

type CTraCuuFlowProps = {
  initialScreen?: TraCuuScreen;
  initialKetQua?: ChonNgayKetQuaState | null;
};

export function CTraCuuFlow({
  initialScreen = "entry",
  initialKetQua = null,
}: CTraCuuFlowProps) {
  const navigate = useNavigate();
  const entryScrollRef = useRef<HTMLDivElement>(null);
  const resultsScrollRef = useRef<HTMLDivElement>(null);
  const dayScrollRef = useRef<HTMLDivElement>(null);
  const { profile, loading: profileLoading } = useProfile();
  const calendarLocked = profile ? !canUseCalendar(profile) : false;
  const { busy, slow, runPick, cancel } = useTraCuuFlowPick();
  const { followUpRemaining, quotaLoaded, refreshQuota, setFollowUpRemaining } =
    useDayLuanDailyQuota(true);

  const hydrated = useRef(false);
  const [screen, setScreen] = useState<TraCuuScreen>(initialScreen);
  const [ketQua, setKetQua] = useState<ChonNgayKetQuaState | null>(
    initialKetQua,
  );
  const [intro, setIntro] = useState<string | null>(null);
  const [introLoading, setIntroLoading] = useState(false);
  const [filter, setFilter] = useState<TraCuuRefineFilter>("all");
  const [rangeDays, setRangeDays] = useState(30);
  const [rangeLabel, setRangeLabel] = useState(TRA_CUU_DEFAULT_RANGE_LABEL);
  const [selectedDayIso, setSelectedDayIso] = useState<string | null>(null);
  const [thinkingMeta, setThinkingMeta] = useState<{
    intentLabel: string;
    rangeLabel: string;
  } | null>(null);
  const [initialIntent, setInitialIntent] = useState<TuTruIntent | undefined>();
  const [entryPillText, setEntryPillText] = useState<string | undefined>();
  const [weekendFlash, setWeekendFlash] = useState(false);

  const menh = profile ? laSoJsonToRevealProps(profile.la_so)?.menh ?? null : null;

  const resetToEntry = useCallback(() => {
    setKetQua(null);
    setIntro(null);
    setSelectedDayIso(null);
    setFilter("all");
    setRangeLabel(TRA_CUU_DEFAULT_RANGE_LABEL);
    setRangeDays(30);
    clearTraCuuFlow();
  }, []);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;

    if (initialKetQua?.payload) {
      setKetQua(initialKetQua);
      setScreen(initialScreen);
      const days = initialKetQua.daysInclusive ?? 30;
      setRangeDays(days);
      setRangeLabel(traCuuRangeLabelForDays(days));
      const stored = loadTraCuuFlow();
      if (stored?.intro) setIntro(stored.intro);
      if (stored?.filter) {
        setFilter(stored.filter);
        if (stored.filter === "weekend") {
          setRangeLabel(traCuuWeekendRangeLabel(days));
        }
      }
      if (initialScreen === "results" && !stored?.intro) {
        void loadTraCuuIntroReading(initialKetQua.payload).then((text) => {
          setIntro(text);
          persistTraCuuFlow({
            ...initialKetQua,
            intro: text,
            filter: stored?.filter ?? "all",
            screen: "results",
          });
        });
      }
      return;
    }

    const stored = loadTraCuuFlow();
    if (stored?.payload) {
      setKetQua(stored);
      setIntro(stored.intro ?? null);
      setFilter(stored.filter ?? "all");
      const days = stored.daysInclusive ?? 30;
      setRangeDays(days);
      setRangeLabel(
        stored.filter === "weekend"
          ? traCuuWeekendRangeLabel(days)
          : traCuuRangeLabelForDays(days),
      );
      setSelectedDayIso(stored.selectedDayIso ?? null);
      setScreen(stored.screen ?? "results");
    }

    const preset = consumeTraCuuFormPreset();
    if (preset) {
      setInitialIntent(preset.intent);
      setRangeDays(preset.daysInclusive);
    }
  }, [initialKetQua, initialScreen]);

  useEffect(() => {
    const ref =
      screen === "entry"
        ? entryScrollRef
        : screen === "results"
          ? resultsScrollRef
          : screen === "day"
            ? dayScrollRef
            : null;
    ref?.current?.scrollTo(0, 0);
  }, [screen, selectedDayIso]);

  const persistCurrent = useCallback(
    (
      patch: Partial<{
        intro: string | null;
        filter: TraCuuRefineFilter;
        screen: TraCuuScreen;
        selectedDayIso: string | null;
      }>,
    ) => {
      if (!ketQua) return;
      persistTraCuuFlow({
        ...ketQua,
        intro,
        filter,
        screen: patch.screen ?? screen,
        selectedDayIso:
          patch.selectedDayIso !== undefined
            ? patch.selectedDayIso
            : selectedDayIso,
        ...patch,
      });
    },
    [ketQua, intro, filter, screen, selectedDayIso],
  );

  const loadIntro = useCallback(async (state: ChonNgayKetQuaState) => {
    setIntroLoading(true);
    const text = await loadTraCuuIntroReading(state.payload);
    setIntro(text);
    setIntroLoading(false);
    persistTraCuuFlow({
      ...state,
      intro: text,
      filter: "all",
      screen: "results",
    });
  }, []);

  const startSearch = useCallback(
    async (intent: TuTruIntent, intentLabel: string, days = rangeDays) => {
      setEntryPillText(undefined);
      const nextRangeLabel = traCuuRangeLabelForDays(days);
      setThinkingMeta({
        intentLabel,
        rangeLabel: nextRangeLabel,
      });
      setScreen("thinking");

      const result = await runPick({ intent, intentLabel, rangeDays: days });
      if (!result) {
        setScreen(ketQua ? "results" : "entry");
        return;
      }

      setKetQua(result);
      setFilter("all");
      setRangeDays(days);
      setRangeLabel(nextRangeLabel);
      setIntro(null);
      setScreen("results");
      persistTraCuuFlow({
        ...result,
        intro: null,
        filter: "all",
        screen: "results",
      });
      void loadIntro(result);
    },
    [ketQua, loadIntro, rangeDays, runPick],
  );

  const handleRefine = useCallback(
    async (next: TraCuuRefineFilter) => {
      if (!ketQua) return;

      if (next === "extended90") {
        setFilter("all");
        await startSearch(ketQua.intent, ketQua.intentLabel, 90);
        return;
      }

      if (next === "all") {
        setFilter("all");
        if (ketQua.daysInclusive !== 30) {
          await startSearch(ketQua.intent, ketQua.intentLabel, 30);
        } else {
          setRangeLabel(TRA_CUU_DEFAULT_RANGE_LABEL);
          persistCurrent({ screen: "results", filter: "all" });
        }
        return;
      }

      if (next === "weekend") {
        setWeekendFlash(true);
        setScreen("thinking");
        setThinkingMeta({
          intentLabel: ketQua.intentLabel,
          rangeLabel: traCuuWeekendRangeLabel(rangeDays),
        });
        await delayMs(WEEKEND_FLASH_MS);
        setWeekendFlash(false);
        setFilter("weekend");
        setRangeLabel(traCuuWeekendRangeLabel(rangeDays));
        setScreen("results");
        persistCurrent({ screen: "results", filter: "weekend" });
      }
    },
    [ketQua, persistCurrent, rangeDays, startSearch],
  );

  const showThinking =
    screen === "thinking" || weekendFlash || (busy && screen !== "entry");

  useEffect(() => {
    setTraCuuThinkingOverlayActive(showThinking);
    return () => setTraCuuThinkingOverlayActive(false);
  }, [showThinking]);

  const goToEntry = useCallback(
    (prefillText?: string) => {
      resetToEntry();
      setScreen("entry");
      setEntryPillText(prefillText?.trim() || undefined);
    },
    [resetToEntry],
  );

  const thinkingBack = () => {
    cancel();
    setWeekendFlash(false);
    if (ketQua && screen !== "entry") {
      setScreen("results");
    } else {
      goToEntry();
    }
  };

  return (
    <DirectionCScreenBoundary screen="Tra cứu">
      <div
        className="relative flex min-h-full flex-col"
        style={{ background: CT.paper, color: CT.ink, fontFamily: "var(--serif)" }}
      >
        {screen === "entry" ? (
          <CTraCuuEntryScreen
            profile={profile}
            profileLoading={profileLoading}
            calendarLocked={calendarLocked}
            disabled={busy}
            initialIntent={initialIntent}
            initialPillText={entryPillText}
            scrollRef={entryScrollRef}
            onNeedSubscription={() => void navigate("/dat-lich")}
            onSubmit={(intent, intentLabel) => void startSearch(intent, intentLabel)}
          />
        ) : null}

        {screen === "results" && ketQua ? (
          <CTraCuuResultsScreen
            state={ketQua}
            rangeLabel={rangeLabel}
            intro={intro}
            introLoading={introLoading}
            filter={filter}
            quotaRemaining={followUpRemaining}
            quotaLoaded={quotaLoaded}
            scrollRef={resultsScrollRef}
            onBack={() => goToEntry()}
            onChangeTask={(prefill) => goToEntry(prefill)}
            onStartSearch={(intent, intentLabel) =>
              void startSearch(intent, intentLabel)
            }
            onQuotaChange={setFollowUpRemaining}
            onOpenDay={(iso) => {
              setSelectedDayIso(iso);
              setScreen("day");
              persistCurrent({ screen: "day", selectedDayIso: iso });
              void refreshQuota();
            }}
            onRefine={(f) => void handleRefine(f)}
          />
        ) : null}

        {screen === "day" && ketQua && selectedDayIso ? (
          <CTraCuuDayScreen
            key={selectedDayIso}
            iso={selectedDayIso}
            intent={ketQua.intent}
            intentLabel={ketQua.intentLabel}
            quotaLoaded={quotaLoaded}
            scrollRef={dayScrollRef}
            onQuotaChange={setFollowUpRemaining}
            onBack={() => {
              setScreen("results");
              persistCurrent({ screen: "results" });
              void refreshQuota();
            }}
          />
        ) : null}

        {showThinking && thinkingMeta ? (
          <CTraCuuThinkingScreen
            intentLabel={thinkingMeta.intentLabel}
            menh={menh}
            rangeLabel={thinkingMeta.rangeLabel}
            slow={slow}
            onBack={thinkingBack}
            onCancel={thinkingBack}
          />
        ) : null}
      </div>
    </DirectionCScreenBoundary>
  );
}
