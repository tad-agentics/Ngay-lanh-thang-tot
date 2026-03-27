import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

import { Chip } from "~/components/Chip";
import { CreditsHeaderChip } from "~/components/CreditsHeaderChip";
import { ScreenHeader } from "~/components/ScreenHeader";
import { GrainOverlay } from "~/components/GrainOverlay";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { Button } from "~/components/ui/button";
import { cn } from "~/components/ui/utils";
import { useProfile, type Profile } from "~/hooks/useProfile";
import type { LaSoJson } from "~/lib/api-types";
import { profileToBatTuPersonQuery } from "~/lib/bat-tu-birth";
import { invokeBatTu } from "~/lib/bat-tu";
import {
  invokeGenerateReading,
  normalizeLaSoSectionsInput,
  type LaSoChiTietSection,
} from "~/lib/generate-reading";
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

/**
 * Khóa cache theo dữ liệu sinh / chốt lá số — không dùng `updated_at` (sẽ đổi sau refresh
 * số dư, subscription, v.v. và làm mất luận giải đã tạo khi F5).
 */
function laSoChiTietCacheRevision(p: Profile): string {
  return [
    p.ngay_sinh ?? "",
    p.gio_sinh ?? "",
    p.gioi_tinh ?? "",
    p.birth_data_locked_at ?? "",
  ].join("\x1e");
}

