import { useEffect, useMemo, useRef, useState } from "react";

import { BackBar, Mono } from "~/components/brand";
import { CBaziReadingChapter } from "~/components/direction-c/CBaziReadingChapter";
import { CBaziReadingPaywallView } from "~/components/direction-c/CBaziReadingPaywallView";
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
import {
  deriveChapterLoadState,
  type BaziChapterLoadState,
} from "~/lib/bazi-chapter-load";
import {
  buildBaziDisplayChapters,
  type BaziDisplayChapter,
} from "~/lib/bazi-reading-outline";
import type { LaSoChiTietSection } from "~/lib/generate-reading";
import {
  baziReadingCacheRevision,
  currentYearVn,
  persistBaziReadingSession,
  readBaziReadingSession,
} from "~/lib/bazi-reading-session";
import { CT, DISPLAY2 } from "~/lib/c-tokens";
import { canUseBaziReading } from "~/lib/entitlements";
import { profileHasLaso } from "~/lib/la-so-ui";
import { formatProfileBirthSubline } from "~/lib/profile-birth-line";

function buildChaptersFromLoadResult(
  partial: BaziReadingLoadResult,
  profileLaSo: LaSoJson | null,
  options?: { chapterLoad?: BaziChapterLoadState },
): BaziDisplayChapter[] {
  return buildBaziDisplayChapters({
    sections: partial.sections,
    laSo: partial.laSoDisplay ?? profileLaSo,
    luuNienFactsRaw: partial.luuNienFactsRaw,
    phongThuyFactsRaw: partial.phongThuyFactsRaw,
    yearCanChi: partial.yearCanChi,
    phongThuyFetchError: partial.phongThuyFetchError,
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
  return buildChaptersFromLoadResult(cached, profileLaSo);
}

/** SessionStorage partial — sau mỗi wave generate, reload không mất § đã xong. */
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

export function CBaziReadingScreen() {
  const { profile, loading: profileLoading } = useProfile();
  const [chapters, setChapters] = useState<BaziDisplayChapter[] | null>(null);
  /** DeepSeek bundle đang chạy — skeleton facts vẫn hiển thị. */
  const [generating, setGenerating] = useState(true);
  const genRef = useRef(0);
  const factsRef = useRef<BaziReadingFactsBundle | null>(null);
  const partialLoadRef = useRef<BaziReadingLoadResult | null>(null);
  const needsVisibleResumeRef = useRef(false);
  const resumeLoadRef = useRef<(() => Promise<void>) | null>(null);
  const visibleResumeInFlightRef = useRef(false);
  const unlocked = canUseBaziReading(profile);
  const year = currentYearVn();

  useEffect(() => {
    if (profileLoading || !profile) return;
    if (!unlocked || !profileHasLaso(profile.la_so)) {
      setGenerating(false);
      return;
    }

    const body = profileToBatTuPersonQuery(profile);
    if (!body.birth_date) {
      setGenerating(false);
      return;
    }

    let cancelled = false;

    const factsPromise = fetchBaziReadingFactsBundle(profile, year, {
      silentPhongThuyToast: true,
    });

    void (async () => {
      const dbDelivery = await fetchBaziReadingDelivery(profile, year);
      if (cancelled) return;
      if (dbDelivery) {
        const fromDb = deliveryToLoadResult(dbDelivery);
        if (
          cachedDeliveryIsComplete(
            fromDb.sections,
            fromDb.luuNienFactsRaw,
            fromDb.phongThuyFactsRaw,
          )
        ) {
          setChapters(
            buildChaptersFromLoadResult(
              fromDb,
              (profile.la_so as LaSoJson) ?? null,
            ),
          );
          setGenerating(false);
          return;
        }
      }

      const revision = baziReadingCacheRevision(profile, year);
      const cached = readBaziReadingSession(profile.id, revision);
      if (cancelled) return;
      if (
        cached &&
        cachedDeliveryIsComplete(
          cached.sections,
          cached.luuNienFactsRaw,
          cached.phongThuyFactsRaw,
        )
      ) {
        setChapters(
          chaptersFromSession(cached, (profile.la_so as LaSoJson) ?? null),
        );
        setGenerating(false);
        return;
      }

      const facts = await factsPromise;
      if (cancelled) return;
      if (facts) {
        factsRef.current = facts;
        setChapters(buildBaziSkeletonChapters(facts));
      }

      await runFullLoad(facts ?? undefined);
    })();

    const profileLaSo = (profile.la_so as LaSoJson) ?? null;
    const sessionRevision = baziReadingCacheRevision(profile, year);

    async function runFullLoad(preloadedFacts?: BaziReadingFactsBundle) {
      const gen = ++genRef.current;
      if (cancelled) return;
      setGenerating(true);
      const full = await loadBaziReadingFull(profile, year, {
        preloadedFacts: preloadedFacts ?? factsRef.current ?? undefined,
        onProgress: (partial, chapterLoad) => {
          if (cancelled || gen !== genRef.current) return;
          partialLoadRef.current = partial;
          persistPartialBaziSession(profile.id, sessionRevision, partial);
          setChapters(
            buildChaptersFromLoadResult(partial, profileLaSo, { chapterLoad }),
          );
        },
      });
      if (cancelled || gen !== genRef.current) return;
      partialLoadRef.current = full;
      setChapters(
        buildChaptersFromLoadResult(full, profileLaSo, {
          chapterLoad: deriveChapterLoadState(full.sections, {
            luuNienFactsRaw: full.luuNienFactsRaw,
            phongThuyFactsRaw: full.phongThuyFactsRaw,
            phongThuyFetchError: full.phongThuyFetchError,
            bundleFinished: true,
          }),
        }),
      );
      if (full.sections.length > 0) {
        persistPartialBaziSession(profile.id, sessionRevision, full);
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

    resumeLoadRef.current = () => runFullLoad(factsRef.current ?? undefined);

    return () => {
      cancelled = true;
      resumeLoadRef.current = null;
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
    const gen = ++genRef.current;
    const profileLaSo = (profile.la_so as LaSoJson) ?? null;
    const sessionRevision = baziReadingCacheRevision(profile, year);
    setGenerating(true);
    void (async () => {
      const facts =
        factsRef.current ??
        (await fetchBaziReadingFactsBundle(profile, year));
      if (gen !== genRef.current) return;
      if (facts) {
        factsRef.current = facts;
        setChapters(buildBaziSkeletonChapters(facts));
      }
      const full = await loadBaziReadingFull(profile, year, {
        forceRegenerate: true,
        preloadedFacts: facts ?? undefined,
        onProgress: (partial, chapterLoad) => {
          if (gen !== genRef.current) return;
          partialLoadRef.current = partial;
          persistPartialBaziSession(profile.id, sessionRevision, partial);
          setChapters(
            buildChaptersFromLoadResult(partial, profileLaSo, { chapterLoad }),
          );
        },
      });
      if (gen !== genRef.current) return;
      partialLoadRef.current = full;
      setChapters(
        buildChaptersFromLoadResult(full, profileLaSo, {
          chapterLoad: deriveChapterLoadState(full.sections, {
            luuNienFactsRaw: full.luuNienFactsRaw,
            phongThuyFactsRaw: full.phongThuyFactsRaw,
            phongThuyFetchError: full.phongThuyFetchError,
            bundleFinished: true,
          }),
        }),
      );
      if (full.sections.length > 0) {
        persistPartialBaziSession(profile.id, sessionRevision, full);
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
    })();
  };

  const pendingLuanCount = useMemo(() => {
    if (!chapters || !generating) return 0;
    return chapters.filter((ch) => {
      if (ch.kind === "menh") return ch.proseLoading;
      if (ch.kind === "tinh_cach") return ch.luanLoading;
      if (ch.kind === "van_nam") return ch.luanLoading;
      if (ch.kind === "phong_thuy") return ch.proseLoading;
      if (ch.kind === "quy_nhan") return ch.proseLoading;
      return false;
    }).length;
  }, [chapters, generating]);

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
        <BackBar title="Luận giải Bát Tự" />
        <p className="px-6 font-serif text-sm" style={{ color: CT.muted }}>
          Đang luận giải bản mệnh…
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
        title={`Luận giải Bát Tự · ${year}`}
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

        {!hasContent && !generating && chapters ? (
          <div className="mt-8 text-center">
            <p className="font-serif text-sm" style={{ color: CT.muted }}>
              Chưa có nội dung. Thử tải lại sau.
            </p>
            <button
              type="button"
              onClick={retryLoad}
              className="mt-4 px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider"
              style={{ ...DISPLAY2, background: CT.forest, color: CT.cream, border: "none" }}
            >
              Tải lại
            </button>
          </div>
        ) : chapters ? (
          <>
            {chapters.map((ch) =>
              profile ? (
                <CBaziReadingChapter
                  key={ch.key}
                  chapter={ch}
                  profile={profile}
                  onRetryMenh={ch.kind === "menh" ? retryLoad : undefined}
                  onRetryLuan={retryLoad}
                />
              ) : null,
            )}
            {generating && pendingLuanCount > 0 ? (
              <p
                className="mt-6 text-center font-serif text-[12px] italic"
                style={{ color: CT.muted }}
                aria-live="polite"
              >
                {pendingLuanCount >= 5
                  ? "NLTT đang soạn luận giải — bạn có thể đọc từng phần bên trên khi sẵn sàng."
                  : `Đang soạn thêm ${pendingLuanCount} phần luận…`}
              </p>
            ) : null}
          </>
        ) : generating ? (
          <p className="mt-8 font-serif text-sm" style={{ color: CT.muted }}>
            Đang mở lá số…
          </p>
        ) : null}
      </div>
    </main>
  );
}
