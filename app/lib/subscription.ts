import type { Profile } from "~/lib/profile-context";

/** Gói không giới hạn lượng còn hiệu lực (theo `subscription_expires_at`). */
export function subscriptionActive(
  expires: string | null | undefined,
): boolean {
  if (!expires) return false;
  return new Date(expires) > new Date();
}

/** Ngày hết hạn gói (tiếng Việt, dài) — chỉ khi còn hiệu lực. */
export function subscriptionExpiryLongVi(
  expires: string | null | undefined,
): string | null {
  if (!subscriptionActive(expires) || !expires) return null;
  return new Date(expires).toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export type CreditsProfilePick = Pick<
  Profile,
  "credits_balance" | "subscription_expires_at"
>;

/** Một dòng chính: «Không giới hạn lượng» hoặc «N lượng». */
export function creditsBalanceHeadline(
  profile: CreditsProfilePick | null | undefined,
): string {
  if (!profile) return "0 lượng";
  if (subscriptionActive(profile.subscription_expires_at)) {
    return "Không giới hạn lượng";
  }
  return `${profile.credits_balance} lượng`;
}

/**
 * Dòng phụ khi đang có gói: hết hạn + số lượng sau khi hết gói.
 * Trả về null nếu không có gói đang chạy.
 */
export function creditsBalanceFootnote(
  profile: CreditsProfilePick | null | undefined,
): string | null {
  if (!profile || !subscriptionActive(profile.subscription_expires_at)) {
    return null;
  }
  const exp = subscriptionExpiryLongVi(profile.subscription_expires_at);
  if (!exp) return null;
  return `Gói đến ${exp}. Sau hết gói: ${profile.credits_balance} lượng.`;
}

/** Nhãn rút gọn cho chỗ chật (ví dụ chip trên header). */
export function creditsBalanceChipLabel(
  profile: CreditsProfilePick | null | undefined,
): string {
  if (!profile) return "0";
  if (subscriptionActive(profile.subscription_expires_at)) {
    return "Không giới hạn";
  }
  return String(profile.credits_balance);
}
