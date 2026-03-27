import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

import { AiReadingBlock } from "~/components/AiReadingBlock";
import { Chip } from "~/components/Chip";
import { CreditGate } from "~/components/CreditGate";
import { CreditsHeaderChip } from "~/components/CreditsHeaderChip";
import { ScreenHeader } from "~/components/ScreenHeader";
import { GrainOverlay } from "~/components/GrainOverlay";
import { Button } from "~/components/ui/button";
import { cn } from "~/components/ui/utils";
import { useFeatureCosts } from "~/hooks/useFeatureCosts";
import { useProfile } from "~/hooks/useProfile";
import type { LaSoJson } from "~/lib/api-types";
import { profileToBatTuPersonQuery } from "~/lib/bat-tu-birth";
import { invokeBatTu } from "~/lib/bat-tu";
import { invokeGenerateReading } from "~/lib/generate-reading";
import { laSoJsonToChiTiet, profileHasLaso } from "~/lib/la-so-ui";

/** Thanh ngũ hành — khớp Make: xám / forest / xanh / đỏ sẫm / ochre. */
const NGU_HANH_COLORS: Record<string, string> = {
  kim: "oklch(0.62 0.02 80)",
  moc: "var(--forest)",
  thuy: "#4a7a9b",
  hoa: "var(--danger)",
  tho: "#a67c29",
};

const LA_SO_CHI_TIET_SESSION = "la-so-chi-tiet-ai:";
/** Tránh vượt ~5MB sessionStorage; payload structured thường < 100KB. */
const MAX_LASO_PAYLOAD_CACHE_CHARS = 1_500_000;

function isLaSoSemanticShape(o: Record<string, unknown>): boolean {
  return (
    "tinh_cach" in o ||
    "su_nghiep" in o ||
    "tai_van" in o ||
    "suc_khoe" in o ||
    "tinh_duyen" in o ||
    "_raw" in o
  );
}

/**
 * Lột envelope từ tu-tru-api (data / result / payload, tối đa vài lần)
 * cho tới khi gặp object có khối ngữ nghĩa lá số hoặc không còn lớp hợp lệ.
 */
function laSoReadingPayload(data: unknown): unknown {
  let cur: unknown = data;
  for (let depth = 0; depth < 6; depth++) {
    if (cur == null || typeof cur !== "object" || Array.isArray(cur)) break;
    const o = cur as Record<string, unknown>;
    if (isLaSoSemanticShape(o)) return o;
    const inner = o.data ?? o.result ?? o.payload;
    if (inner != null && typeof inner === "object" && !Array.isArray(inner)) {
      cur = inner;
      continue;
    }
    break;
  }
  return cur;
}

/** Lưu reading và/hoặc payload chờ Haiku; cả hai rỗng thì xóa key. */
function persistChiTietSession(
  profileId: string,
  profileUpdatedAt: string,
  state: { reading?: string | null; payload?: unknown | null },
): void {
  const key = `${LA_SO_CHI_TIET_SESSION}${profileId}`;
  try {
    const hasReading =
      typeof state.reading === "string" && state.reading.trim().length > 0;
    const hasPayload =
      state.payload !== undefined && state.payload !== null;

    if (hasReading) {
      sessionStorage.setItem(
        key,
        JSON.stringify({
          v: 2,
          profileUpdatedAt,
          reading: state.reading!.trim(),
        }),
      );
      return;
    }

    if (hasPayload) {
      const s = JSON.stringify(state.payload);
      if (s.length > MAX_LASO_PAYLOAD_CACHE_CHARS) {
        if (import.meta.env.DEV) {
          console.warn(
            "[la-so chi tiết] Payload quá lớn — không cache (F5 có thể mất nút thử lại không trừ lượng).",
          );
        }
        sessionStorage.removeItem(key);
        return;
      }
      sessionStorage.setItem(
        key,
        JSON.stringify({
          v: 2,
          profileUpdatedAt,
          payload: state.payload,
        }),
      );
      return;
    }

    sessionStorage.removeItem(key);
  } catch {
    // quota / private mode
  }
}

