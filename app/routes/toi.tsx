import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

import type { TuTruIntent } from "~/lib/api-types";
import type { SavedPick } from "~/hooks/useSavedPicks";
import { offerGoogleCalendarAfterSave } from "~/lib/saved-pick-calendar";
import {
  goodForFromSavedPickPayload,
  pickMarkLabelForNav,
} from "~/lib/saved-pick-mark";

import { Mono } from "~/components/brand";
import { CConfirmDialog } from "~/components/direction-c/CConfirmDialog";
import { DirectionCScreenBoundary } from "~/components/direction-c/DirectionCScreenBoundary";
import { CSavedPickMarkSheet } from "~/components/direction-c/CSavedPickMarkSheet";
import { CMeLockedBaziCard } from "~/components/direction-c/CMeLockedBaziCard";
import { CMeLockedTieuVanCard } from "~/components/direction-c/CMeLockedTieuVanCard";
import { currentYearVn } from "~/lib/bazi-reading-session";
import { useLaSoRecomputeGate } from "~/hooks/useLaSoRecomputeGate";
import { useEntitlements } from "~/hooks/useEntitlements";
import { useProfile } from "~/hooks/useProfile";
import { useSavedPicks } from "~/hooks/useSavedPicks";
import { useSubscription } from "~/hooks/useSubscription";
import { useAuth } from "~/lib/auth";
import { scoreDotColor } from "~/lib/c-score";
import { CT } from "~/lib/c-tokens";
import {
  hasYearlySubscription,
  subscriptionActive,
  subscriptionExpiryUrgent,
} from "~/lib/entitlements";
import { laSoJsonToChiTiet, laSoJsonToRevealProps } from "~/lib/la-so-ui";
import { resolveProfileDisplayName } from "~/lib/profile-display-name";
import {
  pickScoreNumber,
  upcomingSavedPicks,
  type UpcomingSavedPickRow,
} from "~/lib/saved-picks-upcoming";

const PILLAR_LABELS = ["Niên", "Nguyệt", "Nhật", "Thời"] as const;

function ageFromNgaySinh(ngaySinh: string | null): string | null {
  if (!ngaySinh) return null;
  const y = Number.parseInt(ngaySinh.slice(0, 4), 10);
  if (!Number.isFinite(y)) return null;
  const age = new Date().getFullYear() - y;
  return age > 0 ? `${age} tuổi` : null;
}

function subscriptionPlanLabel(expiresAt: string | null): string {
  if (!expiresAt || !subscriptionActive(expiresAt)) return "chưa có gói";
  const months =
    (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30);
  if (months >= 11) return "gói năm";
  if (months >= 5) return "gói 6 tháng";
  return "gói tháng";
}

function subscriptionProgress(expiresAt: string | null): number {
  if (!expiresAt || !subscriptionActive(expiresAt)) return 0;
  const exp = new Date(expiresAt).getTime();
  const now = Date.now();
  const startGuess = exp - 365 * 86_400_000;
  const total = exp - startGuess;
  if (total <= 0) return 0.93;
  return Math.min(0.98, Math.max(0.05, (now - startGuess) / total));
}

