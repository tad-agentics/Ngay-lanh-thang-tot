import { useState } from "react";

import { BackBar, Mono, Ticket } from "~/components/brand";
import { invokeBatTu } from "~/lib/bat-tu";
import {
  ddMmYyyyInputToIsoDate,
  formatDdMmYyyyWithAutoSlash,
} from "~/lib/bat-tu-birth";
import { CT } from "~/lib/c-tokens";

interface ConvertResult {
  lunarDay: string;
  lunarMonth: string;
  lunarYear: string;
  canChi: string;
  truc: string;
  sao: string;
  yearLabel: string;
  leap: boolean;
}

function parseConvertResult(data: unknown): ConvertResult | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  const str = (k: string) => (typeof d[k] === "string" ? String(d[k]) : "");
  const lunar_day = str("lunar_day") || str("lunarDay") || str("ngay_am");
  const lunar_month = str("lunar_month") || str("lunarMonth") || str("thang_am");
  const lunar_year = str("lunar_year") || str("lunarYear") || str("nam_am");
  const can_chi_day =
    str("can_chi_day") || str("canChiDay") || str("can_chi") || str("ngay_can_chi");
  if (!lunar_day) return null;
  return {
    lunarDay: lunar_day,
    lunarMonth: lunar_month,
    lunarYear: lunar_year,
    canChi: can_chi_day,
    truc: str("truc") || str("truc_ngay"),
    sao: str("sao") || str("star"),
    yearLabel: str("year_can_chi") || str("yearCanChi") || lunar_year,
    leap: Boolean(d.leap || d.nhuan || d.is_leap),
  };
}

export function CChuyenLichScreen() {
  const [dateInput, setDateInput] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ConvertResult | null>(null);
  const [rawDate, setRawDate] = useState<string | null>(null);

  async function handleConvert() {
    setInputError(null);
    const iso = ddMmYyyyInputToIsoDate(dateInput.trim());
    if (!iso) {
      setInputError("Nhập đúng định dạng DD/MM/YYYY (ví dụ 12/05/2026).");
      return;
    }
    setLoading(true);
    setResult(null);
    const res = await invokeBatTu<unknown>({ op: "convert-date", body: { solar: iso } });
    setLoading(false);
    if (!res.ok) {
      setInputError(res.message ?? "Không chuyển được — thử lại.");
      return;
    }
    const parsed = parseConvertResult(res.data);
    if (!parsed) {
      setInputError("Không đọc được kết quả từ máy chủ.");
      return;
    }
    setResult(parsed);
    setRawDate(dateInput.trim());
  }

  return (
    <div
      className="flex min-h-full flex-col"
      style={{ background: CT.paper, color: CT.ink, fontFamily: "var(--serif)" }}
    >
      <BackBar title="Chuyển lịch" subtitle="Tiện ích · đổi dương sang âm" />

      <div className="flex-1 px-5 pb-10">
        <div
          className="mb-5 border px-4 py-3 text-center font-[family-name:var(--font-mono)] text-[10px] font-bold uppercase tracking-[0.08em]"
          style={{ borderColor: CT.goldDeep, color: CT.goldDeep, background: "rgba(154,124,34,0.06)" }}
        >
          Dương → Âm
        </div>

        <div className="border px-4 py-4" style={{ borderColor: CT.hairline }}>
          <Mono className="text-[10px]" style={{ color: CT.muted }}>
            Ngày dương lịch
          </Mono>
          <input
            type="text"
            inputMode="numeric"
            placeholder="DD/MM/YYYY"
            value={dateInput}
            maxLength={10}
            onChange={(e) => {
              setInputError(null);
              setDateInput(formatDdMmYyyyWithAutoSlash(e.target.value));
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleConvert();
            }}
            className="mt-2 w-full border-0 border-b bg-transparent pb-2 font-[family-name:var(--font-display-2)] text-[22px] font-bold outline-none"
            style={{ borderColor: inputError ? CT.red : CT.hairline, color: CT.ink }}
          />
          {inputError ? (
            <Mono className="mt-1.5 block text-[10px]" style={{ color: CT.red }}>
              {inputError}
            </Mono>
          ) : null}
        </div>

        <button
          type="button"
          disabled={loading || !dateInput}
          onClick={() => void handleConvert()}
          className="mt-4 w-full cursor-pointer border-none py-3.5 font-[family-name:var(--font-display-2)] text-[13px] font-extrabold uppercase tracking-[0.1em] disabled:opacity-50"
          style={{ background: CT.forest, color: CT.cream }}
        >
          {loading ? "Đang tra…" : "Chuyển sang âm lịch"}
        </button>

        {result ? (
          <div className="mt-6">
            <Ticket holes stub={Boolean(result.yearLabel)} stubLabel={result.yearLabel ? `·${result.yearLabel}·` : undefined}>
              <div className="px-4 py-4">
                <Mono style={{ color: CT.muted }}>Lịch âm · {rawDate}</Mono>
                <div className="mt-1.5 font-[family-name:var(--font-display-2)] text-[38px] font-black leading-none text-forest">
                  {result.lunarDay
                    ? `${result.lunarDay} tháng ${result.lunarMonth}`
                    : "—"}
                </div>
                {result.canChi ? (
                  <p className="mt-3 text-sm" style={{ color: CT.ink2 }}>
                    Can chi ngày: <strong>{result.canChi}</strong>
                    {[result.truc, result.sao].filter(Boolean).length
                      ? ` · ${[result.truc, result.sao].filter(Boolean).join(" · ")}`
                      : ""}
                  </p>
                ) : null}
              </div>
            </Ticket>
          </div>
        ) : null}
      </div>
    </div>
  );
}
