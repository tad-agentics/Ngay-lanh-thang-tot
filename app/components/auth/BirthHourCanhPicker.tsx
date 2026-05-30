import { useEffect, useState } from "react";

import { C, CANH_HOURS, inputLabel } from "~/components/auth/c-auth-ui";
import { Mono } from "~/components/brand";
import { invokeBatTu } from "~/lib/bat-tu";
import { gioiTinhToBatTuGender, ngaySinhToBatTuBirthDate } from "~/lib/bat-tu-birth";
import { formatCanhRangeDetail } from "~/lib/first-run-ui";
import { extractHourPillarPreview } from "~/lib/la-so-ui";

export type BirthHourCanhPickerProps = {
  birthDateIso: string | null;
  gioiTinh?: "nam" | "nu" | null;
  selected: number | null;
  onSelect: (index: number) => void;
};

export function BirthHourCanhPicker({
  birthDateIso,
  gioiTinh = null,
  selected,
  onSelect,
}: BirthHourCanhPickerProps) {
  const [previewLoading, setPreviewLoading] = useState(false);
  const [hourPillar, setHourPillar] = useState<{
    label: string;
    hanh: string;
  } | null>(null);

  const selectedCanh = selected != null ? CANH_HOURS[selected] : null;
  const canPreview = Boolean(birthDateIso && selectedCanh);

  useEffect(() => {
    if (!canPreview || selected == null) {
      setHourPillar(null);
      setPreviewLoading(false);
      return;
    }

    const canh = CANH_HOURS[selected]!;
    const gender = gioiTinhToBatTuGender(gioiTinh);
    const birth_date = ngaySinhToBatTuBirthDate(birthDateIso);
    if (!birth_date) {
      setHourPillar(null);
      setPreviewLoading(false);
      return;
    }
    const body = {
      birth_date,
      birth_time: canh.code,
      tz: "Asia/Ho_Chi_Minh",
      ...(gender !== undefined ? { gender } : {}),
    };

    let cancelled = false;
    setPreviewLoading(true);
    setHourPillar(null);

    const timer = window.setTimeout(() => {
      void (async () => {
        const res = await invokeBatTu<unknown>({
          op: "tu-tru-preview",
          body,
        });
        if (cancelled) return;
        setPreviewLoading(false);
        if (!res.ok) {
          setHourPillar(null);
          return;
        }
        setHourPillar(extractHourPillarPreview(res.data));
      })();
    }, 280);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [birthDateIso, canPreview, gioiTinh, selected]);

  return (
    <div>
      <div style={inputLabel}>Canh giờ sinh</div>
      <p
        style={{
          marginTop: 4,
          marginBottom: 12,
          fontFamily: "var(--serif)",
          fontSize: 12.5,
          color: "rgba(237,231,211,0.55)",
          lineHeight: 1.45,
        }}
      >
        Một ngày có 12 canh giờ — chọn khoảng gần đúng nhất nếu không nhớ chính xác.
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 6,
          opacity: birthDateIso ? 1 : 0.45,
          pointerEvents: birthDateIso ? "auto" : "none",
        }}
      >
        {CANH_HOURS.map((canh, i) => {
          const isSel = i === selected;
          return (
            <button
              key={canh.name}
              type="button"
              onClick={() => onSelect(i)}
              disabled={!birthDateIso}
              style={{
                padding: "11px 4px",
                textAlign: "center",
                background: isSel ? C.gold : "transparent",
                border: `1px solid ${isSel ? C.gold : "rgba(197,165,90,0.28)"}`,
                cursor: birthDateIso ? "pointer" : "not-allowed",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--display-2)",
                  fontWeight: 800,
                  fontSize: 14.5,
                  color: isSel ? C.forest : C.cream,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                {canh.name}
              </div>
              <div
                style={{
                  fontFamily: "var(--serif)",
                  fontSize: 10.5,
                  color: isSel ? C.forest : "rgba(237,231,211,0.55)",
                  marginTop: 2,
                }}
              >
                {canh.range}
              </div>
            </button>
          );
        })}
      </div>

      {!birthDateIso ? (
        <p
          style={{
            marginTop: 8,
            fontFamily: "var(--serif)",
            fontSize: 11.5,
            color: "rgba(237,231,211,0.45)",
          }}
        >
          Nhập ngày sinh trước để chọn canh giờ.
        </p>
      ) : null}

      {selectedCanh ? (
        <div
          style={{
            marginTop: 14,
            padding: "12px 14px",
            borderLeft: `2px solid ${C.gold}`,
            background: "rgba(197,165,90,0.06)",
          }}
        >
          <Mono style={{ color: C.gold, fontSize: 9.5, letterSpacing: "0.12em" }}>
            ĐÃ CHỌN · {selectedCanh.name.toUpperCase()}
          </Mono>
          <div
            style={{
              marginTop: 4,
              fontFamily: "var(--serif)",
              fontSize: 13.5,
              color: C.cream,
              lineHeight: 1.5,
            }}
          >
            {formatCanhRangeDetail(selectedCanh.range, selectedCanh.name)}
            {previewLoading ? (
              <> · đang tính trụ giờ…</>
            ) : hourPillar ? (
              <>
                {" · "}
                trụ giờ{" "}
                <strong style={{ color: C.gold, fontWeight: 700 }}>
                  {hourPillar.label}
                </strong>
                {hourPillar.hanh !== "—" ? (
                  <> · hành {hourPillar.hanh}</>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
