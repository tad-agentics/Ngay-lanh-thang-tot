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
import { loadBaziReadingFull } from "~/lib/bazi-reading-load";
import {
  buildBaziDisplayChapters,
  menhTongQuanProseFromSections,
  type BaziDisplayChapter,
} from "~/lib/bazi-reading-outline";
import { hasLuuNienLifeLuanFromSections } from "~/lib/luu-nien-life-ui";
import { parseLuuNienFactsView } from "~/lib/luu-nien-facts-ui";
import { hasTinhCachLuanFromSections } from "~/lib/personality-traits-ui";
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

function chaptersFromSession(
  cached: NonNullable<ReturnType<typeof readBaziReadingSession>>,
  profileLaSo: LaSoJson | null,
): BaziDisplayChapter[] {
  return buildBaziDisplayChapters({
    sections: cached.sections,
    laSo: cached.laSoDisplay ?? profileLaSo,
    luuNienFactsRaw: cached.luuNienFactsRaw,
    phongThuyFactsRaw: cached.phongThuyFactsRaw,
    yearCanChi: cached.yearCanChi,
  });
}

export function CBaziReadingScreen() {
  const { profile, loading: profileLoading } = useProfile();
  const [chapters, setChapters] = useState<BaziDisplayChapter[] | null>(null);
  const [loading, setLoading] = useState(true);
  const genRef = useRef(0);
  const unlocked = canUseBaziReading(profile);
  const year = currentYearVn();

  useEffect(() => {
    if (profileLoading || !profile) return;
    if (!unlocked || !profileHasLaso(profile.la_so)) {
      setLoading(false);
      return;
    }

    const body = profileToBatTuPersonQuery(profile);
    if (!body.birth_date) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      const dbDelivery = await fetchBaziReadingDelivery(profile, year);
      if (cancelled) return;
      if (dbDelivery) {
        const fromDb = deliveryToLoadResult(dbDelivery);
        if (
          menhTongQuanProseFromSections(fromDb.sections) &&
          hasTinhCachLuanFromSections(fromDb.sections) &&
          hasLuuNienLifeLuanFromSections(
            fromDb.sections,
            Math.max(
              1,
              parseLuuNienFactsView(fromDb.luuNienFactsRaw)?.lifeAreas.length ??
                4,
            ),
          )
        ) {
          setChapters(
            buildBaziDisplayChapters({
              sections: fromDb.sections,
              laSo: fromDb.laSoDisplay ?? (profile.la_so as LaSoJson) ?? null,
              luuNienFactsRaw: fromDb.luuNienFactsRaw,
              phongThuyFactsRaw: fromDb.phongThuyFactsRaw,
              yearCanChi: fromDb.yearCanChi,
            }),
          );
          setLoading(false);
          return;
        }
      }

      const revision = baziReadingCacheRevision(profile, year);
      const cached = readBaziReadingSession(profile.id, revision);
      if (cancelled) return;
      if (
        cached &&
        menhTongQuanProseFromSections(cached.sections) &&
        hasTinhCachLuanFromSections(cached.sections) &&
        hasLuuNienLifeLuanFromSections(
          cached.sections,
          Math.max(
            1,
            parseLuuNienFactsView(cached.luuNienFactsRaw)?.lifeAreas.length ?? 4,
          ),
        )
      ) {
        setChapters(
          chaptersFromSession(cached, (profile.la_so as LaSoJson) ?? null),
        );
        setLoading(false);
        return;
      }

      await runFullLoad();
    })();

    async function runFullLoad() {
      const gen = ++genRef.current;
      if (cancelled) return;
      setLoading(true);
      const full = await loadBaziReadingFull(profile, year);
      if (cancelled || gen !== genRef.current) return;
      const built = buildBaziDisplayChapters({
        sections: full.sections,
        laSo: full.laSoDisplay,
        luuNienFactsRaw: full.luuNienFactsRaw,
        phongThuyFactsRaw: full.phongThuyFactsRaw,
        yearCanChi: full.yearCanChi,
        phongThuyFetchError: full.phongThuyFetchError,
      });
      setChapters(built);
      if (full.sections.length > 0) {
        const revision = baziReadingCacheRevision(profile, year);
        persistBaziReadingSession(profile.id, revision, {
          sections: full.sections,
          yearCanChi: full.yearCanChi,
          laSoDisplay: full.laSoDisplay,
          luuNienFactsRaw: full.luuNienFactsRaw,
          phongThuyFactsRaw: full.phongThuyFactsRaw,
        });
      }
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [profile, profileLoading, unlocked, year]);

  const retryLoad = () => {
    if (!profile || !unlocked) return;
    const gen = ++genRef.current;
    setLoading(true);
    void (async () => {
      const full = await loadBaziReadingFull(profile, year, {
        forceRegenerate: true,
      });
      if (gen !== genRef.current) return;
      setChapters(
        buildBaziDisplayChapters({
          sections: full.sections,
          laSo: full.laSoDisplay,
          luuNienFactsRaw: full.luuNienFactsRaw,
          phongThuyFactsRaw: full.phongThuyFactsRaw,
          yearCanChi: full.yearCanChi,
          phongThuyFetchError: full.phongThuyFetchError,
        }),
      );
      if (full.sections.length > 0) {
        persistBaziReadingSession(
          profile.id,
          baziReadingCacheRevision(profile, year),
          {
            sections: full.sections,
            yearCanChi: full.yearCanChi,
            laSoDisplay: full.laSoDisplay,
            luuNienFactsRaw: full.luuNienFactsRaw,
            phongThuyFactsRaw: full.phongThuyFactsRaw,
          },
        );
      }
      setLoading(false);
    })();
  };

  const hasContent = useMemo(
    () =>
      chapters?.some((ch) => {
        if (ch.kind === "menh") {
          const hasLaSo =
            ch.laSo != null &&
            typeof ch.laSo === "object" &&
            Object.keys(ch.laSo).length > 0;
          return hasLaSo || Boolean(ch.prose.trim());
        }
        if (ch.kind === "tinh_cach") {
          return (
            ch.traits.length > 0 ||
            Boolean(ch.introProse.trim() || ch.prose.trim())
          );
        }
        if (ch.kind === "quy_nhan") {
          return Boolean(ch.prose || ch.quyNhan || ch.daiVanNext);
        }
        return Boolean(ch.prose || ch.facts);
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

        {loading && !chapters ? (
          <p className="mt-8 font-serif text-sm" style={{ color: CT.muted }}>
            Đang luận giải chi tiết bản mệnh…
          </p>
        ) : !hasContent && !loading ? (
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
        ) : (
          chapters?.map((ch) =>
            profile ? (
              <CBaziReadingChapter
                key={ch.key}
                chapter={ch}
                profile={profile}
                onRetryMenh={ch.kind === "menh" ? retryLoad : undefined}
              />
            ) : null,
          )
        )}
      </div>
    </main>
  );
}
