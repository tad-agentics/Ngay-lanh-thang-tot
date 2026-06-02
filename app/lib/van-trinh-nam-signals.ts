import type {
  VanTrinhNamEmphasisSignal,
  VanTrinhNamVerdictSignal,
} from "~/lib/van-trinh-nam-types";

const VERDICT_LABELS: Record<VanTrinhNamVerdictSignal, string> = {
  thuan: "Thuận",
  than_trong: "Cần thận trọng",
  can_nang: "Cần năng",
};

const EMPHASIS_LABELS: Record<VanTrinhNamEmphasisSignal, string> = {
  up: "Nổi bật tích cực",
  down: "Cần chú ý",
  neutral: "Ổn định",
};

const ARCHETYPE_LABELS: Record<string, string> = {
  nang_do: "Tháng đẩy mạnh",
  gieo_hat: "Gieo hạt",
  thu_hoach: "Thu hoạch",
  phong_thu: "Phòng thủ",
  chuyen_dong: "Chuyển động",
};

export function verdictSignalLabel(
  signal: string | undefined,
): string | null {
  if (!signal) return null;
  return VERDICT_LABELS[signal as VanTrinhNamVerdictSignal] ?? null;
}

export function emphasisSignalLabel(
  signal: string | undefined,
): string | null {
  if (!signal) return null;
  return EMPHASIS_LABELS[signal as VanTrinhNamEmphasisSignal] ?? null;
}

export function monthArchetypeLabel(archetype: string | undefined): string | null {
  if (!archetype) return null;
  return ARCHETYPE_LABELS[archetype] ?? null;
}

export function disclaimerCopyVi(key: string): string {
  switch (key) {
    case "luu_nguyet_pillar_solar_simplified":
      return "Lưu nguyệt dùng quy tắc tháng dương lịch đơn giản (phiên bản 1).";
    case "not_medical_or_legal_advice":
      return "Nội dung mang tính tham khảo — không thay tư vấn y tế, pháp lý hay tài chính.";
    default:
      return key;
  }
}
