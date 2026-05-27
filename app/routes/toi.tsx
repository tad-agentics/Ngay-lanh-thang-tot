import { Link, useNavigate } from "react-router";

import { Mono } from "~/components/brand";
import { scoreDotColor } from "~/lib/c-score";
import { CT } from "~/lib/c-tokens";
import { subscriptionActive } from "~/lib/entitlements";
import { laSoJsonToChiTiet, laSoJsonToRevealProps, profileHasLaso } from "~/lib/la-so-ui";
import { useEntitlements } from "~/hooks/useEntitlements";
import { useProfile } from "~/hooks/useProfile";
import { useSavedPicks } from "~/hooks/useSavedPicks";
import { useSubscription } from "~/hooks/useSubscription";

const PILLAR_LABELS = ["Niên", "Nguyệt", "Nhật", "Thời"] as const;

function ageFromNgaySinh(ngaySinh: string | null): string | null {
  if (!ngaySinh) return null;
  const y = Number.parseInt(ngaySinh.slice(0, 4), 10);
  if (!Number.isFinite(y)) return null;
  const age = new Date().getFullYear() - y;
  return age > 0 ? `${age} tuổi` : null;
}

function daysUntil(iso: string | null): string | null {
  if (!iso) return null;
  const target = new Date(`${iso.slice(0, 10)}T12:00:00`);
  const now = new Date();
  now.setHours(12, 0, 0, 0);
  const diff = Math.ceil((target.getTime() - now.getTime()) / 86_400_000);
  if (diff < 0) return null;
  if (diff === 0) return "hôm nay";
  if (diff < 30) return `${diff} ngày nữa`;
  if (diff < 60) return "~1 tháng";
  return `~${Math.round(diff / 30)} tháng`;
}

