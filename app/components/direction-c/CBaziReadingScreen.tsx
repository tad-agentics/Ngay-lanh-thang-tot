import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { BackBar, Mono } from "~/components/brand";
import { CBaziLockedScreen } from "~/components/direction-c/CBaziLockedScreen";
import { useProfile, type Profile } from "~/hooks/useProfile";
import { profileToBatTuPersonQuery } from "~/lib/bat-tu-birth";
import { invokeBatTu } from "~/lib/bat-tu";
import {
  baziReadingCacheRevision,
  currentYearVn,
  persistBaziReadingSession,
  readBaziReadingSession,
} from "~/lib/bazi-reading-session";
import { CT, DISPLAY, DISPLAY2 } from "~/lib/c-tokens";
import { canUseBaziReading } from "~/lib/entitlements";
import {
  invokeGenerateReading,
  normalizeLaSoSectionsInput,
  type LaSoChiTietSection,
} from "~/lib/generate-reading";
import { laSoJsonToRevealProps, profileHasLaso } from "~/lib/la-so-ui";
import { fetchLuuNienYearFacts } from "~/lib/luu-nien-facts";
import {
  luuNienSectionsFromGenerateReading,
  mergeLaSoWithLuuNienSections,
} from "~/lib/luu-nien-ui";
import { fetchPhongThuyYearFacts } from "~/lib/phong-thuy-facts";
import {
  mergeBaziReadingWithPhongThuy,
  phongThuySectionsFromGenerateReading,
} from "~/lib/phong-thuy-ui";

function birthLine(profile: {
  display_name: string | null;
  ngay_sinh: string | null;
  gio_sinh: string | null;
}): string {
  const parts: string[] = [];
  if (profile.display_name) parts.push(profile.display_name);
  if (profile.ngay_sinh) parts.push(`sinh ${profile.ngay_sinh}`);
  if (profile.gio_sinh) parts.push(`giờ ${profile.gio_sinh}`);
  return parts.join(" · ");
}

function laSoSectionsFromGenerateReading(
  sections: LaSoChiTietSection[] | null,
  reading: string | null,
): LaSoChiTietSection[] {
  const fromModel =
    sections && sections.length > 0
      ? sections
      : reading?.trim()
        ? [{ id: "tong_hop", title: "Luận giải", text: reading.trim() }]
        : [];
  return normalizeLaSoSectionsInput(fromModel);
}

async function loadBaziReadingSections(
  profile: Profile,
  year: number,
): Promise<LaSoChiTietSection[]> {
  const body = profileToBatTuPersonQuery(profile);
  if (!body.birth_date) return [];

  const [lasoRes, luuNienRes, phongThuyRes] = await Promise.all([
    invokeBatTu<unknown>({ op: "la-so", body }),
    fetchLuuNienYearFacts(profile, year),
    fetchPhongThuyYearFacts(profile, year),
  ]);

  if (!lasoRes.ok) {
    toast.error(lasoRes.message ?? "Không tải lá số.");
    return [];
  }

  const [lasoGen, luuNienGen, phongThuyGen] = await Promise.all([
    invokeGenerateReading({
      endpoint: "la-so-chi-tiet",
      data: lasoRes.data,
    }),
    luuNienRes.ok
      ? invokeGenerateReading({
          endpoint: "luu-nien",
          data: luuNienRes.data,
        })
      : Promise.resolve({ reading: null, sections: null, dayReadings: null }),
    phongThuyRes.ok
      ? invokeGenerateReading({
          endpoint: "phong-thuy",
          data: phongThuyRes.data,
        })
      : Promise.resolve({ reading: null, sections: null, dayReadings: null }),
  ]);

  const laSoSections = laSoSectionsFromGenerateReading(
    lasoGen.sections,
    lasoGen.reading,
  );
  const luuNienSections = luuNienSectionsFromGenerateReading(
    luuNienGen.sections,
    luuNienGen.reading,
  );
  const phongThuySections = phongThuySectionsFromGenerateReading(
    phongThuyRes.ok ? phongThuyRes.data : null,
    phongThuyGen.reading,
  );

  const withLuuNien = mergeLaSoWithLuuNienSections(laSoSections, luuNienSections);
  return mergeBaziReadingWithPhongThuy(withLuuNien, phongThuySections);
}