export default function ToiRoute() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { expiryFormatted, isActive, expiresAt } = useSubscription();
  const {
    canUseBaziReading: baziUnlocked,
    canUseTieuVanReading: tieuVanUnlocked,
  } = useEntitlements();
  const tieuVanYear = currentYearVn();
  const {
    picks,
    loading: picksLoading,
    error: picksError,
    deletePick,
    updatePick,
  } = useSavedPicks();
  const [pickToDelete, setPickToDelete] = useState<UpcomingSavedPickRow | null>(
    null,
  );
  const [pickToEdit, setPickToEdit] = useState<SavedPick | null>(null);
  const [deletingPickId, setDeletingPickId] = useState<string | null>(null);
  const [savingPickEdit, setSavingPickEdit] = useState(false);

  const expiryUrgent = subscriptionExpiryUrgent(expiresAt);
  const yearlySub = hasYearlySubscription(profile);
  const { pending: recomputePending } = useLaSoRecomputeGate();

  const displayName = resolveProfileDisplayName(profile, user);
  const laso = profile ? laSoJsonToRevealProps(profile.la_so) : null;
  const chiTiet = profile
    ? laSoJsonToChiTiet(profile.la_so as import("~/lib/api-types").LaSoJson | null)
    : null;
  const ageLabel = profile ? ageFromNgaySinh(profile.ngay_sinh) : null;

  const upcoming = upcomingSavedPicks(picks, { limit: 3 });

  const editPickSuggestedLabels = useMemo(
    () => (pickToEdit ? goodForFromSavedPickPayload(pickToEdit.payload) : []),
    [pickToEdit],
  );

  async function confirmEditSavedPick(values: {
    label: string;
    intent: TuTruIntent | null;
    note: string | null;
    addToGoogleCalendar: boolean;
  }) {
    if (!pickToEdit || savingPickEdit) return;
    setSavingPickEdit(true);
    const r = await updatePick(pickToEdit.id, values);
    setSavingPickEdit(false);
    if (r.ok) {
      const dayIso = pickToEdit.day_iso;
      const pickScore = pickScoreNumber(pickToEdit.score);
      setPickToEdit(null);
      if (values.addToGoogleCalendar && dayIso) {
        offerGoogleCalendarAfterSave({
          dayIso,
          label: values.label,
          note: values.note,
          score: pickScore,
        });
      } else {
        toast.success("Đã cập nhật đánh dấu.");
      }
    } else {
      toast.error(r.error ?? "Không lưu được.");
    }
  }

  async function confirmDeleteSavedPick() {
    if (!pickToDelete || deletingPickId) return;
    setDeletingPickId(pickToDelete.id);
    const r = await deletePick(pickToDelete.id);
    setDeletingPickId(null);
    if (r.ok) {
      setPickToDelete(null);
      toast.success("Đã xóa ngày khỏi sổ.");
    } else {
      toast.error(r.error ?? "Không xóa được. Thử lại.");
    }
  }

  const pillars = PILLAR_LABELS.map((label, i) => {
    const can = chiTiet?.thienCan[i] ?? "—";
    const chi = chiTiet?.diaChi[i] ?? "—";
    const combined = can !== "—" && chi !== "—" ? `${can} ${chi}` : can;
    return { label, value: combined, hi: label === "Nhật" };
  });

  const daysLeft =
    expiresAt && isActive
      ? Math.max(
          0,
          Math.ceil(
            (new Date(expiresAt).getTime() - Date.now()) / 86_400_000,
          ),
        )
      : null;

  return (
    <DirectionCScreenBoundary screen="Tôi">
      <div
        className="flex min-h-full flex-col"
        style={{ background: CT.paper, color: CT.ink, fontFamily: "var(--serif)" }}
      >
        <div className="flex-1 overflow-auto px-6 pb-[100px] pt-5">
        <div>
          <div
            className="font-[family-name:var(--display)] text-[26.5px] font-extrabold uppercase leading-[1.05] tracking-[-0.01em]"
            style={{ color: CT.ink }}
          >
            {displayName}
          </div>
          <div className="mt-1 font-serif text-[13px]" style={{ color: CT.muted }}>
            {[ageLabel, laso?.menh ? `mệnh ${laso.menh}` : null]
              .filter(Boolean)
              .join(" · ")}
          </div>
        </div>

        {recomputePending ? (
          <div
            className="mt-4 border-l-[3px] px-3 py-2.5 font-serif text-[13px] leading-snug"
            style={{
              borderColor: CT.goldDeep,
              background: "rgba(154,124,34,0.08)",
              color: CT.ink2,
            }}
          >
            Đang chấm lại lá số — lịch có thể cập nhật trong giây lát.
          </div>
        ) : null}

        <div
          className="mt-7 px-4 py-3.5"
          style={{
            background: expiryUrgent ? "rgba(154,124,34,0.12)" : CT.forest,
            color: expiryUrgent ? CT.ink : CT.cream,
            border: expiryUrgent ? `1px solid ${CT.goldDeep}` : "none",
          }}
        >
          <div className="flex items-baseline justify-between">
            <Mono
              style={{
                color: expiryUrgent ? CT.goldDeep : CT.gold,
                fontSize: 9.5,
                letterSpacing: "0.18em",
              }}
            >
              Lịch của tôi · {subscriptionPlanLabel(expiresAt)}
            </Mono>
            {daysLeft != null ? (
              <span
                className="font-serif text-[11.5px]"
                style={{
                  color: expiryUrgent
                    ? CT.goldDeep
                    : "rgba(237,231,211,0.6)",
                }}
              >
                còn {daysLeft} ngày
              </span>
            ) : null}
          </div>
          <div
            className="mt-2 font-[family-name:var(--display)] text-[22.5px] font-extrabold uppercase tracking-[-0.005em]"
            style={{ color: expiryUrgent ? CT.ink : undefined }}
          >
            {isActive && expiryFormatted
              ? expiryUrgent
                ? `Sắp hết · đến ${expiryFormatted}`
                : `Dùng đến ${expiryFormatted}`
              : "Chưa có lịch cá nhân"}
          </div>
          {isActive ? (
            <div
              className="mt-3 h-[3px] overflow-hidden"
              style={{ background: "rgba(237,231,211,0.15)" }}
            >
              <div
                className="h-full"
                style={{
                  width: `${Math.round(subscriptionProgress(expiresAt) * 100)}%`,
                  background: CT.gold,
                }}
              />
            </div>
          ) : null}
          <button
            type="button"
            onClick={() =>
              void navigate(
                isActive && !yearlySub
                  ? "/dat-lich?plan=goi_12thang"
                  : "/dat-lich",
              )
            }
            className="mt-3.5 w-full cursor-pointer border-none p-3 font-[family-name:var(--display-2)] text-xs font-extrabold uppercase tracking-[0.08em]"
            style={{
              background: expiryUrgent ? CT.forest : CT.gold,
              color: expiryUrgent ? CT.cream : CT.forest,
            }}
          >
            {isActive
              ? yearlySub
                ? "Gia hạn · nâng gói"
                : "Nâng lên lịch năm"
              : "Đặt lịch cá nhân"}
          </button>
        </div>

        {baziUnlocked ? (
          <Link
            to="/toi/luan-bat-tu"
            className="relative mt-[22px] block cursor-pointer border px-4 py-3.5 no-underline"
            style={{ background: "#fff", borderColor: CT.goldDeep, color: CT.ink }}
          >
            <div className="flex items-baseline gap-2">
              <span style={{ color: CT.goldDeep, fontSize: 14.5 }}>★</span>
              <Mono style={{ color: CT.goldDeep, fontSize: 9.5 }}>
                {yearlySub ? "Đã mở · gói năm" : "Đã mở"}
              </Mono>
            </div>
            <div
              className="mt-1.5 font-[family-name:var(--display)] text-[19.5px] font-extrabold uppercase tracking-[-0.01em]"
              style={{ color: CT.ink }}
            >
              Luận giải Bát tự năm
            </div>
            <div className="mt-1 font-serif text-xs" style={{ color: CT.muted }}>
              tính cách · vận năm · phong thuỷ · quý nhân
            </div>
            <div
              className="mt-2.5 font-[family-name:var(--display-2)] text-xs font-bold uppercase tracking-[0.06em]"
              style={{ color: CT.goldDeep }}
            >
              Đọc ngay →
            </div>
          </Link>
        ) : (
          <CMeLockedBaziCard />
        )}

        {tieuVanUnlocked ? (
          <Link
            to={`/toi/luan-tieu-van?year=${tieuVanYear}`}
            className="relative mt-[22px] block cursor-pointer border px-4 py-3.5 no-underline"
            style={{ background: "#fff", borderColor: CT.goldDeep, color: CT.ink }}
          >
            <div className="flex items-baseline gap-2">
              <span style={{ color: CT.goldDeep, fontSize: 14.5 }}>★</span>
              <Mono style={{ color: CT.goldDeep, fontSize: 9.5 }}>
                {yearlySub ? "Đã mở · gói năm" : "Đã mở"}
              </Mono>
            </div>
            <div
              className="mt-1.5 font-[family-name:var(--display)] text-[19.5px] font-extrabold uppercase tracking-[-0.01em]"
              style={{ color: CT.ink }}
            >
              Luận giải Tiểu vận {tieuVanYear}
            </div>
            <div className="mt-1 font-serif text-xs" style={{ color: CT.muted }}>
              vận hạn cát hung · phong thủy cát tường · luận giải tháng
            </div>
            <div
              className="mt-2.5 font-[family-name:var(--display-2)] text-xs font-bold uppercase tracking-[0.06em]"
              style={{ color: CT.goldDeep }}
            >
              Đọc ngay →
            </div>
          </Link>
        ) : (
          <CMeLockedTieuVanCard />
        )}

        <div
          className="mt-9 border-t pt-[22px]"
          style={{ borderColor: CT.hairline }}
        >
          <Mono style={{ color: CT.muted, fontSize: 9.5, display: "block", marginBottom: 6 }}>
            Ngày sắp tới · đã đánh dấu
          </Mono>
          {picksLoading ? (
            <p className="font-serif text-xs" style={{ color: CT.muted }}>
              Đang tải…
            </p>
          ) : picksError ? (
            <p className="font-serif text-xs leading-relaxed" style={{ color: CT.red }}>
              Không tải được sổ ngày ({picksError}). Thử tải lại trang.
            </p>
          ) : upcoming.length > 0 ? (
            upcoming.map((r, i) => (
              <div
                key={r.id}
                className="flex items-baseline gap-2 py-3"
                style={{
                  borderBottom:
                    i < upcoming.length - 1 ? `1px solid ${CT.hairline2}` : "none",
                }}
              >
                <Link
                  to={`/ngay/${r.iso}`}
                  state={{
                    markLabel: pickMarkLabelForNav(r),
                    intentLabel: pickMarkLabelForNav(r),
                  }}
                  className="flex min-w-0 flex-1 items-baseline gap-3.5 no-underline"
                  style={{ color: CT.ink }}
                >
                  <div className="min-w-[50px] shrink-0">
                    <div
                      className="font-[family-name:var(--display-2)] text-[17.5px] font-extrabold tabular-nums tracking-[-0.015em]"
                      style={{ color: CT.ink }}
                    >
                      {r.d}
                    </div>
                    <Mono style={{ color: CT.muted, fontSize: 9, marginTop: 3 }}>
                      {r.in}
                    </Mono>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-serif text-[14px]" style={{ color: CT.ink }}>
                      {r.v}
                    </div>
                    {r.note ? (
                      <div
                        className="mt-0.5 font-serif text-[11.5px] leading-snug"
                        style={{ color: CT.muted }}
                      >
                        {r.note}
                      </div>
                    ) : null}
                  </div>
                  <div
                    className="shrink-0 font-[family-name:var(--display-2)] text-sm font-bold tabular-nums"
                    style={{ color: scoreDotColor(r.s) }}
                  >
                    {r.s}
                  </div>
                </Link>
                <button
                  type="button"
                  disabled={deletingPickId === r.id || savingPickEdit}
                  onClick={() => {
                    const full = picks.find((p) => p.id === r.id);
                    if (full) setPickToEdit(full);
                  }}
                  className="shrink-0 cursor-pointer border-none bg-transparent px-1 py-0.5 font-serif text-xs disabled:opacity-50"
                  style={{ color: CT.goldDeep }}
                  aria-label={`Sửa ${r.v} · ${r.d}`}
                >
                  Sửa
                </button>
                <button
                  type="button"
                  disabled={deletingPickId === r.id}
                  onClick={() => setPickToDelete(r)}
                  className="shrink-0 cursor-pointer border-none bg-transparent px-1 py-0.5 font-serif text-xs disabled:opacity-50"
                  style={{ color: CT.muted }}
                  aria-label={`Xóa ${r.v} · ${r.d}`}
                >
                  {deletingPickId === r.id ? "…" : "Xóa"}
                </button>
              </div>
            ))
          ) : (
            <p className="font-serif text-xs leading-relaxed" style={{ color: CT.muted }}>
              Chưa có ngày đánh dấu — mở chi tiết ngày từ lịch hoặc tra cứu và chọn
              &ldquo;Đánh dấu để nhắc trước 1 ngày&rdquo;.
            </p>
          )}
        </div>

        <div
          className="mt-9 border-t pt-[22px]"
          style={{ borderColor: CT.hairline }}
        >
          <div className="flex items-baseline justify-between">
            <Mono style={{ color: CT.muted, fontSize: 9.5 }}>Lá số tứ trụ</Mono>
            <Link
              to="/toi/la-so"
              className="font-serif text-xs no-underline"
              style={{ color: CT.goldDeep }}
            >
              Xem chi tiết →
            </Link>
          </div>
          <div className="mt-2.5 grid grid-cols-4 gap-1">
            {pillars.map((p) => (
              <div
                key={p.label}
                className="px-1.5 py-2 text-center"
                style={{
                  background: p.hi ? "rgba(154,124,34,0.08)" : "transparent",
                  border: `1px solid ${p.hi ? CT.goldDeep : CT.hairline2}`,
                }}
              >
                <div className="font-serif text-[10.5px]" style={{ color: CT.muted }}>
                  {p.label}
                </div>
                <div
                  className="mt-1 font-[family-name:var(--display-2)] text-xs font-bold tracking-[-0.005em]"
                  style={{ color: p.hi ? CT.goldDeep : CT.ink }}
                >
                  {p.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className="mt-9 border-t pt-[22px]"
          style={{ borderColor: CT.hairline }}
        >
          <Mono
            style={{ color: CT.muted, fontSize: 9.5, display: "block", marginBottom: 4 }}
          >
            Tiện ích · cài đặt
          </Mono>
          {[
            {
              t: "Giới thiệu bạn bè",
              sub: "mã mời · theo dõi thưởng",
              to: "/toi/gioi-thieu",
            },
            {
              t: "Sửa hồ sơ",
              sub: "tên · ngày sinh · giờ sinh",
              to: "/toi/sua-ho-so",
            },
            {
              t: "Cài đặt",
              sub: "tài khoản · gói · hỗ trợ",
              to: "/toi/cai-dat",
            },
          ].map((row, i, arr) => (
            <Link
              key={row.to}
              to={row.to}
              className="flex items-baseline justify-between py-3 no-underline"
              style={{
                borderBottom:
                  i < arr.length - 1 ? `1px solid ${CT.hairline2}` : "none",
                color: CT.ink,
              }}
            >
              <div>
                <div
                  className="font-[family-name:var(--display-2)] text-sm font-bold tracking-[-0.005em]"
                  style={{ color: CT.ink }}
                >
                  {row.t}
                </div>
                <div className="mt-0.5 font-serif text-[12px]" style={{ color: CT.muted }}>
                  {row.sub}
                </div>
              </div>
              <span className="font-serif text-sm" style={{ color: CT.goldDeep }}>
                ›
              </span>
            </Link>
          ))}
        </div>

        <div
          className="mt-7 text-center font-[family-name:var(--mono)] text-[9.5px] tracking-[0.06em]"
          style={{ color: CT.muted }}
        >
          v1.0.4 · ngaylanhthangtot.vn
        </div>
      </div>

      <CSavedPickMarkSheet
        open={pickToEdit != null}
        mode="edit"
        dayIso={pickToEdit?.day_iso ?? ""}
        score={pickToEdit ? pickScoreNumber(pickToEdit.score) ?? undefined : undefined}
        suggestedLabels={editPickSuggestedLabels}
        initialLabel={pickToEdit?.label ?? ""}
        initialNote={pickToEdit?.note}
        initialIntent={(pickToEdit?.intent as TuTruIntent | null) ?? null}
        busy={savingPickEdit}
        onClose={() => {
          if (!savingPickEdit) setPickToEdit(null);
        }}
        onConfirm={confirmEditSavedPick}
      />

      <CConfirmDialog
        open={pickToDelete != null}
        title="Xóa ngày đã lưu?"
        description={
          pickToDelete
            ? `${pickToDelete.d} · ${pickToDelete.v} sẽ được gỡ khỏi sổ nhắc. Bạn vẫn xem lại ngày đó trên lịch.`
            : ""
        }
        confirmLabel="Xóa"
        onConfirm={() => void confirmDeleteSavedPick()}
        onCancel={() => {
          if (!deletingPickId) setPickToDelete(null);
        }}
      />
      </div>
    </DirectionCScreenBoundary>
  );
}
