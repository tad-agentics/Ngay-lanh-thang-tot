import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { BackBar, Mono } from "~/components/brand";
import { ErrorBanner } from "~/components/ErrorBanner";
import { useProfile } from "~/hooks/useProfile";
import { invokeBatTu } from "~/lib/bat-tu";
import {
  ddMmYyyyInputToBatTuBirthDate,
  formatDdMmYyyyWithAutoSlash,
  isPartialDdMmYyyyInput,
  profileToBatTuPersonQuery,
} from "~/lib/bat-tu-birth";
import { CT } from "~/lib/c-tokens";
import { invokeGenerateReading } from "~/lib/generate-reading";
import {
  PHONG_THUY_PURPOSE_OPTIONS,
  type PhongThuyPurposeValue,
  phongThuyPayloadToTeaserView,
  phongThuyPayloadToView,
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

function PhongThuyResults({ view, full }: { view: PhongThuyView; full: boolean }) {
  return (
    <div className="mt-3 space-y-3 text-sm" style={{ color: CT.ink2 }}>
      <p>
        <strong style={{ color: CT.ink }}>Hướng tốt:</strong> {view.huongTot}
      </p>
      {full ? (
        <p>
          <strong style={{ color: CT.ink }}>Hướng xấu:</strong> {view.huongXau}
        </p>
      ) : null}
      <p>
        <strong style={{ color: CT.ink }}>Màu tốt:</strong> {view.mauTot}
      </p>
      {full && view.mauKy !== "—" ? (
        <p>
          <strong style={{ color: CT.ink }}>Màu kỵ:</strong> {view.mauKy}
        </p>
      ) : null}
      <p>
        <strong style={{ color: CT.ink }}>Số tốt:</strong> {view.soTot}
      </p>
      {full && view.soKy !== "—" ? (
        <p>
          <strong style={{ color: CT.ink }}>Số kỵ:</strong> {view.soKy}
        </p>
      ) : null}
      {view.goiY.length > 0 ? (
        <ul className="list-disc pl-5">
          {view.goiY.slice(0, full ? 8 : 3).map((g, i) => (
            <li key={`${g.tieu_de ?? "g"}-${i}`}>
              {g.tieu_de ? `${g.tieu_de}: ` : ""}
              {g.mo_ta ?? ""}
            </li>
          ))}
        </ul>
      ) : null}
      {full && view.phiTinhNoteVi ? (
        <p className="text-xs italic" style={{ color: CT.muted }}>
          {view.phiTinhNoteVi}
        </p>
      ) : null}
    </div>
  );
}

/** Direction C — phong thuỷ teaser + full unlock (no lượng UI). */
export function CPhongThuyScreen() {
  const navigate = useNavigate();
  const { profile, loading: profileLoading } = useProfile();
  const [purpose, setPurpose] = useState<PhongThuyPurposeValue>("NHA_O");
  const [year, setYear] = useState(() => String(new Date().getFullYear()));
  const [partnerNgay, setPartnerNgay] = useState("");
  const [teaserBusy, setTeaserBusy] = useState(false);
  const [fullBusy, setFullBusy] = useState(false);
  const [teaserView, setTeaserView] = useState<PhongThuyView | null>(null);
  const [fullView, setFullView] = useState<PhongThuyView | null>(null);
  const [phongAiReading, setPhongAiReading] = useState<string | null>(null);
  const [phongAiLoading, setPhongAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const teaserReq = useRef(0);

  const hasLaso = profile ? profileHasLaso(profile.la_so) : false;

  useEffect(() => {
    if (!profileLoading && profile && !hasLaso) {
      navigate("/gio-sinh", { replace: true });
    }
  }, [profileLoading, profile, hasLaso, navigate]);

  useEffect(() => {
    if (!profile || !hasLaso || profileLoading) return;
    const t = window.setTimeout(() => {
      const reqId = ++teaserReq.current;
      void (async () => {
        const q = profileToBatTuPersonQuery(profile);
        if (!q.birth_date) return;
        const yearN = Number.parseInt(year.trim(), 10);
        if (!Number.isFinite(yearN) || yearN < 1900 || yearN > 2100) return;
        let partnerBirth: string | null = null;
        if (partnerNgay.trim()) {
          partnerBirth = ddMmYyyyInputToBatTuBirthDate(partnerNgay.trim());
          if (!partnerBirth) {
            if (reqId === teaserReq.current) setTeaserView(null);
            return;
          }
        }
        setTeaserBusy(true);
        const res = await invokeBatTu({
          op: "phong-thuy",
          body: {
            birth_date: q.birth_date,
            birth_time: q.birth_time,
            gender: q.gender,
            tz: q.tz ?? "Asia/Ho_Chi_Minh",
            purpose,
            year: yearN,
            ...(partnerBirth ? { partner_birth_date: partnerBirth } : {}),
            detail: "teaser",
          },
        });
        if (reqId !== teaserReq.current) return;
        setTeaserBusy(false);
        if (!res.ok) {
          setError(res.message);
          return;
        }
        setTeaserView(phongThuyPayloadToTeaserView(res.data) ?? emptyView());
      })();
    }, 400);
    return () => {
      teaserReq.current += 1;
      window.clearTimeout(t);
    };
  }, [profile, hasLaso, profileLoading, purpose, year, partnerNgay]);

  async function loadFull() {
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
    const partnerBirth =
      partnerNgay.trim().length > 0
        ? ddMmYyyyInputToBatTuBirthDate(partnerNgay.trim())
        : null;
    if (partnerNgay.trim() && !partnerBirth) {
      toast.error("Ngày sinh người cùng không gian không hợp lệ.");
      return;
    }

    setFullBusy(true);
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
        ...(partnerBirth ? { partner_birth_date: partnerBirth } : {}),
      },
    });
    setFullBusy(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    const v = phongThuyPayloadToView(res.data);
    if (!v) {
      toast.error("Không tải được kết quả đầy đủ.");
      return;
    }
    setFullView(v);
    setPhongAiLoading(true);
    setPhongAiReading(null);
    const gen = await invokeGenerateReading({ endpoint: "phong-thuy", data: res.data });
    setPhongAiReading(gen.reading?.trim() || null);
    setPhongAiLoading(false);
  }

  const partnerInvalid =
    partnerNgay.trim().length > 0 &&
    ddMmYyyyInputToBatTuBirthDate(partnerNgay.trim()) == null &&
    !isPartialDdMmYyyyInput(partnerNgay);

  const displayTeaser = teaserView ?? emptyView();
  const displayFull = fullView ?? emptyView();

  return (
    <div
      className="flex min-h-full flex-col"
      style={{ background: CT.paper, color: CT.ink, fontFamily: "var(--serif)" }}
    >
      <BackBar title="Phong thuỷ" />

      <div className="flex-1 overflow-auto px-6 pb-24 pt-2">
        <p className="text-sm leading-snug" style={{ color: CT.ink2 }}>
          Hướng, màu và số theo mệnh — gợi ý Phi Tinh năm bạn chọn.
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
            onChange={(e) => {
              setPurpose(e.target.value as PhongThuyPurposeValue);
              setFullView(null);
            }}
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
            onChange={(e) => {
              setYear(e.target.value);
              setFullView(null);
            }}
            className="mt-1.5 w-full border bg-white px-3 py-2.5 font-serif text-sm tabular-nums"
            style={{ borderColor: CT.hairline, color: CT.ink }}
          />
        </label>

        <label className="mt-4 block">
          <Mono style={{ color: CT.muted, fontSize: 9 }}>
            Ngày sinh người cùng không gian (tuỳ chọn)
          </Mono>
          <input
            type="text"
            inputMode="numeric"
            placeholder="DD/MM/YYYY"
            value={partnerNgay}
            onChange={(e) =>
              setPartnerNgay(formatDdMmYyyyWithAutoSlash(e.target.value))
            }
            className="mt-1.5 w-full border bg-white px-3 py-2.5 font-serif text-sm"
            style={{
              borderColor: partnerInvalid ? CT.red : CT.hairline,
              color: CT.ink,
            }}
          />
        </label>

        {teaserBusy ? (
          <p className="mt-5 text-sm" style={{ color: CT.muted }}>
            Đang tải gợi ý…
          </p>
        ) : teaserView ? (
          <div className="mt-6 border-t pt-5" style={{ borderColor: CT.hairline }}>
            <Mono style={{ color: CT.muted, fontSize: 9 }}>Gợi ý nhanh</Mono>
            <PhongThuyResults view={displayTeaser} full={false} />
          </div>
        ) : null}

        {!fullView ? (
          <button
            type="button"
            disabled={fullBusy || partnerInvalid || profileLoading}
            onClick={() => void loadFull()}
            className="mt-6 w-full cursor-pointer border-none py-3.5 font-[family-name:var(--font-display-2)] text-xs font-extrabold uppercase tracking-[0.08em] disabled:opacity-60"
            style={{ background: CT.forest, color: CT.cream }}
          >
            {fullBusy ? "Đang mở đầy đủ…" : "Xem phong thuỷ đầy đủ"}
          </button>
        ) : (
          <div className="mt-6 border-t pt-5" style={{ borderColor: CT.hairline }}>
            <Mono style={{ color: CT.goldDeep, fontSize: 9 }}>Đã mở đầy đủ</Mono>
            <PhongThuyResults view={displayFull} full />
            {phongAiLoading ? (
              <p className="mt-4 text-sm" style={{ color: CT.muted }}>
                Đang soạn luận giải…
              </p>
            ) : phongAiReading ? (
              <div
                className="mt-4 border-l-2 py-2 pl-3 text-sm leading-relaxed"
                style={{ borderColor: CT.goldDeep, color: CT.ink2 }}
              >
                {phongAiReading}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
