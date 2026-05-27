import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { BackBar, Mono } from "~/components/brand";
import { ErrorBanner } from "~/components/ErrorBanner";
import { useProfile } from "~/hooks/useProfile";
import { invokeBatTu } from "~/lib/bat-tu";
import { profileToBatTuPersonQuery } from "~/lib/bat-tu-birth";
import { CT } from "~/lib/c-tokens";
import {
  PHONG_THUY_PURPOSE_OPTIONS,
  type PhongThuyPurposeValue,
  phongThuyPayloadToTeaserView,
  type PhongThuyView,
} from "~/lib/phong-thuy-ui";
import { profileHasLaso } from "~/lib/la-so-ui";

function emptyView(): PhongThuyView {
  return {
    status: null,
    version: null,
    purpose: null,
    userMenhLabel: null,
    dungThanApi: null,
    kyThanApi: null,
    huongTotItems: [],
    mauTotItems: [],
    soTotNumbers: [],
    huongTot: "—",
    huongXau: "—",
    mauTot: "—",
    mauKy: "—",
    soTot: "—",
    soKy: "—",
    goiY: [],
    purposeSpecific: null,
    personalization: null,
    phiTinhYear: null,
    phiTinh: [],
    huongTotNamNay: [],
    huongXauNamNay: [],
    hoaGiai: [],
    phiTinhNoteVi: null,
    coupleHarmony: null,
  };
}

/** Direction C — phong thuỷ teaser (subset of legacy /app/phong-thuy). */
export function CPhongThuyScreen() {
  const navigate = useNavigate();
  const { profile, loading: profileLoading } = useProfile();
  const [purpose, setPurpose] = useState<PhongThuyPurposeValue>("NHA_O");
  const [year, setYear] = useState(() => String(new Date().getFullYear()));
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<PhongThuyView | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasLaso = profile ? profileHasLaso(profile.la_so) : false;

  useEffect(() => {
    if (!profileLoading && profile && !hasLaso) {
      navigate("/gio-sinh", { replace: true });
    }
  }, [profileLoading, profile, hasLaso, navigate]);

  async function loadTeaser() {
    if (!profile) return;
    const q = profileToBatTuPersonQuery(profile);
    if (!q.birth_date) {
      toast.error("Hồ sơ thiếu ngày sinh.");
      return;
    }
    const yearN = Number.parseInt(year.trim(), 10);
    if (!Number.isFinite(yearN) || yearN < 1900 || yearN > 2100) {
      toast.error("Năm cần trong khoảng 1900–2100.");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await invokeBatTu({
      op: "phong-thuy",
      body: {
        birth_date: q.birth_date,
        birth_time: q.birth_time,
        gender: q.gender,
        tz: q.tz ?? "Asia/Ho_Chi_Minh",
        purpose,
        year: yearN,
        detail: "teaser",
      },
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    const v = phongThuyPayloadToTeaserView(res.data);
    setView(v ?? emptyView());
  }

  const display = view ?? emptyView();

  return (
    <div
      className="flex min-h-full flex-col"
      style={{ background: CT.paper, color: CT.ink, fontFamily: "var(--serif)" }}
    >
      <BackBar title="Phong thuỷ" />

      <div className="flex-1 overflow-auto px-6 pb-24 pt-2">
        <Mono style={{ color: CT.muted, fontSize: 9 }}>Gợi ý theo mệnh · teaser</Mono>
        <p className="mt-2 text-sm leading-snug" style={{ color: CT.ink2 }}>
          Hướng, màu và số hợp mệnh — đối chiếu lá số tứ trụ của bạn.
        </p>

        {error ? (
          <div className="mt-4">
            <ErrorBanner message={error} />
          </div>
        ) : null}

        <label className="mt-5 block">
          <Mono style={{ color: CT.muted, fontSize: 9 }}>Mục đích</Mono>
          <select
            value={purpose}
            onChange={(e) => setPurpose(e.target.value as PhongThuyPurposeValue)}
            className="mt-1.5 w-full border bg-white px-3 py-2.5 font-serif text-sm"
            style={{ borderColor: CT.hairline, color: CT.ink }}
          >
            {PHONG_THUY_PURPOSE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-4 block">
          <Mono style={{ color: CT.muted, fontSize: 9 }}>Năm Phi Tinh</Mono>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="mt-1.5 w-full border bg-white px-3 py-2.5 font-serif text-sm tabular-nums"
            style={{ borderColor: CT.hairline, color: CT.ink }}
          />
        </label>

        <button
          type="button"
          disabled={busy || profileLoading}
          onClick={() => void loadTeaser()}
          className="mt-5 w-full cursor-pointer border-none py-3.5 font-[family-name:var(--font-display-2)] text-xs font-extrabold uppercase tracking-[0.08em] disabled:opacity-60"
          style={{ background: CT.forest, color: CT.cream }}
        >
          {busy ? "Đang tính…" : "Xem gợi ý"}
        </button>

        {view ? (
          <div
            className="mt-8 border-t pt-6"
            style={{ borderColor: CT.hairline }}
          >
            <Mono style={{ color: CT.muted, fontSize: 9 }}>Kết quả</Mono>
            <div className="mt-3 space-y-3 text-sm" style={{ color: CT.ink2 }}>
              <p>
                <strong style={{ color: CT.ink }}>Hướng tốt:</strong>{" "}
                {display.huongTot}
              </p>
              <p>
                <strong style={{ color: CT.ink }}>Màu tốt:</strong> {display.mauTot}
              </p>
              <p>
                <strong style={{ color: CT.ink }}>Số tốt:</strong> {display.soTot}
              </p>
              {display.goiY.length > 0 ? (
                <ul className="list-disc pl-5">
                  {display.goiY.slice(0, 4).map((g, i) => (
                    <li key={`${g.tieu_de ?? "g"}-${i}`}>
                      {g.tieu_de ? `${g.tieu_de}: ` : ""}
                      {g.mo_ta ?? ""}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
