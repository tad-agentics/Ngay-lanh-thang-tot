import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { CircleHelp, Compass } from "lucide-react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { useFeatureCosts } from "~/hooks/useFeatureCosts";
import { useProfile } from "~/hooks/useProfile";
import { invokeBatTu } from "~/lib/bat-tu";
import { invokeGenerateReading } from "~/lib/generate-reading";
import {
  ddMmYyyyInputToBatTuBirthDate,
  formatDdMmYyyyWithAutoSlash,
  isPartialDdMmYyyyInput,
  profileToBatTuPersonQuery,
} from "~/lib/bat-tu-birth";
import { laSoJsonToRevealProps, profileHasLaso } from "~/lib/la-so-ui";
import {
  PHONG_THUY_PURPOSE_OPTIONS,
  type PhongThuyPurposeValue,
  phongThuyPayloadToTeaserView,
  phongThuyPayloadToView,
  type PhongThuyView,
} from "~/lib/phong-thuy-ui";

function emptyPhongThuyView(): PhongThuyView {
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

type PhongThuyQueryFieldsProps = {
  idSuffix?: string;
  purpose: PhongThuyPurposeValue;
  onPurposeChange: (v: PhongThuyPurposeValue) => void;
  phongYearInput: string;
  onPhongYearInputChange: (v: string) => void;
  partnerNgayDdMmYyyy: string;
  onPartnerNgayDdMmYyyyChange: (v: string) => void;
};

function PhongThuyQueryFields({
  idSuffix = "",
  purpose,
  onPurposeChange,
  phongYearInput,
  onPhongYearInputChange,
  partnerNgayDdMmYyyy,
  onPartnerNgayDdMmYyyyChange,
}: PhongThuyQueryFieldsProps) {
  const s = idSuffix;
  const partnerDateInvalid =
    partnerNgayDdMmYyyy.trim().length > 0 &&
    ddMmYyyyInputToBatTuBirthDate(partnerNgayDdMmYyyy.trim()) == null &&
    !isPartialDdMmYyyyInput(partnerNgayDdMmYyyy);
  return (
    <div className="flex flex-col gap-3 mb-4">
      <div className="space-y-2">
        <Label htmlFor={`phong-purpose${s}`} className="text-xs">
          Mục đích không gian
        </Label>
        <Select
          value={purpose}
          onValueChange={(v) => onPurposeChange(v as PhongThuyPurposeValue)}
        >
          <SelectTrigger id={`phong-purpose${s}`} className="w-full">
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
        <Label htmlFor={`phong-year${s}`} className="text-xs">
          Năm dương lịch (Phi Tinh)
        </Label>
        <Input
          id={`phong-year${s}`}
          type="number"
          min={1900}
          max={2100}
          value={phongYearInput}
          onChange={(e) => onPhongYearInputChange(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <Label htmlFor={`phong-partner${s}`} className="text-xs leading-snug">
            Ngày sinh người cùng nhà (tuỳ chọn)
          </Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground inline-flex rounded-full p-0.5 -m-0.5 shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
                aria-label="Giải thích: người cùng nhà và vì sao nhập ngày sinh"
              >
                <CircleHelp className="size-3.5" aria-hidden />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              sideOffset={6}
              className="max-w-[min(20rem,calc(100vw-2rem))] px-3 py-2.5 text-left font-normal leading-relaxed text-balance"
            >
              <span className="block font-medium text-primary-foreground/95 mb-1.5">
                “Người cùng không gian” là gì?
              </span>
              Là người thường xuyên ở chung phòng hoặc chung nhà với bạn — ví dụ
              vợ/chồng, con, người thuê cùng, bố mẹ cùng sinh sống.
              <span className="block mt-2">
                Nhập đúng ngày sinh của họ để tính thêm phần hài hòa Nạp Âm và
                gợi ý hóa giải khi hai mệnh xung khắc (hữu ích cho phòng ngủ,
                bàn làm việc, khu vực dùng chung). Để trống nếu bạn chỉ xem cho
                một người.
              </span>
            </TooltipContent>
          </Tooltip>
        </div>
        <Input
          id={`phong-partner${s}`}
          type="text"
          name={`partner-birth-ddmmyyyy${s}`}
          autoComplete="off"
          placeholder="DD/MM/YYYY"
          aria-invalid={partnerDateInvalid}
          maxLength={10}
          className="tabular-nums"
          value={partnerNgayDdMmYyyy}
          onChange={(e) =>
            onPartnerNgayDdMmYyyyChange(
              formatDdMmYyyyWithAutoSlash(e.target.value),
            )
          }
        />
        {partnerDateInvalid ? (
          <p className="text-[11px] text-destructive leading-relaxed" role="alert">
            Nhập đúng DD/MM/YYYY và ngày phải có thật trên lịch (ví dụ 20/05/1990).
          </p>
        ) : null}
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Chỉ định dạng DD/MM/YYYY. Dùng khi muốn gợi ý cho cả hai mệnh trong cùng
          căn nhà — để trống nếu chỉ cần xem cho bản thân.
        </p>
      </div>
    </div>
  );
}

/** Hiển thị một khối purpose_specific (key → object linh hoạt). */
function PurposeSpecificBlock({
  data,
}: {
  data: Record<string, unknown>;
}) {
  return (
    <div
      className="border border-border bg-card px-4 py-3 space-y-3"
      style={{ borderRadius: "var(--radius-lg)" }}
    >
      <p className="text-foreground text-sm font-medium">Theo mục đích</p>
      {Object.entries(data).map(([key, raw]) => {
        const o = raw && typeof raw === "object" && !Array.isArray(raw)
          ? (raw as Record<string, unknown>)
          : null;
        const tot = o
          ? typeof o.tot === "string"
            ? o.tot
            : typeof o.label === "string"
              ? o.label
              : null
          : null;
        const reason = o && typeof o.reason === "string" ? o.reason : null;
        const prettyKey = key.replace(/_/g, " ");
        return (
          <div key={key} className="border-t border-border pt-3 first:border-0 first:pt-0">
            <p className="text-muted-foreground text-[10px] uppercase tracking-wide mb-1">
              {prettyKey}
            </p>
            {tot ? (
              <p className="text-foreground text-sm font-medium">{tot}</p>
            ) : typeof raw === "string" ? (
              <p className="text-foreground text-sm">{raw}</p>
            ) : (
              <pre className="text-[11px] text-muted-foreground whitespace-pre-wrap break-words">
                {JSON.stringify(raw, null, 0)}
              </pre>
            )}
            {reason ? (
              <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
                {reason}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export default function AppPhongThuy() {
  const navigate = useNavigate();
  const { profile, loading: profileLoading } = useProfile();
  const { costs, loading: costsLoading } = useFeatureCosts();
  const [unlocked, setUnlocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [teaserBusy, setTeaserBusy] = useState(false);
  const [teaserView, setTeaserView] = useState<PhongThuyView | null>(null);
  const [view, setView] = useState<PhongThuyView | null>(null);
  const [phongAiReading, setPhongAiReading] = useState<string | null>(null);
  const [phongAiLoading, setPhongAiLoading] = useState(false);
  const phongAiGenRef = useRef(0);
  const [purpose, setPurpose] = useState<PhongThuyPurposeValue>("NHA_O");
  const [phongYearInput, setPhongYearInput] = useState(() =>
    String(new Date().getFullYear()),
  );
  const [partnerNgayDdMmYyyy, setPartnerNgayDdMmYyyy] = useState("");
  const teaserReqIdRef = useRef(0);

  const hasLaso = profile ? profileHasLaso(profile.la_so) : false;
  const laso = profile ? laSoJsonToRevealProps(profile.la_so) : null;
  const menh = laso?.menh ?? "";
  const dungThanLaso = laso?.dungThan ?? "";

  useEffect(() => {
    if (!profileLoading && profile && !hasLaso) {
      navigate("/app/la-so", { replace: true });
    }
  }, [profileLoading, profile, hasLaso, navigate]);

  useEffect(() => {
    if (!profile || !hasLaso || profileLoading) return;

    const t = window.setTimeout(() => {
      const reqId = ++teaserReqIdRef.current;
      void (async () => {
        const q = profileToBatTuPersonQuery(profile);
        if (!q.birth_date) return;
        const yearN = Number.parseInt(phongYearInput.trim(), 10);
        const yearOk =
          Number.isFinite(yearN) && yearN >= 1900 && yearN <= 2100;
        let partnerBirth: string | null = null;
        if (partnerNgayDdMmYyyy.trim().length > 0) {
          partnerBirth = ddMmYyyyInputToBatTuBirthDate(partnerNgayDdMmYyyy.trim());
          if (!partnerBirth) {
            if (reqId === teaserReqIdRef.current) {
              setTeaserView(null);
              setTeaserBusy(false);
            }
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
            ...(yearOk ? { year: yearN } : {}),
            ...(partnerBirth ? { partner_birth_date: partnerBirth } : {}),
            detail: "teaser",
          },
        });
        if (reqId !== teaserReqIdRef.current) return;
        setTeaserBusy(false);
        if (!res.ok) return;
        const v = phongThuyPayloadToTeaserView(res.data);
        if (v) setTeaserView(v);
      })();
    }, 400);

    return () => {
      teaserReqIdRef.current += 1;
      setTeaserBusy(false);
      window.clearTimeout(t);
    };
  }, [
    profile,
    hasLaso,
    profileLoading,
    purpose,
    phongYearInput,
    partnerNgayDdMmYyyy,
  ]);

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
      partnerNgayDdMmYyyy.trim().length > 0
        ? ddMmYyyyInputToBatTuBirthDate(partnerNgayDdMmYyyy.trim())
        : null;
    if (partnerNgayDdMmYyyy.trim().length > 0 && !partnerBirth) {
      toast.error(
        "Ngày sinh người cùng không gian cần đúng DD/MM/YYYY và là ngày có thật.",
      );
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
  const phongCostLabel =
    phongRow?.is_free || (phongRow?.credit_cost ?? 0) <= 0
      ? null
      : (phongRow?.credit_cost ?? 10);
  const phongUnlockLabel =
    busy
      ? "Đang tải…"
      : phongCostLabel == null
        ? "Mở khóa xem đầy đủ"
        : `Mở khóa — ${phongCostLabel} lượng`;
  const phongRecalcLabel =
    busy
      ? "Đang tải…"
      : phongCostLabel == null
        ? "Tính lại"
        : `Tính lại — ${phongCostLabel} lượng`;

  /** Chặn submit khi ô partner có nội dung nhưng chưa đủ / sai ngày (kể cả đang gõ dở). */
  const partnerBirthInputInvalid =
    partnerNgayDdMmYyyy.trim().length > 0 &&
    ddMmYyyyInputToBatTuBirthDate(partnerNgayDdMmYyyy.trim()) == null;

  if (profileLoading || costsLoading || !profile || !hasLaso) {
    return (
      <div className="px-4 pb-8 py-10 text-sm text-muted-foreground">
        Đang tải…
      </div>
    );
  }

  const display: PhongThuyView =
    unlocked && view ? view : teaserView ?? emptyPhongThuyView();

  const dungThanDisplay =
    display.dungThanApi ?? dungThanLaso;

  const kyThanDisplay =
    display.kyThanApi ?? null;

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
        appScreenTitle
        endAdornment={<CreditsHeaderChip />}
      />

      <div className="flex flex-col gap-4">
        {teaserBusy && !unlocked ? (
          <p className="text-muted-foreground text-xs">Đang cập nhật gợi ý…</p>
        ) : null}

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
              {display.userMenhLabel
                ? `NẠP ÂM · ${display.userMenhLabel}`
                : menh
                  ? `MỆNH ${menh.toUpperCase()}`
                  : "PHONG THỦY"}
            </p>

            {!unlocked && !teaserView ? (
              <p className="text-surface-foreground/80 text-sm leading-relaxed mb-4">
                Đang tải…
              </p>
            ) : null}

            {unlocked || teaserView ? (
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
                  <p className="text-surface-foreground text-sm font-medium text-balance">
                    {display.huongTot}
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex gap-1 justify-center mb-1.5 flex-wrap">
                    {display.mauTotItems.slice(0, 4).map((m, i) => (
                      <span
                        key={i}
                        title={m.color}
                        className="w-3.5 h-3.5 rounded-full border border-surface-foreground/20 inline-block"
                        style={{
                          backgroundColor: m.hex ?? "var(--color-accent)",
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-surface-foreground/60 text-xs mb-0.5">
                    Màu hợp
                  </p>
                  <p className="text-surface-foreground text-xs text-balance">
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
            ) : null}

            <div className="border-t border-surface-foreground/10 pt-3 space-y-2">
              <p className="text-surface-foreground/60 text-xs mb-1 font-medium">
                Hướng / màu / số nên tránh
              </p>
              {!unlocked ? (
                <p className="text-surface-foreground/80 text-sm">
                  Mở khóa để xem chi tiết theo Kỵ Thần và Phi Tinh đầy đủ.
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

            {(dungThanDisplay || kyThanDisplay) ? (
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
                {kyThanDisplay ? (
                  <div>
                    <p className="text-surface-foreground/60 text-xs mb-0.5">
                      Kỵ Thần (hành)
                    </p>
                    <p className="text-surface-foreground text-sm font-medium">
                      {kyThanDisplay}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        {unlocked && view?.purposeSpecific ? (
          <PurposeSpecificBlock data={view.purposeSpecific} />
        ) : null}

        {unlocked && view?.personalization ? (
          <div
            className="border border-border bg-card px-4 py-3"
            style={{ borderRadius: "var(--radius-lg)" }}
          >
            <p className="text-foreground text-sm font-medium mb-2">
              Cường nhược lá số
            </p>
            <div className="space-y-1 text-xs text-muted-foreground">
              {view.personalization.chart_strength ? (
                <p>
                  <span className="text-foreground/80">Sức chart: </span>
                  {view.personalization.chart_strength}
                </p>
              ) : null}
              {view.personalization.intensity ? (
                <p>
                  <span className="text-foreground/80">Mức tác động: </span>
                  {view.personalization.intensity}
                </p>
              ) : null}
              {view.personalization.note ? (
                <p className="leading-relaxed text-foreground/90">
                  {view.personalization.note}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        {unlocked && view && view.goiY.length ? (
          <div className="flex flex-col gap-2">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Vật phẩm & gợi ý
            </p>
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

        {unlocked && view && view.phiTinh.length ? (
          <div
            className="border border-border bg-card px-4 py-3 space-y-3"
            style={{ borderRadius: "var(--radius-lg)" }}
          >
            <p className="text-foreground text-sm font-medium">
              Phi tinh năm {view.phiTinhYear ?? "—"}
            </p>
            {view.phiTinhNoteVi ? (
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                {view.phiTinhNoteVi}
              </p>
            ) : null}
            <div className="grid gap-2 sm:grid-cols-2">
              {view.phiTinh.map((cell, i) => (
                <div
                  key={`${cell.direction}-${i}`}
                  className="rounded-md border border-border/80 px-2 py-2 text-xs"
                >
                  <p className="font-medium text-foreground">{cell.direction}</p>
                  <p className="text-muted-foreground">
                    {cell.star_name ?? `Sao ${cell.star ?? "—"}`}
                    {cell.hanh ? ` · ${cell.hanh}` : ""}
                    {cell.nature ? ` · ${cell.nature}` : ""}
                  </p>
                  {cell.meaning ? (
                    <p className="text-muted-foreground mt-1 leading-relaxed">
                      {cell.meaning}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
            {view.huongTotNamNay.length || view.huongXauNamNay.length ? (
              <div className="text-[11px] space-y-1">
                {view.huongTotNamNay.length ? (
                  <p>
                    <span className="text-foreground/80">Hướng tốt năm nay: </span>
                    {view.huongTotNamNay.join(", ")}
                  </p>
                ) : null}
                {view.huongXauNamNay.length ? (
                  <p>
                    <span className="text-foreground/80">Hướng xấu năm nay: </span>
                    {view.huongXauNamNay.join(", ")}
                  </p>
                ) : null}
              </div>
            ) : null}
            {view.hoaGiai.length ? (
              <div className="space-y-2">
                <p className="text-xs font-medium text-foreground">Hóa giải gợi ý</p>
                {view.hoaGiai.map((h, idx) => (
                  <p key={idx} className="text-[11px] text-muted-foreground leading-relaxed">
                    {h.direction ? `${h.direction}: ` : ""}
                    {h.remedy ?? "—"}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {unlocked && view?.coupleHarmony ? (
          <div
            className="border border-border bg-card px-4 py-3 space-y-3"
            style={{ borderRadius: "var(--radius-lg)" }}
          >
            <p className="text-foreground text-sm font-medium">
              Cặp đôi & không gian chung
            </p>
            {view.coupleHarmony.relation ? (
              <p className="text-xs text-muted-foreground">
                {view.coupleHarmony.relation}
              </p>
            ) : null}
            {view.coupleHarmony.person1_menh_name ||
            view.coupleHarmony.person2_menh_name ? (
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {[view.coupleHarmony.person1_menh_name, view.coupleHarmony.person2_menh_name]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            ) : null}
            {view.coupleHarmony.remedy_element ? (
              <p className="text-xs text-foreground/90">
                <span className="text-muted-foreground">Hành hóa giải gợi ý: </span>
                {view.coupleHarmony.remedy_element}
              </p>
            ) : null}
            {view.coupleHarmony.explanation ? (
              <p className="text-xs leading-relaxed text-foreground/90">
                {view.coupleHarmony.explanation}
              </p>
            ) : null}
            {view.coupleHarmony.remedies.length ? (
              <div className="space-y-2">
                {view.coupleHarmony.remedies.map((r, i) => (
                  <div key={i} className="text-xs border-t border-border pt-2 first:border-0 first:pt-0">
                    <p className="font-medium text-foreground">{r.item}</p>
                    {r.vi_tri ? (
                      <p className="text-muted-foreground">{r.vi_tri}</p>
                    ) : null}
                    {r.reason ? (
                      <p className="text-muted-foreground leading-relaxed">{r.reason}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
            {view.coupleHarmony.colors_for_shared_space.length ? (
              <div className="space-y-2 pt-1">
                <p className="text-[11px] font-medium text-foreground">
                  Màu gợi ý không gian chung
                </p>
                <div className="flex flex-wrap gap-2 items-center">
                  {view.coupleHarmony.colors_for_shared_space.map((c, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 rounded-md border border-border/80 px-2 py-1 text-[11px] text-foreground"
                    >
                      <span
                        className="w-3 h-3 rounded-full border border-border shrink-0"
                        style={{
                          backgroundColor: c.hex ?? "var(--color-accent)",
                        }}
                        title={c.color}
                      />
                      <span>
                        {c.color}
                        {c.element ? ` · ${c.element}` : ""}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {unlocked ? (
          <AiReadingBlock
            title="Luận giải"
            variant="on-card"
            loading={phongAiLoading}
            text={phongAiReading}
          />
        ) : null}

        {unlocked ? (
          <div
            className="border border-border bg-card px-4 py-4"
            style={{ borderRadius: "var(--radius-lg)" }}
          >
            <p className="text-foreground text-sm font-medium mb-1">
              Tính lại theo lựa chọn
            </p>
            <p className="text-muted-foreground text-xs leading-relaxed mb-4">
              Chỉnh mục đích, năm hoặc người cùng không gian rồi tính lại. Mỗi lần
              mở kết quả đầy đủ vẫn tính lượng như lần đầu (trừ khi gói miễn phí).
            </p>
            <PhongThuyQueryFields
              idSuffix="-recalc"
              purpose={purpose}
              onPurposeChange={setPurpose}
              phongYearInput={phongYearInput}
              onPhongYearInputChange={setPhongYearInput}
              partnerNgayDdMmYyyy={partnerNgayDdMmYyyy}
              onPartnerNgayDdMmYyyyChange={setPartnerNgayDdMmYyyy}
            />
            <Button
              size="sm"
              disabled={busy || partnerBirthInputInvalid}
              onClick={() => void runPhongThuy()}
            >
              {phongRecalcLabel}
            </Button>
          </div>
        ) : null}

        {!unlocked ? (
          <div
            className="border border-border bg-card px-4 py-4"
            style={{ borderRadius: "var(--radius-lg)" }}
          >
            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
              Chọn mục đích, năm và người cùng không gian — gợi ý phía trên cập
              nhật theo lựa chọn (teaser).{" "}
              <span className="text-foreground/90">
                Mở khóa để xem hướng/màu/số nên tránh, vật phẩm, Phi Tinh đầy đủ
                và cân Nạp Âm cặp đôi.
              </span>
            </p>
            <PhongThuyQueryFields
              purpose={purpose}
              onPurposeChange={setPurpose}
              phongYearInput={phongYearInput}
              onPhongYearInputChange={setPhongYearInput}
              partnerNgayDdMmYyyy={partnerNgayDdMmYyyy}
              onPartnerNgayDdMmYyyyChange={setPartnerNgayDdMmYyyy}
            />
            <CreditGate featureKey="phong_thuy">
              <Button
                size="sm"
                disabled={busy || partnerBirthInputInvalid}
                onClick={() => void runPhongThuy()}
              >
                {phongUnlockLabel}
              </Button>
            </CreditGate>
          </div>
        ) : null}
      </div>
    </div>
  );
}
