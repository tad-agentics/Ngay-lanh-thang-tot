import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Link } from "react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

import { AiReadingBlock } from "~/components/AiReadingBlock";
import { CreditsHeaderChip } from "~/components/CreditsHeaderChip";
import { ScreenHeader } from "~/components/ScreenHeader";
import { GrainOverlay } from "~/components/GrainOverlay";
import { Button } from "~/components/ui/button";
import { useProfile } from "~/hooks/useProfile";
import { useFeatureCosts } from "~/hooks/useFeatureCosts";
import {
  profileToBatTuPersonQuery,
  tieVanUnlockIdentityKey,
} from "~/lib/bat-tu-birth";
import { invokeBatTu } from "~/lib/bat-tu";
import { supabase } from "~/lib/supabase";
import {
  invokeGenerateReading,
  type LaSoChiTietSection,
} from "~/lib/generate-reading";
import { toDbFeatureKey } from "~/lib/constants";
import { laSoJsonToRevealProps, profileHasLaso } from "~/lib/la-so-ui";
import {
  formatDaiVanContextLineForVanThangDisplay,
  mapTieuVanPayload,
  tieuVanTongQuanDisplayOrNull,
  type TieuVanUi,
} from "~/lib/tieu-van-ui";
import { subscriptionActive } from "~/lib/subscription";
import {
  buildVanThangMonthHeading,
  parseConvertDateLunarTucLine,
  solarYmToTitleLabel,
  stripRedundantSolarMonthPrefix,
} from "~/lib/van-thang-month-label";

const VAN_FEATURE = toDbFeatureKey("van_thang");

function monthOptions(count: number): { ym: string; solarLabel: string }[] {
  const out: { ym: string; solarLabel: string }[] = [];
  const d = new Date();
  for (let i = 0; i < count; i++) {
    const x = new Date(d.getFullYear(), d.getMonth() + i, 1);
    const y = x.getFullYear();
    const m = x.getMonth() + 1;
    const ym = `${y}-${String(m).padStart(2, "0")}`;
    const solarLabel =
      solarYmToTitleLabel(ym) ?? `Tháng ${m} Năm ${y}`;
    out.push({ ym, solarLabel });
  }
  return out;
}

function QualitativeCard({
  kicker,
  titleOptional,
  children,
}: {
  kicker: string;
  titleOptional?: string;
  children: ReactNode;
}) {
  return (
    <div
      className="bg-card border border-border px-4 py-4"
      style={{ borderRadius: "var(--radius-lg)" }}
    >
      <p
        className="text-muted-foreground text-[10px] mb-2 uppercase tracking-wide"
        style={{ fontFamily: "var(--font-ibm-mono)" }}
      >
        {kicker}
      </p>
      {titleOptional ? (
        <p className="text-foreground text-sm font-medium mb-2">{titleOptional}</p>
      ) : null}
      <div className="text-foreground text-sm leading-relaxed">{children}</div>
    </div>
  );
}

