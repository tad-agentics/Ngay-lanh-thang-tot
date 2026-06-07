import type { LichRow } from "~/components/direction-c/LichToPageCard";
import { CT } from "~/lib/c-tokens";

const PREVIEW_COUNT = 2;

function nonEmptyLabels(labels: string[]): string[] {
  return labels.map((l) => l.trim()).filter(Boolean);
}

/** Rút gọn hàng Nên — không liệt kê 20+ việc trên một dòng. */
export function formatNenTeaser(labels: string[]): string {
  const items = nonEmptyLabels(labels);
  if (items.length === 0) return "—";
  if (items.length === 1) {
    return `${items[0]} — hỏi tiếp nếu đây không phải việc bạn định làm`;
  }
  const preview = items.slice(0, PREVIEW_COUNT).join(", ");
  return `${items.length} việc thuận theo lịch · ${preview}… — hỏi tiếp để chọn đúng việc của bạn`;
}

/** Rút gọn hàng Tránh — hướng user tới hỏi việc cụ thể thay vì đọc cả danh sách. */
export function formatTranhTeaser(labels: string[]): string {
  const items = nonEmptyLabels(labels);
  if (items.length === 0) return "—";
  if (items.length === 1) {
    return `Tránh ${items[0]} — hỏi tiếp xem việc bạn định làm có trong danh sách tránh không`;
  }
  return `${items.length} việc nên tránh — hỏi tiếp xem việc bạn định làm có phù hợp ngày này`;
}

export function buildLichNenTranhRows(input: {
  goodFor: string[];
  avoidFor: string[];
  gioTot: string;
}): LichRow[] {
  return [
    { key: "Nên", value: formatNenTeaser(input.goodFor), color: CT.forest },
    { key: "Tránh", value: formatTranhTeaser(input.avoidFor), color: CT.red },
    { key: "Giờ tốt", value: input.gioTot.trim() || "—", color: CT.goldDeep },
  ];
}
