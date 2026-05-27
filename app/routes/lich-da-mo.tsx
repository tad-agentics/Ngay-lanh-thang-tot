import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { btnPrimaryGold, C, CForestShell } from "~/components/auth/c-auth-ui";
import { Mono } from "~/components/brand";
import { useProfile } from "~/hooks/useProfile";
import { useAuth } from "~/lib/auth";
import { invokeBatTu } from "~/lib/bat-tu";
import { profileToBatTuPersonQuery } from "~/lib/bat-tu-birth";
import { parseNgayHomNayForHome } from "~/lib/home-bat-tu";
import {
  mastheadFromIso,
  ngayHomNayToLichCard,
  weekdayFromIso,
} from "~/lib/lich-format";
import { laSoJsonToRevealProps } from "~/lib/la-so-ui";
import { destinationAfterOnboarding } from "~/lib/pending-return-to";
import { supabase } from "~/lib/supabase";
import { todayIsoInVn } from "~/lib/today-reading-cache";

type RevealCard = {
  masthead: string;
  dayNumber: string;
  weekday: string;
  lunarLabel: string;
  canChi: string;
  verdictLabel: string;
  score: number;
};

function fallbackCard(iso: string): RevealCard {
  const d = new Date(`${iso}T12:00:00`);
  return {
    masthead: mastheadFromIso(iso),
    dayNumber: String(d.getDate()),
    weekday: weekdayFromIso(iso),
    lunarLabel: "—",
    canChi: "",
    verdictLabel: "Ngày khá",
    score: 68,
  };
}

