/** Luận inline giả — ngày khác (user chưa từng đăng ký gói), không gọi Gemini. */

const DEFAULT_OTHER_DAY_INLINE_MOCK =
  "Ngày này được chấm riêng theo lá số của bạn. Đặt lịch để đọc luận giải đầy đủ — phân tích bốn yếu tố, giờ tốt và hỏi tiếp theo từng ngày.";

export function dayLuanOtherDayInlineMock(detail?: {
  canChi?: string | null;
  score?: number | null;
}): string {
  const canChi =
    detail?.canChi && detail.canChi !== "—" ? detail.canChi.trim() : null;
  const score =
    detail?.score != null && Number.isFinite(detail.score)
      ? Math.round(detail.score)
      : null;

  if (canChi && score != null) {
    return `Ngày ${canChi} được chấm ${score} điểm theo lá số của bạn. Đặt lịch để đọc luận giải đầy đủ — phân tích bốn yếu tố, giờ tốt và hỏi tiếp riêng cho ngày này.`;
  }
  if (canChi) {
    return `Ngày ${canChi} có luận giải riêng theo lá số của bạn. Đặt lịch để xem đầy đủ — phân tích bốn yếu tố, giờ tốt và hỏi tiếp theo ngày.`;
  }
  return DEFAULT_OTHER_DAY_INLINE_MOCK;
}
