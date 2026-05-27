import { Link } from "react-router";

import { ErrorBanner } from "~/components/ErrorBanner";
import { BackBar, Mono } from "~/components/brand";
import { useDayLuanReading } from "~/hooks/useDayLuanReading";
import { CT } from "~/lib/c-tokens";
import { weekdayFromIso } from "~/lib/lich-format";
import { formatIsoDateLichHeader } from "~/lib/tu-tru-dates";

export function CAiSectionedScreen({ iso }: { iso: string }) {
  const {
    profileLoading,
    detailLoading,
    detailError,
    detail,
    unlocked,
    subActive,
  } = useDayLuanReading(iso);

  const loading = profileLoading || detailLoading;
  const sections = (detail?.breakdown ?? []).map((row) => ({
    title: row.source,
    verdict: row.type || "—",
    body: row.reasonVi,
    score: row.points >= 0 ? `+${row.points}` : String(row.points),
  }));

  if (!loading && sections.length === 0 && detail) {
    if (detail.trucTitle) {
      sections.push({
        title: "Trực ngày",
        verdict: detail.trucTitle,
        body: detail.trucDescription || detail.trucLine,
        score: "",
      });
    }
    if (detail.starLine) {
      sections.push({
        title: "Nhị thập bát tú",
        verdict: detail.starLine.split("·")[0]?.trim() ?? detail.starLine,
        body: detail.starLine,
        score: "",
      });
    }
    for (const line of detail.reasonLines.slice(0, 2)) {
      sections.push({
        title: "Luận giải",
        verdict: detail.grade,
        body: line,
        score: "",
      });
    }
  }

  return (
    <main
      className="min-h-[100svh] flex flex-col"
      style={{ background: CT.paper, color: CT.ink }}
    >
      <BackBar
        title="Luận giải đầy đủ"
        endAdornment={<Mono style={{ color: CT.muted, fontSize: 9 }}>Có nguồn</Mono>}
      />

      <div className="flex-1 overflow-auto px-6 pt-2 pb-8">
        {loading ? (
          <p className="font-serif text-sm" style={{ color: CT.muted }}>
            Đang tải…
          </p>
        ) : null}
        {detailError ? <ErrorBanner message={detailError} /> : null}

        {!loading && !detailError && detail ? (
          <>
            <div className="flex items-baseline gap-2.5 mt-1.5 flex-wrap">
              <span
                style={{
                  fontFamily: "var(--display-2)",
                  fontWeight: 800,
                  fontSize: 22,
                  color: CT.ink,
                  letterSpacing: "-0.01em",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {formatIsoDateLichHeader(iso)}
              </span>
              <span className="font-serif text-xs" style={{ color: CT.muted }}>
                · {weekdayFromIso(iso)}
                {detail.canChi ? ` · ${detail.canChi}` : ""}
              </span>
            </div>

            {!unlocked ? (
              <div className="mt-8 text-center">
                <p className="font-serif text-sm mb-4" style={{ color: CT.ink2 }}>
                  Cần gói lịch đang hoạt động để xem bản đầy đủ có nguồn.
                </p>
                <Link
                  to="/dat-lich"
                  className="inline-block py-3 px-6 font-display text-xs font-extrabold uppercase tracking-wider"
                  style={{ background: CT.forest, color: CT.cream }}
                >
                  {subActive ? "Tải lại" : "Lập lịch / gia hạn"}
                </Link>
              </div>
            ) : (
              <>
                {sections.map((s, i) => (
                  <div
                    key={`${s.title}-${i}`}
                    className="mt-4 pt-4"
                    style={{
                      borderTop:
                        i === 0
                          ? `1px solid ${CT.hairline}`
                          : `1px solid ${CT.hairline2}`,
                    }}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <Mono style={{ color: CT.muted, fontSize: 9 }}>{s.title}</Mono>
                      {s.score ? (
                        <span
                          style={{
                            fontFamily: "var(--display-2)",
                            fontWeight: 700,
                            fontSize: 13,
                            color: CT.goldDeep,
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {s.score}
                        </span>
                      ) : null}
                    </div>
                    <div
                      className="mt-1 font-display text-base font-bold"
                      style={{ color: CT.ink, letterSpacing: "-0.005em" }}
                    >
                      {s.verdict}
                    </div>
                    <p
                      className="mt-1.5 font-serif text-[13px] leading-relaxed"
                      style={{ color: CT.ink2 }}
                    >
                      {s.body}
                    </p>
                  </div>
                ))}

                {detail.score != null ? (
                  <div
                    className="mt-5 py-3.5 flex justify-between items-baseline"
                    style={{ borderTop: `2px solid ${CT.ink}` }}
                  >
                    <div
                      className="font-display text-base font-extrabold uppercase"
                      style={{ letterSpacing: "-0.005em" }}
                    >
                      Tổng điểm
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span
                        style={{
                          fontFamily: "var(--display-2)",
                          fontWeight: 800,
                          fontSize: 32,
                          color: CT.goldDeep,
                          lineHeight: 1,
                          letterSpacing: "-0.015em",
                        }}
                      >
                        {detail.score}
                      </span>
                      <span className="font-serif text-[13px]" style={{ color: CT.muted }}>
                        /100
                      </span>
                    </div>
                  </div>
                ) : null}

                <div className="mt-5">
                  <Mono style={{ color: CT.muted, fontSize: 9 }}>Nguồn đối chiếu</Mono>
                  <div className="mt-2 flex flex-col gap-1.5">
                    {[
                      ["[1]", "Hiệp Kỷ Biện Phương — Trực ngày"],
                      ["[2]", "Ngọc Hạp Thông Thư — Thần sát"],
                      ["[3]", "Tứ trụ — tương sinh tương khắc với lá số"],
                      ["[4]", "Lịch Vạn Niên — giờ Hoàng đạo"],
                    ].map(([n, t]) => (
                      <div
                        key={n}
                        className="flex gap-2 font-serif text-xs leading-snug"
                        style={{ color: CT.ink2 }}
                      >
                        <span
                          className="font-mono text-[10px] min-w-6"
                          style={{ color: CT.goldDeep }}
                        >
                          {n}
                        </span>
                        <span>{t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        ) : null}
      </div>
    </main>
  );
}