export default function LichDaMoRoute() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const [finishing, setFinishing] = useState(false);
  const [loadingToday, setLoadingToday] = useState(true);

  const iso = todayIsoInVn();
  const menh = profile?.la_so ? laSoJsonToRevealProps(profile.la_so)?.menh : null;

  const [card, setCard] = useState<RevealCard>(() => fallbackCard(iso));

  useEffect(() => {
    if (profileLoading || !profile) return;
    const body = profileToBatTuPersonQuery(profile);
    if (!body.birth_date) {
      setLoadingToday(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      const res = await invokeBatTu<unknown>({
        op: "ngay-hom-nay",
        body: { ...body, date: iso },
      });
      if (cancelled) return;
      if (res.ok) {
        const parsed = parseNgayHomNayForHome(res.data);
        if (parsed) {
          const mapped = ngayHomNayToLichCard(
            parsed,
            menh && menh !== "—" ? menh : null,
            iso,
          );
          setCard({
            masthead: mapped.masthead,
            dayNumber: mapped.dayNumber,
            weekday: mapped.weekday,
            lunarLabel: parsed.lunarLabel,
            canChi: parsed.canChi,
            verdictLabel: mapped.verdictLabel,
            score: mapped.score,
          });
        }
      }
      setLoadingToday(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [profile, profileLoading, iso, menh]);

  const footerMenh = useMemo(() => {
    if (menh && menh !== "—") return menh;
    return "của bạn";
  }, [menh]);

  async function openCalendar() {
    if (!user) return;
    setFinishing(true);
    const { error } = await supabase
      .from("profiles")
      .update({ onboarding_completed_at: new Date().toISOString() })
      .eq("id", user.id);
    setFinishing(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    window.dispatchEvent(new Event("ngaytot:profile-refresh"));
    navigate(destinationAfterOnboarding(), { replace: true });
  }

  return (
    <CForestShell gradientOpacity={0.18}>
      <div
        style={{
          flex: 1,
          padding: "32px 28px 24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "relative",
        }}
      >
        <Mono
          style={{
            color: C.gold,
            fontSize: 10,
            letterSpacing: "0.22em",
            alignSelf: "flex-start",
          }}
        >
          Lịch đã mở
        </Mono>
        <h1
          style={{
            fontFamily: "var(--display)",
            fontWeight: 800,
            fontSize: 38,
            color: C.cream,
            lineHeight: 1,
            textTransform: "uppercase",
            letterSpacing: "-0.02em",
            margin: "10px 0 4px",
            alignSelf: "flex-start",
          }}
        >
          Đây là trang
          <br />
          <span
            style={{
              color: C.gold,
              fontFamily: "var(--serif)",
              fontStyle: "italic",
              fontWeight: 700,
              textTransform: "none",
              letterSpacing: 0,
            }}
          >
            đầu tiên của bạn.
          </span>
        </h1>

        <div
          style={{
            marginTop: 28,
            width: 240,
            background: C.paperWarm,
            color: C.ink,
            transform: "rotate(-2deg)",
            boxShadow: "0 18px 36px rgba(0,0,0,0.32)",
            opacity: loadingToday ? 0.85 : 1,
          }}
        >
          <div
            style={{
              padding: "10px 16px 4px",
              fontFamily: "var(--serif)",
              fontSize: 11,
              color: C.muted,
            }}
          >
            {card.masthead}
          </div>
          <div
            style={{
              padding: "4px 16px 10px",
              display: "flex",
              alignItems: "flex-end",
              gap: 10,
            }}
          >
            <div
              style={{
                fontFamily: "var(--display-2)",
                fontWeight: 800,
                fontSize: 84,
                color: C.red,
                lineHeight: 0.85,
                letterSpacing: "-0.045em",
              }}
            >
              {card.dayNumber}
            </div>
            <div
              style={{
                paddingBottom: 8,
                fontFamily: "var(--display)",
                fontWeight: 900,
                fontSize: 22,
                color: C.red,
                textTransform: "uppercase",
                letterSpacing: "-0.01em",
              }}
            >
              {card.weekday}
            </div>
          </div>
          <div
            style={{
              padding: "0 16px 10px",
              fontFamily: "var(--serif)",
              fontSize: 11,
              color: C.ink2,
            }}
          >
            {card.lunarLabel}
            {card.canChi && card.canChi !== "—" ? (
              <>
                {" · ngày "}
                <strong style={{ color: C.ink, fontWeight: 600 }}>
                  {card.canChi}
                </strong>
              </>
            ) : null}
          </div>
          <div
            style={{
              padding: "8px 16px 12px",
              borderTop: `1px solid ${C.hairline}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
            }}
          >
            <div>
              {menh && menh !== "—" ? (
                <Mono style={{ color: C.goldDeep, fontSize: 8 }}>
                  Cho mệnh {menh}
                </Mono>
              ) : null}
              <div
                style={{
                  fontFamily: "var(--display-2)",
                  fontWeight: 700,
                  fontSize: 12,
                  color: C.goldDeep,
                  textTransform: "uppercase",
                }}
              >
                {card.verdictLabel}
              </div>
            </div>
            <span
              style={{
                fontFamily: "var(--display-2)",
                fontWeight: 800,
                fontSize: 26,
                color: C.goldDeep,
                fontVariantNumeric: "tabular-nums",
                letterSpacing: "-0.015em",
              }}
            >
              {card.score}
            </span>
          </div>
        </div>

        <p
          style={{
            marginTop: 32,
            fontFamily: "var(--serif)",
            fontStyle: "italic",
            fontSize: 14,
            color: "rgba(237,231,211,0.65)",
            lineHeight: 1.5,
            textAlign: "center",
            maxWidth: 280,
          }}
        >
          Mỗi ngày một trang — đã chấm theo mệnh{" "}
          <strong style={{ color: C.gold, fontWeight: 600 }}>{footerMenh}</strong>.
        </p>

        <button
          type="button"
          disabled={finishing}
          onClick={() => void openCalendar()}
          style={{ ...btnPrimaryGold, marginTop: "auto" }}
        >
          {finishing ? "Đang mở…" : "Vào lịch hôm nay →"}
        </button>
      </div>
    </CForestShell>
  );
}
