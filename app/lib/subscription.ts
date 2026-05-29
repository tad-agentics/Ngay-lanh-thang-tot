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
