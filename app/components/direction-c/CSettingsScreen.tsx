import { useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

import { BackBar, Mono } from "~/components/brand";
import { CConfirmDialog } from "~/components/direction-c/CConfirmDialog";
import { useAuth } from "~/lib/auth";
import { useProfile } from "~/hooks/useProfile";
import { useSubscription } from "~/hooks/useSubscription";
import { CT } from "~/lib/c-tokens";
import { subscriptionDaysUntil } from "~/lib/entitlements";

const APP_VERSION = "1.0.4";

type RowProps = {
  label: string;
  value?: string | null;
  arrow?: string;
  to?: string;
  href?: string;
  onClick?: () => void;
  danger?: boolean;
  last?: boolean;
};

function SettingsRow({
  label,
  value,
  arrow = "›",
  to,
  href,
  onClick,
  danger,
  last,
}: RowProps) {
  const inner = (
    <>
      <div
        className="font-[family-name:var(--display-2)] text-sm font-semibold tracking-[-0.005em]"
        style={{ color: danger ? CT.red : CT.ink }}
      >
        {label}
      </div>
      <div className="flex shrink-0 items-baseline gap-2.5">
        {value ? (
          <span className="font-serif text-[12.5px]" style={{ color: CT.muted }}>
            {value}
          </span>
        ) : null}
        <span className="font-serif text-sm" style={{ color: danger ? CT.red : CT.muted }}>
          {arrow}
        </span>
      </div>
    </>
  );

  const rowClass =
    "flex w-full cursor-pointer items-baseline justify-between border-none bg-transparent py-3 text-left no-underline";
  const borderStyle = last ? undefined : { borderBottom: `1px solid ${CT.hairline2}` };

  if (to) {
    return (
      <Link to={to} className={rowClass} style={borderStyle}>
        {inner}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={rowClass} style={{ ...borderStyle, color: CT.ink }}>
        {inner}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={rowClass} style={borderStyle}>
      {inner}
    </button>
  );
}

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-[26px] first:mt-2">
      <Mono className="mb-1 text-[9px]" style={{ color: CT.muted }}>
        {title}
      </Mono>
      <div>{children}</div>
    </section>
  );
}

function LegalPickerDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center"
      style={{ background: "rgba(24,21,14,0.55)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-picker-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[390px] px-6 pb-8 pt-5 sm:rounded-none"
        style={{ background: CT.paper, fontFamily: "var(--serif)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <Mono style={{ color: CT.muted, fontSize: 9 }}>Pháp lý</Mono>
        <h3
          id="legal-picker-title"
          className="mt-1.5 font-[family-name:var(--display-2)] text-base font-semibold tracking-[-0.005em]"
          style={{ color: CT.ink }}
        >
          Điều khoản · Bảo mật
        </h3>
        <div className="mt-4 flex flex-col gap-2">
          <Link
            to="/dieu-khoan"
            onClick={onClose}
            className="block border py-3 text-center font-[family-name:var(--display-2)] text-xs font-bold uppercase tracking-[0.06em] no-underline"
            style={{ borderColor: CT.hairline, color: CT.ink }}
          >
            Điều khoản sử dụng
          </Link>
          <Link
            to="/chinh-sach-bao-mat"
            onClick={onClose}
            className="block border py-3 text-center font-[family-name:var(--display-2)] text-xs font-bold uppercase tracking-[0.06em] no-underline"
            style={{ borderColor: CT.hairline, color: CT.ink }}
          >
            Chính sách bảo mật
          </Link>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full cursor-pointer border-none bg-transparent py-2 text-center font-serif text-[12.5px]"
          style={{ color: CT.muted }}
        >
          Huỷ
        </button>
      </div>
    </div>
  );
}

export function CSettingsScreen() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { profile } = useProfile();
  const { expiresAt, isActive } = useSubscription();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);

  const planLabel = useMemo(() => {
    if (!isActive || !expiresAt) return "chưa có gói";
    const days = subscriptionDaysUntil(expiresAt);
    const months =
      (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30);
    let tier = "1 tháng";
    if (months >= 11) tier = "1 năm";
    else if (months >= 5) tier = "6 tháng";
    if (days == null) return tier;
    return `${tier} · còn ${days} ngày`;
  }, [expiresAt, isActive]);

  async function confirmLogout() {
    setLogoutOpen(false);
    await signOut();
    navigate("/dang-nhap", { replace: true });
  }

  return (
    <div
      className="flex min-h-[100svh] flex-col"
      style={{ background: CT.paper, color: CT.ink, fontFamily: "var(--serif)" }}
    >
      <BackBar title="Cài đặt" />

      <div className="flex-1 overflow-auto px-6 pb-[100px] pt-1">
        <SettingsSection title="Tài khoản">
          <SettingsRow
            label="Email"
            value={profile?.email ?? "—"}
            arrow="khoá"
            onClick={() => toast.message("Email liên kết tài khoản — không đổi tại đây.")}
          />
          <SettingsRow label="Đổi mật khẩu" to="/quen-mat-khau" />
          <SettingsRow
            label="Đăng nhập 2 lớp"
            value="tắt"
            onClick={() => toast.message("Tính năng sắp có.")}
            last
          />
        </SettingsSection>

        <SettingsSection title="Lịch của tôi">
          <SettingsRow label="Gói hiện tại" value={planLabel} to="/dat-lich" />
          <SettingsRow
            label="Lịch sử thanh toán"
            href="mailto:hotro@ngaylanhthangtot.vn?subject=Y%C3%AAu%20c%E1%BA%A7u%20l%E1%BB%8Bch%20s%E1%BB% AD%20thanh%20to%C3%A1n"
          />
          <SettingsRow label="Phương thức thanh toán" value="PayOS" arrow="›" last />
        </SettingsSection>

        <SettingsSection title="Hiển thị">
          <SettingsRow label="Ngôn ngữ" value="Tiếng Việt" arrow="›" />
          <SettingsRow
            label="Hiện chữ Hán Việt nặng"
            value="tắt"
            onClick={() => toast.message("Tính năng sắp có.")}
            last
          />
        </SettingsSection>

        <SettingsSection title="Hỗ trợ">
          <SettingsRow label="Câu hỏi thường gặp" to="/#hoi-dap" />
          <SettingsRow label="Liên hệ" href="mailto:hotro@ngaylanhthangtot.vn" />
          <SettingsRow
            label="Điều khoản · Bảo mật"
            onClick={() => setLegalOpen(true)}
            last
          />
        </SettingsSection>

        <div
          className="mt-8 border-t pt-5"
          style={{ borderColor: CT.hairline }}
        >
          <button
            type="button"
            onClick={() => setLogoutOpen(true)}
            className="w-full cursor-pointer border-none bg-transparent py-3 text-left font-[family-name:var(--display-2)] text-sm font-semibold tracking-[-0.005em]"
            style={{ color: CT.red }}
          >
            Đăng xuất
          </button>
        </div>

        <p
          className="mt-6 text-center font-[family-name:var(--mono)] text-[9.5px] tracking-[0.06em]"
          style={{ color: CT.muted }}
        >
          v{APP_VERSION} · ngaylanhthangtot.vn
        </p>
      </div>

      <LegalPickerDialog open={legalOpen} onClose={() => setLegalOpen(false)} />

      <CConfirmDialog
        open={logoutOpen}
        title={
          <>
            Đăng xuất khỏi
            <br />
            lịch của bạn?
          </>
        }
        description="Lá số và sổ ngày của bạn vẫn được lưu trên cloud. Đăng nhập lại bất cứ lúc nào."
        confirmLabel="Đăng xuất"
        onConfirm={() => void confirmLogout()}
        onCancel={() => setLogoutOpen(false)}
      />
    </div>
  );
}
