import type { BaziChapterLoadState } from "~/lib/bazi-chapter-load";

export type BaziLoadProgress = {
  done: number;
  total: number;
  /** Nhãn § đang chờ luận (hoặc tổng quát khi xong hết). */
  activeLabel: string;
};

const CHAPTER_ORDER: (keyof BaziChapterLoadState)[] = [
  "menh_tong_quan",
  "tinh_cach",
  "van_nam",
  "phong_thuy",
  "quy_nhan",
];

const CHAPTER_LABELS: Record<keyof BaziChapterLoadState, string> = {
  menh_tong_quan: "mệnh tổng quan",
  tinh_cach: "tính cách · cá tính",
  van_nam: "vận năm",
  phong_thuy: "phong thủy năm",
  quy_nhan: "quý nhân · lưu ý",
};

function chapterApplies(
  key: keyof BaziChapterLoadState,
  load: BaziChapterLoadState,
): boolean {
  return load[key] !== "idle";
}

/** Tiến độ staged load — chỉ khi còn § đang `loading`. */
export function deriveBaziLoadProgress(
  chapterLoad: BaziChapterLoadState,
  yearCanChi: string,
): BaziLoadProgress | null {
  const applicable = CHAPTER_ORDER.filter((k) => chapterApplies(k, chapterLoad));
  if (applicable.length === 0) return null;

  const done = applicable.filter((k) => chapterLoad[k] === "done").length;
  const total = applicable.length;
  const pending = applicable.find((k) => chapterLoad[k] === "loading");

  if (!pending && done === total) return null;

  const vanLabel = yearCanChi.trim()
    ? `vận năm ${yearCanChi.trim()}`
    : CHAPTER_LABELS.van_nam;
  const activeKey = pending ?? applicable[applicable.length - 1]!;
  const activeLabel =
    activeKey === "van_nam" ? vanLabel : CHAPTER_LABELS[activeKey];

  return {
    done,
    total,
    activeLabel: pending
      ? `Đang luận ${activeLabel}…`
      : `Đã xong ${done}/${total} phần — đang hoàn tất…`,
  };
}
