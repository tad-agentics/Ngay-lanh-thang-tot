import { lazy, Suspense, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

import { CreditGate } from "~/components/CreditGate";
import { CreditsHeaderChip } from "~/components/CreditsHeaderChip";
import { GrainOverlay } from "~/components/GrainOverlay";

const HopTuoiResultPanel = lazy(() =>
  import("~/components/hop-tuoi/HopTuoiResultPanel").then((m) => ({
    default: m.HopTuoiResultPanel,
  })),
);
import { ScreenHeader } from "~/components/ScreenHeader";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useFeatureCosts } from "~/hooks/useFeatureCosts";
import { useProfile } from "~/hooks/useProfile";
import { invokeBatTu } from "~/lib/bat-tu";
import {
  gioiTinhToBatTuGender,
  ngaySinhToBatTuBirthDate,
  profileToBatTuPersonQuery,
  timeInputToBatTuBirthTime,
} from "~/lib/bat-tu-birth";
import {
  HOP_TUOI_RELATIONSHIP_OPTIONS,
  hopTuoiPayloadToPanel,
} from "~/lib/hop-tuoi-result";
import { scoreToLetterGrade } from "~/lib/score-grade";
import { laSoJsonToRevealProps, profileHasLaso } from "~/lib/la-so-ui";

const GIOI_TINH_LABEL: Record<string, string> = { nam: "Nam", nu: "Nữ" };