function formatPickDate(iso: string): string {
  const dt = new Date(`${iso.slice(0, 10)}T12:00:00`);
  const d = String(dt.getDate()).padStart(2, "0");
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  return `${d}.${m}`;
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
  const { profile } = useProfile();
  const { expiryFormatted, isActive, expiresAt } = useSubscription();
  const { canUseBaziReading: baziUnlocked } = useEntitlements();
  const { picks, loading: picksLoading } = useSavedPicks();

  const displayName = profile?.display_name ?? "—";
  const laso = profile ? laSoJsonToRevealProps(profile.la_so) : null;
  const chiTiet = profile
    ? laSoJsonToChiTiet(profile.la_so as import("~/lib/api-types").LaSoJson | null)
    : null;
  const ageLabel = profile ? ageFromNgaySinh(profile.ngay_sinh) : null;
  const hasLaso = profile ? profileHasLaso(profile.la_so) : false;

  const upcoming = picks
    .filter((p) => p.day_iso && daysUntil(p.day_iso))
    .slice(0, 3)
    .map((p) => ({
      d: formatPickDate(p.day_iso!),
      v: p.label ?? "Việc đã đánh dấu",
      s: p.score ?? 78,
      in: daysUntil(p.day_iso)!,
    }));

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
    <div
      className="flex min-h-full flex-col"
      style={{ background: CT.paper, color: CT.ink, fontFamily: "var(--serif)" }}
    >
      <div className="flex-1 overflow-auto px-6 pb-24 pt-5">
        <div>
          <div
            className="font-[family-name:var(--font-display)] text-[26px] font-extrabold uppercase leading-[1.05] tracking-[-0.01em]"
            style={{ color: CT.ink }}
          >
            {displayName}
          </div>
          <div className="mt-1 font-serif text-[12.5px]" style={{ color: CT.muted }}>
            {[ageLabel, laso?.menh ? `mệnh ${laso.menh}` : null]
              .filter(Boolean)
              .join(" · ")}
          </div>
        </div>

        <div
          className="mt-7 px-4 py-3.5"
          style={{ background: CT.forest, color: CT.cream }}
        >
          <div className="flex items-baseline justify-between">
            <Mono style={{ color: CT.gold, fontSize: 9, letterSpacing: "0.18em" }}>
              Lịch của tôi · {subscriptionPlanLabel(expiresAt)}
            </Mono>
            {daysLeft != null ? (
              <span
                className="font-serif text-[11px]"
                style={{ color: "rgba(237,231,211,0.6)" }}
              >
                còn {daysLeft} ngày
              </span>
            ) : null}
          </div>
          <div
            className="mt-2 font-[family-name:var(--font-display)] text-[22px] font-extrabold uppercase tracking-[-0.005em]"
          >
            {isActive && expiryFormatted
              ? `Dùng đến ${expiryFormatted}`
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
            onClick={() => void navigate("/dat-lich")}
            className="mt-3.5 w-full cursor-pointer border-none py-3 font-[family-name:var(--font-display)] text-xs font-extrabold uppercase tracking-[0.08em]"
            style={{ background: CT.gold, color: CT.forest }}
          >
            {isActive ? "Gia hạn · nâng gói" : "Đặt lịch cá nhân"}
          </button>
        </div>

        {baziUnlocked ? (
          <Link
            to="/toi/luan-bat-tu"
            className="relative mt-5 block cursor-pointer border px-4 py-3.5 no-underline"
            style={{ background: "#fff", borderColor: CT.goldDeep, color: CT.ink }}
          >
            <div className="flex items-baseline gap-2">
              <span style={{ color: CT.goldDeep, fontSize: 14 }}>★</span>
              <Mono style={{ color: CT.goldDeep, fontSize: 9 }}>
                {baziUnlocked ? "Đã mở" : "Luận giải"}
              </Mono>
            </div>
            <div
              className="mt-1.5 font-[family-name:var(--font-display)] text-[19px] font-extrabold uppercase tracking-[-0.01em]"
              style={{ color: CT.ink }}
            >
              Luận giải Bát tự
            </div>
            <div className="mt-1 font-serif text-xs" style={{ color: CT.muted }}>
              tính cách · vận năm · phong thuỷ · quý nhân
            </div>
            <div
              className="mt-2.5 font-[family-name:var(--font-display)] text-xs font-bold uppercase tracking-[0.06em]"
              style={{ color: CT.goldDeep }}
            >
              Đọc ngay →
            </div>
          </Link>
        ) : (
          <Link
            to="/dat-lich"
            className="mt-5 block border px-4 py-3.5 no-underline"
            style={{ background: "#fff", borderColor: CT.hairline, color: CT.ink }}
          >
            <Mono style={{ color: CT.muted, fontSize: 9 }}>Luận giải Bát tự</Mono>
            <div
              className="mt-1.5 font-[family-name:var(--font-display)] text-base font-bold uppercase tracking-[-0.005em]"
            >
              Mở khóa luận giải
            </div>
            <div className="mt-1 font-serif text-xs" style={{ color: CT.muted }}>
              Gói năm hoặc mua lẻ tại Đặt lịch
            </div>
          </Link>
        )}

        <div
          className="mt-9 border-t pt-5"
          style={{ borderColor: CT.hairline }}
        >
          <Mono
            style={{ color: CT.muted, fontSize: 9, display: "block", marginBottom: 6 }}
          >
            Ngày sắp tới · đã đánh dấu
          </Mono>
          {picksLoading ? (
            <p className="font-serif text-xs" style={{ color: CT.muted }}>
              Đang tải…
            </p>
          ) : upcoming.length > 0 ? (
            upcoming.map((r, i) => (
              <div
                key={`${r.d}-${i}`}
                className="flex items-baseline gap-3.5 py-3"
                style={{
                  borderBottom:
                    i < upcoming.length - 1 ? `1px solid ${CT.hairline2}` : "none",
                }}
              >
                <div className="min-w-[50px]">
                  <div
                    className="font-[family-name:var(--font-display)] text-[17px] font-extrabold tabular-nums tracking-[-0.015em]"
                    style={{ color: CT.ink }}
                  >
                    {r.d}
                  </div>
                  <Mono style={{ color: CT.muted, fontSize: 8.5, marginTop: 3 }}>
                    {r.in}
                  </Mono>
                </div>
                <div className="flex-1 font-serif text-[13.5px]" style={{ color: CT.ink }}>
                  {r.v}
                </div>
                <div
                  className="font-[family-name:var(--font-display)] text-sm font-bold tabular-nums"
                  style={{ color: scoreDotColor(r.s) }}
                >
                  {r.s}
                </div>
              </div>
            ))
          ) : (
            <p className="font-serif text-xs leading-relaxed" style={{ color: CT.muted }}>
              Chưa có ngày đánh dấu — tra cứu ngày lành và lưu vào sổ.
            </p>
          )}
        </div>

        <div
          className="mt-9 border-t pt-5"
          style={{ borderColor: CT.hairline }}
        >
          <div className="flex items-baseline justify-between">
            <Mono style={{ color: CT.muted, fontSize: 9 }}>Lá số tứ trụ</Mono>
            <Link
              to={hasLaso ? "/toi/la-so" : "/toi/la-so"}
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
                <div className="font-serif text-[10px]" style={{ color: CT.muted }}>
                  {p.label}
                </div>
                <div
                  className="mt-1 font-[family-name:var(--font-display)] text-xs font-bold tracking-[-0.005em]"
                  style={{ color: p.hi ? CT.goldDeep : CT.ink }}
                >
                  {p.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className="mt-9 border-t pt-5"
          style={{ borderColor: CT.hairline }}
        >
          <Mono
            style={{ color: CT.muted, fontSize: 9, display: "block", marginBottom: 4 }}
          >
            Tiện ích · cài đặt
          </Mono>
          {[
            { t: "Chuyển lịch", sub: "âm ↔ dương", to: "/tien-ich/chuyen-lich" },
            { t: "Cài đặt", sub: "thông báo · tài khoản · hỗ trợ", to: "/toi/cai-dat" },
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
                  className="font-[family-name:var(--font-display)] text-sm font-bold tracking-[-0.005em]"
                  style={{ color: CT.ink }}
                >
                  {row.t}
                </div>
                <div className="mt-0.5 font-serif text-[11.5px]" style={{ color: CT.muted }}>
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
          className="mt-7 text-center font-[family-name:var(--font-mono)] text-[9px] tracking-[0.06em]"
          style={{ color: CT.muted }}
        >
          v1.0.4 · ngaylanhthangtot.vn
        </div>
      </div>
    </div>
  );
}
