/**
 * Chuyển lịch — solar ↔ lunar date converter, forest-default (dark).
 * Wraps existing `convert-date` Edge op. Canvas 26 per b-flow3.jsx.
 */

import { useState } from "react";

import { BackBar, Kanji, Mono, Ticket } from "~/components/brand";
import { invokeBatTu } from "~/lib/bat-tu";
import {
  ddMmYyyyInputToIsoDate,
  formatDdMmYyyyWithAutoSlash,
} from "~/lib/bat-tu-birth";

const F = "#1d3129";
const C = "#ede7d3";
const M_MUTED = "#7a9a80";
const ACCENT = "#c5a55a";
const ACCENT_DIM = "rgba(197,165,90,0.22)";

type ConvertMode = "solar-to-lunar";

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
  const can_chi_day = str("can_chi_day") || str("canChiDay") || str("can_chi") || str("ngay_can_chi");
  const truc = str("truc") || str("truc_ngay");
  const sao = str("sao") || str("star") || str("sao_ngay");
  const year_can_chi = str("year_can_chi") || str("yearCanChi") || str("nam_can_chi") || lunar_year;
  const leap = Boolean(d["leap"] || d["nhuan"] || d["is_leap"]);

  if (!lunar_day) return null;
  return {
    lunarDay: lunar_day,
    lunarMonth: lunar_month,
    lunarYear: year_can_chi,
    canChi: can_chi_day,
    truc,
    sao,
    yearLabel: year_can_chi,
    leap,
  };
}

export default function AppChuyenLich() {
  const [mode] = useState<ConvertMode>("solar-to-lunar");
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
    <div style={{ background: F, minHeight: "100%", color: C, fontFamily: "var(--serif)", position: "relative" }}>
      <Kanji
        ch="曆"
        size={420}
        style={{ position: "absolute", top: 60, right: -120, color: "rgba(197,165,90,0.05)", pointerEvents: "none" }}
      />

      <BackBar dark title="Chuyển lịch" subtitle="Tiện ích · đổi dương sang âm" />

      <div style={{ padding: "0 20px 32px", position: "relative" }}>
        {/* Mode tabs (solar → lunar only for now) */}
        <div style={{ display: "flex", border: `1px solid ${ACCENT_DIM}`, marginBottom: 20 }}>
          {[["Dương → Âm", "solar-to-lunar"]].map(([label, val]) => (
            <div
              key={val}
              style={{
                flex: 1,
                textAlign: "center",
                padding: "12px 6px",
                background: mode === val ? ACCENT : "transparent",
                color: mode === val ? F : M_MUTED,
                fontFamily: "var(--mono)",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {label}
            </div>
          ))}
          <div
            style={{
              flex: 1,
              textAlign: "center",
              padding: "12px 6px",
              background: "transparent",
              color: "rgba(237,231,211,0.2)",
              fontFamily: "var(--mono)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              cursor: "not-allowed",
            }}
          >
            Âm → Dương
          </div>
        </div>

        {/* Input card */}
        <div style={{ padding: 16, background: "rgba(237,231,211,0.04)", border: `1px solid ${ACCENT}` }}>
          <Mono style={{ color: M_MUTED, display: "block", marginBottom: 8 }}>Ngày dương lịch</Mono>
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
            onKeyDown={(e) => { if (e.key === "Enter") void handleConvert(); }}
            style={{
              width: "100%",
              padding: "12px 14px",
              background: F,
              border: `1px solid ${inputError ? "#8b1a1a" : ACCENT_DIM}`,
              color: C,
              fontFamily: "var(--display-2)",
              fontWeight: 700,
              fontSize: 22,
              letterSpacing: "-0.01em",
              outline: "none",
            }}
          />
          {inputError ? (
            <Mono style={{ color: "#c07070", display: "block", marginTop: 6 }}>{inputError}</Mono>
          ) : null}
        </div>

        {/* Convert button */}
        <div style={{ display: "flex", justifyContent: "center", margin: "16px 0" }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 22, color: ACCENT }}>↓</span>
        </div>

        <button
          type="button"
          onClick={() => void handleConvert()}
          disabled={loading || !dateInput}
          style={{
            width: "100%",
            padding: "14px",
            background: loading || !dateInput ? "rgba(197,165,90,0.3)" : ACCENT,
            color: F,
            border: "none",
            fontFamily: "var(--display-2)",
            fontWeight: 800,
            fontSize: 13,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            cursor: loading || !dateInput ? "wait" : "pointer",
            marginBottom: 20,
          }}
        >
          {loading ? "Đang tra…" : "Chuyển sang âm lịch"}
        </button>

        {/* Result ticket */}
        {result ? (
          <>
            <Ticket holes stub={Boolean(result.yearLabel)} stubLabel={result.yearLabel ? `·${result.yearLabel}·` : undefined}>
              <div style={{ padding: "18px 18px" }}>
                <Mono style={{ color: "#7a7050" }}>Lịch Âm · {rawDate}</Mono>
                <div style={{ fontFamily: "var(--display-2)", fontWeight: 900, fontSize: 38, color: "#1d3129", lineHeight: 0.95, marginTop: 6 }}>
                  {result.lunarDay ? `${result.lunarDay} tháng ${result.lunarMonth}` : "—"}
                </div>
                {result.yearLabel ? (
                  <div style={{ fontFamily: "var(--serif)", color: "#3a3220", fontSize: 14, marginTop: 4, fontStyle: "italic" }}>
                    Năm {result.yearLabel}{result.leap ? " — có nhuận" : ""}
                  </div>
                ) : null}
                {(result.canChi || result.truc || result.sao) ? (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px dashed rgba(122,112,80,0.3)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {result.canChi ? (
                      <div>
                        <Mono style={{ color: "#7a7050" }}>Can chi ngày</Mono>
                        <div style={{ fontFamily: "var(--hanzi)", color: "#1d3129", fontSize: 15, fontWeight: 700, marginTop: 2 }}>{result.canChi}</div>
                      </div>
                    ) : null}
                    {(result.truc || result.sao) ? (
                      <div>
                        <Mono style={{ color: "#7a7050" }}>Trực · Sao</Mono>
                        <div style={{ color: "#1d3129", fontFamily: "var(--display-2)", fontWeight: 700, fontSize: 12, marginTop: 4 }}>
                          {[result.truc, result.sao].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </Ticket>
            {result.yearLabel ? (
              <Mono style={{ color: M_MUTED, display: "block", textAlign: "center", marginTop: 16 }}>
                Năm {result.yearLabel}{result.leap ? " — có tháng nhuận" : ""}
              </Mono>
            ) : null}
          </>
        ) : !loading ? (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <Mono style={{ color: "rgba(197,165,90,0.35)" }}>Nhập ngày và bấm chuyển</Mono>
          </div>
        ) : null}
      </div>
    </div>
  );
}