export default function AppHopTuoi() {
  const navigate = useNavigate();
  const { profile, loading: profileLoading } = useProfile();
  const { costs, loading: costsLoading } = useFeatureCosts();
  const [form, setForm] = useState({
    ngaySinh: "",
    gioSinh: "",
    gioiTinh: "" as "nam" | "nu" | "",
    relationshipType: "",
  });
  const [showResult, setShowResult] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [busy, setBusy] = useState(false);
  const [panel, setPanel] = useState<ReturnType<typeof hopTuoiPayloadToPanel>>(
    null,
  );

  const hasLaso = profile ? profileHasLaso(profile.la_so) : false;
  const laso = profile ? laSoJsonToRevealProps(profile.la_so) : null;

  useEffect(() => {
    if (!profileLoading && profile && !hasLaso) {
      navigate("/app/la-so", { replace: true });
    }
  }, [profileLoading, profile, hasLaso, navigate]);

  async function handleSubmit() {
    if (!profile || !form.ngaySinh || !form.gioiTinh) return;
    const p1 = profileToBatTuPersonQuery(profile);
    if (!p1.birth_date) {
      toast.error("Hồ sơ thiếu ngày sinh — cập nhật trong Cài đặt.");
      return;
    }
    const p2Date = ngaySinhToBatTuBirthDate(form.ngaySinh);
    if (!p2Date) {
      toast.error("Ngày sinh người kia không hợp lệ.");
      return;
    }
    const p2Gender = gioiTinhToBatTuGender(form.gioiTinh);
    if (p2Gender === undefined) {
      toast.error("Chọn giới tính người kia.");
      return;
    }

    setBusy(true);
    try {
      const res = await invokeBatTu({
        op: "hop-tuoi",
        body: {
          person1_birth_date: p1.birth_date,
          person1_birth_time: p1.birth_time ?? 11,
          person1_gender: p1.gender ?? 1,
          person2_birth_date: p2Date,
          person2_birth_time: timeInputToBatTuBirthTime(form.gioSinh) ?? 11,
          person2_gender: p2Gender,
          ...(form.relationshipType.trim()
            ? { relationship_type: form.relationshipType.trim() }
            : {}),
        },
      });

      if (!res.ok) {
        toast.error(res.message);
        return;
      }

      const mapped = hopTuoiPayloadToPanel(res.data);
      if (!mapped) {
        toast.error(
          "Không tải được kết quả hợp tuổi lúc này. Thử lại sau vài giây.",
        );
        return;
      }
      setPanel(mapped);
      setShowResult(true);
      window.setTimeout(() => setShowShare(true), 1600);
    } finally {
      setBusy(false);
    }
  }

  function handleReset() {
    setShowResult(false);
    setShowShare(false);
    setPanel(null);
    setForm({
      ngaySinh: "",
      gioSinh: "",
      gioiTinh: "",
      relationshipType: "",
    });
  }

  const hopRow = costs.hop_tuoi;
  const hopSubmitLabel =
    busy
      ? "Đang phân tích…"
      : hopRow?.is_free || (hopRow?.credit_cost ?? 0) <= 0
        ? "Kiểm tra hợp tuổi"
        : `Kiểm tra hợp tuổi — ${hopRow?.credit_cost ?? 8} lượng`;

  if (profileLoading || costsLoading || !profile || !hasLaso) {
    return (
      <div className="px-4 pb-8 py-10 text-sm text-muted-foreground">
        Đang tải…
      </div>
    );
  }

  const isLowScore = panel ? panel.score < 50 : false;

  return (
    <div className="px-4 pb-8">
      <ScreenHeader
        title="Hợp tuổi"
        endAdornment={<CreditsHeaderChip />}
      />

      {!showResult ? (
        <CreditGate featureKey="hop_tuoi">
          <div className="flex flex-col gap-5">
            <div
              className="relative overflow-hidden bg-surface text-surface-foreground px-4 py-3"
              style={{ borderRadius: "var(--radius-lg)" }}
            >
              <GrainOverlay />
              <div className="relative">
                <p
                  className="text-surface-foreground/50 text-[10px] mb-2"
                  style={{ fontFamily: "var(--font-ibm-mono)" }}
                >
                  BẠN
                </p>
                <p className="text-surface-foreground text-sm font-medium">
                  Mệnh{" "}
                  <span className="text-accent">{laso?.menh ?? "—"}</span>
                  {laso?.nhatChu ? (
                    <>
                      {" "}
                      · Nhật Chủ{" "}
                      <span className="text-accent">{laso.nhatChu}</span>
                    </>
                  ) : null}
                </p>
                <p className="text-surface-foreground/50 text-xs mt-0.5">
                  Từ lá số đã lưu
                </p>
              </div>
            </div>

            <div
              className="bg-card border border-border px-4 py-4"
              style={{ borderRadius: "var(--radius-lg)" }}
            >
              <p
                className="text-muted-foreground text-[10px] mb-4"
                style={{ fontFamily: "var(--font-ibm-mono)" }}
              >
                NGƯỜI KIA — không lưu sau khi rời màn
              </p>
              <div className="flex flex-col gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hop-relationship" className="text-xs">
                    Mối quan hệ (phản hồi chi tiết v2)
                  </Label>
                  <select
                    id="hop-relationship"
                    className="w-full h-10 px-3 text-sm rounded-md border border-border bg-background text-foreground"
                    value={form.relationshipType}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        relationshipType: e.target.value,
                      }))
                    }
                  >
                    {HOP_TUOI_RELATIONSHIP_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hop-other-date" className="text-xs">
                    Ngày sinh dương lịch
                  </Label>
                  <Input
                    id="hop-other-date"
                    type="date"
                    value={form.ngaySinh}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, ngaySinh: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hop-other-time" className="text-xs">
                    Giờ sinh (tuỳ chọn)
                  </Label>
                  <Input
                    id="hop-other-time"
                    type="time"
                    value={form.gioSinh}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, gioSinh: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <span className="text-xs text-foreground block">Giới tính</span>
                  <div
                    className="flex border border-border overflow-hidden"
                    style={{ borderRadius: "var(--radius-md)" }}
                  >
                    {(["nam", "nu"] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, gioiTinh: g }))}
                        className="flex-1 py-2.5 text-sm font-medium transition-colors"
                        style={{
                          background:
                            form.gioiTinh === g ? "var(--surface)" : "var(--card)",
                          color:
                            form.gioiTinh === g
                              ? "var(--surface-foreground)"
                              : "var(--muted-foreground)",
                        }}
                      >
                        {GIOI_TINH_LABEL[g]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <Button
              size="lg"
              disabled={!form.ngaySinh || !form.gioiTinh || busy}
              className="w-full"
              onClick={() => void handleSubmit()}
            >
              {hopSubmitLabel}
            </Button>
          </div>
        </CreditGate>
      ) : panel ? (
        <div className="flex flex-col gap-5">
          <Suspense
            fallback={
              <p className="text-muted-foreground text-sm py-4">Đang tải…</p>
            }
          >
            <HopTuoiResultPanel {...panel} />
          </Suspense>

          <div className="px-1">
            {isLowScore ? (
              <p className="text-muted-foreground text-sm leading-relaxed">
                Có một số điểm cần chú ý — xem chi tiết để hiểu thêm.
              </p>
            ) : (
              <p className="text-muted-foreground text-sm leading-relaxed">
                Nạp Âm{" "}
                <span className="text-foreground font-medium">
                  {panel.naphAm1}
                </span>{" "}
                và{" "}
                <span className="text-foreground font-medium">
                  {panel.naphAm2}
                </span>{" "}
                — {panel.naphAmRelation}
              </p>
            )}
          </div>

          {showShare ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              asChild
            >
              <Link
                to="/app/chia-se"
                state={{
                  resultType: "hop_tuoi",
                  suKien: "Hợp tuổi",
                  day: {
                    dateLabel: panel.chipLabel,
                    lunarLabel: "",
                    reasons: [
                      `${panel.chipLabel} — điểm ${panel.score}/100`,
                      ...(panel.reading
                        ? [panel.reading.slice(0, 160)]
                        : []),
                    ],
                  },
                  grade: scoreToLetterGrade(panel.score),
                }}
              >
                Chia sẻ kết quả
              </Link>
            </Button>
          ) : null}

          <Button
            variant="secondary"
            size="sm"
            className="w-full sm:w-auto"
            type="button"
            onClick={handleReset}
          >
            Kiểm tra lại
          </Button>
        </div>
      ) : null}
    </div>
  );
}
