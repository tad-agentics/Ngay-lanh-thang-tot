/** §03 Vận năm — luận dài từng lĩnh vực (life_areas). */

export const LUU_NIEN_DEFAULT_LIFE_AREA_IDS = [
  "tai_loc",
  "su_nghiep",
  "tinh_duyen",
  "suc_khoe",
] as const;

export type LuuNienLifeAreasPromptOpts = {
  areaIds: readonly string[];
  includeIntro: boolean;
};

const LUU_NIEN_LIFE_AREA_PROSE_RULES = `- Giữ "id" và "label" khớp data.life_areas (hoặc lifeAreas).
- Mỗi "text": **~500 ký tự** (tối thiểu 450, mục tiêu 500–600), chia **đúng 3 đoạn** ngăn bằng \\n\\n (mỗi đoạn **3–5 câu**).
- Nêu **thuận lợi** và **khó khăn** trong lĩnh vực đó trong năm đang luận; gợi ý nhịp/tháng cẩn trọng nếu month_scores có trong data.
- Bám verdict/outlook từ data nhưng mở rộng — không lặp một câu ngắn từ API.
- Giọng ấm, cụ thể, xưng "bạn"; không phán tuyệt đối.`;

export function luuNienLifeAreasSystem(
  opts: LuuNienLifeAreasPromptOpts,
): string {
  const areaIds = [...opts.areaIds];
  const count = areaIds.length;
  const idList = areaIds.join(", ");
  const introBlock = opts.includeIntro
    ? `- Bắt buộc "luu_nien_year_intro": **4–6 câu** tổng quan cả năm (can chi, đánh giá năm, thuận + khó chính — không đi sâu từng lĩnh vực).\n`
    : `- **KHÔNG** có khóa "luu_nien_year_intro" — chỉ life_area_readings.\n`;

  return `Bạn là chuyên gia tử vi và lịch số Việt Nam, viết **luận vận năm** (lưu niên) cho ứng dụng.

## ĐỊNH DẠNG
- Đầu vào: JSON "endpoint":"luu-nien" và "data" (year_can_chi, life_areas[], …).
- Đầu ra: CHỈ một object JSON hợp lệ, không bọc \`\`\`, không lời dẫn ngoài JSON.

## PHẠM VI LÔ NÀY (bắt buộc)
- CHỈ sinh life_area_readings cho **đúng ${count}** mục, id: ${idList}.
- **Không** thêm mục ngoài danh sách.
${introBlock}- "life_area_readings": mảng { "id", "label", "text" } — **đúng ${count}** phần tử.

## life_area_readings
${LUU_NIEN_LIFE_AREA_PROSE_RULES}

## ĐIỀU CẤM
- KHÔNG markdown, KHÔNG gạch đầu dòng. KHÔNG lời chào.`;
}

export function luuNienLifeAreasRetrySystem(
  opts: LuuNienLifeAreasPromptOpts,
): string {
  const areaIds = [...opts.areaIds];
  const count = areaIds.length;
  const idList = areaIds.join(", ");
  const introKeys = opts.includeIntro
    ? '{"luu_nien_year_intro":"...","life_area_readings":[{"id","label","text"},...]}'
    : '{"life_area_readings":[{"id","label","text"},...]}';

  return `Cùng JSON luu-nien. Trả CHỈ ${introKeys}.
Đúng **${count}** mục life_area_readings, id: ${idList} — không thêm, không bớt.
Mỗi text ~500 ký tự (tối thiểu 450), đúng 3 đoạn (\\n\\n), 3–5 câu/đoạn.`;
}

export const LUU_NIEN_LIFE_AREAS_SYSTEM = luuNienLifeAreasSystem({
  areaIds: [...LUU_NIEN_DEFAULT_LIFE_AREA_IDS],
  includeIntro: true,
});

export const LUU_NIEN_LIFE_AREAS_RETRY_SYSTEM = luuNienLifeAreasRetrySystem({
  areaIds: [...LUU_NIEN_DEFAULT_LIFE_AREA_IDS],
  includeIntro: true,
});
