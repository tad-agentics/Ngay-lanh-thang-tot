import { useEffect, useMemo, useRef, useState } from "react";

import { BackBar, Mono } from "~/components/brand";
import { CBaziReadingChapter } from "~/components/direction-c/CBaziReadingChapter";
import { CBaziReadingLoadProgress } from "~/components/direction-c/CBaziReadingLoadProgress";
import { CBaziReadingPaywallView } from "~/components/direction-c/CBaziReadingPaywallView";
import { ReadingLoadFallback } from "~/components/direction-c/ReadingLoadFallback";
import type { LaSoJson } from "~/lib/api-types";
import { useProfile } from "~/hooks/useProfile";
import { profileToBatTuPersonQuery } from "~/lib/bat-tu-birth";
import {
  deliveryToLoadResult,
  fetchBaziReadingDelivery,
} from "~/lib/bazi-reading-delivery";
import {
  baziReadingDeliveryIsComplete,
  buildBaziSkeletonChapters,
  fetchBaziReadingFactsBundle,
  loadBaziReadingFull,
  type BaziReadingFactsBundle,
  type BaziReadingLoadResult,
} from "~/lib/bazi-reading-load";
import { setBaziReadingScreenLoadActive } from "~/lib/bazi-reading-load-coord";
import { cancelBaziReadingPrewarm } from "~/lib/bazi-reading-prewarm";
import {
  createInitialChapterLoadState,
  deriveChapterLoadState,
  type BaziChapterLoadState,
} from "~/lib/bazi-chapter-load";
import { deriveBaziLoadProgress } from "~/lib/bazi-reading-progress";
import {
  buildBaziDisplayChapters,
  type BaziDisplayChapter,
} from "~/lib/bazi-reading-outline";
import type { LaSoChiTietSection } from "~/lib/generate-reading";
import {
  type BaziReadingSessionData,
  baziReadingCacheRevision,
  currentYearVn,
  persistBaziReadingSession,
  readBaziReadingSession,
} from "~/lib/bazi-reading-session";
import { CT } from "~/lib/c-tokens";
import { canUseBaziReading } from "~/lib/entitlements";
import { LUAN_LA_SO_BAT_TU_TITLE } from "~/lib/luan-la-so-bat-tu-labels";
import { formatProfileBirthSubline } from "~/lib/profile-birth-line";

type CachedChapterInput = BaziReadingSessionData & {
  phongThuyFetchError?: string | null;
};

function buildChaptersFromLoadResult(
  partial: CachedChapterInput,
  profileLaSo: LaSoJson | null,
  options?: {
    chapterLoad?: BaziChapterLoadState;
    instantProse?: boolean;
  },
): BaziDisplayChapter[] {
  return buildBaziDisplayChapters({
    sections: partial.sections,
    laSo: partial.laSoDisplay ?? profileLaSo,
    luuNienFactsRaw: partial.luuNienFactsRaw,
    phongThuyFactsRaw: partial.phongThuyFactsRaw,
    yearCanChi: partial.yearCanChi,
    phongThuyFetchError: partial.phongThuyFetchError ?? null,
    chapterLoad: options?.chapterLoad,
  });
}

function cachedDeliveryIsComplete(
  sections: LaSoChiTietSection[],
  luuNienFactsRaw: unknown | null,
  phongThuyFactsRaw: unknown | null,
): boolean {
  return baziReadingDeliveryIsComplete(sections, {
    luuNienFactsRaw,
    phongThuyFactsRaw,
  });
}

function chaptersFromSession(
  cached: NonNullable<ReturnType<typeof readBaziReadingSession>>,
  profileLaSo: LaSoJson | null,
): BaziDisplayChapter[] {
  return buildChaptersFromLoadResult(cached, profileLaSo, {
    instantProse: true,
  });
}

