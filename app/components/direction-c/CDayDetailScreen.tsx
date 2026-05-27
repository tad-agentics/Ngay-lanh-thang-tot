import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";

import { ErrorBanner } from "~/components/ErrorBanner";
import { BackBar } from "~/components/brand";
import { useSavedPicks } from "~/hooks/useSavedPicks";
import { LichToPageCard } from "~/components/direction-c/LichToPageCard";
import { invokeBatTu } from "~/lib/bat-tu";
import { profileToBatTuPersonQuery } from "~/lib/bat-tu-birth";
import { parseDayDetailForView } from "~/lib/day-detail-view";
import { CT } from "~/lib/c-tokens";
import { mastheadFromIso, weekdayFromIso } from "~/lib/lich-format";
import { verdictLabelFromScore } from "~/lib/c-score";
import { laSoJsonToRevealProps } from "~/lib/la-so-ui";
import { useProfile } from "~/hooks/useProfile";
import { addDaysToIso } from "~/hooks/useStreak";

export function CDayDetailScreen() {
  const { ngay } = useParams();
  const navigate = useNavigate();
  const { profile, loading: profileLoading } = useProfile();
  const { savePick } = useSavedPicks();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<ReturnType<typeof parseDayDetailForView> | null>(
    null,
  );

  const iso = ngay ?? "";
  const menh = profile ? laSoJsonToRevealProps(profile.la_so)?.menh ?? null : null;

  useEffect(() => {
    if (profileLoading || !profile || !iso) return;
    const body = profileToBatTuPersonQuery(profile);
    if (!body.birth_date) {
      setLoading(false);
      setError("Cần ngày sinh trên hồ sơ.");
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void (async () => {
      const res = await invokeBatTu<unknown>({
        op: "day-detail",
        body: { ...body, date: iso },
      });
      if (cancelled) return;
      if (!res.ok) {
        setError(res.message ?? "Không tải chi tiết ngày.");
        setDetail(null);
      } else {
        setDetail(parseDayDetailForView(res.data));
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [profile, profileLoading, iso]);

  const prevIso = iso ? addDaysToIso(iso, -1) : "";
  const nextIso = iso ? addDaysToIso(iso, 1) : "";
  const monthNum = iso ? Number(iso.slice(5, 7)) : 0;

  const score = detail?.score ?? null;

  async function handleSavePick() {
    if (!detail || !iso || saving) return;
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
    if (r.ok) toast.success("Đã lưu vào sổ việc.");
    else toast.error(r.error ?? "Không lưu được.");
  }

  return (
    <main
      className="flex min-h-full flex-col"
      style={{ background: CT.paper, color: CT.ink }}
    >
      <BackBar title={monthNum ? `Lịch tháng ${monthNum}` : "Chi tiết ngày"} />

      <div className="flex-1 overflow-y-auto px-[22px] pb-8 pt-1">
        {error ? <ErrorBanner message={error} /> : null}
        {loading ? (
          <p className="py-12 text-center font-serif text-sm" style={{ color: CT.muted }}>
            Đang tải…
          </p>
        ) : null}

        {detail ? (
          <>
            <LichToPageCard
              masthead={mastheadFromIso(iso, detail.canChi)}
              dayNumber={iso.slice(8, 10).replace(/^0/, "") || "—"}
              weekday={weekdayFromIso(iso)}
              lunarLine={
                <>
                  {detail.lunarDate || "—"}
                  {detail.canChi ? (
                    <>
                      {" "}
                      · ngày{" "}
                      <strong style={{ color: CT.ink, fontWeight: 600 }}>
                        {detail.canChi}
                      </strong>
                    </>
                  ) : null}
                </>
              }
              verdictLabel={
                score != null ? verdictLabelFromScore(score) : detail.grade || "—"
              }
              verdictSub={menh ? <>cho mệnh {menh}</> : null}
              score={score}
              quote={detail.reasonLines[0] ?? null}
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
              onVerdictClick={() => void navigate(`/luan-ai/day-${iso}`)}
            />

            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSavePick()}
              className="mt-4 flex min-h-[44px] w-full cursor-pointer items-center justify-center border-none uppercase tracking-widest disabled:opacity-60"
              style={{
                padding: 12,
                background: CT.forest,
                color: CT.cream,
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: 12,
                letterSpacing: "0.08em",
              }}
            >
              {saving ? "Đang lưu…" : "Đánh dấu để nhắc trước 1 ngày"}
            </button>
          </>
        ) : null}
      </div>
    </main>
  );
}