export default function AppVanThang() {
  const { profile, loading, refresh } = useProfile();
  const { costs, loading: costsLoading } = useFeatureCosts();
  const months = useMemo(() => monthOptions(6), []);
  const [monthIdx, setMonthIdx] = useState(0);
  const [unlocked, setUnlocked] = useState<Record<string, TieuVanUi>>({});
  const [unlocking, setUnlocking] = useState(false);
  const [lunarTucByYm, setLunarTucByYm] = useState<
    Record<string, string | null>
  >({});
  const [lunarPrefetch, setLunarPrefetch] = useState<
    "idle" | "loading" | "done"
  >("idle");
  const [tieuVanAiReading, setTieuVanAiReading] = useState<
    Record<string, string | null>
  >({});
  const [tieuVanAiSections, setTieuVanAiSections] = useState<
    Record<string, LaSoChiTietSection[] | null>
  >({});
  const [tieuVanAiLoading, setTieuVanAiLoading] = useState<
    Record<string, boolean>
  >({});
  const tieuVanAiGenRef = useRef<Record<string, number>>({});

  const costRow = costs[VAN_FEATURE];
  const cost = costRow?.credit_cost ?? 24;

  const hasLaso = profile ? profileHasLaso(profile.la_so) : false;
  const q = profileToBatTuPersonQuery(profile ?? null);
  const prefetchLunarLabels =
    !loading && !costsLoading && hasLaso && Boolean(q.birth_date);

  useEffect(() => {
    if (!prefetchLunarLabels) {
      setLunarPrefetch("idle");
      return;
    }
    let cancelled = false;
    setLunarPrefetch("loading");
    void (async () => {
      const entries = await Promise.all(
        months.map(async ({ ym }) => {
          const res = await invokeBatTu<unknown>({
            op: "convert-date",
            body: { solar: `${ym}-01` },
          });
          if (!res.ok) return [ym, null] as const;
          const line = parseConvertDateLunarTucLine(res.data);
          return [ym, line] as const;
        }),
      );
      if (!cancelled) {
        setLunarTucByYm(Object.fromEntries(entries));
        setLunarPrefetch("done");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [prefetchLunarLabels, months]);

  const vanIdentityKey = useMemo(
    () => (q.birth_date ? tieVanUnlockIdentityKey(q) : ""),
    [q.birth_date, q.birth_time, q.gender, q.tz],
  );

  const startTieuVanAiForMonth = useCallback((ymKey: string, raw: unknown) => {
    const nextGen = (tieuVanAiGenRef.current[ymKey] ?? 0) + 1;
    tieuVanAiGenRef.current[ymKey] = nextGen;
    setTieuVanAiReading((prev) => ({ ...prev, [ymKey]: null }));
    setTieuVanAiSections((prev) => ({ ...prev, [ymKey]: null }));
    setTieuVanAiLoading((prev) => ({ ...prev, [ymKey]: true }));
    void invokeGenerateReading({
      endpoint: "tieu-van",
      data: raw,
    }).then((r) => {
      if (tieuVanAiGenRef.current[ymKey] !== nextGen) return;
      const secs = r.sections && r.sections.length > 0 ? r.sections : null;
      if (secs) {
        setTieuVanAiSections((prev) => ({ ...prev, [ymKey]: secs }));
        setTieuVanAiReading((prev) => ({ ...prev, [ymKey]: null }));
      } else {
        setTieuVanAiReading((prev) => ({
          ...prev,
          [ymKey]: r.reading?.trim() ? r.reading : null,
        }));
        setTieuVanAiSections((prev) => ({ ...prev, [ymKey]: null }));
      }
      setTieuVanAiLoading((prev) => ({ ...prev, [ymKey]: false }));
    });
  }, []);

  useEffect(() => {
    if (!profile?.id || !hasLaso || !vanIdentityKey) return;
    let cancelled = false;
    void (async () => {
      const { data, error } = await supabase
        .from("tieu_van_unlocks")
        .select("year_month, payload")
        .eq("identity_key", vanIdentityKey);
      if (cancelled || error) return;
      const nextUnlocked: Record<string, TieuVanUi> = {};
      for (const row of data ?? []) {
        nextUnlocked[row.year_month] = mapTieuVanPayload(row.payload);
      }
      if (cancelled) return;
      setUnlocked((prev) => ({ ...prev, ...nextUnlocked }));
      for (const row of data ?? []) {
        if (cancelled) break;
        startTieuVanAiForMonth(row.year_month, row.payload as unknown);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profile?.id, hasLaso, vanIdentityKey, startTieuVanAiForMonth]);

  const reveal = laSoJsonToRevealProps(profile?.la_so ?? undefined);
  const nhatChuProfile = reveal?.nhatChu ?? "";

  const current = months[monthIdx] ?? months[0]!;
  const ym = current.ym;
  const lunarLine = lunarTucByYm[ym];
  const monthHeading = buildVanThangMonthHeading(
    current.solarLabel,
    lunarLine,
  );
  const isUnlocked = Boolean(unlocked[ym]);

  async function runTieuVan() {
    if (!q.birth_date || unlocking) {
      if (!q.birth_date) toast.error("Cần ngày sinh trong lá số / hồ sơ.");
      return;
    }
    setUnlocking(true);
    try {
      const res = await invokeBatTu<unknown>({
        op: "tieu-van",
        body: { ...q, month: ym },
      });
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      const ui = mapTieuVanPayload(res.data);
      setUnlocked((prev) => ({ ...prev, [ym]: ui }));
      startTieuVanAiForMonth(ym, res.data);
      await refresh();
    } finally {
      setUnlocking(false);
    }
  }

  if (loading || costsLoading) {
    return (
      <div className="px-4 pb-8">
        <ScreenHeader
          title="Vận tháng"
          showBack={false}
          appScreenTitle
          endAdornment={<CreditsHeaderChip />}
        />
        <p className="text-sm text-muted-foreground py-6">Đang tải…</p>
      </div>
    );
  }

  if (!hasLaso) {
    return (
      <div className="px-4 pb-8 py-10 space-y-4">
        <ScreenHeader
          title="Vận tháng"
          showBack={false}
          appScreenTitle
          endAdornment={<CreditsHeaderChip />}
        />
        <p className="text-muted-foreground text-sm leading-relaxed">
          Cần lá số tứ trụ trước khi xem vận tháng cá nhân hoá.
        </p>
        <Button asChild>
          <Link to="/app/la-so">Lập lá số</Link>
        </Button>
      </div>
    );
  }

  if (!q.birth_date) {
    return (
      <div className="px-4 pb-8 py-10 space-y-4">
        <ScreenHeader
          title="Vận tháng"
          showBack={false}
          appScreenTitle
          endAdornment={<CreditsHeaderChip />}
        />
        <p className="text-muted-foreground text-sm">
          Thiếu ngày sinh trên hồ sơ — bổ sung trong Cài đặt hoặc lập lại lá số.
        </p>
        <Button variant="secondary" asChild>
          <Link to="/app/cai-dat">Cài đặt</Link>
        </Button>
      </div>
    );
  }

  const detail = unlocked[ym];
  const subActive = subscriptionActive(profile?.subscription_expires_at);
  const nhatChuLine =
    detail?.nhatChuApi && detail.nhatChuApi.trim()
      ? detail.nhatChuApi
      : nhatChuProfile;

  const hasTuTruMeta =
    detail &&
    (detail.dungThanApi ||
      detail.chartStrength ||
      detail.thapThanOfMonth);

  const tongQuanStripped = detail
    ? stripRedundantSolarMonthPrefix(detail.tongQuan, ym)
    : "";
  const tongQuanDisplay =
    detail != null
      ? tieuVanTongQuanDisplayOrNull(detail.elementRelationCode, tongQuanStripped)
      : null;
  const canLuuDisplay = detail
    ? formatDaiVanContextLineForVanThangDisplay(
        stripRedundantSolarMonthPrefix(detail.canLuu, ym),
      )
    : "";
  const tieuVanAiLoad = tieuVanAiLoading[ym] ?? false;
  const tieuVanAiText = tieuVanAiReading[ym] ?? null;
  const tieuVanAiSecs = tieuVanAiSections[ym] ?? null;

  return (
    <div className="px-4 pb-8">
      <ScreenHeader
        title="Vận tháng"
        showBack={false}
        appScreenTitle
        endAdornment={<CreditsHeaderChip />}
      />

      <div className="flex items-center justify-between mb-5" style={{ minHeight: 44 }}>
        <button
          type="button"
          aria-label="Tháng trước"
          onClick={() => setMonthIdx((i) => Math.max(0, i - 1))}
          disabled={monthIdx === 0}
          className="flex items-center justify-center text-muted-foreground disabled:opacity-30"
          style={{ width: 36, height: 36, borderRadius: "var(--radius-sm)" }}
        >
          <ChevronLeft size={18} strokeWidth={1.5} aria-hidden />
        </button>

        <div className="text-center flex-1 min-w-0 px-1">
          <p className="text-foreground text-sm font-medium text-pretty break-words">
            {current.solarLabel}
          </p>
          {lunarLine ? (
            <p className="text-muted-foreground text-xs mt-0.5 text-pretty break-words leading-snug">
              Âm lịch: {lunarLine}
            </p>
          ) : lunarPrefetch === "loading" ? (
            <p className="text-muted-foreground text-xs mt-0.5">
              Đang tra âm lịch…
            </p>
          ) : null}
        </div>

        <button
          type="button"
          aria-label="Tháng sau"
          onClick={() => setMonthIdx((i) => Math.min(months.length - 1, i + 1))}
          disabled={monthIdx === months.length - 1}
          className="flex items-center justify-center text-muted-foreground disabled:opacity-30"
          style={{ width: 36, height: 36, borderRadius: "var(--radius-sm)" }}
        >
          <ChevronRight size={18} strokeWidth={1.5} aria-hidden />
        </button>
      </div>

      <div className="flex flex-col gap-4">
        <div
          className="relative overflow-hidden bg-surface text-surface-foreground px-4 py-3"
          style={{ borderRadius: "var(--radius-lg)" }}
        >
          <GrainOverlay />
          <div className="relative">
            <p
              className="text-surface-foreground/50 text-xs mb-1.5"
              style={{ fontFamily: "var(--font-ibm-mono)" }}
            >
              {isUnlocked ? "LÁ SỐ CỦA BẠN" : "KHUNG THÁNG"}
            </p>
            <p className="text-surface-foreground text-sm leading-relaxed">
              {isUnlocked && detail ? (
                <>
                  {detail.pillarHint !== "—" ? (
                    <>
                      Trụ tháng{" "}
                      <span className="text-surface-foreground/90 font-medium">
                        {detail.pillarHint}
                      </span>
                      .
                    </>
                  ) : (
                    <>Theo lá số cho tháng bạn đang chọn.</>
                  )}
                  {detail.userMenhLabel ? (
                    <>
                      {" "}
                      Mệnh Nạp Âm theo lá số:{" "}
                      <span className="text-accent font-medium">
                        {detail.userMenhLabel}
                      </span>
                      .
                    </>
                  ) : null}
                </>
              ) : (
                <>
                  {monthHeading} — bạn đang xem khung tháng dương lịch. Mở khóa để xem luận
                  giải theo trụ tháng, quan hệ với mệnh và Đại Vận từ lá số, không phải lịch
                  chung.
                </>
              )}
            </p>
          </div>
        </div>

        {isUnlocked && detail ? (
          <>
            <QualitativeCard kicker="Luận giải vận tháng">
              <div className="space-y-2">
                {nhatChuLine ? (
                  <p className="text-foreground text-sm">
                    <span className="text-muted-foreground">Nhật Chủ: </span>
                    <span className="font-medium">{nhatChuLine}</span>
                  </p>
                ) : null}
                {hasTuTruMeta ? (
                  <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
                    {detail.dungThanApi ? (
                      <li>
                        Dụng Thần:{" "}
                        <span className="font-medium text-foreground">
                          {detail.dungThanApi}
                        </span>
                      </li>
                    ) : null}
                    {detail.chartStrength ? (
                      <li>
                        Thế lá số:{" "}
                        <span className="font-medium text-foreground">
                          {detail.chartStrength}
                        </span>
                      </li>
                    ) : null}
                    {detail.thapThanOfMonth ? (
                      <li>
                        Thập Thần của trụ tháng (so với Nhật Chủ):{" "}
                        <span className="font-medium text-foreground">
                          {detail.thapThanOfMonth}
                        </span>
                      </li>
                    ) : null}
                  </ul>
                ) : null}
                {tongQuanDisplay != null && tongQuanDisplay.length > 0 ? (
                  <p className="text-foreground text-sm leading-relaxed">{tongQuanDisplay}</p>
                ) : null}
                {canLuuDisplay.trim().length > 0 ? (
                  <div className="mt-3 pt-3 border-t border-border/60">
                    <p
                      className="text-muted-foreground text-[10px] mb-1.5 uppercase tracking-wide"
                      style={{ fontFamily: "var(--font-ibm-mono)" }}
                    >
                      Đại vận hiện tại
                    </p>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {canLuuDisplay}
                    </p>
                  </div>
                ) : null}
                <AiReadingBlock
                  showTitle={false}
                  variant="on-card"
                  loading={tieuVanAiLoad}
                  text={tieuVanAiText}
                  sections={tieuVanAiSecs}
                />
              </div>
            </QualitativeCard>

            {detail.tags.length > 0 ? (
              <div
                className="bg-card border border-border px-4 py-4"
                style={{ borderRadius: "var(--radius-lg)" }}
              >
                <p className="text-foreground text-sm font-medium mb-3">
                  Tháng này nhìn chung
                </p>
                <div className="flex flex-wrap gap-2">
                  {detail.tags.map((t) => (
                    <span
                      key={t}
                      className="text-xs px-2.5 py-1 rounded-full border border-border bg-muted/40 text-foreground"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {detail.linhVuc.length > 0 ? (
              <div className="flex flex-col gap-3">
                <p className="text-foreground text-sm font-medium px-0.5">
                  Gợi ý theo từng lĩnh vực
                </p>
                {detail.linhVuc.map((row, idx) => (
                  <QualitativeCard key={`${ym}-linh-vuc-${idx}`} kicker={row.title}>
                    <p className="text-muted-foreground text-sm leading-relaxed">{row.body}</p>
                  </QualitativeCard>
                ))}
              </div>
            ) : null}

            <p className="text-muted-foreground text-xs leading-relaxed px-0.5">
              Có việc lớn trong tháng? →{" "}
              <Link to="/app/chon-ngay" className="text-primary font-medium underline underline-offset-2">
                Chọn ngày lành
              </Link>{" "}
              để xem ngày cụ thể theo lá số của bạn.
            </p>
          </>
        ) : (
          <div
            className="border border-border bg-card px-4 py-4"
            style={{ borderRadius: "var(--radius-lg)" }}
          >
            {subActive || (profile?.credits_balance ?? 0) >= cost ? (
              <>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  Mở khóa để xem luận giải định tính: trụ tháng, mệnh, quan hệ ngũ hành với tháng,
                  nhịp Đại Vận và lưu ý trong tháng — không dùng điểm số, bám theo lá số đã
                  lưu.
                </p>
                <Button
                  type="button"
                  className="w-full sm:w-auto"
                  disabled={unlocking}
                  onClick={() => void runTieuVan()}
                >
                  {unlocking ? "Đang mở khóa…" : `Mở khóa — ${cost} lượng`}
                </Button>
              </>
            ) : (
              <>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  Mở chi tiết vận tháng — cần{" "}
                  <span className="text-foreground" style={{ fontFamily: "var(--font-ibm-mono)" }}>
                    {cost} lượng
                  </span>
                  . Số dư hiện tại:{" "}
                  <span className="text-foreground" style={{ fontFamily: "var(--font-ibm-mono)" }}>
                    {subscriptionActive(profile?.subscription_expires_at)
                      ? "Không giới hạn lượng"
                      : `${profile?.credits_balance ?? 0} lượng`}
                  </span>
                  .
                </p>
                <Button type="button" className="w-full sm:w-auto" asChild>
                  <Link to="/app/mua-luong" state={{ returnTo: "/app/van-thang" }}>
                    Mua thêm lượng
                  </Link>
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
