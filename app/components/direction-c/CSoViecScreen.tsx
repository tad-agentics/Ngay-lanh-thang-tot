import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { BackBar, Mono } from "~/components/brand";
import { useSavedPicks } from "~/hooks/useSavedPicks";
import { CT } from "~/lib/c-tokens";

type Tab = "upcoming" | "past";

function diffDays(dayIso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dayIso.slice(0, 10)}T12:00:00`);
  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
}

function formatDayIso(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}`;
}

/** Direction C — sổ việc (saved picks list). */
export function CSoViecScreen() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("upcoming");
  const { picks, loading, error, deletePick } = useSavedPicks();

  const dated = picks.filter((p) => p.day_iso);
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
      className="flex min-h-full flex-col"
      style={{ background: CT.paper, color: CT.ink, fontFamily: "var(--serif)" }}
    >
      <BackBar
        title="Sổ việc"
        subtitle={`${dated.length} việc · ${upcoming.length} sắp tới`}
      />

      <div className="px-5 pt-2">
        <div
          className="flex gap-0.5 p-[3px]"
          style={{ background: "rgba(154,124,34,0.08)" }}
        >
          {(
            [
              { id: "upcoming" as const, label: `Sắp tới · ${upcoming.length}` },
              { id: "past" as const, label: `Đã qua · ${past.length}` },
            ] as const
          ).map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className="flex-1 cursor-pointer border-none py-2.5 font-[family-name:var(--font-display-2)] text-xs font-bold uppercase tracking-[0.08em]"
                style={{
                  background: active ? CT.forest : "transparent",
                  color: active ? CT.cream : CT.muted,
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-auto pb-10 pt-3">
        {loading ? (
          <p className="py-8 text-center text-sm" style={{ color: CT.muted }}>
            Đang tải sổ…
          </p>
        ) : error ? (
          <p className="py-8 text-center text-sm" style={{ color: CT.red }}>
            {error}
          </p>
        ) : items.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm" style={{ color: CT.muted }}>
              {tab === "upcoming"
                ? "Chưa có việc sắp tới — lưu ngày từ tra cứu hoặc chi tiết ngày."
                : "Chưa có việc đã qua."}
            </p>
            <button
              type="button"
              onClick={() => void navigate("/tra-cuu")}
              className="mt-4 cursor-pointer border-none px-6 py-3 font-[family-name:var(--font-display-2)] text-xs font-extrabold uppercase tracking-[0.08em]"
              style={{ background: CT.forest, color: CT.cream }}
            >
              Tra cứu ngày tốt
            </button>
          </div>
        ) : (
          items.map((it) => {
            const days = diffDays(it.day_iso!);
            const label = it.label ?? "Việc đã lưu";
            return (
              <div
                key={it.id}
                className="relative mx-5 mb-2 flex items-center gap-3 border bg-white px-4 py-3.5"
                style={{ borderColor: CT.hairline }}
              >
                <div
                  className="absolute bottom-0 left-0 top-0 w-1"
                  style={{
                    background:
                      tab === "upcoming" && days <= 7 ? CT.goldDeep : CT.hairline2,
                  }}
                />
                <button
                  type="button"
                  className="min-w-0 flex-1 cursor-pointer border-none bg-transparent p-0 text-left"
                  onClick={() => void navigate(`/ngay/${it.day_iso}`)}
                >
                  <div className="font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-[-0.005em]">
                    {label}
                  </div>
                  <Mono className="mt-1 text-[9px]" style={{ color: CT.muted }}>
                    {formatDayIso(it.day_iso!)}
                    {tab === "upcoming"
                      ? ` · ${days === 0 ? "hôm nay" : `${days} ngày nữa`}`
                      : ` · ${Math.abs(days)} ngày trước`}
                    {it.score != null ? ` · ${it.score}` : ""}
                  </Mono>
                </button>
                <button
                  type="button"
                  aria-label="Xoá"
                  onClick={() => void handleDelete(it.id)}
                  className="cursor-pointer border-none bg-transparent px-2 font-serif text-lg"
                  style={{ color: CT.muted }}
                >
                  ×
                </button>
              </div>
            );
          })
        )}

        {!loading && dated.length > 0 ? (
          <div className="px-5 pt-4">
            <button
              type="button"
              onClick={() => void navigate("/tra-cuu")}
              className="w-full cursor-pointer border-none py-3.5 font-[family-name:var(--font-display-2)] text-xs font-extrabold uppercase tracking-[0.08em]"
              style={{ background: CT.forest, color: CT.cream }}
            >
              + Thêm việc mới
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