export default function AppLaSoChiTiet() {
  const navigate = useNavigate();
  const { profile, loading, refresh } = useProfile();
  const { costs, loading: costsLoading } = useFeatureCosts();
  const hasLaso = profile ? profileHasLaso(profile.la_so) : false;

  const [detailReading, setDetailReading] = useState<string | null>(null);
  /** Đã trả phí bat-tu `la-so` nhưng Haiku lỗi — chỉ gọi lại generate-reading, không trừ lượng lần hai. */
  const [laSoPayloadRetry, setLaSoPayloadRetry] = useState<unknown | null>(null);
  const [detailBusy, setDetailBusy] = useState(false);
  const [detailAiLoading, setDetailAiLoading] = useState(false);
  const detailGenRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!hasLaso) {
      navigate("/app/la-so", { replace: true });
    }
  }, [hasLaso, loading, navigate]);

  useEffect(() => {
    if (!profile?.id) return;
    const key = `${LA_SO_CHI_TIET_SESSION}${profile.id}`;
    try {
      const raw = sessionStorage.getItem(key);
      if (!raw) return;
      const o = JSON.parse(raw) as {
        profileUpdatedAt?: string;
        reading?: string;
        payload?: unknown;
      };
      if (o.profileUpdatedAt !== profile.updated_at) {
        sessionStorage.removeItem(key);
        return;
      }
      if (typeof o.reading === "string" && o.reading.trim()) {
        setDetailReading(o.reading.trim());
        setLaSoPayloadRetry(null);
        return;
      }
      if (o.payload !== undefined && o.payload !== null) {
        setLaSoPayloadRetry(o.payload);
        setDetailReading(null);
      }
    } catch {
      sessionStorage.removeItem(key);
    }
  }, [profile?.id, profile?.updated_at]);

  async function runGenerateReadingFromPayload(payload: unknown) {
    if (!profile) return;
    const gen = ++detailGenRef.current;
    setDetailAiLoading(true);
    try {
      const { reading } = await invokeGenerateReading({
        endpoint: "la-so",
        data: payload,
      });
      if (gen !== detailGenRef.current || !mountedRef.current) return;
      const text = reading?.trim() ?? null;
      if (!text) {
        toast.error(
          "Chưa tạo được diễn giải. Bạn có thể thử lại — không trừ thêm lượng.",
        );
        if (mountedRef.current) setDetailReading(null);
        persistChiTietSession(profile.id, profile.updated_at, { payload });
        return;
      }
      if (!mountedRef.current) return;
      setLaSoPayloadRetry(null);
      setDetailReading(text);
      persistChiTietSession(profile.id, profile.updated_at, { reading: text });
      void refresh();
    } finally {
      if (gen === detailGenRef.current && mountedRef.current) {
        setDetailAiLoading(false);
        setDetailBusy(false);
      }
    }
  }

  async function runLaSoDetailReading() {
    if (!profile) return;
    const q = profileToBatTuPersonQuery(profile);
    if (!q.birth_date || q.birth_time === undefined) {
      toast.error(
        "Cần đủ ngày sinh và khung giờ sinh. Hãy kiểm tra Cài đặt tài khoản.",
      );
      return;
    }
    setLaSoPayloadRetry(null);
    persistChiTietSession(profile.id, profile.updated_at, {});
    setDetailBusy(true);
    setDetailAiLoading(false);
    const res = await invokeBatTu<unknown>({
      op: "la-so",
      body: { ...q },
    });
    if (!res.ok) {
      toast.error(res.message);
      if (mountedRef.current) setDetailBusy(false);
      return;
    }
    const payload = laSoReadingPayload(res.data);
    persistChiTietSession(profile.id, profile.updated_at, { payload });
    if (!mountedRef.current) return;
    setLaSoPayloadRetry(payload);
    await runGenerateReadingFromPayload(payload);
  }

  async function retryReadingOnly() {
    if (!laSoPayloadRetry) return;
    setDetailBusy(true);
    setDetailAiLoading(false);
    await runGenerateReadingFromPayload(laSoPayloadRetry);
  }

  if (loading || !profile?.la_so || !hasLaso) {
    return (
      <div className="min-h-[40vh] bg-background px-4 pb-8 py-10">
        <p className="text-sm text-muted-foreground">Đang tải…</p>
      </div>
    );
  }

  const detail = laSoJsonToChiTiet(profile.la_so as LaSoJson);
  const { nguHanh } = detail;

  const q = profileToBatTuPersonQuery(profile);
  const needsBirthTime = q.birth_time === undefined;
  const costRow = costs.la_so_diengiai;
  const unlockLabel =
    detailBusy && !detailAiLoading
      ? "Đang lấy lá số…"
      : detailBusy && detailAiLoading
        ? "Đang viết diễn giải…"
        : costRow?.is_free || (costRow?.credit_cost ?? 0) <= 0
          ? "Mở khóa diễn giải chi tiết"
          : `Mở khóa — ${costRow?.credit_cost ?? 10} lượng`;

  const showReadingBlock =
    Boolean(detailReading) || detailAiLoading || detailBusy;

  const showPaidUnlockCard =
    !detailReading && !laSoPayloadRetry && !detailBusy && !detailAiLoading;

  const showRetryReadingCard =
    !detailReading && laSoPayloadRetry != null && !detailBusy && !detailAiLoading;

  return (
    <div className="min-h-[60vh] bg-background px-4 pb-24">
      <ScreenHeader
        title="Chi tiết lá số"
        showBack={false}
        appScreenTitle
        endAdornment={<CreditsHeaderChip />}
      />

      <div className="flex flex-col gap-4">
        <div
          className="relative overflow-hidden bg-forest text-forest-foreground px-4 py-4 shadow-sm"
          style={{ borderRadius: "var(--radius-lg)" }}
        >
          <GrainOverlay />
          <div className="relative">
            <p
              className="text-forest-foreground/55 text-[10px] font-medium tracking-widest mb-3"
              style={{ fontFamily: "var(--font-ibm-mono)" }}
            >
              TỨ TRỤ
            </p>
            <div className="grid grid-cols-4 gap-2 text-center">
              {(["Giờ", "Ngày", "Tháng", "Năm"] as const).map((label, i) => (
                <div key={label}>
                  <p className="text-forest-foreground/50 text-[10px] mb-2 font-medium">
                    {label}
                  </p>
                  <div
                    className="bg-forest-foreground/12 py-2 mb-1"
                    style={{ borderRadius: "var(--radius-sm)" }}
                  >
                    <p className="text-make-cta text-sm font-semibold">
                      {detail.thienCan[i] ?? "—"}
                    </p>
                  </div>
                  <div
                    className="bg-forest-foreground/8 py-2"
                    style={{ borderRadius: "var(--radius-sm)" }}
                  >
                    <p className="text-make-cta/95 text-sm font-medium">
                      {detail.diaChi[i] ?? "—"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          className="bg-card border border-border px-4 py-4 shadow-sm"
          style={{ borderRadius: "var(--radius-lg)" }}
        >
          <p className="text-foreground text-base font-semibold mb-3">Ngũ hành</p>
          <div className="flex flex-col gap-2.5">
            {(Object.entries(nguHanh) as [string, number][]).map(([key, val]) => {
              const labels: Record<string, string> = {
                kim: "Kim",
                moc: "Mộc",
                thuy: "Thủy",
                hoa: "Hỏa",
                tho: "Thổ",
              };
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-foreground text-xs font-medium w-9 shrink-0">
                    {labels[key] ?? key}
                  </span>
                  <div
                    className="flex-1 h-2 bg-make-cta/28 overflow-hidden min-w-0"
                    style={{ borderRadius: "var(--radius-pill)" }}
                  >
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${Math.min(100, val)}%`,
                        background: NGU_HANH_COLORS[key] ?? "var(--muted-foreground)",
                        borderRadius: "var(--radius-pill)",
                      }}
                    />
                  </div>
                  <span className="text-muted-foreground text-xs w-9 text-right tabular-nums shrink-0">
                    {val}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div
          className="bg-card border border-border px-4 py-4 shadow-sm"
          style={{ borderRadius: "var(--radius-lg)" }}
        >
          <p className="text-foreground text-base font-semibold mb-3">Cát thần</p>
          <div className="flex flex-wrap gap-2">
            {detail.thanSat.map((ts) => (
              <Chip
                key={ts}
                color="success"
                size="sm"
                radius="sm"
                className="!bg-forest/12 !text-forest font-medium"
              >
                {ts}
              </Chip>
            ))}
          </div>
        </div>

        <div
          className="bg-card border border-border px-4 py-4 shadow-sm"
          style={{ borderRadius: "var(--radius-lg)" }}
        >
          <p className="text-foreground text-base font-semibold mb-3">Đại Vận</p>
          <div className="flex flex-col gap-2">
            {detail.daiVanList.map((dv) => (
              <div
                key={`${dv.label}-${dv.years}`}
                className={cn(
                  "flex items-center gap-2 py-2.5 px-3 rounded-[var(--radius-sm)]",
                  dv.isActive
                    ? "bg-forest text-make-cta shadow-sm"
                    : "border border-border bg-transparent",
                )}
              >
                <span
                  className={cn(
                    "text-sm font-semibold flex-1 min-w-0",
                    dv.isActive ? "text-make-cta" : "text-foreground",
                  )}
                >
                  {dv.label}
                </span>
                <span
                  className={cn(
                    "text-xs tabular-nums shrink-0",
                    dv.isActive ? "text-make-cta" : "text-muted-foreground",
                  )}
                  style={{ fontFamily: "var(--font-ibm-mono)" }}
                >
                  {dv.years}
                </span>
                {dv.isActive ? (
                  <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-black/22 text-make-cta border border-make-cta/30">
                    Hiện tại
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        {showPaidUnlockCard ? (
          <div
            className="bg-card border border-border px-4 py-4 shadow-sm"
            style={{ borderRadius: "var(--radius-lg)" }}
          >
            <p className="text-foreground text-base font-semibold mb-2">
              Diễn giải chi tiết
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
              Bản đầy đủ theo tính cách, sự nghiệp, tài vận, sức khỏe và (khi có)
              tình duyên — từ lá số có cấu trúc, viết gọn bằng AI. Mỗi lần mở khóa
              trừ lượng theo bảng giá.
            </p>
            {needsBirthTime ? (
              <p className="text-destructive text-xs leading-relaxed mb-3">
                Thiếu khung giờ sinh trên hồ sơ — không gọi được API lá số chi
                tiết. Cập nhật trong Cài đặt (hoặc lập lại lá số nếu được phép).
              </p>
            ) : null}
            {costsLoading ? (
              <p className="text-muted-foreground text-xs">Đang tải bảng giá…</p>
            ) : (
              <CreditGate featureKey="la_so_diengiai">
                <Button
                  type="button"
                  className="font-semibold"
                  disabled={detailBusy || needsBirthTime}
                  onClick={() => void runLaSoDetailReading()}
                >
                  {unlockLabel}
                </Button>
              </CreditGate>
            )}
          </div>
        ) : null}

        {showRetryReadingCard ? (
          <div
            className="bg-card border border-border px-4 py-4 shadow-sm"
            style={{ borderRadius: "var(--radius-lg)" }}
          >
            <p className="text-foreground text-base font-semibold mb-2">
              Diễn giải chưa sẵn sàng
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
              Dữ liệu lá số đã lấy xong; bước viết AI gặp sự cố. Thử lại chỉ tạo
              diễn giải — không trừ thêm lượng.
            </p>
            <Button
              type="button"
              variant="secondary"
              className="font-semibold"
              onClick={() => void retryReadingOnly()}
            >
              Thử lại diễn giải
            </Button>
          </div>
        ) : null}

        {showReadingBlock ? (
          <AiReadingBlock
            title="Diễn giải chi tiết"
            loading={detailBusy || detailAiLoading}
            text={detailReading}
            variant="on-card"
            emptyLabel="Diễn giải chưa tạo được. Thử lại sau hoặc kiểm tra kết nối."
          />
        ) : null}

        <Button variant="outline" asChild className="w-full font-medium">
          <Link to="/app/la-so">← Lá số tứ trụ</Link>
        </Button>
      </div>
    </div>
  );
}