export function CBaziReadingScreen() {
  const { profile, loading: profileLoading } = useProfile();
  const [sections, setSections] = useState<LaSoChiTietSection[]>([]);
  const [loading, setLoading] = useState(true);
  const genRef = useRef(0);
  const unlocked = canUseBaziReading(profile);
  const reveal = profile?.la_so ? laSoJsonToRevealProps(profile.la_so) : null;
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

    const revision = baziReadingCacheRevision(profile, year);
    const cached = readBaziReadingSession(profile.id, revision);
    if (cached && cached.length > 0) {
      setSections(normalizeLaSoSectionsInput(cached));
      setLoading(false);
      return;
    }

    let cancelled = false;
    const gen = ++genRef.current;
    setLoading(true);
    void (async () => {
      const merged = await loadBaziReadingSections(profile, year);
      if (cancelled || gen !== genRef.current) return;
      setSections(merged);
      if (merged.length > 0) {
        persistBaziReadingSession(profile.id, revision, merged);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [profile, profileLoading, unlocked, year]);

  const retryLoad = () => {
    if (!profile || !unlocked) return;
    const gen = ++genRef.current;
    setLoading(true);
    void (async () => {
      const merged = await loadBaziReadingSections(profile, year);
      if (gen !== genRef.current) return;
      setSections(merged);
      if (merged.length > 0) {
        persistBaziReadingSession(
          profile.id,
          baziReadingCacheRevision(profile, year),
          merged,
        );
      }
      setLoading(false);
    })();
  };

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

  if (!unlocked) {
    return <CBaziLockedScreen />;
  }

  return (
    <main
      className="min-h-[100svh] flex flex-col"
      style={{ background: CT.paper, color: CT.ink, fontFamily: "var(--serif)" }}
    >
      <BackBar
        title={`Luận giải Bát Tự · ${year}`}
        endAdornment={<Mono style={{ color: CT.muted, fontSize: 9.5 }}>Học thuật cổ thư</Mono>}
      />

      <div className="flex-1 overflow-auto px-6 pb-10 pt-1">
        <div
          className="mt-2 py-2.5 px-3.5"
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
            {birthLine(profile)}
          </p>
        ) : null}

        {reveal ? (
          <div className="mt-3">
            <h2
              className="text-[28.5px] font-extrabold uppercase leading-none"
              style={{ ...DISPLAY, letterSpacing: "-0.015em" }}
            >
              {reveal.nhatChu}
              {reveal.hanh !== "—" ? ` ${reveal.hanh}` : ""} ·{" "}
              <span
                className="font-serif italic font-bold normal-case"
                style={{ color: CT.goldDeep }}
              >
                {reveal.menh}
              </span>
            </h2>
          </div>
        ) : null}

        {loading ? (
          <p className="mt-8 font-serif text-sm" style={{ color: CT.muted }}>
            Đang luận giải chi tiết bản mệnh…
          </p>
        ) : sections.length === 0 ? (
          <div className="mt-8 text-center">
            <p className="font-serif text-sm" style={{ color: CT.muted }}>
              Chưa có nội dung. Thử tải lại sau.
            </p>
            <button
              type="button"
              onClick={retryLoad}
              className="mt-4 py-2.5 px-5 text-xs font-extrabold uppercase tracking-wider"
              style={{ ...DISPLAY2, background: CT.forest, color: CT.cream, border: "none" }}
            >
              Tải lại
            </button>
          </div>
        ) : (
          sections.map((s, i) => (
            <section key={s.id} className="mt-6">
              <div
                className="flex items-baseline gap-2.5 pb-1.5"
                style={{ borderBottom: `1px solid ${CT.ink}` }}
              >
                <span
                  className="font-mono text-[11.5px]"
                  style={{ color: CT.goldDeep, letterSpacing: "0.18em" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className="text-lg font-extrabold uppercase tracking-tight"
                  style={DISPLAY}
                >
                  {s.title}
                </span>
              </div>
              <p
                className="mt-3 text-[14px] leading-relaxed whitespace-pre-wrap"
                style={{ color: CT.ink2 }}
              >
                {s.text}
              </p>
            </section>
          ))
        )}
      </div>
    </main>
  );
}
