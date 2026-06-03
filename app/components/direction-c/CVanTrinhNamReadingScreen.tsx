import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";

import { CTieuVanLockedScreen } from "~/components/direction-c/CTieuVanLockedScreen";
import { CVanTrinhNamChapter } from "~/components/direction-c/CVanTrinhNamChapter";
import { VanTrinhNamMonthNav } from "~/components/direction-c/van-trinh-nam/VanTrinhNamMonthNav";
import { CBaziReadingLoadProgress } from "~/components/direction-c/CBaziReadingLoadProgress";
import { BackBar, Mono } from "~/components/brand";
import { useProfile } from "~/hooks/useProfile";
import { CT, DISPLAY2 } from "~/lib/c-tokens";
import { canUseTieuVanReading } from "~/lib/entitlements";
import { profileHasLaso, laSoJsonToRevealProps } from "~/lib/la-so-ui";
import {
  LUAN_LUU_NIEN_NGUYET_TITLE,
  LUAN_LUU_NIEN_NGUYET_TITLE_SHORT,
} from "~/lib/luan-luu-nien-nguyet-labels";
import { formatProfileBirthSubline } from "~/lib/profile-birth-line";
import {
  buildVanTrinhNamDisplayBlocks,
  buildVanTrinhNamSkeletonBlocks,
} from "~/lib/van-trinh-nam-outline";
import { cancelVanTrinhNamPrewarm } from "~/lib/van-trinh-nam-prewarm";
import type { LaSoChiTietSection } from "~/lib/generate-reading";
import {
  blockKeyToVanTrinhWaveTarget,
  cachedSessionIsComplete,
  createInitialVanTrinhChapterLoadState,
  deliveryToLoadResult,
  deriveVanTrinhChapterLoadState,
  fetchVanTrinhNamContext,
  fetchVanTrinhNamDelivery,
  loadVanTrinhNamFull,
  loadVanTrinhNamRetryWaves,
  persistVanTrinhNamDelivery,
  persistVanTrinhNamSession,
  readVanTrinhNamSession,
  vanTrinhNamCacheRevision,
  type VanTrinhChapterLoadState,
} from "~/lib/van-trinh-nam-load";
import type { VanTrinhNamLuanContext } from "~/lib/van-trinh-nam-types";
import { setVanTrinhNamScreenLoadActive } from "~/lib/van-trinh-nam-load-coord";
import { deriveVanTrinhLoadProgress } from "~/lib/van-trinh-nam-progress";
import {
  currentYearVn,
  parseYearFromSearch,
} from "~/lib/van-trinh-nam-session";
import type { VanTrinhNamDisplayBlock } from "~/lib/van-trinh-nam-outline";

type CVanTrinhNamReadingScreenProps = {
  year?: number;
};