function persistPartialBaziSession(
  profileId: string,
  revision: string,
  partial: BaziReadingLoadResult,
): void {
  if (partial.sections.length === 0) return;
  persistBaziReadingSession(profileId, revision, {
    sections: partial.sections,
    yearCanChi: partial.yearCanChi,
    laSoDisplay: partial.laSoDisplay,
    luuNienFactsRaw: partial.luuNienFactsRaw,
    phongThuyFactsRaw: partial.phongThuyFactsRaw,
  });
}

function applyCachedChapters(
  fromCache: CachedChapterInput,
  profileLaSo: LaSoJson | null,
): BaziDisplayChapter[] {
  return buildChaptersFromLoadResult(fromCache, profileLaSo, {
    chapterLoad: deriveChapterLoadState(fromCache.sections, {
      luuNienFactsRaw: fromCache.luuNienFactsRaw,
      phongThuyFactsRaw: fromCache.phongThuyFactsRaw,
      phongThuyFetchError: fromCache.phongThuyFetchError ?? null,
      bundleFinished: true,
    }),
    instantProse: true,
  });
}

export function CBaziReadingScreen() {
  const { profile, loading: profileLoading } = useProfile();
  const [chapters, setChapters] = useState<BaziDisplayChapter[] | null>(null);
  const [generating, setGenerating] = useState(true);
  /** DB/session cache — hiện luận ngay, không typewriter. */
  const [instantProse, setInstantProse] = useState(false);
  const [chapterLoad, setChapterLoad] = useState<BaziChapterLoadState>(
    createInitialChapterLoadState(),
  );
  const [yearCanChiLabel, setYearCanChiLabel] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const genRef = useRef(0);
  const factsRef = useRef<BaziReadingFactsBundle | null>(null);
  const partialLoadRef = useRef<BaziReadingLoadResult | null>(null);
  const needsVisibleResumeRef = useRef(false);
  const resumeLoadRef = useRef<(() => Promise<void>) | null>(null);
  const visibleResumeInFlightRef = useRef(false);
  const fullLoadInFlightRef = useRef(false);
  const runFullLoadRef = useRef<
    (
      preloadedFacts?: BaziReadingFactsBundle,
      opts?: { screenPriority?: boolean; forceRegenerate?: boolean },
    ) => Promise<void>
  >(null);
  const unlocked = canUseBaziReading(profile);
  const year = currentYearVn();
  const birthReady = Boolean(
    profile && profileToBatTuPersonQuery(profile).birth_date,
  );

  useEffect(() => {
    if (profileLoading || !profile) return;
    if (!unlocked) {
      setGenerating(false);
      setInstantProse(false);
      setChapters(null);
      return;
    }

    const body = profileToBatTuPersonQuery(profile);
    if (!body.birth_date) {
      setGenerating(false);
      setChapters(null);
      return;
    }

    let cancelled = false;
    setLoadError(null);
    cancelBaziReadingPrewarm(profile, year);
    const profileLaSo = (profile.la_so as LaSoJson) ?? null;
    const sessionRevision = baziReadingCacheRevision(profile, year);

    const factsPromise = fetchBaziReadingFactsBundle(profile, year, {
      silentPhongThuyToast: true,
    });
    const dbPromise = fetchBaziReadingDelivery(profile, year);

    void (async () => {
      try {
        let partialHydrated = false;
        const [dbDelivery, factsEarly] = await Promise.all([
          dbPromise,
          factsPromise,
        ]);
        if (cancelled) return;

        if (factsEarly) {
          factsRef.current = factsEarly;
        }

        if (dbDelivery) {
          const fromDb = deliveryToLoadResult(dbDelivery);
          if (
            cachedDeliveryIsComplete(
              fromDb.sections,
              fromDb.luuNienFactsRaw,
              fromDb.phongThuyFactsRaw,
            )
          ) {
            setYearCanChiLabel(fromDb.yearCanChi);
            setInstantProse(true);
            setGenerating(false);
            setChapters(applyCachedChapters(fromDb, profileLaSo));
            return;
          }
          if (fromDb.sections.length > 0) {
            partialHydrated = true;
            const partialLoad = deriveChapterLoadState(fromDb.sections, {
              luuNienFactsRaw: fromDb.luuNienFactsRaw,
              phongThuyFactsRaw: fromDb.phongThuyFactsRaw,
              bundleFinished: false,
            });
            setYearCanChiLabel(fromDb.yearCanChi);
            setChapterLoad(partialLoad);
            setChapters(
              buildChaptersFromLoadResult(fromDb, profileLaSo, {
                chapterLoad: partialLoad,
                instantProse: true,
              }),
            );
            setGenerating(true);
          }
        }

        const cached = readBaziReadingSession(profile.id, sessionRevision);
        if (
          cached &&
          cachedDeliveryIsComplete(
            cached.sections,
            cached.luuNienFactsRaw,
            cached.phongThuyFactsRaw,
          )
        ) {
          setYearCanChiLabel(cached.yearCanChi);
          setInstantProse(true);
          setGenerating(false);
          setChapters(chaptersFromSession(cached, profileLaSo));
          return;
        }

        if (cached && cached.sections.length > 0 && !partialHydrated) {
          partialHydrated = true;
          const partialLoad = deriveChapterLoadState(cached.sections, {
            luuNienFactsRaw: cached.luuNienFactsRaw,
            phongThuyFactsRaw: cached.phongThuyFactsRaw,
            bundleFinished: false,
          });
          setYearCanChiLabel(cached.yearCanChi);
          setChapterLoad(partialLoad);
          setChapters(
            buildChaptersFromLoadResult(cached, profileLaSo, {
              chapterLoad: partialLoad,
              instantProse: true,
            }),
          );
          setGenerating(true);
        }

        const facts = factsEarly;
        if (facts && !partialHydrated) {
          setYearCanChiLabel(facts.yearCanChi);
          setInstantProse(false);
          setChapterLoad(createInitialChapterLoadState());
          setChapters(buildBaziSkeletonChapters(facts));
          setGenerating(true);
        }

        await runFullLoad(facts ?? undefined, { screenPriority: true });
      } catch {
        if (!cancelled) {
          setLoadError("Không tải được luận giải. Thử lại sau.");
          setGenerating(false);
        }
      }
    })();

    async function runFullLoad(
      preloadedFacts?: BaziReadingFactsBundle,
      opts?: { screenPriority?: boolean; forceRegenerate?: boolean },
    ) {
      if (!profile) return;
      if (fullLoadInFlightRef.current && opts?.screenPriority) {
        fullLoadInFlightRef.current = false;
      }
      if (fullLoadInFlightRef.current && !opts?.screenPriority) return;

      fullLoadInFlightRef.current = true;
      const gen = ++genRef.current;
      if (cancelled) {
        fullLoadInFlightRef.current = false;
        return;
      }
      setLoadError(null);
      setInstantProse(false);
      setGenerating(true);
      setBaziReadingScreenLoadActive(true);

      let full: BaziReadingLoadResult | undefined;
      try {
        let facts = preloadedFacts ?? factsRef.current ?? undefined;
        if (!facts) {
          facts =
            (await fetchBaziReadingFactsBundle(profile, year, {
              silentPhongThuyToast: true,
            })) ?? undefined;
          if (cancelled || gen !== genRef.current) {
            if (gen === genRef.current) setGenerating(false);
            return;
          }
          if (!facts) {
            setLoadError(
              "Không tải được lá số hoặc dữ liệu năm. Kiểm tra kết nối và thử lại.",
            );
            setGenerating(false);
            return;
          }
          factsRef.current = facts;
          setYearCanChiLabel(facts.yearCanChi);
          setChapterLoad(createInitialChapterLoadState());
          setChapters(buildBaziSkeletonChapters(facts));
        }

        full = await loadBaziReadingFull(profile, year, {
          forceRegenerate: opts?.forceRegenerate === true,
          loadSource: "screen",
          preloadedFacts: facts,
          onProgress: (partial, nextChapterLoad) => {
            if (cancelled || gen !== genRef.current) return;
            partialLoadRef.current = partial;
            setYearCanChiLabel(partial.yearCanChi);
            setChapterLoad(nextChapterLoad);
            persistPartialBaziSession(profile.id, sessionRevision, partial);
            setChapters(
              buildChaptersFromLoadResult(partial, profileLaSo, {
                chapterLoad: nextChapterLoad,
                instantProse: false,
              }),
            );
          },
        });
      } catch {
        if (gen === genRef.current && !cancelled) {
          setLoadError("Không tải được luận giải. Thử lại sau.");
          setGenerating(false);
        }
        return;
      } finally {
        fullLoadInFlightRef.current = false;
        if (gen === genRef.current) {
          setBaziReadingScreenLoadActive(false);
        }
      }

      if (cancelled || gen !== genRef.current || !full) {
        if (gen === genRef.current) setGenerating(false);
        return;
      }

      partialLoadRef.current = full;
      const finishedLoad = deriveChapterLoadState(full.sections, {
        luuNienFactsRaw: full.luuNienFactsRaw,
        phongThuyFactsRaw: full.phongThuyFactsRaw,
        phongThuyFetchError: full.phongThuyFetchError,
        bundleFinished: true,
      });
      setYearCanChiLabel(full.yearCanChi);
      setChapterLoad(finishedLoad);
      setChapters(
        buildChaptersFromLoadResult(full, profileLaSo, {
          chapterLoad: finishedLoad,
          instantProse: false,
        }),
      );
      if (full.sections.length > 0) {
        persistPartialBaziSession(profile.id, sessionRevision, full);
      } else {
        const laSo = full.laSoDisplay ?? profileLaSo;
        const hasLaSo =
          laSo != null &&
          typeof laSo === "object" &&
          Object.keys(laSo as object).length > 0;
        if (!hasLaSo) {
          setLoadError(
            "Luận giải chưa được tạo — có thể do giới hạn tải. Thử lại sau vài phút.",
          );
        }
      }
      needsVisibleResumeRef.current = Boolean(
        full.networkInterrupted &&
          !cachedDeliveryIsComplete(
            full.sections,
            full.luuNienFactsRaw,
            full.phongThuyFactsRaw,
          ),
      );
      setGenerating(false);
    }

    runFullLoadRef.current = runFullLoad;
    resumeLoadRef.current = () => runFullLoad(factsRef.current ?? undefined);

    return () => {
      cancelled = true;
      fullLoadInFlightRef.current = false;
      setBaziReadingScreenLoadActive(false);
      resumeLoadRef.current = null;
      runFullLoadRef.current = null;
    };
  }, [profile, profileLoading, unlocked, year]);

  useEffect(() => {
    if (!profile || !unlocked) return;

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (!needsVisibleResumeRef.current) return;
      if (generating || visibleResumeInFlightRef.current) return;
      if (!factsRef.current) return;

      needsVisibleResumeRef.current = false;
      visibleResumeInFlightRef.current = true;
      void resumeLoadRef.current?.().finally(() => {
        visibleResumeInFlightRef.current = false;
      });
    };

    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [profile, unlocked, generating]);

  const retryLoad = () => {
    if (!profile || !unlocked) return;
    setLoadError(null);
    setInstantProse(false);
    void (async () => {
      const facts =
        factsRef.current ??
        (await fetchBaziReadingFactsBundle(profile, year));
      if (facts) {
        factsRef.current = facts;
        setYearCanChiLabel(facts.yearCanChi);
        setChapterLoad(createInitialChapterLoadState());
        setChapters(buildBaziSkeletonChapters(facts));
      }
      await runFullLoadRef.current?.(facts ?? undefined, {
        screenPriority: true,
        forceRegenerate: true,
      });
    })();
  };

  const loadProgress = useMemo(() => {
    if (!generating || instantProse) return null;
    return deriveBaziLoadProgress(chapterLoad, yearCanChiLabel);
  }, [generating, instantProse, chapterLoad, yearCanChiLabel]);

  const hasContent = useMemo(
    () =>
      chapters?.some((ch) => {
        if (ch.kind === "menh") {
          const hasLaSo =
            ch.laSo != null &&
            typeof ch.laSo === "object" &&
            Object.keys(ch.laSo).length > 0;
          return hasLaSo || ch.proseLoading || Boolean(ch.prose.trim());
        }
        if (ch.kind === "tinh_cach") {
          return (
            ch.luanLoading ||
            ch.traits.length > 0 ||
            Boolean(ch.introProse.trim() || ch.prose.trim())
          );
        }
        if (ch.kind === "van_nam") {
          return Boolean(ch.facts) || ch.luanLoading || Boolean(ch.prose);
        }
        if (ch.kind === "phong_thuy") {
          return Boolean(ch.facts) || ch.proseLoading || Boolean(ch.prose);
        }
        if (ch.kind === "quy_nhan") {
          return (
            Boolean(ch.quyNhan || ch.daiVanNext) ||
            ch.proseLoading ||
            Boolean(ch.prose)
          );
        }
        return false;
      }) ?? false,
    [chapters],
  );

  if (profileLoading) {
    return (
      <main className="min-h-[100svh]" style={{ background: CT.paper }}>
        <BackBar title={LUAN_LA_SO_BAT_TU_TITLE} />
        <p className="px-6 font-serif text-sm" style={{ color: CT.muted }}>
          Đang mở lá số…
        </p>
      </main>
    );
  }

  if (!unlocked && profile) {
    return <CBaziReadingPaywallView profile={profile} />;
  }

  return (
    <main
      className="flex min-h-[100svh] flex-col"
      style={{ background: CT.paper, color: CT.ink, fontFamily: "var(--serif)" }}
    >
      <BackBar
        title={`${LUAN_LA_SO_BAT_TU_TITLE} · ${year}`}
        endAdornment={<Mono style={{ color: CT.muted, fontSize: 9.5 }}>Học thuật cổ thư</Mono>}
      />

      <div className="flex-1 overflow-auto px-6 pb-10 pt-1">
        <div
          className="mt-2 px-3.5 py-2.5"
          style={{
            background: "rgba(122,154,128,0.12)",
            borderLeft: `2px solid ${CT.greenMute}`,
          }}
        >
          <p className="font-serif text-xs leading-snug" style={{ color: CT.ink2 }}>
            <strong style={{ color: CT.ink }}>Đã mở</strong> · theo lá số tứ trụ của bạn
          </p>
        </div>

        {profile ? (
          <p className="mt-4 font-serif text-[13px]" style={{ color: CT.muted }}>
            {formatProfileBirthSubline(profile)}
          </p>
        ) : null}

        {loadProgress ? <CBaziReadingLoadProgress progress={loadProgress} /> : null}

        {loadError && !generating && !hasContent ? (
          <ReadingLoadFallback message={loadError} onRetry={retryLoad} />
        ) : !hasContent && !generating && chapters ? (
          <ReadingLoadFallback
            message="Chưa có nội dung. Thử tải lại sau."
            onRetry={retryLoad}
          />
        ) : chapters ? (
          <>
            {chapters.map((ch) =>
              profile ? (
                <CBaziReadingChapter
                  key={ch.key}
                  chapter={ch}
                  profile={profile}
                  instantProse={instantProse}
                  onRetryMenh={ch.kind === "menh" ? retryLoad : undefined}
                  onRetryLuan={retryLoad}
                />
              ) : null,
            )}
          </>
        ) : generating ? (
          <p className="mt-8 font-serif text-sm" style={{ color: CT.muted }}>
            Đang tải bảng lá số và dữ liệu năm…
          </p>
        ) : birthReady ? (
          <ReadingLoadFallback
            message="Chưa tải được luận giải. Thử tải lại sau."
            onRetry={retryLoad}
          />
        ) : (
          <p className="mt-8 font-serif text-sm" style={{ color: CT.muted }}>
            Cần ngày giờ sinh trong hồ sơ để luận giải lá số.
          </p>
        )}
      </div>
    </main>
  );
}
