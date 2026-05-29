import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import {
  btnPrimaryGold,
  C,
  CANH_HOURS,
  CForestShell,
} from "~/components/auth/c-auth-ui";
import { BackBar, Mono } from "~/components/brand";
import { useProfile } from "~/hooks/useProfile";
import { useAuth } from "~/lib/auth";
import { invokeBatTu } from "~/lib/bat-tu";
import {
  batTuBirthTimeCodeToGioSinh,
  profileToBatTuPersonQuery,
} from "~/lib/bat-tu-birth";
import { formatCanhRangeDetail } from "~/lib/first-run-ui";
import { extractHourPillarPreview } from "~/lib/la-so-ui";
import { supabase } from "~/lib/supabase";

export default function GioSinhRoute() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const [selected, setSelected] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [hourPillar, setHourPillar] = useState<{
    label: string;
    hanh: string;
  } | null>(null);

  const selectedCanh = selected != null ? CANH_HOURS[selected] : null;

  useEffect(() => {
    if (selected == null || !profile?.ngay_sinh) {
      setHourPillar(null);
      setPreviewLoading(false);
      return;
    }

    const canh = CANH_HOURS[selected]!;
    const base = profileToBatTuPersonQuery(profile);
    const body = { ...base, birth_time: canh.code };

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
  }, [selected, profile?.ngay_sinh, profile?.gioi_tinh]);

  async function continueToBuild() {
    if (selected == null || !user) return;
    if (!profile?.ngay_sinh) {
      toast.error("Thiếu ngày sinh — hoàn tất đăng ký trước.");
      navigate("/dang-ky", { replace: true });
      return;
    }
    const code = CANH_HOURS[selected]!.code;
    const gioSinh = batTuBirthTimeCodeToGioSinh(code);
    if (!gioSinh) {
      toast.error("Không chọn được giờ sinh.");
      return;
    }
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({ gio_sinh: gioSinh })
      .eq("id", user.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    window.dispatchEvent(new Event("ngaytot:profile-refresh"));
    navigate("/dang-dung-lich");
  }

  return (
    <CForestShell>
      <BackBar
        dark
        onBack={() => navigate("/dang-nhap", { replace: true })}
        endAdornment={
          <Mono style={{ color: "rgba(200,188,152,0.5)", fontSize: 9 }}>
            2 / 2
          </Mono>
        }
      />

      <div
        style={{
          flex: 1,
          padding: "12px 28px 24px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Mono style={{ color: C.gold, fontSize: 10, letterSpacing: "0.22em" }}>
          Lập lá số · bước 2
        </Mono>
        <h1
          style={{
            fontFamily: "var(--display)",
            fontWeight: 800,
            fontSize: 36,
            color: C.cream,
            lineHeight: 1,
            textTransform: "uppercase",
            letterSpacing: "-0.015em",
            margin: "12px 0 6px",
          }}
        >
          Canh giờ sinh?
        </h1>
        <p
          style={{
            fontFamily: "var(--serif)",
            fontSize: 13.5,
            color: "rgba(237,231,211,0.65)",
            lineHeight: 1.55,
            maxWidth: 280,
          }}
        >
          Một ngày có 12 canh giờ — nếu bản chủ không nhớ chính xác, hãy chọn khoảng giờ gần đúng nhất.
        </p>

        <div
          style={{
            marginTop: 22,
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 6,
          }}
        >
          {CANH_HOURS.map((canh, i) => {
            const isSel = i === selected;
            return (
              <button
                key={canh.name}
                type="button"
                onClick={() => setSelected(i)}
                style={{
                  padding: "11px 4px",
                  textAlign: "center",
                  background: isSel ? C.gold : "transparent",
                  border: `1px solid ${isSel ? C.gold : "rgba(197,165,90,0.28)"}`,
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--display-2)",
                    fontWeight: 800,
                    fontSize: 14,
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
                    fontSize: 10,
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

        {selectedCanh ? (
          <div
            style={{
              marginTop: 16,
              padding: "12px 14px",
              borderLeft: `2px solid ${C.gold}`,
              background: "rgba(197,165,90,0.06)",
            }}
          >
            <Mono style={{ color: C.gold, fontSize: 9, letterSpacing: "0.12em" }}>
              ĐÃ CHỌN · {selectedCanh.name.toUpperCase()}
            </Mono>
            <div
              style={{
                marginTop: 4,
                fontFamily: "var(--serif)",
                fontSize: 13,
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
              ) : (
                <>
                  {" · "}
                  trụ giờ theo canh{" "}
                  <strong style={{ color: C.gold, fontWeight: 700 }}>
                    {selectedCanh.name}
                  </strong>
                </>
              )}
            </div>
          </div>
        ) : null}

        <button
          type="button"
          disabled={selected == null || busy || profileLoading}
          onClick={() => void continueToBuild()}
          style={{ ...btnPrimaryGold, marginTop: "auto" }}
        >
          {busy ? "Đang lưu…" : "Hoàn tất & Mở lịch cát tường →"}
        </button>
      </div>
    </CForestShell>
  );
}
