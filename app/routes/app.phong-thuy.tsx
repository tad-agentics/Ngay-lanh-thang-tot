import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Compass } from "lucide-react";
import { toast } from "sonner";

import { AiReadingBlock } from "~/components/AiReadingBlock";
import { CreditGate } from "~/components/CreditGate";
import { CreditsHeaderChip } from "~/components/CreditsHeaderChip";
import { GrainOverlay } from "~/components/GrainOverlay";
import { ScreenHeader } from "~/components/ScreenHeader";
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
import { invokeGenerateReading } from "~/lib/generate-reading";
import {
  ngaySinhToBatTuBirthDate,
  profileToBatTuPersonQuery,
} from "~/lib/bat-tu-birth";
import { laSoJsonToRevealProps, profileHasLaso } from "~/lib/la-so-ui";
import {
  PHONG_THUY_PURPOSE_OPTIONS,
  type PhongThuyPurposeValue,
  phongThuyPayloadToView,
  type PhongThuyView,
} from "~/lib/phong-thuy-ui";

export default function AppPhongThuy() {
  const navigate = useNavigate();
  const { profile, loading: profileLoading } = useProfile();
  const { costs, loading: costsLoading } = useFeatureCosts();
  const [unlocked, setUnlocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<PhongThuyView | null>(null);
  const [phongAiReading, setPhongAiReading] = useState<string | null>(null);
  const [phongAiLoading, setPhongAiLoading] = useState(false);
  const phongAiGenRef = useRef(0);
  const [purpose, setPurpose] = useState<PhongThuyPurposeValue>("NHA_O");
  const [phongYearInput, setPhongYearInput] = useState(() =>
    String(new Date().getFullYear()),
  );
  const [partnerNgayIso, setPartnerNgayIso] = useState("");

  const hasLaso = profile ? profileHasLaso(profile.la_so) : false;
  const laso = profile ? laSoJsonToRevealProps(profile.la_so) : null;
  const menh = laso?.menh ?? "";
  const dungThan = laso?.dungThan ?? "";

  useEffect(() => {
    if (!profileLoading && profile && !hasLaso) {
      navigate("/app/la-so", { replace: true });
    }
  }, [profileLoading, profile, hasLaso, navigate]);

  async function runPhongThuy() {
    if (!profile) return;
    const q = profileToBatTuPersonQuery(profile);
    if (!q.birth_date) {
      toast.error("Hồ sơ thiếu ngày sinh — cập nhật trong Cài đặt.");
      return;
    }
    const yearN = Number.parseInt(phongYearInput.trim(), 10);
    if (!Number.isFinite(yearN) || yearN < 1900 || yearN > 2100) {
      toast.error("Năm Phi Tinh cần trong khoảng 1900–2100.");
      return;
    }

    const partnerBirth =
      partnerNgayIso.trim().length > 0
        ? ngaySinhToBatTuBirthDate(partnerNgayIso.trim())
        : null;
    if (partnerNgayIso.trim().length > 0 && !partnerBirth) {
      toast.error("Ngày sinh người cùng không gian không hợp lệ.");
      return;
    }

    setBusy(true);
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
    setBusy(false);
    if (!res.ok) {
      toast.error(res.message);
      return;
    }
    const v = phongThuyPayloadToView(res.data);
    if (!v) {
      toast.error(
        "Không tải được kết quả phong thủy lúc này. Thử lại sau vài giây.",
      );
      return;
    }
    setView(v);
    setUnlocked(true);
    const g = ++phongAiGenRef.current;
    setPhongAiReading(null);
    setPhongAiLoading(true);
    void invokeGenerateReading({
      endpoint: "phong-thuy",
      data: res.data,
    }).then((r) => {
      if (g !== phongAiGenRef.current) return;
      setPhongAiReading(r.reading);
      setPhongAiLoading(false);
    });
  }

  const phongRow = costs.phong_thuy;
  const phongUnlockLabel =
    busy
      ? "Đang tải…"
      : phongRow?.is_free || (phongRow?.credit_cost ?? 0) <= 0
        ? "Mở khóa xem đầy đủ"
        : `Mở khóa — ${phongRow?.credit_cost ?? 5} lượng`;

  if (profileLoading || costsLoading || !profile || !hasLaso) {
    return (
      <div className="px-4 pb-8 py-10 text-sm text-muted-foreground">
        Đang tải…
      </div>
    );
  }

  const display: PhongThuyView =
    unlocked && view
      ? view
      : {
          userMenhLabel: null,
          dungThanApi: null,
          kyThanApi: null,
          huongTot: "—",
          huongXau: "—",
          mauTot: "—",
          mauKy: "—",
          soTot: "—",
          soKy: "—",
          goiY: [],
        };

  const dungThanDisplay =
    unlocked && display.dungThanApi
      ? display.dungThanApi
      : dungThan;

  const kyLines: { label: string; value: string }[] = [];
  if (unlocked) {
    if (display.huongXau !== "—") {
      kyLines.push({ label: "Hướng nên tránh", value: display.huongXau });
    }
    if (display.mauKy !== "—") {
      kyLines.push({ label: "Màu nên tránh", value: display.mauKy });
    }
    if (display.soKy !== "—") {
      kyLines.push({ label: "Số nên tránh", value: display.soKy });
    }
  }

  return (
    <div className="px-4 pb-8">
      <ScreenHeader
        title="Phong thủy"
        showBack={false}
        endAdornment={<CreditsHeaderChip />}
      />

      <div className="flex flex-col gap-4">
        <div
          className="relative overflow-hidden bg-surface text-surface-foreground px-4 py-4"
          style={{ borderRadius: "var(--radius-lg)" }}
        >
          <GrainOverlay />
          <div className="relative">
            <p
              className="text-surface-foreground/50 text-[10px] mb-3"
              style={{ fontFamily: "var(--font-ibm-mono)" }}
            >
              {unlocked && display.userMenhLabel
                ? `NẠP ÂM · ${display.userMenhLabel}`
                : menh
                  ? `MỆNH ${menh.toUpperCase()}`
                  : "PHONG THỦY"}
            </p>

            {!unlocked ? (
              <p className="text-surface-foreground/80 text-sm leading-relaxed mb-4">
                Gợi ý hướng, màu, số và bài trí theo Dụng Thần từ lá số đã lưu.
                {dungThanDisplay ? (
                  <>
                    {" "}
                    <span className="text-accent font-medium">
                      {dungThanDisplay}
                    </span>
                  </>
                ) : null}
              </p>
            ) : null}

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center">
                <Compass
                  size={18}
                  className="text-accent mx-auto mb-1.5"
                  strokeWidth={1.5}
                />
                <p className="text-surface-foreground/60 text-xs mb-0.5">
                  Hướng tốt
                </p>
                <p className="text-surface-foreground text-sm font-medium">
                  {display.huongTot}
                </p>
              </div>
              <div className="text-center">
                <div className="flex gap-1 justify-center mb-1.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-success inline-block" />
                  <span className="w-3.5 h-3.5 rounded-full bg-accent inline-block" />
                </div>
                <p className="text-surface-foreground/60 text-xs mb-0.5">
                  Màu hợp
                </p>
                <p className="text-surface-foreground text-xs">
                  {display.mauTot}
                </p>
              </div>
              <div className="text-center">
                <p
                  className="text-accent mb-0.5"
                  style={{
                    fontFamily: "var(--font-ibm-mono)",
                    fontSize: 18,
                    fontWeight: 500,
                  }}
                >
                  {display.soTot}
                </p>
                <p className="text-surface-foreground/60 text-xs">Số hợp</p>
              </div>
            </div>

            <div className="border-t border-surface-foreground/10 pt-3 space-y-2">
              <p className="text-surface-foreground/60 text-xs mb-1 font-medium">
                Kỵ Thần — nên tránh
              </p>
              {!unlocked ? (
                <p className="text-surface-foreground/80 text-sm">
                  Mở khóa để xem hướng, màu và số nên tránh theo lá số.
                </p>
              ) : kyLines.length ? (
                kyLines.map((row) => (
                  <div key={row.label}>
                    <p className="text-surface-foreground/50 text-[10px] mb-0.5">
                      {row.label}
                    </p>
                    <p className="text-surface-foreground/80 text-sm leading-relaxed">
                      {row.value}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-surface-foreground/80 text-sm">—</p>
              )}
            </div>

            {(dungThanDisplay || (unlocked && display.kyThanApi)) ? (
              <div className="mt-3 border-t border-surface-foreground/10 pt-3 space-y-2">
                {dungThanDisplay ? (
                  <div>
                    <p className="text-surface-foreground/60 text-xs mb-0.5">
                      Dụng Thần
                    </p>
                    <p className="text-accent text-sm font-medium">
                      {dungThanDisplay}
                    </p>
                  </div>
                ) : null}
                {unlocked && display.kyThanApi ? (
                  <div>
                    <p className="text-surface-foreground/60 text-xs mb-0.5">
                      Kỵ Thần (hành)
                    </p>
                    <p className="text-surface-foreground text-sm font-medium">
                      {display.kyThanApi}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        {unlocked && view?.goiY.length ? (
          <div className="flex flex-col gap-2">
            {view.goiY.map((g, i) => (
              <div
                key={i}
                className="bg-card border border-border px-4 py-3"
                style={{ borderRadius: "var(--radius-md)" }}
              >
                <p className="text-foreground text-sm font-medium mb-1">
                  {g.tieu_de}
                </p>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  {g.mo_ta}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        {unlocked ? (
          <AiReadingBlock
            title="Diễn giải nhanh"
            variant="on-card"
            loading={phongAiLoading}
            text={phongAiReading}
          />
        ) : null}

        {!unlocked ? (
          <CreditGate featureKey="phong_thuy">
            <div
              className="border border-border bg-card px-4 py-4"
              style={{ borderRadius: "var(--radius-lg)" }}
            >
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                Theo Dụng Thần lá số. Chọn mục đích không gian, năm tính Phi
                Tinh (Cửu cung lưu niên) và tùy chọn ngày sinh người cùng nhà để
                cân Nạp Âm.
              </p>
              <div className="flex flex-col gap-3 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="phong-purpose" className="text-xs">
                    Mục đích không gian
                  </Label>
                  <Select
                    value={purpose}
                    onValueChange={(v) =>
                      setPurpose(v as PhongThuyPurposeValue)
                    }
                  >
                    <SelectTrigger id="phong-purpose" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PHONG_THUY_PURPOSE_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phong-year" className="text-xs">
                    Năm dương lịch (Phi Tinh)
                  </Label>
                  <Input
                    id="phong-year"
                    type="number"
                    min={1900}
                    max={2100}
                    value={phongYearInput}
                    onChange={(e) => setPhongYearInput(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phong-partner" className="text-xs">
                    Người cùng không gian (tùy chọn)
                  </Label>
                  <Input
                    id="phong-partner"
                    type="date"
                    value={partnerNgayIso}
                    onChange={(e) => setPartnerNgayIso(e.target.value)}
                  />
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Hóa giải xung Nạp Âm khi có sinh nhật hợp lệ — để trống nếu
                    không cần.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                disabled={busy}
                onClick={() => void runPhongThuy()}
              >
                {phongUnlockLabel}
              </Button>
            </div>
          </CreditGate>
        ) : null}
      </div>
    </div>
  );
}
