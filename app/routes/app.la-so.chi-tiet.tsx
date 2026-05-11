import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { AiReadingBlock } from "~/components/AiReadingBlock";
import { Chip } from "~/components/Chip";
import { CreditsHeaderChip } from "~/components/CreditsHeaderChip";
import { BackBar, Kanji, Mono } from "~/components/brand";
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
import {
  extractLaSoChiTietEnrichment,
  laSoJsonToChiTiet,
  mergeLaSoJsonForChiTietDisplay,
  profileHasLaso,
} from "~/lib/la-so-ui";

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

/** Thứ tự nhãn cố định — luôn hiển thị đủ 5 mục; nội dung là đoạn văn tự động cho từng khía cạnh. */
const LA_SO_CHI_TIET_ASPECT_ROWS: { id: string; title: string }[] = [
  { id: "tinh_cach", title: "Tính cách" },
  { id: "su_nghiep", title: "Sự nghiệp" },
  { id: "tai_van", title: "Tài vận" },
  { id: "suc_khoe", title: "Sức khỏe" },
  { id: "tinh_duyen", title: "Tình duyên" },
];

const TONG_HOP_SECTION_ID = "tong_hop";

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

/** Lưu luận giải theo khía cạnh và/hoặc tải trọng chờ Edge luận giải; rỗng hết thì xóa key. */
function persistChiTietSession(
  profileId: string,
  cacheRevision: string,
  state: {
    luanSections?: LaSoChiTietSection[] | null;
    payload?: unknown | null;
    /** `_raw.element_counts` từ GET la-so — nhỏ, giữ để thanh ngũ hành khớp engine sau F5 */
    chiTietEnrichment?: Record<string, unknown> | null;
  },
): void {
  const key = `${LA_SO_CHI_TIET_SESSION}${profileId}`;
  try {
    const hasLuan =
      Array.isArray(state.luanSections) && state.luanSections.length > 0;
    const hasPayload =
      state.payload !== undefined && state.payload !== null;
    const enrich =
      state.chiTietEnrichment != null &&
      typeof state.chiTietEnrichment === "object" &&
      Object.keys(state.chiTietEnrichment).length > 0
        ? state.chiTietEnrichment
        : undefined;

    if (hasLuan) {
      sessionStorage.setItem(
        key,
        JSON.stringify({
          v: 5,
          revision: cacheRevision,
          luanSections: state.luanSections,
          ...(enrich ? { chiTietEnrichment: enrich } : {}),
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
          ...(enrich ? { chiTietEnrichment: enrich } : {}),
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

  /** Luận giải tự động theo khía cạnh (một lần gọi la-so-chi-tiet). */
  const [luanSections, setLuanSections] = useState<LaSoChiTietSection[]>([]);
  /** Đã có payload `la-so` nhưng bước generate-reading lỗi — chỉ gọi lại generate-reading. */
  const [laSoPayloadRetry, setLaSoPayloadRetry] = useState<unknown | null>(null);
  /** Phần bổ sung từ GET la-so (`_raw.element_counts`) — ref đồng bộ khi gọi persist sau await. */
  const [chiTietEnrichment, setChiTietEnrichment] = useState<
    Record<string, unknown> | null
  >(null);
  const chiTietEnrichmentRef = useRef<Record<string, unknown> | null>(null);
  const assignChiTietEnrichment = useCallback(
    (x: Record<string, unknown> | null) => {
      chiTietEnrichmentRef.current = x;
      setChiTietEnrichment(x);
    },
    [],
  );
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
      if (!raw) {
        assignChiTietEnrichment(null);
        return;
      }
      const o = JSON.parse(raw) as {
        v?: number;
        revision?: string;
        /** @deprecated v2 — so khớp updated_at dễ lệch sau refresh profile */
        profileUpdatedAt?: string;
        reading?: string;
        payload?: unknown;
        structuredSections?: unknown;
        luanSections?: LaSoChiTietSection[];
        chiTietEnrichment?: Record<string, unknown>;
      };
      const revisionMatches =
        typeof o.revision === "string" && o.revision === expectedRevision;
      const legacyV2Matches =
        o.v === 2 &&
        typeof o.profileUpdatedAt === "string" &&
        o.profileUpdatedAt === profile.updated_at;
      if (!revisionMatches && !legacyV2Matches) {
        sessionStorage.removeItem(key);
        assignChiTietEnrichment(null);
        return;
      }
      const enrichRestored =
        o.chiTietEnrichment != null &&
        typeof o.chiTietEnrichment === "object" &&
        !Array.isArray(o.chiTietEnrichment)
          ? o.chiTietEnrichment
          : extractLaSoChiTietEnrichment(o.payload);
      assignChiTietEnrichment(
        enrichRestored && Object.keys(enrichRestored).length > 0
          ? enrichRestored
          : null,
      );
      const restoredLuan = normalizeLaSoSectionsInput(o.luanSections);
      if (restoredLuan.length > 0) {
        setLuanSections(restoredLuan);
        setLaSoPayloadRetry(null);
        if (legacyV2Matches && !revisionMatches) {
          persistChiTietSession(profile.id, expectedRevision, {
            luanSections: restoredLuan,
            chiTietEnrichment:
              enrichRestored && Object.keys(enrichRestored).length > 0
                ? enrichRestored
                : undefined,
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
            chiTietEnrichment:
              enrichRestored && Object.keys(enrichRestored).length > 0
                ? enrichRestored
                : undefined,
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
            chiTietEnrichment:
              enrichRestored && Object.keys(enrichRestored).length > 0
                ? enrichRestored
                : undefined,
          });
        }
      }
    } catch {
      sessionStorage.removeItem(key);
      assignChiTietEnrichment(null);
    }
  }, [
    assignChiTietEnrichment,
    profile?.id,
    profile?.ngay_sinh,
    profile?.gio_sinh,
    profile?.gioi_tinh,
    profile?.birth_data_locked_at,
    profile?.updated_at,
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
          chiTietEnrichment: chiTietEnrichmentRef.current ?? undefined,
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
          chiTietEnrichment: chiTietEnrichmentRef.current ?? undefined,
        });
        return;
      }
      if (mountedRef.current) setLuanSections(clamped);
      setLaSoPayloadRetry(null);
      persistChiTietSession(profile.id, laSoChiTietCacheRevision(profile), {
        luanSections: clamped,
        chiTietEnrichment: chiTietEnrichmentRef.current ?? undefined,
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
    assignChiTietEnrichment(null);
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
    const ext = extractLaSoChiTietEnrichment(res.data);
    if (ext) assignChiTietEnrichment(ext);
    const payload = laSoReadingPayload(res.data);
    persistChiTietSession(profile.id, laSoChiTietCacheRevision(profile), {
      payload,
      chiTietEnrichment: ext ?? undefined,
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
      <div style={{ background: "radial-gradient(ellipse at 50% 0%, #2a4738 0%, #1d3129 50%, #131f1a 100%)", minHeight: "100%" }}>
        <BackBar dark title="Lá số · Chi tiết" subtitle="5 mục · Tứ Trụ · Đại Vận" endAdornment={<CreditsHeaderChip />} />
        <p style={{ padding: "24px 20px", fontFamily: "var(--mono)", fontSize: 12, color: "#7a9a80" }}>Đang tải…</p>
      </div>
    );
  }

  const detail = laSoJsonToChiTiet(
    mergeLaSoJsonForChiTietDisplay(
      profile.la_so as LaSoJson,
      chiTietEnrichment,
    ) as LaSoJson,
  );
  const { nguHanh } = detail;
  const currentDaiVan =
    detail.daiVanList.find((d) => d.isActive) ??
    (detail.daiVanList.length === 1 ? detail.daiVanList[0] : undefined);

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
    <div style={{
      background: "radial-gradient(ellipse at 50% 0%, #2a4738 0%, #1d3129 50%, #131f1a 100%)",
      minHeight: "100%",
      color: "var(--cream, #ede7d3)",
      fontFamily: "var(--serif)",
      position: "relative",
      "--surface": "rgba(197,165,90,0.08)",
      "--surface-foreground": "var(--cream, #ede7d3)",
      "--accent": "var(--gold, #c5a55a)",
      "--border": "rgba(197,165,90,0.25)",
      "--muted-foreground": "rgba(237,231,211,0.55)",
      "--foreground": "var(--cream, #ede7d3)",
      "--card": "rgba(237,231,211,0.95)",
      "--card-foreground": "#18150e",
    } as React.CSSProperties}>
      <Kanji ch="命" size={400} style={{ position: "absolute", top: 80, right: -100, color: "rgba(197,165,90,0.05)", pointerEvents: "none" }} />
      <BackBar dark title="Lá số · Chi tiết" subtitle="5 mục · Tứ Trụ · Đại Vận" endAdornment={<CreditsHeaderChip />} />

      <div className="px-4 pb-24" style={{ position: "relative" }}>
      <div className="flex flex-col gap-4 pt-4">
        <div
          style={{
            background: "rgba(197,165,90,0.09)",
            border: "1px solid rgba(197,165,90,0.28)",
            borderRadius: "var(--radius-lg)",
            padding: "16px",
          }}
        >
          <Mono style={{ color: "rgba(197,165,90,0.65)", display: "block", marginBottom: 12 }}>
            TỨ TRỤ
          </Mono>
          <div>
            <div className="grid grid-cols-4 gap-2 text-center">
              {(["Giờ", "Ngày", "Tháng", "Năm"] as const).map((label, i) => (
                <div key={label}>
                  <p className="text-[10px] mb-2 font-medium" style={{ color: "rgba(197,165,90,0.6)" }}>
                    {label}
                  </p>
                  <div
                    className="py-2 mb-1"
                    style={{ background: "rgba(197,165,90,0.15)", borderRadius: "var(--radius-sm)" }}
                  >
                    <p className="text-sm font-semibold text-center" style={{ color: "var(--cream, #ede7d3)" }}>
                      {detail.thienCan[i] ?? "—"}
                    </p>
                  </div>
                  <div
                    className="py-2"
                    style={{ background: "rgba(197,165,90,0.08)", borderRadius: "var(--radius-sm)" }}
                  >
                    <p className="text-sm font-medium text-center" style={{ color: "rgba(237,231,211,0.85)" }}>
                      {detail.diaChi[i] ?? "—"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          style={{
            background: "rgba(197,165,90,0.08)",
            border: "1px solid rgba(197,165,90,0.25)",
            borderRadius: "var(--radius-lg)",
            padding: "16px",
          }}
        >
          <Mono style={{ color: "rgba(197,165,90,0.65)", display: "block", marginBottom: 12 }}>NGŨ HÀNH</Mono>
          <div className="flex flex-col gap-2.5">
            {(Object.entries(nguHanh) as [string, number][]).map(([key, val]) => {
              const labels: Record<string, string> = {
                kim: "Kim",
                moc: "Mộc",
                thuy: "Thủy",
                hoa: "Hỏa",
                tho: "Thổ",
              };
              const pct =
                Number.isFinite(val) && val >= 0
                  ? Math.min(100, Math.round(val))
                  : 0;
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-xs font-medium w-9 shrink-0" style={{ color: "var(--cream, #ede7d3)" }}>
                    {labels[key] ?? key}
                  </span>
                  <div
                    className="flex-1 h-2 overflow-hidden min-w-0"
                    style={{ borderRadius: "var(--radius-pill)", background: "rgba(237,231,211,0.15)" }}
                  >
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${pct}%`,
                        background: NGU_HANH_COLORS[key] ?? "var(--muted-foreground)",
                        borderRadius: "var(--radius-pill)",
                      }}
                    />
                  </div>
                  <span className="text-xs w-9 text-right tabular-nums shrink-0" style={{ color: "rgba(237,231,211,0.55)" }}>
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div
          style={{
            background: "rgba(197,165,90,0.08)",
            border: "1px solid rgba(197,165,90,0.25)",
            borderRadius: "var(--radius-lg)",
            padding: "16px",
          }}
        >
          <Mono style={{ color: "rgba(197,165,90,0.65)", display: "block", marginBottom: 10 }}>CÁT THẦN</Mono>
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
          style={{
            background: "rgba(197,165,90,0.08)",
            border: "1px solid rgba(197,165,90,0.25)",
            borderRadius: "var(--radius-lg)",
            padding: "16px",
          }}
        >
          <Mono style={{ color: "rgba(197,165,90,0.65)", display: "block", marginBottom: 6 }}>ĐẠI VẬN HIỆN TẠI</Mono>
          <p style={{ fontFamily: "var(--serif)", fontSize: 12, color: "rgba(237,231,211,0.6)", lineHeight: 1.5, marginBottom: 10 }}>
            Theo dữ liệu lá số đã lưu — trụ và khoảng tuổi tương ứng giai đoạn đang vận.
          </p>
          {currentDaiVan ? (
            <div
              className={cn("flex flex-col gap-1 py-3 px-3")}
              style={{
                background: "rgba(197,165,90,0.18)",
                border: "1px solid rgba(197,165,90,0.35)",
                borderRadius: "var(--radius-sm)",
              }}
            >
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <span className="text-sm font-semibold min-w-0" style={{ color: "var(--cream, #ede7d3)" }}>
                  {currentDaiVan.label}
                </span>
                {currentDaiVan.years !== "—" ? (
                  <span
                    className="text-xs tabular-nums shrink-0"
                    style={{ fontFamily: "var(--font-ibm-mono)", color: "rgba(237,231,211,0.7)" }}
                  >
                    Tuổi {currentDaiVan.years}
                  </span>
                ) : null}
              </div>
            </div>
          ) : (
            <p style={{ fontFamily: "var(--serif)", fontSize: 13, color: "rgba(237,231,211,0.6)" }}>
              Chưa xác định được đại vận hiện tại từ dữ liệu. Kiểm tra lá số đã chốt có đủ
              thông tin đại vận.
            </p>
          )}
        </div>

        <div>
          <Mono style={{ color: "rgba(197,165,90,0.65)", display: "block", marginBottom: 10 }}>
            Luận giải theo lá số
          </Mono>

          {showLaSoFlowPanel ? (
            <AiReadingBlock
              title="5 mục · Tính cách · Sự nghiệp · Tài vận · Sức khỏe · Tình duyên"
              showTitle={false}
              loading={detailBusy || (detailAiLoading && luanSections.length === 0)}
              text={null}
              sections={luanSections.length > 0 ? luanSections : null}
              variant="forest"
              onRetry={laSoPayloadRetry ? () => void retryReadingOnly() : undefined}
              retryBusy={detailBusy || detailAiLoading}
            />
          ) : null}

          {showPaidUnlockCard ? (
            <div
              style={{
                background: "rgba(197,165,90,0.08)",
                border: "1px solid rgba(197,165,90,0.3)",
                borderRadius: "var(--radius-lg)",
                padding: "16px",
              }}
            >
              <Mono style={{ color: "rgba(197,165,90,0.65)", display: "block", marginBottom: 8 }}>
                Luận giải chi tiết · 5 mục
              </Mono>
              <p
                style={{
                  fontFamily: "var(--serif)",
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: "rgba(237,231,211,0.8)",
                  marginBottom: 14,
                }}
              >
                Bản đầy đủ theo tính cách, sự nghiệp, tài vận, sức khỏe và tình duyên — dựa trên lá số có cấu trúc.
              </p>
              {needsBirthTime ? (
                <p
                  style={{
                    fontFamily: "var(--serif)",
                    fontStyle: "italic",
                    fontSize: 12,
                    color: "#c07070",
                    marginBottom: 12,
                    lineHeight: 1.55,
                  }}
                >
                  Thiếu khung giờ sinh — không lấy được lá số chi tiết. Liên hệ hỗ trợ để cập nhật.
                </p>
              ) : null}
              <button
                type="button"
                disabled={detailBusy || needsBirthTime}
                onClick={() => void runLaSoDetailReading()}
                style={{
                  background: "var(--cream, #ede7d3)",
                  color: "#18150e",
                  border: "none",
                  padding: "11px 20px",
                  fontFamily: "var(--display-2, 'Barlow Condensed', sans-serif)",
                  fontWeight: 700,
                  fontSize: 13,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  cursor: detailBusy || needsBirthTime ? "default" : "pointer",
                  opacity: detailBusy || needsBirthTime ? 0.6 : 1,
                  width: "100%",
                }}
              >
                {detailCtaLabel}
              </button>
            </div>
          ) : null}

          {showRetryReadingCard ? (
            <div
              style={{
                background: "rgba(139,26,26,0.08)",
                border: "1px solid rgba(139,26,26,0.35)",
                borderRadius: "var(--radius-lg)",
                padding: "16px",
              }}
            >
              <Mono style={{ color: "#c07070", display: "block", marginBottom: 8 }}>
                Luận giải chưa sẵn sàng
              </Mono>
              <p
                style={{
                  fontFamily: "var(--serif)",
                  fontStyle: "italic",
                  fontSize: 12,
                  color: "rgba(237,231,211,0.7)",
                  marginBottom: 14,
                  lineHeight: 1.55,
                }}
              >
                Dữ liệu lá số đã lấy xong; bước luận giải gặp sự cố.
              </p>
              <button
                type="button"
                onClick={() => void retryReadingOnly()}
                style={{
                  background: "rgba(197,165,90,0.12)",
                  border: "1px solid rgba(197,165,90,0.4)",
                  color: "var(--cream, #ede7d3)",
                  padding: "9px 18px",
                  fontFamily: "var(--display-2, 'Barlow Condensed', sans-serif)",
                  fontWeight: 700,
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  cursor: "pointer",
                }}
              >
                Thử lại luận giải
              </button>
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => navigate("/app/la-so")}
          style={{
            background: "transparent",
            border: "1px solid rgba(197,165,90,0.25)",
            color: "rgba(200,188,152,0.75)",
            padding: "14px 16px",
            minHeight: 48,
            fontFamily: "var(--mono)",
            fontSize: 12,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            cursor: "pointer",
            width: "100%",
          }}
        >
          ← Lá số tứ trụ
        </button>
      </div>
      </div>
    </div>
  );
}
