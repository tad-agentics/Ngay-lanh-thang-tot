/**
 * /app/so-viec — Sổ việc (saved picks).
 * ViecListLight per b-refresh.jsx §3 — backed by saved_picks DB table (Wave 7).
 */

import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { BackBar, Mono } from "~/components/brand";
import { useSavedPicks } from "~/hooks/useSavedPicks";

type Tab = "upcoming" | "past";

function diffDays(dayIso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dayIso + "T00:00:00");
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export default function AppSoViec() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("upcoming");
  const { picks, loading, error, deletePick } = useSavedPicks();

  const dated = picks.filter((p) => p.day_iso != null);
  const upcoming = dated.filter((p) => diffDays(p.day_iso!) >= 0);
  const past = dated.filter((p) => diffDays(p.day_iso!) < 0);
  const items = tab === "upcoming" ? upcoming : past;

  async function handleDelete(id: string) {
    const r = await deletePick(id);
    if (r.ok) toast.success("Đã xoá khỏi sổ.");
    else toast.error(r.error ?? "Không thể xoá.");
  }

  return (
    <div
      style={{
        background: "var(--paper, #f0ece2)",
        minHeight: "100%",
        color: "var(--ink, #1a1a1a)",
        fontFamily: "var(--serif)",
      }}
    >
      <BackBar
        title="Sổ việc"
        subtitle={`${dated.length} việc · ${upcoming.length} sắp tới · ${past.length} đã qua`}
        onBack={() => void navigate(-1)}
      />

      {/* Segmented tabs */}
      <div className="px-5 pt-3">
        <div
          style={{
            display: "flex",
            gap: 6,
            padding: 4,
            background: "rgba(154,124,34,0.08)",
          }}
        >
          {(["upcoming", "past"] as const).map((v) => {
            const label = v === "upcoming"
              ? `Sắp tới · ${upcoming.length}`
              : `Đã qua · ${past.length}`;
            const active = tab === v;
            return (
              <button
                key={v}
                type="button"
                onClick={() => setTab(v)}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  background: active ? "#1d3129" : "transparent",
                  color: active ? "#ede7d3" : "#7a7050",
                  border: "none",
                  fontFamily: "var(--display-2)",
                  fontWeight: 700,
                  fontSize: 12,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "background 0.15s ease, color 0.15s ease",
                  minHeight: 44,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-5 pt-3 pb-3">
        <Mono style={{ color: "#7a7050" }}>
          Sắp xếp theo ngày gần nhất
        </Mono>
      </div>

      <div className="pb-8">
        {loading ? (
          <p style={{ textAlign: "center", padding: "24px 20px", fontFamily: "var(--serif)", fontSize: 14, color: "#7a7050" }}>
            Đang tải sổ việc…
          </p>
        ) : error ? (
          <p style={{ textAlign: "center", padding: "24px 20px", fontFamily: "var(--serif)", fontSize: 14, color: "#c25c5c" }}>
            {error}
          </p>
        ) : tab === "upcoming" ? (
          items.map((it) => {
            const days = diffDays(it.day_iso!);
            const label = it.label ?? it.source_endpoint;
            return (
              <div
                key={it.id}
                style={{
                  margin: "0 22px 8px",
                  background: "#fff",
                  border: "1px solid rgba(154,124,34,0.22)",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 4,
                    background: days <= 5 ? "var(--gold, #c9a84c)" : "rgba(154,124,34,0.3)",
                  }}
                />
                <div
                  style={{
                    padding: "14px 16px 14px 18px",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                  }}
                >
                  <div style={{ minWidth: 56, textAlign: "center" }}>
                    <div
                      style={{
                        fontFamily: "var(--display-2)",
                        fontWeight: 800,
                        fontSize: 28,
                        color: "var(--ink, #1a1a1a)",
                        lineHeight: 1,
                      }}
                    >
                      {days}
                    </div>
                    <Mono style={{ color: "#7a7050", marginTop: 2 }} size={12}>
                      còn ngày
                    </Mono>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: "var(--display-2)",
                        fontWeight: 700,
                        fontSize: 14,
                        color: "var(--ink, #1a1a1a)",
                        textTransform: "uppercase",
                        letterSpacing: "-0.005em",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {label}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Mono style={{ color: "#7a7050" }} size={10}>{it.day_iso}</Mono>
                      {it.score != null ? (
                        <>
                          <span style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(122,112,80,0.4)", flexShrink: 0 }} />
                          <Mono style={{ color: "var(--gold-deep, #7d6219)", fontWeight: 600 }} size={10}>{it.score}/100</Mono>
                        </>
                      ) : null}
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label="Xoá"
                    onClick={() => void handleDelete(it.id)}
                    style={{
                      background: "none",
                      border: "none",
                      padding: "6px",
                      cursor: "pointer",
                      color: "rgba(122,112,80,0.5)",
                      fontSize: 16,
                      flexShrink: 0,
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          items.map((it) => {
            const days = Math.abs(diffDays(it.day_iso!));
            const label = it.label ?? it.source_endpoint;
            return (
              <div
                key={it.id}
                style={{
                  margin: "0 22px 6px",
                  padding: "10px 14px",
                  background: "rgba(255,255,255,0.5)",
                  border: "1px solid rgba(154,124,34,0.12)",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  opacity: 0.75,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: "var(--display-2)",
                      fontWeight: 600,
                      fontSize: 12,
                      color: "#3a3220",
                      textTransform: "uppercase",
                      letterSpacing: "-0.005em",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {label}
                  </div>
                  <Mono style={{ color: "#7a7050", marginTop: 2 }} size={10}>
                    {it.day_iso}{it.score != null ? ` · ${it.score}/100` : ""}
                  </Mono>
                </div>
                <Mono style={{ color: "#7a7050" }} size={12}>
                  cách {days} ngày
                </Mono>
                <button
                  type="button"
                  aria-label="Xoá"
                  onClick={() => void handleDelete(it.id)}
                  style={{
                    background: "none",
                    border: "none",
                    padding: "4px 6px",
                    cursor: "pointer",
                    color: "rgba(122,112,80,0.4)",
                    fontSize: 14,
                    flexShrink: 0,
                  }}
                >
                  ×
                </button>
              </div>
            );
          })
        )}

        {!loading && items.length === 0 ? (
          <div className="px-5 py-6 text-center">
            <p style={{ fontFamily: "var(--serif)", fontSize: 14, color: "#7a7050" }}>
              {tab === "upcoming" ? "Chưa có việc sắp tới." : "Chưa có việc nào đã qua."}
            </p>
            <p style={{ fontFamily: "var(--mono)", fontSize: 12, color: "#9a7050", marginTop: 6, letterSpacing: "0.08em", textTransform: "uppercase", lineHeight: 1.45 }}>
              Lưu ngày lành từ kết quả chọn ngày để thêm vào sổ.
            </p>
          </div>
        ) : null}

        {/* Add new */}
        <div className="px-5 pt-4">
          <button
            type="button"
            onClick={() => void navigate("/app/chon-ngay")}
            style={{
              width: "100%",
              padding: "14px",
              background: "#1d3129",
              color: "#ede7d3",
              border: "none",
              fontFamily: "var(--display-2)",
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            + Thêm việc mới
          </button>
        </div>
      </div>
    </div>
  );
}
