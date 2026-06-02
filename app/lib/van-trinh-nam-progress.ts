import type { VanTrinhChapterLoadState, VanTrinhChapterKey } from "~/lib/van-trinh-nam-chapter-load";
import { VAN_TRINH_PROGRESS_KEYS } from "~/lib/van-trinh-nam-chapter-load";

export type VanTrinhLoadProgress = {
  done: number;
  total: number;
  activeLabel: string;
};

const LABELS: Partial<Record<VanTrinhChapterKey, string>> = {
  part_a: "lưu niên (cả năm)",
  closing: "kết bài",
};

function labelForKey(key: VanTrinhChapterKey): string {
  if (key.startsWith("month_")) {
    const n = Number(key.replace("month_", ""));
    return `tháng ${n}`;
  }
  return LABELS[key] ?? key;
}

export function deriveVanTrinhLoadProgress(
  chapterLoad: VanTrinhChapterLoadState,
  yearCanChi: string,
): VanTrinhLoadProgress | null {
  const keys = VAN_TRINH_PROGRESS_KEYS;
  const done = keys.filter((k) => chapterLoad[k] === "done").length;
  const total = keys.length;
  const pending = keys.find((k) => chapterLoad[k] === "loading");

  if (!pending && done === total) return null;

  const activeKey = pending ?? keys[keys.length - 1]!;
  const base = labelForKey(activeKey);
  const activeLabel = pending
    ? `Đang luận ${base}…`
    : `Đã xong ${done}/${total} phần — đang hoàn tất…`;

  if (activeKey === "part_a" && yearCanChi.trim()) {
    return {
      done,
      total,
      activeLabel: pending
        ? `Đang luận vận trình năm ${yearCanChi.trim()}…`
        : activeLabel,
    };
  }

  return { done, total, activeLabel };
}