function isLaSoSemanticShape(o: Record<string, unknown>): boolean {
  return (
    "tinh_cach" in o ||
    "tinhCach" in o ||
    "su_nghiep" in o ||
    "suNghiep" in o ||
    "tai_van" in o ||
    "taiVan" in o ||
    "suc_khoe" in o ||
    "sucKhoe" in o ||
    "tinh_duyen" in o ||
    "tinhDuyen" in o ||
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

/** Lưu luận giải theo khía cạnh và/hoặc payload chờ generate-reading; rỗng hết thì xóa key. */
function persistChiTietSession(
  profileId: string,
  cacheRevision: string,
  state: {
    luanSections?: LaSoChiTietSection[] | null;
    payload?: unknown | null;
  },
): void {
  const key = `${LA_SO_CHI_TIET_SESSION}${profileId}`;
  try {
    const hasLuan =
      Array.isArray(state.luanSections) && state.luanSections.length > 0;
    const hasPayload =
      state.payload !== undefined && state.payload !== null;

    if (hasLuan) {
      sessionStorage.setItem(
        key,
        JSON.stringify({
          v: 5,
          revision: cacheRevision,
          luanSections: state.luanSections,
        }),
      );
      return;
    }

    if (hasPayload) {
      const s = JSON.stringify(state.payload);
      if (s.length > MAX_LASO_PAYLOAD_CACHE_CHARS) {
        if (import.meta.env.DEV) {
          console.warn(
            "[la-so chi tiết] Payload quá lớn — không cache (F5 có thể mất nút thử lại).",
          );
        }
        sessionStorage.removeItem(key);
        return;
      }
      sessionStorage.setItem(
        key,
        JSON.stringify({
          v: 5,
          revision: cacheRevision,
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
  const hasLaso = profile ? profileHasLaso(profile.la_so) : false;

  /** Luận giải generative theo khía cạnh (một lần gọi la-so-chi-tiet). */
  const [luanSections, setLuanSections] = useState<LaSoChiTietSection[]>([]);
  /** Đã có payload `la-so` nhưng bước generate-reading lỗi — chỉ gọi lại generate-reading. */
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
    const expectedRevision = laSoChiTietCacheRevision(profile);
    try {
      const raw = sessionStorage.getItem(key);
      if (!raw) return;
      const o = JSON.parse(raw) as {
        v?: number;
        revision?: string;
        /** @deprecated v2 — so khớp updated_at dễ lệch sau refresh profile */
        profileUpdatedAt?: string;
        reading?: string;
        payload?: unknown;
        structuredSections?: unknown;
        luanSections?: LaSoChiTietSection[];
      };
      const revisionMatches =
        typeof o.revision === "string" && o.revision === expectedRevision;
      const legacyV2Matches =
        o.v === 2 &&
        typeof o.profileUpdatedAt === "string" &&
        o.profileUpdatedAt === profile.updated_at;
      if (!revisionMatches && !legacyV2Matches) {
        sessionStorage.removeItem(key);
        return;
      }
      const restoredLuan = normalizeLaSoSectionsInput(o.luanSections);
      if (restoredLuan.length > 0) {
        setLuanSections(restoredLuan);
        setLaSoPayloadRetry(null);
        if (legacyV2Matches && !revisionMatches) {
          persistChiTietSession(profile.id, expectedRevision, {
            luanSections: restoredLuan,
          });
        }
        return;
      }
      if (typeof o.reading === "string" && o.reading.trim()) {
        setLuanSections(
          normalizeLaSoSectionsInput([
            {
              id: "tong_hop",
              title: "Luận giải",
              text: o.reading.trim(),
            },
          ]),
        );
        setLaSoPayloadRetry(null);
        if (legacyV2Matches && !revisionMatches) {
          persistChiTietSession(profile.id, expectedRevision, {
            luanSections: normalizeLaSoSectionsInput([
              {
                id: "tong_hop",
                title: "Luận giải",
                text: o.reading.trim(),
              },
            ]),
          });
        }
        return;
      }
      if (o.payload !== undefined && o.payload !== null) {
        setLaSoPayloadRetry(o.payload);
        setLuanSections([]);
        if (legacyV2Matches && !revisionMatches) {
          persistChiTietSession(profile.id, expectedRevision, {
            payload: o.payload,
          });
        }
      }
    } catch {
      sessionStorage.removeItem(key);
    }
  }, [
    profile?.id,
    profile?.ngay_sinh,
    profile?.gio_sinh,
    profile?.gioi_tinh,
    profile?.birth_data_locked_at,
  ]);

  async function runGenerateReadingFromPayload(payload: unknown) {
    if (!profile) return;
    const gen = ++detailGenRef.current;
    setDetailAiLoading(true);
    try {
      const { reading, sections } = await invokeGenerateReading({
        endpoint: "la-so-chi-tiet",
        data: payload,
      });
      if (gen !== detailGenRef.current || !mountedRef.current) return;

      const fromModel =
        sections && sections.length > 0
          ? sections
          : reading?.trim()
            ? [
                {
                  id: "tong_hop",
                  title: "Luận giải",
                  text: reading.trim(),
                },
              ]
            : null;

      if (!fromModel?.length) {
        toast.error(
          "Chưa tạo được luận giải. Bạn có thể thử lại.",
        );
        if (mountedRef.current) setLuanSections([]);
        persistChiTietSession(profile.id, laSoChiTietCacheRevision(profile), {
          payload,
        });
        return;
      }
      if (!mountedRef.current) return;
      const clamped = normalizeLaSoSectionsInput(fromModel);
      if (!clamped.length) {
        toast.error(
          "Chưa tạo được luận giải. Bạn có thể thử lại.",
        );
        if (mountedRef.current) setLuanSections([]);
        persistChiTietSession(profile.id, laSoChiTietCacheRevision(profile), {
          payload,
        });
        return;
      }
      if (mountedRef.current) setLuanSections(clamped);
      setLaSoPayloadRetry(null);
      persistChiTietSession(profile.id, laSoChiTietCacheRevision(profile), {
        luanSections: clamped,
      });
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
    setLuanSections([]);
    persistChiTietSession(profile.id, laSoChiTietCacheRevision(profile), {});
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
    persistChiTietSession(profile.id, laSoChiTietCacheRevision(profile), {
      payload,
    });
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
  const detailCtaLabel =
    detailBusy && !detailAiLoading
      ? "Đang lấy lá số…"
      : detailBusy && detailAiLoading
        ? "Đang tạo luận giải…"
        : "Xem luận giải chi tiết";

  const showPaidUnlockCard =
    luanSections.length === 0 &&
    !laSoPayloadRetry &&
    !detailBusy &&
    !detailAiLoading;

  const showRetryReadingCard =
    luanSections.length === 0 &&
    laSoPayloadRetry != null &&
    !detailBusy &&
    !detailAiLoading;

  const showLaSoFlowPanel =
    detailBusy || luanSections.length > 0 || detailAiLoading;

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

        {showLaSoFlowPanel ? (
          <div
            className="bg-card border border-border px-4 py-4 shadow-sm"
            style={{ borderRadius: "var(--radius-lg)" }}
          >
            <p className="text-foreground text-base font-semibold mb-1">
              Luận giải theo lá số
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
              Mỗi khía cạnh (tính cách, sự nghiệp, tài vận, sức khỏe, tình duyên khi có dữ
              liệu) là một đoạn văn mạch lạc, dựa trên lá số chi tiết — không thay thế bảng
              tứ trụ ở trên.
            </p>
            {(detailBusy || detailAiLoading) && luanSections.length === 0 ? (
              <div className="space-y-2" aria-busy="true">
                <div className="h-10 rounded-md bg-muted/40 animate-pulse" />
                <div className="h-10 rounded-md bg-muted/40 animate-pulse w-[94%]" />
              </div>
            ) : luanSections.length > 0 ? (
              <Accordion
                type="multiple"
                defaultValue={luanSections.map((s) => s.id)}
                className="w-full"
              >
                {luanSections.map((sec) => (
                  <AccordionItem key={sec.id} value={sec.id}>
                    <AccordionTrigger className="text-sm font-semibold py-3">
                      {sec.title}
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                        {sec.text}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : null}
          </div>
        ) : null}

        {showPaidUnlockCard ? (
          <div
            className="bg-card border border-border px-4 py-4 shadow-sm"
            style={{ borderRadius: "var(--radius-lg)" }}
          >
            <p className="text-foreground text-base font-semibold mb-2">
              Luận giải chi tiết
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
              Bản đầy đủ theo tính cách, sự nghiệp, tài vận, sức khỏe và (khi có)
              tình duyên — dựa trên lá số có cấu trúc, trình bày mạch lạc.
            </p>
            {needsBirthTime ? (
              <p className="text-destructive text-xs leading-relaxed mb-3">
                Thiếu khung giờ sinh trên hồ sơ — không gọi được API lá số chi
                tiết. Cập nhật trong Cài đặt (hoặc lập lại lá số nếu được phép).
              </p>
            ) : null}
            <Button
              type="button"
              className="font-semibold"
              disabled={detailBusy || needsBirthTime}
              onClick={() => void runLaSoDetailReading()}
            >
              {detailCtaLabel}
            </Button>
          </div>
        ) : null}

        {showRetryReadingCard ? (
          <div
            className="bg-card border border-border px-4 py-4 shadow-sm"
            style={{ borderRadius: "var(--radius-lg)" }}
          >
            <p className="text-foreground text-base font-semibold mb-2">
              Luận giải chưa sẵn sàng
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
              Dữ liệu lá số đã lấy xong; bước luận giải gặp sự cố. Thử lại chỉ
              tạo phần luận giải.
            </p>
            <Button
              type="button"
              variant="secondary"
              className="font-semibold"
              onClick={() => void retryReadingOnly()}
            >
              Thử lại luận giải
            </Button>
          </div>
        ) : null}

        <Button variant="outline" asChild className="w-full font-medium">
          <Link to="/app/la-so">← Lá số tứ trụ</Link>
        </Button>
      </div>
    </div>
  );
}
