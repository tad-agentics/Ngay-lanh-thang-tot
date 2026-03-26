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
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useFeatureCosts } from "~/hooks/useFeatureCosts";
import { useProfile } from "~/hooks/useProfile";
import { invokeBatTu } from "~/lib/bat-tu";
import {
  BAT_TU_BIRTH_TIME_OPTIONS,
  gioiTinhToBatTuGender,
  ngaySinhToBatTuBirthDate,
  profileToBatTuPersonQuery,
} from "~/lib/bat-tu-birth";
import {
  HOP_TUOI_RELATIONSHIP_OPTIONS,
  hopTuoiGradToLetterGrade,
  hopTuoiPayloadToPanel,
} from "~/lib/hop-tuoi-result";
import { scoreToLetterGrade } from "~/lib/score-grade";
import { laSoJsonToRevealProps, profileHasLaso } from "~/lib/la-so-ui";

const GIOI_TINH_LABEL: Record<string, string> = { nam: "Nam", nu: "Nữ" };

/** Không chọn giờ cụ thể → cùng mặc định trước đây (`person2_birth_time` = 11, Giờ Ngọ). */
const HOP_OTHER_BIRTH_TIME_DEFAULT = "__default__";

export default function AppHopTuoi() {
  const navigate = useNavigate();
  const { profile, loading: profileLoading } = useProfile();
  const { costs, loading: costsLoading } = useFeatureCosts();
  const [form, setForm] = useState({
    ngaySinh: "",
    /** Mã `birth_time` tu-tru-api hoặc `HOP_OTHER_BIRTH_TIME_DEFAULT`. */
    otherBirthTime: HOP_OTHER_BIRTH_TIME_DEFAULT,
    gioiTinh: "" as "nam" | "nu" | "",
    relationshipType: "",
  });
  const [showResult, setShowResult] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [busy, setBusy] = useState(false);
  const [panel, setPanel] = useState<ReturnType<typeof hopTuoiPayloadToPanel>>(
    null,
  );
  const [lastError, setLastError] = useState<string | null>(null);

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
    setLastError(null);
    try {
      const p2BirthTime =
        form.otherBirthTime === HOP_OTHER_BIRTH_TIME_DEFAULT
          ? 11
          : Number.parseInt(form.otherBirthTime, 10);
      const res = await invokeBatTu({
        op: "hop-tuoi",
        body: {
          person1_birth_date: p1.birth_date,
          person1_birth_time: p1.birth_time ?? 11,
          person1_gender: p1.gender ?? 1,
          person2_birth_date: p2Date,
          person2_birth_time:
            Number.isFinite(p2BirthTime) && p2BirthTime >= 0 ? p2BirthTime : 11,
          person2_gender: p2Gender,
          ...(form.relationshipType.trim()
            ? { relationship_type: form.relationshipType.trim() }
            : {}),
        },
      });

      if (!res.ok) {
        setLastError(res.message);
        toast.error(res.message);
        return;
      }

      const mapped = hopTuoiPayloadToPanel(res.data);
      if (!mapped) {
        const msg =
          "Không tải được kết quả hợp tuổi lúc này. Thử lại sau vài giây.";
        setLastError(msg);
        toast.error(msg);
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
    setLastError(null);
    setPanel(null);
    setForm({
      ngaySinh: "",
      otherBirthTime: HOP_OTHER_BIRTH_TIME_DEFAULT,
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

  const isLowScore = panel
    ? panel.gradLabel === "Cần lưu ý" ||
      (panel.score != null && panel.score < 50)
    : false;

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
                Thông tin chỉ dùng cho lần xem này — không lưu
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
                    Ngày sinh
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
                    Giờ sinh
                  </Label>
                  <Select
                    value={form.otherBirthTime}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, otherBirthTime: v }))
                    }
                  >
                    <SelectTrigger
                      id="hop-other-time"
                      className="w-full h-[50px] text-base md:text-sm"
                    >
                      <SelectValue placeholder="Chọn khung giờ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={HOP_OTHER_BIRTH_TIME_DEFAULT}>
                        Chưa rõ — mặc định Giờ Ngọ (11h–12h59)
                      </SelectItem>
                      {BAT_TU_BIRTH_TIME_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={String(opt.value)}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.otherBirthTime === HOP_OTHER_BIRTH_TIME_DEFAULT ? (
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Chọn đúng khung giờ can chi giúp v2 luận sâu hơn; một số
                      tiêu chí có thể ở mức trung tính nếu để mặc định.
                    </p>
                  ) : null}
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

            {lastError ? (
              <Alert variant="destructive" className="text-left">
                <AlertTitle>Không thực hiện được yêu cầu</AlertTitle>
                <AlertDescription>{lastError}</AlertDescription>
              </Alert>
            ) : null}

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
            {panel.apiVersion === 2 ? (
              <p className="text-muted-foreground text-sm leading-relaxed">
                {isLowScore
                  ? "Có tín hiệu cần lưu ý — xem tiêu chí và Gợi ý phía trên."
                  : "Xem Diễn giải và tiêu chí cụ thể trong khung kết quả."}
              </p>
            ) : isLowScore ? (
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
                  suKien: panel.relationshipLabel ?? "Hợp tuổi",
                  day: {
                    dateLabel: panel.chipLabel,
                    lunarLabel: "",
                    reasons: [
                      panel.apiVersion === 2 && panel.score == null
                        ? panel.chipLabel
                        : `${panel.chipLabel} — điểm ${panel.score ?? "—"}/100`,
                      ...(panel.reading
                        ? [panel.reading.slice(0, 160)]
                        : []),
                    ],
                  },
                  grade:
                    panel.apiVersion === 2 && panel.score == null
                      ? hopTuoiGradToLetterGrade(panel.gradLabel)
                      : scoreToLetterGrade(panel.score ?? 72),
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