export function CVanTrinhNamReadingScreen({
  year: yearProp,
}: CVanTrinhNamReadingScreenProps) {
  const [searchParams] = useSearchParams();
  const year = yearProp ?? parseYearFromSearch(searchParams) ?? currentYearVn();

  const { profile, loading: profileLoading } = useProfile();
  const [blocks, setBlocks] = useState<VanTrinhNamDisplayBlock[] | null>(null);
  const [generating, setGenerating] = useState(true);
  const [instantProse, setInstantProse] = useState(false);
  const [chapterLoad, setChapterLoad] = useState<VanTrinhChapterLoadState>(
    createInitialVanTrinhChapterLoadState(),
  );
  const [yearCanChiLabel, setYearCanChiLabel] = useState("");
  const genRef = useRef(0);
  const needsVisibleResumeRef = useRef(false);
  const resumeLoadRef = useRef<(() => Promise<void>) | null>(null);
  const runFullLoadRef = useRef<
    (opts?: { force?: boolean }) => Promise<void>
  >(null);
  const partialLoadRef = useRef<
    (ctx: VanTrinhNamLuanContext, blockKey: string) => Promise<void>
  >(null);
  const visibleResumeInFlightRef = useRef(false);
  const fullLoadInFlightRef = useRef(false);
  const loadCtxRef = useRef<VanTrinhNamLuanContext | null>(null);
  const loadSectionsRef = useRef<LaSoChiTietSection[]>([]);

  const unlocked = canUseTieuVanReading(profile);
  const reveal = profile?.la_so ? laSoJsonToRevealProps(profile.la_so) : null;

  const loadProgress = useMemo(() => {
    if (!generating || instantProse) return null;
    return deriveVanTrinhLoadProgress(chapterLoad, yearCanChiLabel);
  }, [generating, instantProse, chapterLoad, yearCanChiLabel]);

  useEffect(() => {
    if (profileLoading || !profile) return;
    if (!unlocked || !profileHasLaso(profile.la_so)) {
      setGenerating(false);
      setInstantProse(false);
      return;
    }

    let cancelled = false;

    cancelVanTrinhNamPrewarm(profile, year);

    void (async () => {
      const [ctxEarly, dbDeliveryRaw] = await Promise.all([
        fetchVanTrinhNamContext(profile, year),
        fetchVanTrinhNamDelivery(profile, year),
      ]);
      if (cancelled) return;

      const dbDelivery =
        dbDeliveryRaw &&
        (!ctxEarly ||
          dbDeliveryRaw.engineVersion === ctxEarly.meta.engine_version)
          ? dbDeliveryRaw
          : null;

      if (dbDelivery) {
        loadCtxRef.current = dbDelivery.luanContext;
        loadSectionsRef.current = dbDelivery.sections;
        const fromDb = deliveryToLoadResult(dbDelivery);
        const rev = vanTrinhNamCacheRevision(
          profile,
          year,
          fromDb.engineVersion,
        );
        setYearCanChiLabel(fromDb.yearCanChi);
        setInstantProse(true);
        setGenerating(false);
        setChapterLoad(
          deriveVanTrinhChapterLoadState(fromDb.sections, {
            bundleFinished: true,
          }),
        );
        setBlocks(
          buildVanTrinhNamDisplayBlocks({
            ctx: fromDb.luanContext,
            sections: fromDb.sections,
            chapterLoad: deriveVanTrinhChapterLoadState(fromDb.sections, {
              bundleFinished: true,
            }),
          }),
        );
        persistVanTrinhNamSession(profile.id, rev, fromDb);
        return;
      }

      const sessionRevision = ctxEarly
        ? vanTrinhNamCacheRevision(profile, year, ctxEarly.meta.engine_version)
        : vanTrinhNamCacheRevision(profile, year, "0");

      const cached = readVanTrinhNamSession(profile.id, sessionRevision);
      if (cached) {
        loadCtxRef.current = cached.luanContext;
        loadSectionsRef.current = cached.sections;
      }
      if (cached && cachedSessionIsComplete(cached)) {
        setYearCanChiLabel(cached.yearCanChi);
        setInstantProse(true);
        setGenerating(false);
        const load = deriveVanTrinhChapterLoadState(cached.sections, {
          bundleFinished: true,
        });
        setChapterLoad(load);
        setBlocks(
          buildVanTrinhNamDisplayBlocks({
            ctx: cached.luanContext,
            sections: cached.sections,
            chapterLoad: load,
          }),
        );
        return;
      }

      const ctx = ctxEarly;
      if (!ctx) {
        setGenerating(false);
        return;
      }

      loadCtxRef.current = ctx;
      const rev3 = sessionRevision;
      const partialSections = cached?.sections ?? [];
      loadSectionsRef.current = partialSections;
      setYearCanChiLabel(
        ctx.part_a.hook_year.year_can_chi || String(ctx.meta.year),
      );
      setInstantProse(false);
      const partialLoad = deriveVanTrinhChapterLoadState(partialSections, {
        bundleFinished: false,
      });
      setChapterLoad(partialLoad);
      setBlocks(
        buildVanTrinhNamDisplayBlocks({
          ctx,
          sections: partialSections,
          chapterLoad: partialLoad,
        }),
      );
      setGenerating(true);

      await runFullLoad(ctx, rev3, partialSections);
    })();

    async function runFullLoad(
      ctx: NonNullable<Awaited<ReturnType<typeof fetchVanTrinhNamContext>>>,
      sessionRevision: string,
      existingSections: LaSoChiTietSection[] = [],
    ) {
      if (fullLoadInFlightRef.current) return;
      fullLoadInFlightRef.current = true;
      const gen = ++genRef.current;
      setVanTrinhNamScreenLoadActive(true);
      try {
        const full = await loadVanTrinhNamFull(profile, year, ctx, {
          existingSections,
          onProgress: (partial, nextLoad) => {
            if (cancelled || gen !== genRef.current) return;
            loadCtxRef.current = partial.luanContext;
            loadSectionsRef.current = partial.sections;
            setYearCanChiLabel(partial.yearCanChi);
            setChapterLoad(nextLoad);
            persistVanTrinhNamSession(profile.id, sessionRevision, {
              sections: partial.sections,
              yearCanChi: partial.yearCanChi,
              luanContext: partial.luanContext,
              engineVersion: partial.engineVersion,
            });
            setBlocks(
              buildVanTrinhNamDisplayBlocks({
                ctx: partial.luanContext,
                sections: partial.sections,
                chapterLoad: nextLoad,
              }),
            );
          },
        });
        loadSectionsRef.current = full.sections;
        if (cancelled || gen !== genRef.current) return;
        const finishedLoad = deriveVanTrinhChapterLoadState(full.sections, {
          bundleFinished: true,
        });
        setChapterLoad(finishedLoad);
        setBlocks(
          buildVanTrinhNamDisplayBlocks({
            ctx: full.luanContext,
            sections: full.sections,
            chapterLoad: finishedLoad,
          }),
        );
        persistVanTrinhNamSession(profile.id, sessionRevision, full);
        if (cachedSessionIsComplete(full)) {
          void persistVanTrinhNamDelivery(profile, year, full);
        }
        needsVisibleResumeRef.current = Boolean(
          full.networkInterrupted && !cachedSessionIsComplete(full),
        );
      } finally {
        fullLoadInFlightRef.current = false;
        if (gen === genRef.current) {
          setVanTrinhNamScreenLoadActive(false);
          setGenerating(false);
        }
      }
    }

    async function runPartialLoad(
      ctx: VanTrinhNamLuanContext,
      blockKey: string,
    ) {
      const target = blockKeyToVanTrinhWaveTarget(blockKey);
      if (!target) return;
      const sessionRevision = vanTrinhNamCacheRevision(
        profile,
        year,
        ctx.meta.engine_version,
      );
      if (fullLoadInFlightRef.current) return;
      fullLoadInFlightRef.current = true;
      const gen = ++genRef.current;
      setVanTrinhNamScreenLoadActive(true);
      setGenerating(true);
      try {
        const partial = await loadVanTrinhNamRetryWaves(
          profile,
          year,
          ctx,
          loadSectionsRef.current,
          [target],
          {
            onProgress: (p, nextLoad) => {
              if (cancelled || gen !== genRef.current) return;
              loadSectionsRef.current = p.sections;
              setChapterLoad(nextLoad);
              setBlocks(
                buildVanTrinhNamDisplayBlocks({
                  ctx: p.luanContext,
                  sections: p.sections,
                  chapterLoad: nextLoad,
                }),
              );
            },
          },
        );
        if (cancelled || gen !== genRef.current) return;
        const finishedLoad = deriveVanTrinhChapterLoadState(partial.sections, {
          bundleFinished: true,
        });
        setChapterLoad(finishedLoad);
        setBlocks(
          buildVanTrinhNamDisplayBlocks({
            ctx: partial.luanContext,
            sections: partial.sections,
            chapterLoad: finishedLoad,
          }),
        );
        persistVanTrinhNamSession(profile.id, sessionRevision, partial);
        if (cachedSessionIsComplete(partial)) {
          void persistVanTrinhNamDelivery(profile, year, partial);
        }
      } finally {
        fullLoadInFlightRef.current = false;
        if (gen === genRef.current) setGenerating(false);
        setVanTrinhNamScreenLoadActive(false);
      }
    }

    runFullLoadRef.current = async (opts) => {
      const ctx =
        loadCtxRef.current ?? (await fetchVanTrinhNamContext(profile, year));
      if (!ctx) return;
      loadCtxRef.current = ctx;
      const rev = vanTrinhNamCacheRevision(profile, year, ctx.meta.engine_version);
      if (opts?.force) {
        fullLoadInFlightRef.current = false;
      }
      const existing = opts?.force ? [] : loadSectionsRef.current;
      await runFullLoad(ctx, rev, existing);
    };
    resumeLoadRef.current = () =>
      runFullLoadRef.current?.({ force: false }) ?? Promise.resolve();

    partialLoadRef.current = runPartialLoad;

    return () => {
      cancelled = true;
      setVanTrinhNamScreenLoadActive(false);
      resumeLoadRef.current = null;
      runFullLoadRef.current = null;
      partialLoadRef.current = null;
    };
  }, [profile, profileLoading, unlocked, year]);

  useEffect(() => {
    if (!profile || !unlocked) return;
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (!needsVisibleResumeRef.current) return;
      if (generating || visibleResumeInFlightRef.current) return;
      needsVisibleResumeRef.current = false;
      visibleResumeInFlightRef.current = true;
      void resumeLoadRef.current?.().finally(() => {
        visibleResumeInFlightRef.current = false;
      });
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [profile, unlocked, generating]);

  const retryLoad = useCallback(() => {
    if (!profile || !unlocked) return;
    setInstantProse(false);
    void runFullLoadRef.current?.({ force: true });
  }, [profile, unlocked]);

  const retryChapter = useCallback(
    (blockKey: string) => {
      if (!profile || !unlocked) return;
      const ctx = loadCtxRef.current;
      if (!ctx) {
        retryLoad();
        return;
      }
      setInstantProse(false);
      void partialLoadRef.current?.(ctx, blockKey);
    },
    [profile, unlocked, retryLoad],
  );

  const hasContent = useMemo(
    () =>
      blocks?.some((b) => {
        if (b.kind === "part_a") return true;
        if (b.kind === "month") return true;
        if (b.kind === "closing") return Boolean(b.prose) || b.luanLoading;
        return false;
      }) ?? false,
    [blocks],
  );

  if (profileLoading) {
    return (
      <main className="min-h-[100svh]" style={{ background: CT.paper }}>
        <BackBar title={LUAN_LUU_NIEN_NGUYET_TITLE_SHORT} />
        <p className="px-6 font-serif text-sm" style={{ color: CT.muted }}>
          Đang mở luận giải…
        </p>
      </main>
    );
  }

  if (!unlocked) {
    return <CTieuVanLockedScreen year={year} />;
  }

  return (
    <main
      className="flex min-h-[100svh] flex-col"
      style={{ background: CT.paper, color: CT.ink, fontFamily: "var(--serif)" }}
    >
      <BackBar
        title={`${LUAN_LUU_NIEN_NGUYET_TITLE} · ${year}`}
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
            <strong style={{ color: CT.ink }}>Đã mở</strong> · lưu niên & lưu nguyệt theo lá số của bạn
          </p>
        </div>

        {profile ? (
          <p className="mt-4 font-serif text-[13px]" style={{ color: CT.muted }}>
            {formatProfileBirthSubline(profile)}
          </p>
        ) : null}

        {reveal ? (
          <div className="mt-3">
            <h2 className="text-[22px] font-extrabold uppercase leading-none" style={DISPLAY2}>
              {reveal.nhatChu}
              {reveal.hanh !== "—" ? ` ${reveal.hanh}` : ""}
            </h2>
          </div>
        ) : null}

        {loadProgress ? (
          <CBaziReadingLoadProgress
            progress={{
              done: loadProgress.done,
              total: loadProgress.total,
              activeLabel: loadProgress.activeLabel,
            }}
          />
        ) : null}

        {!hasContent && !generating && blocks ? (
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
        ) : blocks ? (
          <>
            {blocks.some((b) => b.kind === "month") ? (
              <VanTrinhNamMonthNav year={year} />
            ) : null}
            {blocks.map((block) => (
              <CVanTrinhNamChapter
                key={block.key}
                block={block}
                year={year}
                instantProse={instantProse}
                onRetryLuan={() => retryChapter(block.key)}
              />
            ))}
          </>
        ) : generating ? (
          <p className="mt-8 font-serif text-sm" style={{ color: CT.muted }}>
            Đang tải vận trình năm…
          </p>
        ) : null}
      </div>
    </main>
  );
}
