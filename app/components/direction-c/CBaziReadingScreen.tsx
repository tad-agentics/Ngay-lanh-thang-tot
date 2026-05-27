import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

import { BackBar, Mono } from "~/components/brand";
import { useProfile } from "~/hooks/useProfile";
import { profileToBatTuPersonQuery } from "~/lib/bat-tu-birth";
import { invokeBatTu } from "~/lib/bat-tu";
import { CT } from "~/lib/c-tokens";
import { canUseBaziReading } from "~/lib/entitlements";
import {
  invokeGenerateReading,
  normalizeLaSoSectionsInput,
  type LaSoChiTietSection,
} from "~/lib/generate-reading";
import { laSoJsonToRevealProps, profileHasLaso } from "~/lib/la-so-ui";

export function CBaziReadingScreen() {
  const { profile, loading: profileLoading } = useProfile();
  const [sections, setSections] = useState<LaSoChiTietSection[]>([]);
  const [loading, setLoading] = useState(true);
  const genRef = useRef(0);
  const unlocked = canUseBaziReading(profile);
  const reveal = profile?.la_so ? laSoJsonToRevealProps(profile.la_so) : null;

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
    const gen = ++genRef.current;
    setLoading(true);
    void (async () => {
      const laso = await invokeBatTu<unknown>({ op: "la-so", body });
      if (cancelled || gen !== genRef.current) return;
      if (!laso.ok) {
        setLoading(false);
        toast.error(laso.message ?? "Không tải lá số.");
        return;
      }
      const { reading, sections: sec } = await invokeGenerateReading({
        endpoint: "la-so-chi-tiet",
        data: laso.data,
      });
      if (cancelled || gen !== genRef.current) return;
      const fromModel =
        sec && sec.length > 0
          ? sec
          : reading?.trim()
            ? [{ id: "tong_hop", title: "Luận giải", text: reading.trim() }]
            : [];
      setSections(normalizeLaSoSectionsInput(fromModel));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [profile, profileLoading, unlocked]);

  if (profileLoading) {
    return (
      <main className="min-h-[100svh]" style={{ background: CT.paper }}>
        <BackBar title="Luận giải Bát tự" />
        <p className="px-6 font-serif text-sm" style={{ color: CT.muted }}>
          Đang tải…
        </p>
      </main>
    );
  }

  if (!unlocked) {
    return (
      <main className="min-h-[100svh]" style={{ background: CT.paper }}>
        <BackBar title="Luận giải Bát tự" />
        <div className="px-6 py-10 text-center">
          <Mono style={{ color: CT.goldDeep, fontSize: 10, letterSpacing: "0.22em" }}>
            Chưa mở
          </Mono>
          <h2 className="mt-2 font-display text-2xl font-extrabold uppercase">
            Luận giải Bát tự · 2026
          </h2>
          <p className="mt-3 font-serif text-sm leading-relaxed" style={{ color: CT.ink2 }}>
            Gói năm hoặc gói Luận Bát tự — mở khóa luận giải đầy đủ theo lá số của bạn.
          </p>
          <Link
            to="/dat-lich"
            className="mt-6 inline-block py-3 px-8 font-display text-xs font-extrabold uppercase tracking-wider no-underline"
            style={{ background: CT.forest, color: CT.cream }}
          >
            Xem gói →
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-[100svh] flex flex-col"
      style={{ background: CT.paper, color: CT.ink }}
    >
      <BackBar
        title="Luận giải Bát tự · 2026"
        endAdornment={<Mono style={{ color: CT.muted, fontSize: 9 }}>AI · có nguồn</Mono>}
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

        {reveal ? (
          <div className="mt-4">
            <h2 className="font-display text-[28px] font-extrabold uppercase leading-none">
              {reveal.nhatChu} ·{" "}
              <span className="font-serif italic font-bold normal-case" style={{ color: CT.goldDeep }}>
                {reveal.menh}
              </span>
            </h2>
          </div>
        ) : null}

        {loading ? (
          <p className="mt-8 font-serif text-sm" style={{ color: CT.muted }}>
            Đang luận giải theo lá số…
          </p>
        ) : sections.length === 0 ? (
          <p className="mt-8 font-serif text-sm" style={{ color: CT.muted }}>
            Chưa có nội dung. Thử tải lại sau.
          </p>
        ) : (
          sections.map((s, i) => (
            <section key={s.id} className="mt-6">
              <div
                className="flex items-baseline gap-2.5 pb-1.5"
                style={{ borderBottom: `1px solid ${CT.ink}` }}
              >
                <span
                  className="font-mono text-[11px]"
                  style={{ color: CT.goldDeep, letterSpacing: "0.18em" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-display text-lg font-extrabold uppercase tracking-tight">
                  {s.title}
                </span>
              </div>
              <p
                className="mt-3 font-serif text-[13.5px] leading-relaxed whitespace-pre-wrap"
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
