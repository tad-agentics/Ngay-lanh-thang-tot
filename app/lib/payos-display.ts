/** Hiển thị tên ngân hàng theo BIN VietQR (PayOS) — fallback khi không tra được. */
const BIN_LABELS: Record<string, string> = {
  "970422": "MB Bank",
  "970436": "Vietcombank",
  "970415": "VietinBank",
  "970418": "BIDV",
  "970405": "Agribank",
  "970407": "Techcombank",
  "970432": "VPBank",
  "970403": "Sacombank",
  "970448": "OCB",
  "970454": "VietCapital Bank",
};

export function payosBankLabel(bankBin: string | null): string {
  if (!bankBin) return "Ngân hàng";
  return BIN_LABELS[bankBin] ?? `Ngân hàng (BIN ${bankBin})`;
}

export function formatVnd(amount: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(amount)}đ`;
}
