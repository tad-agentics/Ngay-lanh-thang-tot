/** vi-VN VND display — `299.000 ₫` (currency symbol ₫, not Latin đ). */

export const VND_CURRENCY_FORMAT = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

/** Space + `₫` as produced by Intl (often NBSP before symbol). */
export const VND_CURRENCY_SUFFIX = (() => {
  const parts = VND_CURRENCY_FORMAT.formatToParts(0);
  const literal = parts.find((p) => p.type === "literal")?.value ?? " ";
  const currency = parts.find((p) => p.type === "currency")?.value ?? "₫";
  return `${literal}${currency}`;
})();

export function formatVndDigits(amount: number): string {
  return VND_CURRENCY_FORMAT.formatToParts(Math.round(amount))
    .filter((p) => p.type === "integer" || p.type === "group")
    .map((p) => p.value)
    .join("");
}

export function formatVndPriceDisplay(amount: number): string {
  return VND_CURRENCY_FORMAT.format(Math.round(amount));
}

export function withVndCurrency(digits: string): string {
  const d = digits.trim();
  if (!d) return "";
  const n = Number.parseInt(d.replace(/\D/g, ""), 10);
  if (Number.isFinite(n) && n > 0) return formatVndPriceDisplay(n);
  return `${d}${VND_CURRENCY_SUFFIX}`;
}
