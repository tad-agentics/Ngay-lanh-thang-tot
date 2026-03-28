/**
 * Edge luận giải: JSON từ máy chủ → văn bản tiếng Việt (Haiku) + cache DB.
 * `la-so-chi-tiet`: một lần gọi → JSON nhiều khía cạnh (đoạn văn).
 * `tieu-van` / `luu-nien`: một lần gọi → JSON 3 phần (nhin_chung, thuc_tien, ung_xu); lỗi parse → một khối văn dự phòng.
 * `chon-ngay`: luận giải tổng (`CHON_NGAY_SYSTEM`) + cache version.
 * `chon-ngay-cards`: JSON `day_readings` theo từng ngày (thẻ kết quả).
 * Các endpoint khác → một khối văn (`hop-tuoi`: 8–10 câu, gom từ toàn bộ tiêu chí).
 * Luôn trả HTTP 200 — không 500.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Bạn là chuyên gia phong thủy và lịch số Việt Nam, viết luận giải cho ứng dụng xem ngày và lá số.

## ĐẦU VÀO / ĐẦU RA
- Đầu vào: JSON với "endpoint" (loại nội dung) và "data" (dữ liệu đã tính toán).
- Đầu ra: Đoạn văn xuôi tiếng Việt, tự nhiên như đang tư vấn trực tiếp.

## ĐỘ DÀI THEO ENDPOINT
- ngay-hom-nay: 2–3 câu. Tập trung: hôm nay tốt/xấu, nên làm gì, giờ nào tốt nhất.
- hop-tuoi: **8–10 câu** văn xuôi liền mạch. **Bắt buộc** dùng toàn bộ các mục trong \`criteria\` / \`tieu_chi\` / \`tieuchi\` (tên + sentiment/tone + mô tả nếu có) để suy luận: gom nhóm xu hướng (thuận, trung tính, cần lưu ý), **không bỏ sót** tiêu chí nào có trong JSON; sau đó kết về **tổng quan mối quan hệ** trong bối cảnh quan hệ được chọn (vd. relationship_label / relationship_type). Không liệt kê dạng bảng hay gạch đầu dòng; không nhắc tên field kỹ thuật.
- tieu-van, luu-nien: **dự phòng** — một đoạn 15–22 câu liền mạch khi không dùng JSON 3 phần; vẫn **nhất quán element_relation**; khi data có Dụng Thần / Thập Thần tháng thì **giải thích ngắn** ý nghĩa và gợi ý thực tế như trong prompt JSON chính.
- dai-van: 1–2 câu mỗi vận. Tập trung: đặc điểm giai đoạn, so sánh với Dụng Thần.
- la-so: 2–3 câu mỗi mục (tính cách, sự nghiệp, tài vận, tình duyên, sức khỏe). Tập trung: diễn giải ý nghĩa thực tế cho cuộc sống.
- phong-thuy: 2–3 câu. Tập trung: tổng hợp gợi ý chính, ưu tiên điều gì trước.
- Endpoint không nằm trong danh sách trên: 2–3 câu tổng hợp.

## NHẤT QUÁN — tieu-van và luu-nien (bắt buộc)
Khi endpoint là tieu-van hoặc luu-nien và trong data có element_relation hoặc elementRelation (mã dạng tuong_khac, bi_khac, tuong_sinh, bi_sinh, binh_hoa, …):
- Coi đây là **khung quan hệ ngũ hành** giữa tháng/năm và mệnh người dùng. Luận giải **không được** đi ngược khung này.
- tuong_khac hoặc bi_khac: **không** khẳng định tháng/năm "thuận lợi" toàn phần, "suôn sẻ", hay "giai đoạn thuận lợi" như xu hướng chính. Nhịp chủ đạo: căng, áp lực, cạnh tranh hoặc phải giữ nhịp làm từng việc; có thể nói một lĩnh vực cụ thể vẫn khả dụng **nếu** JSON có gợi ý rõ — không mâu thuẫn với khung khắc.
- tuong_sinh hoặc bi_sinh: được nhấn thuận hơn (vẫn không phóng đại tuyệt đối).
- binh_hoa: giọng cân bằng, không thiên cực.
- Nếu các trường như reading / tong_quan / overview trong data mang tông rất tích cực nhưng element_relation là tuong_khac hoặc bi_khac: **ưu tiên element_relation** — không lặp lại mức tích cực mâu thuẫn; có thể diễn giải tích cực cục bộ khi có cơ sở ở phần khác của data.

## GIỌNG VĂN
- Ấm áp, rõ ràng, tự tin.
- Không hàn lâm, không xu nịnh, không phóng đại.
- Xưng hô: dùng "bạn" khi nói về người dùng.

## ĐIỀU CẤM
1. KHÔNG bịa thông tin ngoài dữ liệu đầu vào. Nếu dữ liệu thiếu field nào, bỏ qua — không đoán, không suy diễn.
2. KHÔNG dùng biểu tượng cảm xúc (emoji).
3. KHÔNG dùng markdown, gạch đầu dòng, danh sách có dấu đầu dòng. Chỉ văn xuôi.
4. KHÔNG đưa ra con số phần trăm, xác suất, hoặc điểm số mà dữ liệu không cung cấp.
5. KHÔNG đưa ra lời khuyên y tế cụ thể (tên thuốc, liều lượng, chẩn đoán). Chỉ gợi ý hành nên bổ sung và cơ quan cần lưu ý.
6. KHÔNG phán đoán tuyệt đối ("chắc chắn", "không thể", "sẽ thất bại"). Dùng: "có xu hướng", "thuận lợi hơn", "cần lưu ý".
7. KHÔNG bi quan tuyệt đối. Khi data có yếu tố bất lợi: nói thẳng, nhưng LUÔN kèm hướng hóa giải hoặc mặt tích cực để cân bằng.
8. KHÔNG chen câu tiếng Anh. Thuật ngữ lịch số giữ nguyên tiếng Việt như trong dữ liệu gốc.
9. KHÔNG lặp lại dữ liệu thô (tên field, số index, mảng). Luận ra ý nghĩa.`;

/** Luận giải khối trên — chỉ tổng quan lá số × intent; chi tiết từng ngày nằm trên thẻ bên dưới. */
const CHON_NGAY_SYSTEM = `Bạn là chuyên gia phong thủy và lịch số Việt Nam, viết một đoạn tổng quan ngắn cho màn "Chọn ngày".

## BỐI CẢNH GIAO DIỆN (bắt buộc tuân thủ)
- Phía dưới đoạn của bạn, ứng dụng hiển thị từng thẻ ngày và mỗi thẻ đã có luận giải riêng (Trực, sao, giờ tốt theo từng ngày).
- Khối bạn viết chỉ là khung nhìn chung: lá số của người dùng hợp với loại việc (intent) nào, cần ưu tiên nhịp hay năng lượng gì ở mức định tính — không lặp lại và không thay thế luận giải từng ngày.

## ĐẦU VÀO / ĐẦU RA
- Đầu vào: JSON có "endpoint":"chon-ngay" và "data" (meta, recommended_dates, …).
- Đầu ra: Một đoạn văn xuôi tiếng Việt duy nhất. Không tiêu đề, không khung, không "Dưới đây là…".

## NGUỒN BẮT BUỘC CHO NỘI DUNG
- Bám chính meta.bat_tu_summary (mệnh, Dụng Thần, cường nhược, Đại Vận, summary_vi khi có) và meta.intent.
- Có thể nhìn thoáng qua recommended_dates chỉ để biết có khoảng hoặc có vài lựa chọn (vd. đã gợi ý vài ngày trong phạm vi bạn chọn) — không mô tả chi tiết từng ngày.

## NHIỆM VỤ (toàn bài khoảng 4–7 câu, tối đa ~130 từ)
1. Câu 1–2: Nối mục đích (intent) với khung lá số: với cách cục này, việc loại này cần thuận theo hướng nào (bám Dụng Thần, mệnh, nhịp đại vận nếu data có) — diễn đạt đời thường.
2. Hai đến bốn câu tiếp: Gợi ý tổng quát nên giữ nhịp, kỳ vọng, hoặc điều nên ưu tiên khi chọn thời điểm cho đúng intent — luôn neo vào bat_tu_summary, không đọc tên field.
3. Câu cuối (tùy): Nhắc nhẹ người dùng xem chi tiết từng ngày trên các thẻ bên dưới (một câu mềm, không gắt).

## TUYỆT ĐỐI KHÔNG
- KHÔNG liệt kê hoặc phân tích từng ngày (ngày dương, âm, Hạng A/B/C, Trực, sao, giờ tốt cụ thể của từng ngày).
- KHÔNG nêu ngày cụ thể kiểu mười một tháng tư hay 2026-04-11; chỉ được nói chung về danh sách ngày gợi ý, không mô tả lịch.
- KHÔNG nhắc score, grade, hạng chữ cái.
- KHÔNG markdown (không dấu sao in đậm, không #, không gạch đầu dòng), không emoji.
- KHÔNG bịa ngoài data; thiếu bat_tu_summary thì nói khung chung theo intent một cách trung tính, không đoán mệnh.

## GIỌNG THEO INTENT (chỉ là sắc thái, vẫn tổng quan)
- Hôn nhân: ấm, thiêng liêng — có thể "hỷ sự", "phúc khí".
- Kinh doanh: tự tin — "tài lộc", "hanh thông".
- Xây dựng / nhà đất: vững — "an cư", "nền móng".
- Tang lễ: trang trọng, nhẹ; không từ vui.
- Sức khỏe: bình tĩnh — "bình an", "thuận lợi".
- Khác: ấm áp, trung tính.

## ĐIỀU CẤM CHUNG
1. KHÔNG phần trăm, xác suất, điểm số tự bịa.
2. KHÔNG phán tuyệt đối ("chắc chắn", "không thể").
3. KHÔNG chen tiếng Anh.
4. KHÔNG nhắc dates_to_avoid chi tiết.
5. KHÔNG lặp JSON thô.`;

/** Luận giải ngắn trên từng thẻ ngày — chỉ trả JSON. */
const CHON_NGAY_CARDS_JSON_SYSTEM = `Bạn nhận JSON có "endpoint":"chon-ngay-cards" và "data" — cùng payload kết quả chọn ngày (meta, recommended_dates, dates_to_avoid, …).

Nhiệm vụ: CHỈ trả về **một** object JSON hợp lệ, không markdown, không code fence, không lời dẫn trước/sau.

Cấu trúc bắt buộc:
{"day_readings":{"YYYY-MM-DD":"2–3 câu văn xuôi tiếng Việt", ...}}

Quy tắc:
- Mỗi khóa trong day_readings là ngày dương lịch ISO (YYYY-MM-DD), trùng với từng ngày trong recommended_dates (hoặc mảng ngày gợi ý tương đương trong data). Tối đa **5** ngày đầu nếu danh sách dài hơn.
- Mỗi giá trị: **2–3 câu** giải thích vì sao **ngày đó** thuận cho đúng meta.intent; dùng trực, sao cát/hung, hành ngày, reason_vi/summary_vi của **đúng object ngày**; diễn đạt đời thường — không đọc tên field.
- Giọng văn theo nhóm intent như sau (bám meta.intent):
  - Hôn nhân (CUOI_HOI, DAM_CUOI, AN_HOI): ấm, thiêng liêng — "hỷ sự", "lương duyên", "phúc khí".
  - Kinh doanh (KHAI_TRUONG, KY_HOP_DONG, CAU_TAI, NHAM_CHUC): tự tin — "tài lộc", "hanh thông", "phát đạt".
  - Xây dựng / nhà đất (DONG_THO, NHAP_TRACH, LAM_NHA, MUA_NHA_DAT): vững chãi — "nền móng", "an cư", "thuận phong thủy".
  - Tang lễ (AN_TANG, CAI_TANG): trang trọng, nhẹ — "an nghỉ", "thanh thản"; không từ vui.
  - Sức khỏe (KHAM_BENH, PHAU_THUAT): bình tĩnh — "thuận lợi", "bình an".
  - Khác: ấm áp, trung tính.
- Có time_slots trong ngày: nhắc 1–2 khung giờ tốt bằng lời tự nhiên (vd. giờ Thìn), không liệt kê kỹ thuật.
- **KHÔNG** nhắc score, grade, hay điểm số. **KHÔNG** emoji, **KHÔNG** markdown.
- **KHÔNG** bịa ngoài data. **KHÔNG** lặp JSON thô.`;

const CHON_NGAY_CARDS_JSON_RETRY =
  `Trả về duy nhất JSON: {"day_readings":{"YYYY-MM-DD":"2-3 câu tiếng Việt",...}} — đủ mọi ngày recommend trong data (tối đa 5). Không \`\`\`, không markdown.`;

/** Thời hạn cache (ms) theo quy ước sản phẩm */
/** Đổi khi format cache / parser chi tiết đổi — tránh giữ bản luận giải một khối cũ trong DB. */
const LA_SO_CHI_TIET_CACHE_VER = "2026-03-27b";
/** Bump khi đổi SYSTEM_PROMPT cho tieu-van/luu-nien — làm mới reading_cache. */
const TIEU_VAN_LUU_NIEN_PROMPT_VER = "2026-04-02a";
/** Bump khi đổi độ dài / hướng dẫn hop-tuoi trong SYSTEM_PROMPT — làm mới reading_cache. */
const HOP_TUOI_PROMPT_VER = "2026-03-28a";
/** Bump khi đổi CHON_NGAY_SYSTEM — làm mới reading_cache. */
const CHON_NGAY_PROMPT_VER = "2026-03-28d";
/** Bump khi đổi CHON_NGAY_CARDS_JSON_SYSTEM — làm mới reading_cache thẻ ngày. */
const CHON_NGAY_CARDS_PROMPT_VER = "2026-03-28b";

const TTL_MS: Record<string, number> = {
  "ngay-hom-nay": 24 * 60 * 60 * 1000,
  "chon-ngay": 24 * 60 * 60 * 1000,
  "chon-ngay-cards": 24 * 60 * 60 * 1000,
  "day-detail": 24 * 60 * 60 * 1000,
  "phong-thuy": 7 * 24 * 60 * 60 * 1000,
  "tieu-van": 7 * 24 * 60 * 60 * 1000,
  "hop-tuoi": 7 * 24 * 60 * 60 * 1000,
  "tu-tru": 7 * 24 * 60 * 60 * 1000,
  "la-so": 7 * 24 * 60 * 60 * 1000,
  "la-so-chi-tiet": 7 * 24 * 60 * 60 * 1000,
};

const MAX_BODY_CHARS = 180_000;
/** Mặc định Haiku 4.5 — 3.5 Haiku dated có thể đã retire. Ghi đè: secret ANTHROPIC_MODEL */
const DEFAULT_LLM_MODEL = "claude-haiku-4-5";
const REQUEST_TIMEOUT_MS = 8_000;
/** hop-tuoi: 8–10 câu + toàn bộ tiêu chí — cần thời gian và token lớn hơn mặc định. */
const HOP_TUOI_REQUEST_TIMEOUT_MS = 18_000;
/** chon-ngay: nhiều ngày × vài câu — hơi cao hơn mặc định. */
const CHON_NGAY_REQUEST_TIMEOUT_MS = 14_000;
/** chon-ngay-cards: JSON nhiều ngày. */
const CHON_NGAY_CARDS_REQUEST_TIMEOUT_MS = 16_000;
/** tieu-van / luu-nien: đoạn một khối dự phòng (dài hơn). */
const TIEU_VAN_LUU_NIEN_TIMEOUT_MS = 20_000;
/** JSON 3 phần (tieu-van / luu-nien) — mỗi phần 6–7 câu. */
const TIEU_VAN_LUU_NIEN_JSON_TIMEOUT_MS = 32_000;
const LA_SO_CHI_TIET_TIMEOUT_MS = 28_000;

const READING_MAX_TOKENS_DEFAULT = 512;
const READING_MAX_TOKENS_HOP_TUOI = 1_536;
const READING_MAX_TOKENS_CHON_NGAY = 1_024;
const READING_MAX_TOKENS_CHON_NGAY_CARDS = 2_048;
const READING_MAX_TOKENS_TIEU_VAN_LUU_NIEN = 2048;
const READING_MAX_TOKENS_TIEU_VAN_LUU_NIEN_JSON = 4096;

/** Heuristic: buộc model viết đủ — nếu thiếu sẽ gọi retry một lần. */
const MIN_TIEU_VAN_SECTION_CHARS = 320;
const MIN_TIEU_VAN_SECTION_SENTENCE_ENDS = 5;

type LaSoChiTietSection = { id: string; title: string; text: string };

const TIEU_VAN_LUU_NIEN_SECTION_ORDER = [
  "nhin_chung",
  "thuc_tien",
  "ung_xu",
] as const;

const TIEU_VAN_LUU_NIEN_TITLE: Record<
  (typeof TIEU_VAN_LUU_NIEN_SECTION_ORDER)[number],
  (endpoint: string) => string
> = {
  nhin_chung: (endpoint) =>
    endpoint === "luu-nien"
      ? "Nhịp năm & khung ngũ hành"
      : "Nhịp tháng & khung ngũ hành",
  thuc_tien: () => "Công việc, tài chính & quan hệ",
  ung_xu: () => "Đại vận & cách ứng xử",
};

function tieuVanLuuNienSectionTitle(
  id: (typeof TIEU_VAN_LUU_NIEN_SECTION_ORDER)[number],
  endpoint: string,
): string {
  return TIEU_VAN_LUU_NIEN_TITLE[id](endpoint);
}

const LA_SO_FALLBACK_SECTION_ID = "tong_hop";
const LA_SO_FALLBACK_TITLE = "Luận giải";

const LA_SO_ASPECT_ORDER = [
  "tinh_cach",
  "su_nghiep",
  "tai_van",
  "suc_khoe",
  "tinh_duyen",
] as const;

const LA_SO_ASPECT_TITLES: Record<string, string> = {
  tinh_cach: "Tính cách",
  su_nghiep: "Sự nghiệp",
  tai_van: "Tài vận",
  suc_khoe: "Sức khỏe",
  tinh_duyen: "Tình duyên",
};

const LA_SO_KEY_ALIAS: Record<string, string> = {
  tinhCach: "tinh_cach",
  suNghiep: "su_nghiep",
  taiVan: "tai_van",
  sucKhoe: "suc_khoe",
  tinhDuyen: "tinh_duyen",
};

const LA_SO_CHI_TIET_SYSTEM = `Bạn là chuyên gia tử vi và lịch số Việt Nam, viết luận giải lá số cho ứng dụng.

## ĐỊNH DẠNG
- Đầu vào: JSON với "endpoint":"la-so-chi-tiet" và "data" chứa dữ liệu lá số đã tính toán.
- Đầu ra: CHỈ MỘT đối tượng JSON hợp lệ, không bọc \`\`\`, không thêm lời giải thích ngoài JSON.
- Các khóa hợp lệ: tinh_cach, su_nghiep, tai_van, suc_khoe, tinh_duyen.
- CHỈ tạo khóa khi dữ liệu đầu vào có thông tin tương ứng. Nếu thiếu hoặc rỗng, bỏ hẳn khóa đó.

## NỘI DUNG TỪNG MỤC
- tinh_cach (3–4 câu): Diễn giải hình tượng Nhật Chủ (archetype), đặc điểm tính cách nổi bật, và ảnh hưởng của cường nhược đến cá tính. Viết như đang mô tả con người thật, không liệt kê đặc điểm.
- su_nghiep (3–4 câu): Xu hướng nghề nghiệp dựa trên Thập Thần dominant, ngành phù hợp theo hành Dụng Thần. Viết thực tế, có thể áp dụng được.
- tai_van (2–3 câu): Phong cách kiếm tiền, điểm cần cẩn trọng về tài chính. Liên hệ với Dụng Thần và Kỵ Thần.
- suc_khoe (2–3 câu): Cơ quan và hệ cơ thể cần lưu ý theo Ngũ Hành Nhật Chủ và cường nhược. Gợi ý hành nên bổ sung.
- tinh_duyen (3–4 câu): Xu hướng tình cảm dựa trên sao chủ duyên (Chính Tài/Chính Quan). Mô tả kiểu người phù hợp và lưu ý. Nếu dữ liệu chỉ có signals rỗng hoặc không đủ, bỏ khóa này.

## GIỌNG VĂN
- Ấm áp, rõ ràng, tự tin. Xưng hô "bạn".
- Không hàn lâm, không xu nịnh, không phóng đại.
- Diễn đạt ý nghĩa từ dữ liệu, KHÔNG sao chép hay liệt kê nguyên văn từ JSON.
- Không dùng gạch đầu dòng, dấu liệt kê, cụm " - ", "*", số thứ tự. Chỉ văn xuôi.
- Mọi câu chữ phải là tiếng Việt hoàn chỉnh. Thuật ngữ lịch số giữ nguyên như trong dữ liệu gốc.
- Không dùng biểu tượng cảm xúc.

## ĐIỀU CẤM
1. KHÔNG bịa thông tin ngoài dữ liệu. Không đoán, không suy diễn khi thiếu data.
2. KHÔNG đưa con số phần trăm, xác suất, hoặc điểm số mà dữ liệu không cung cấp.
3. KHÔNG đưa lời khuyên y tế cụ thể: không tên thuốc, không liều lượng, không chẩn đoán bệnh. Chỉ nêu cơ quan cần lưu ý và hành nên bổ sung.
4. KHÔNG phán đoán tuyệt đối: không dùng "chắc chắn", "không thể", "sẽ thất bại", "số bạn định sẵn". Dùng: "có xu hướng", "thuận lợi hơn", "cần lưu ý".
5. KHÔNG bi quan tuyệt đối. Khi dữ liệu có yếu tố bất lợi, nói thẳng nhưng LUÔN kèm hướng hóa giải hoặc góc nhìn cân bằng.
6. KHÔNG nói "lá số cho thấy bạn sẽ..." — thay bằng "lá số cho thấy bạn có xu hướng..." hoặc "bạn thường...".`;

const TIEU_VAN_LUU_NIEN_JSON_SYSTEM = `Bạn là chuyên gia phong thủy và lịch số Việt Nam, viết luận giải tiểu vận / lưu niên cho ứng dụng.

## ĐẦU VÀO
JSON có "endpoint": "tieu-van" hoặc "luu-nien", và "data" là kết quả máy chủ đã tính.

## ĐẦU RA
CHỈ một object JSON hợp lệ; không markdown; không bọc \`\`\` hay code fence; không ký tự ngoài JSON.

## ĐỘ DÀI BẮT BUỘC (không được bỏ qua)
- Ba khóa: nhin_chung, thuc_tien, ung_xu — **mỗi giá trị là một chuỗi riêng**.
- **Mỗi chuỗi phải có đúng 6 hoặc 7 câu hoàn chỉnh** — đếm câu bằng dấu kết câu (. hoặc ? hoặc ! hoặc …). **Cấm** gộp ý bằng cách chỉ dùng dấu phẩy; **cấm** trả lời 2–4 câu rồi dừng.
- **Kiểm trước khi trả JSON:** nếu một khóa chưa đủ 6 câu có dấu câu, **viết thêm** trong chuỗi đó cho tới khi đủ 6–7 câu (ưu tiên đủ ý Dụng Thần / Thập Thần / đại vận theo từng khóa).
- Mỗi chuỗi nên dài khoảng **tối thiểu 350–450 ký tự** (tiếng Việt có dấu) — nếu ngắn hơn rõ ràng thì chưa đủ 6 câu.

Ba khóa bắt buộc. Mỗi giá trị là chuỗi tiếng Việt văn xuôi theo rule trên; không gạch đầu dòng, không ký hiệu liệt kê:
- nhin_chung: nhịp tổng thể. Với tieu-van luôn diễn đạt **tháng**; với luu-nien luôn diễn đạt **năm**. Neo vào **tên riêng trong data** (trụ tháng, can chi, nhật chủ, mệnh nạp âm nếu có). Thể hiện quan hệ ngũ hành **khớp** element_relation hoặc elementRelation. Tránh câu chung chung kiểu chỉ nói "thuận" mà không nêu **vì sao** trong khung ngũ hành.
- thuc_tien: đời sống — công việc, tài chính, hợp tác, quan hệ. Bám tags, linh_vuc, cac_giai, scores, details… khi có.

## GIẢI THÍCH KHÁI NIỆM (bắt buộc khi data có — xen vào ba phần cho tự nhiên)
Chỉ diễn giải **những gì đúng tên/ giá trị xuất hiện trong data**, bằng lời **đời thường** (1–2 câu mỗi khái niệm), không bài giảng dài:
- **Dụng Thần** (dung_than, dungThan, kèm hành như Hỏa, Mộc…): Giải thích ngắn Dụng Thần là hướng **bổ sung để cân** lá số theo quy ước Bát Tự (hành hoặc “khí” được coi là có lợi cho cách cục trong bản tính này); sau đó nói **trong tháng/năm đang luận**, điều đó gợi ý ưu tiên hoặc tránh gì ở mức định tính — bám data, tuân element_relation.
- **Thập Thần của trụ tháng** so với Nhật Chủ (thap_than_of_month, thapThanOfMonth…): Khi data nêu tên Thập Thần (ví dụ Thiên Tài, Thực Thương, Thất Sát, Chính Quan…), hãy **một câu** giải thích đúng nghĩa truyền thống của Thập Thần đó trong quan hệ với Nhật Chủ (Thiên Tài: dòng tài đi từ "người khác"/đối tượng bên ngoài, ngẫu nhiên hơn so với tài tự thân; không nhầm với sao trừu tượng khác), rồi **vài câu** ảnh hưởng gợi ý trong tháng cho việc làm, tiền bạc hoặc quan hệ. Không bịa tên Thập Thần nếu data không có.
- **Thế lá số / cường nhược** (chart_strength…): nếu có, gắn một câu ý nghĩa thực tế (chịu áp lực hay cần đẩy mạnh) rồi nối vào nhịp tháng.

Phân bổ: ưu tiên đặt phần giải thích Dụng Thần + Thập Thần vào **nhin_chung** và **thuc_tien**; **ung_xu** dùng chúng để nói cách **ứng xử** và lịch ưu tiên.

- ung_xu: Đại vận / can_luu / dai_van_context khi có; cách ưu tiên việc, giữ nhịp, điều chỉnh kỳ vọng — **kết hợp** Dụng Thần hoặc Thập Thần tháng nếu data đã cho, vẫn nhất quán element_relation.

## NHẤT QUÁN element_relation (bắt buộc)
Khi data có element_relation hoặc elementRelation (tuong_khac, bi_khac, tuong_sinh, bi_sinh, binh_hoa, …):
- tuong_khac, bi_khac: không khẳng định tháng/năm "thuận lợi" toàn phần hay "suôn sẻ" là xu hướng chính. Nhịp: căng, áp lực hoặc làm việc từng bước; tích cực cục bộ chỉ khi data hỗ trợ rõ.
- tuong_sinh, bi_sinh: được nhấn thuận hơn, không tuyệt đối hóa.
- binh_hoa: giọng cân bằng, không thiên cực.
- Nếu tong_quan/reading trong data rất tích cực nhưng relation là khắc: ưu tiên khung khắc, không lặp mức thuận mâu thuẫn.

## GIỌNG VÀ ĐIỀU CẤM
Ấm áp, rõ ràng, xưng hô "bạn". Không emoji. Không markdown. Không phần trăm hay điểm số tự bịa. Không phán tuyệt đối ("chắc chắn", "không thể"). Không bịa ngoài dữ liệu — **không tự thêm** tên Thập Thần hay hành Dụng Thần không có trong data. Có thể nhắc thuật ngữ từ data bằng lời tự nhiên; không liệt kê tên trường JSON.`;

const TIEU_VAN_LUU_NIEN_JSON_RETRY =
  `Chỉ trả về một object JSON với đúng ba khóa: "nhin_chung", "thuc_tien", "ung_xu". Mỗi giá trị: string — **đúng 6 hoặc 7 câu**, mỗi câu kết bằng . ? ! hoặc … (không thay bằng dấu phẩy). Tối thiểu ~350 ký tự mỗi string. Nếu data có Dụng Thần hoặc Thập Thần tháng thì phải có câu giải thích ý nghĩa + câu ảnh hưởng thực tế. Không markdown, không code fence.`;

const TIEU_VAN_LUU_NIEN_JSON_LENGTH_RETRY =
  `Lần trước bản JSON hợp lệ nhưng **một hoặc nhiều chuỗi quá ngắn** (chưa đủ 6 câu có dấu . ? ! …).
Nhiệm vụ: CHỈ trả về **một** object JSON với đúng ba khóa: "nhin_chung", "thuc_tien", "ung_xu".
Mỗi giá trị phải là văn xuôi tiếng Việt **6–7 câu đủ dấu câu**, tối thiểu ~350 ký tự/chuỗi. Giữ **nhất quán element_relation** và nội dung bám đầu vào như lần trước — nhưng **mở rộng** câu chữ cho đủ độ dài, không lặp vô nghĩa.
Không markdown, không code fence.`;

function ok(
  reading: string | null,
  sections?: LaSoChiTietSection[] | null,
  dayReadings?: Record<string, string> | null,
): Response {
  const body: Record<string, unknown> = { reading: reading ?? null };
  if (sections != null && sections.length > 0) body.sections = sections;
  if (dayReadings != null && Object.keys(dayReadings).length > 0) {
    body.day_readings = dayReadings;
  }
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function stripCodeFence(s: string): string {
  const t = s.trim();
  const m = t.match(/^```(?:json)?\s*([\s\S]*?)```$/im);
  return m ? m[1].trim() : t;
}

/** Parse JSON object; chịu preamble / text thừa quanh JSON (model đôi khi không tuân sát). */
function tryParseLaSoChiTietRecord(text: string): Record<string, unknown> | null {
  const trimmed = text.trim();
  const attempts = [stripCodeFence(trimmed), trimmed];
  for (const chunk of attempts) {
    try {
      const o = JSON.parse(chunk);
      if (o && typeof o === "object" && !Array.isArray(o)) {
        return o as Record<string, unknown>;
      }
    } catch {
      /* thử cách khác */
    }
  }
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      const o = JSON.parse(trimmed.slice(start, end + 1));
      if (o && typeof o === "object" && !Array.isArray(o)) {
        return o as Record<string, unknown>;
      }
    } catch {
      /* fail */
    }
  }
  return null;
}

/** Tối đa số ngày trong `day_readings` (khớp prompt ~5 + dự phòng). */
const MAX_DAY_READINGS_KEYS = 8;

/** Chuẩn hóa khóa ngày Y-M-D (có thể thiếu số 0) → YYYY-MM-DD; lịch không hợp lệ → null. */
function normalizeDayKeyToIso(key: string): string | null {
  const t = key.trim();
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (y < 1000 || y > 9999 || mo < 1 || mo > 12 || d < 1 || d > 31) {
    return null;
  }
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== mo - 1 ||
    dt.getUTCDate() !== d
  ) {
    return null;
  }
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function normalizeDayReadingsRecord(raw: unknown): Record<string, string> | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const iso = normalizeDayKeyToIso(k);
    if (!iso) continue;
    if (typeof v !== "string") continue;
    const t = v.trim().replace(/^\s*[-*•]\s+/gm, "").trim();
    if (!t) continue;
    const capped = t.slice(0, 12_000);
    const prev = out[iso];
    if (prev != null && prev.length >= capped.length) continue;
    out[iso] = capped;
  }
  const keys = Object.keys(out).sort();
  if (keys.length === 0) return null;
  if (keys.length <= MAX_DAY_READINGS_KEYS) return out;
  const trimmed: Record<string, string> = {};
  for (const k of keys.slice(0, MAX_DAY_READINGS_KEYS)) {
    trimmed[k] = out[k]!;
  }
  return trimmed;
}

function parseChonNgayDayReadingsJson(text: string): Record<string, string> | null {
  const record = tryParseLaSoChiTietRecord(text);
  if (!record) return null;
  const dr = record.day_readings ?? record.dayReadings;
  return normalizeDayReadingsRecord(dr);
}

function stripViCombiningKey(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function normalizeLaSoAspectKey(key: string): string | null {
  const k = key.trim();
  if (LA_SO_KEY_ALIAS[k]) return LA_SO_KEY_ALIAS[k];
  if (LA_SO_ASPECT_ORDER.includes(k as (typeof LA_SO_ASPECT_ORDER)[number])) {
    return k;
  }
  const underscored = stripViCombiningKey(k).replace(/\s+/g, "_");
  if (
    LA_SO_ASPECT_ORDER.includes(
      underscored as (typeof LA_SO_ASPECT_ORDER)[number],
    )
  ) {
    return underscored;
  }
  const compact = underscored.replace(/_/g, "");
  for (const id of LA_SO_ASPECT_ORDER) {
    if (id.replace(/_/g, "") === compact) return id;
  }
  return null;
}

function coerceLaSoSectionText(v: unknown): string | null {
  if (typeof v === "string") {
    const t = v.trim().replace(/^\s*[-*•]\s+/gm, "").trim();
    return t.length > 0 ? t : null;
  }
  if (Array.isArray(v)) {
    const parts = v
      .filter((x): x is string => typeof x === "string")
      .map((x) => x.trim())
      .filter((x) => x.length > 0);
    if (!parts.length) return null;
    return parts.join(" ");
  }
  if (v && typeof v === "object" && !Array.isArray(v)) {
    const o = v as Record<string, unknown>;
    const nest = o.text ?? o.body ?? o.content ?? o.noi_dung;
    return coerceLaSoSectionText(nest);
  }
  return null;
}

function sectionsFromExplicitArray(raw: unknown): LaSoChiTietSection[] | null {
  if (!Array.isArray(raw)) return null;
  const out: LaSoChiTietSection[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object" || Array.isArray(row)) continue;
    const r = row as Record<string, unknown>;
    const idRaw = typeof r.id === "string" ? r.id.trim() : "";
    const canon = normalizeLaSoAspectKey(idRaw);
    if (!canon) continue;
    const title =
      typeof r.title === "string" && r.title.trim()
        ? r.title.trim()
        : (LA_SO_ASPECT_TITLES[canon] ?? canon);
    const text = coerceLaSoSectionText(r.text);
    if (!text) continue;
    out.push({ id: canon, title, text });
  }
  return out.length > 0 ? out : null;
}

const LA_SO_NESTED_ASPECT_WRAPPERS = [
  "luan_giai",
  "luanGiai",
  "luận_giải",
  "reading",
  "chi_tiet",
  "chiTiet",
  "noi_dung",
  "noiDung",
] as const;

function flattenLaSoChiTietRecord(
  record: Record<string, unknown>,
): Record<string, unknown> {
  let flat = { ...record };
  for (const w of LA_SO_NESTED_ASPECT_WRAPPERS) {
    const v = flat[w];
    if (v && typeof v === "object" && !Array.isArray(v)) {
      flat = { ...flat, ...(v as Record<string, unknown>) };
    }
  }
  return flat;
}

function parseLaSoChiTietSections(text: string): LaSoChiTietSection[] | null {
  const record = tryParseLaSoChiTietRecord(text);
  if (!record) return null;

  const fromArr = sectionsFromExplicitArray(record.sections);
  if (fromArr?.length) return fromArr;

  const flat = flattenLaSoChiTietRecord(record);
  const byId = new Map<string, string>();

  for (const key of Object.keys(flat)) {
    if (key === "sections") continue;
    if ((LA_SO_NESTED_ASPECT_WRAPPERS as readonly string[]).includes(key)) {
      continue;
    }
    const canon = normalizeLaSoAspectKey(key);
    if (!canon) continue;
    const t = coerceLaSoSectionText(flat[key]);
    if (!t) continue;
    byId.set(canon, t);
  }

  const out: LaSoChiTietSection[] = [];
  for (const id of LA_SO_ASPECT_ORDER) {
    const t = byId.get(id);
    if (!t) continue;
    out.push({
      id,
      title: LA_SO_ASPECT_TITLES[id] ?? id,
      text: t,
    });
  }
  return out.length > 0 ? out : null;
}

function snakeToCamelAlias(snake: string): string {
  return snake.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

function pickTieuVanLuuNienField(
  record: Record<string, unknown>,
  snake: string,
): string | null {
  const camel = snakeToCamelAlias(snake);
  return (
    coerceLaSoSectionText(record[snake]) ??
    coerceLaSoSectionText(record[camel])
  );
}

function parseTieuVanLuuNienSections(
  raw: string,
  endpoint: string,
): LaSoChiTietSection[] | null {
  const record = tryParseLaSoChiTietRecord(raw);
  if (!record) return null;
  const out: LaSoChiTietSection[] = [];
  for (const id of TIEU_VAN_LUU_NIEN_SECTION_ORDER) {
    const t = pickTieuVanLuuNienField(record, id);
    if (!t) return null;
    out.push({
      id,
      title: tieuVanLuuNienSectionTitle(id, endpoint),
      text: t,
    });
  }
  return out;
}

function countViSentenceEndings(text: string): number {
  return (text.match(/[.!?…]/g) ?? []).length;
}

function tieuVanSectionTooShort(text: string): boolean {
  const t = text.trim();
  if (t.length < MIN_TIEU_VAN_SECTION_CHARS) return true;
  if (countViSentenceEndings(t) < MIN_TIEU_VAN_SECTION_SENTENCE_ENDS) {
    return true;
  }
  return false;
}

function tieuVanSectionsNeedLengthRetry(
  sections: LaSoChiTietSection[] | null,
): boolean {
  if (!sections?.length) return false;
  return sections.some((s) => tieuVanSectionTooShort(s.text));
}

function readCachedBody(
  endpoint: string,
  reading: string,
): {
  reading: string | null;
  sections: LaSoChiTietSection[] | null;
  dayReadings: Record<string, string> | null;
} {
  if (endpoint === "chon-ngay-cards") {
    try {
      const o = JSON.parse(reading) as { day_readings?: unknown };
      const map = normalizeDayReadingsRecord(o.day_readings);
      if (map) return { reading: null, sections: null, dayReadings: map };
    } catch {
      const map = parseChonNgayDayReadingsJson(reading);
      if (map) return { reading: null, sections: null, dayReadings: map };
    }
    return { reading: null, sections: null, dayReadings: null };
  }
  if (endpoint === "la-so-chi-tiet") {
    try {
      const o = JSON.parse(reading) as { sections?: unknown };
      if (Array.isArray(o.sections) && o.sections.length > 0) {
        const sections: LaSoChiTietSection[] = [];
        for (const row of o.sections) {
          if (!row || typeof row !== "object" || Array.isArray(row)) continue;
          const r = row as Record<string, unknown>;
          const id = typeof r.id === "string" ? r.id : "";
          const title = typeof r.title === "string" ? r.title : "";
          const text = typeof r.text === "string" ? r.text.trim() : "";
          if (!id || !text) continue;
          sections.push({
            id,
            title: title || (LA_SO_ASPECT_TITLES[id] ?? id),
            text,
          });
        }
        if (sections.length > 0) {
          return { reading: null, sections, dayReadings: null };
        }
      }
    } catch {
      /* fall through */
    }
    return { reading: null, sections: null, dayReadings: null };
  }
  if (endpoint === "tieu-van" || endpoint === "luu-nien") {
    try {
      const o = JSON.parse(reading) as { sections?: unknown };
      if (Array.isArray(o.sections) && o.sections.length > 0) {
        const sections: LaSoChiTietSection[] = [];
        for (const row of o.sections) {
          if (!row || typeof row !== "object" || Array.isArray(row)) continue;
          const r = row as Record<string, unknown>;
          const id = typeof r.id === "string" ? r.id.trim() : "";
          const title = typeof r.title === "string" ? r.title.trim() : "";
          const text = typeof r.text === "string" ? r.text.trim() : "";
          if (!id || !text) continue;
          sections.push({
            id,
            title: title.length > 0 ? title : id,
            text,
          });
        }
        if (sections.length > 0) {
          return { reading: null, sections, dayReadings: null };
        }
      }
    } catch {
      /* cache cũ: một chuỗi văn */
    }
    const plain = reading.trim();
    return plain.length > 0
      ? { reading: plain, sections: null, dayReadings: null }
      : { reading: null, sections: null, dayReadings: null };
  }
  return { reading, sections: null, dayReadings: null };
}

function stableStringify(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "null";
  if (typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((v) => stableStringify(v)).join(",")}]`;
  }
  const o = value as Record<string, unknown>;
  const keys = Object.keys(o).sort();
  const parts = keys.map((k) => {
    const v = o[k];
    return `${JSON.stringify(k)}:${stableStringify(v === undefined ? null : v)}`;
  });
  return `{${parts.join(",")}}`;
}

async function sha256Prefix16(text: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text),
  );
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hex.slice(0, 16);
}

function ttlForEndpoint(endpoint: string): number {
  return TTL_MS[endpoint] ?? 24 * 60 * 60 * 1000;
}

async function anthropicCompletion(
  system: string,
  userJson: string,
  maxTokens: number,
  timeoutMs: number,
): Promise<string | null> {
  const key = Deno.env.get("ANTHROPIC_API_KEY");
  if (!key?.trim()) {
    console.warn("[luận-giải] Thiếu biến môi trường ANTHROPIC_API_KEY");
    return null;
  }

  const model =
    Deno.env.get("ANTHROPIC_MODEL")?.trim() || DEFAULT_LLM_MODEL;

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key.trim(),
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system,
        messages: [
          {
            role: "user",
            content: userJson,
          },
        ],
      }),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      console.warn(
        "[luận-giải] Dịch vụ Anthropic trả HTTP",
        res.status,
        errBody.slice(0, 500),
      );
      return null;
    }
    const body = (await res.json()) as {
      content?: Array<{ type?: string; text?: string }>;
    };
    const text = body.content?.find((c) => c.type === "text")?.text?.trim();
    return text && text.length > 0 ? text : null;
  } catch (e) {
    console.warn("[luận-giải] Lỗi khi gọi Anthropic:", e);
    return null;
  } finally {
    clearTimeout(t);
  }
}

async function anthropicReading(
  userJson: string,
  maxTokens: number = READING_MAX_TOKENS_DEFAULT,
  timeoutMs: number = REQUEST_TIMEOUT_MS,
): Promise<string | null> {
  return await anthropicCompletion(
    SYSTEM_PROMPT,
    userJson,
    maxTokens,
    timeoutMs,
  );
}

async function anthropicLaSoChiTiet(userJson: string): Promise<string | null> {
  return await anthropicCompletion(
    LA_SO_CHI_TIET_SYSTEM,
    userJson,
    2048,
    LA_SO_CHI_TIET_TIMEOUT_MS,
  );
}

const LA_SO_CHI_TIET_RETRY_SYSTEM =
`Bạn nhận cùng JSON đầu vào (endpoint la-so-chi-tiet). Nhiệm vụ: CHỈ trả về một object JSON, không markdown, không \`\`\`, không lời dẫn.
Các khóa bắt buộc (chuỗi tiếng Việt, văn xuôi, không gạch đầu dòng): tinh_cach, su_nghiep, tai_van, suc_khoe, tinh_duyen.
Tạo đủ 5 khóa trừ khi dữ liệu đầu vào hoàn toàn không cho phép một mục (khi đó bỏ khóa đó hẳn).`;

async function anthropicLaSoChiTietStructRetry(
  userJson: string,
): Promise<string | null> {
  return await anthropicCompletion(
    LA_SO_CHI_TIET_RETRY_SYSTEM,
    userJson,
    2048,
    LA_SO_CHI_TIET_TIMEOUT_MS,
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return ok(null, null);
  }

  let parsed: unknown;
  try {
    parsed = await req.json();
  } catch {
    return ok(null, null);
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    Array.isArray(parsed)
  ) {
    return ok(null, null);
  }

  const body = parsed as Record<string, unknown>;
  const endpoint =
    typeof body.endpoint === "string" ? body.endpoint.trim() : "";
  const data = body.data;

  if (!endpoint || data === undefined) {
    return ok(null, null);
  }

  if (data !== null && typeof data !== "object") {
    return ok(null, null);
  }

  const dataJson = stableStringify(data);
  const cacheInput =
    endpoint === "la-so-chi-tiet"
      ? `${LA_SO_CHI_TIET_CACHE_VER}\n${endpoint}\n${dataJson}`
      : endpoint === "tieu-van" || endpoint === "luu-nien"
        ? `${TIEU_VAN_LUU_NIEN_PROMPT_VER}\n${endpoint}\n${dataJson}`
        : endpoint === "hop-tuoi"
          ? `${HOP_TUOI_PROMPT_VER}\n${endpoint}\n${dataJson}`
          : endpoint === "chon-ngay"
            ? `${CHON_NGAY_PROMPT_VER}\n${endpoint}\n${dataJson}`
            : endpoint === "chon-ngay-cards"
              ? `${CHON_NGAY_CARDS_PROMPT_VER}\n${endpoint}\n${dataJson}`
              : `${endpoint}\n${dataJson}`;
  const cacheKey = await sha256Prefix16(cacheInput);

  const payload = stableStringify({ endpoint, data });
  if (payload.length > MAX_BODY_CHARS) {
    return ok(null, null);
  }
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  const now = Date.now();
  const admin =
    supabaseUrl && serviceKey ? createClient(supabaseUrl, serviceKey) : null;

  if (admin) {
    const { data: row, error: readErr } = await admin
      .from("reading_cache")
      .select("reading, expires_at")
      .eq("cache_key", cacheKey)
      .maybeSingle();

    if (!readErr && row && typeof row.reading === "string") {
      const exp = row.expires_at as string;
      if (new Date(exp).getTime() > now) {
        const cached = readCachedBody(endpoint, row.reading);
        if (endpoint === "la-so-chi-tiet") {
          if (cached.sections != null && cached.sections.length > 0) {
            return ok(null, cached.sections);
          }
          await admin.from("reading_cache").delete().eq("cache_key", cacheKey);
        } else if (endpoint === "tieu-van" || endpoint === "luu-nien") {
          if (cached.sections != null && cached.sections.length > 0) {
            if (!tieuVanSectionsNeedLengthRetry(cached.sections)) {
              return ok(null, cached.sections);
            }
            await admin.from("reading_cache").delete().eq("cache_key", cacheKey);
          }
          const r = cached.reading?.trim() ?? "";
          if (r.length > 0) return ok(r, null);
          await admin.from("reading_cache").delete().eq("cache_key", cacheKey);
        } else if (endpoint === "chon-ngay-cards") {
          if (
            cached.dayReadings != null &&
            Object.keys(cached.dayReadings).length > 0
          ) {
            return ok(null, null, cached.dayReadings);
          }
          await admin.from("reading_cache").delete().eq("cache_key", cacheKey);
        } else {
          const r = cached.reading?.trim() ?? "";
          if (r.length > 0) return ok(r, null);
          await admin.from("reading_cache").delete().eq("cache_key", cacheKey);
        }
      }
    }
  }

  if (endpoint === "la-so-chi-tiet") {
    const raw = await anthropicLaSoChiTiet(payload);
    if (!raw) return ok(null, null);
    let sections = parseLaSoChiTietSections(raw);
    if (!sections?.length) {
      const retryText = await anthropicLaSoChiTietStructRetry(payload);
      if (retryText) {
        sections = parseLaSoChiTietSections(retryText);
      }
    }
    if (!sections?.length) {
      console.warn(
        "[luận-giải] la-so-chi-tiet: JSON rỗng hoặc không đọc được — thử luận giải một khối văn",
        raw.slice(0, 240),
      );
      const plain = await anthropicReading(payload);
      const t = plain?.trim() ?? "";
      if (!t) {
        console.warn(
          "[luận-giải] la-so-chi-tiet: luận giải dự phòng (một khối văn) thất bại",
          raw.slice(0, 400),
        );
        return ok(null, null);
      }
      sections = [
        {
          id: LA_SO_FALLBACK_SECTION_ID,
          title: LA_SO_FALLBACK_TITLE,
          text: t,
        },
      ];
    }
    const toStore = JSON.stringify({ sections });
    if (admin) {
      const expiresAt = new Date(now + ttlForEndpoint(endpoint)).toISOString();
      await admin.from("reading_cache").upsert(
        {
          cache_key: cacheKey,
          reading: toStore,
          expires_at: expiresAt,
        },
        { onConflict: "cache_key" },
      );
    }
    return ok(null, sections);
  }

  if (endpoint === "tieu-van" || endpoint === "luu-nien") {
    const rawJson = await anthropicCompletion(
      TIEU_VAN_LUU_NIEN_JSON_SYSTEM,
      payload,
      READING_MAX_TOKENS_TIEU_VAN_LUU_NIEN_JSON,
      TIEU_VAN_LUU_NIEN_JSON_TIMEOUT_MS,
    );
    let sections = rawJson
      ? parseTieuVanLuuNienSections(rawJson, endpoint)
      : null;
    if (!sections?.length) {
      const retry = await anthropicCompletion(
        TIEU_VAN_LUU_NIEN_JSON_RETRY,
        payload,
        READING_MAX_TOKENS_TIEU_VAN_LUU_NIEN_JSON,
        TIEU_VAN_LUU_NIEN_JSON_TIMEOUT_MS,
      );
      sections = retry ? parseTieuVanLuuNienSections(retry, endpoint) : null;
    }
    if (sections?.length && tieuVanSectionsNeedLengthRetry(sections)) {
      const lengthUser = stableStringify({
        endpoint,
        data,
        previous_draft_too_short: Object.fromEntries(
          sections.map((s) => [s.id, s.text]),
        ),
      });
      const lengthRetry = await anthropicCompletion(
        TIEU_VAN_LUU_NIEN_JSON_LENGTH_RETRY,
        lengthUser,
        READING_MAX_TOKENS_TIEU_VAN_LUU_NIEN_JSON,
        TIEU_VAN_LUU_NIEN_JSON_TIMEOUT_MS,
      );
      const expanded = lengthRetry
        ? parseTieuVanLuuNienSections(lengthRetry, endpoint)
        : null;
      if (
        expanded &&
        expanded.length === TIEU_VAN_LUU_NIEN_SECTION_ORDER.length
      ) {
        const origTotal = sections.reduce((a, s) => a + s.text.length, 0);
        const newTotal = expanded.reduce((a, s) => a + s.text.length, 0);
        const expandedOk = !tieuVanSectionsNeedLengthRetry(expanded);
        if (expandedOk || newTotal > origTotal * 1.08) {
          sections = expanded;
        }
      }
    }
    if (!sections?.length) {
      console.warn(
        "[luận-giải] tieu-van/luu-nien: JSON 3 phần thất bại — dùng một khối văn",
        rawJson?.slice(0, 200),
      );
      const reading = await anthropicReading(
        payload,
        READING_MAX_TOKENS_TIEU_VAN_LUU_NIEN,
        TIEU_VAN_LUU_NIEN_TIMEOUT_MS,
      );
      if (!reading) return ok(null, null);
      if (admin) {
        const expiresAt = new Date(now + ttlForEndpoint(endpoint)).toISOString();
        await admin.from("reading_cache").upsert(
          {
            cache_key: cacheKey,
            reading,
            expires_at: expiresAt,
          },
          { onConflict: "cache_key" },
        );
      }
      return ok(reading, null);
    }
    const toStore = JSON.stringify({ sections });
    if (admin) {
      const expiresAt = new Date(now + ttlForEndpoint(endpoint)).toISOString();
      await admin.from("reading_cache").upsert(
        {
          cache_key: cacheKey,
          reading: toStore,
          expires_at: expiresAt,
        },
        { onConflict: "cache_key" },
      );
    }
    return ok(null, sections);
  }

  if (endpoint === "chon-ngay") {
    const reading = await anthropicCompletion(
      CHON_NGAY_SYSTEM,
      payload,
      READING_MAX_TOKENS_CHON_NGAY,
      CHON_NGAY_REQUEST_TIMEOUT_MS,
    );
    if (!reading) {
      return ok(null, null);
    }
    if (admin) {
      const expiresAt = new Date(now + ttlForEndpoint(endpoint)).toISOString();
      await admin.from("reading_cache").upsert(
        {
          cache_key: cacheKey,
          reading,
          expires_at: expiresAt,
        },
        { onConflict: "cache_key" },
      );
    }
    return ok(reading, null);
  }

  if (endpoint === "chon-ngay-cards") {
    const raw = await anthropicCompletion(
      CHON_NGAY_CARDS_JSON_SYSTEM,
      payload,
      READING_MAX_TOKENS_CHON_NGAY_CARDS,
      CHON_NGAY_CARDS_REQUEST_TIMEOUT_MS,
    );
    let map = raw ? parseChonNgayDayReadingsJson(raw) : null;
    if (!map || Object.keys(map).length === 0) {
      const retry = await anthropicCompletion(
        CHON_NGAY_CARDS_JSON_RETRY,
        payload,
        READING_MAX_TOKENS_CHON_NGAY_CARDS,
        CHON_NGAY_CARDS_REQUEST_TIMEOUT_MS,
      );
      map = retry ? parseChonNgayDayReadingsJson(retry) : null;
    }
    if (!map || Object.keys(map).length === 0) {
      return ok(null, null);
    }
    const toStore = JSON.stringify({ day_readings: map });
    if (admin) {
      const expiresAt = new Date(now + ttlForEndpoint(endpoint)).toISOString();
      await admin.from("reading_cache").upsert(
        {
          cache_key: cacheKey,
          reading: toStore,
          expires_at: expiresAt,
        },
        { onConflict: "cache_key" },
      );
    }
    return ok(null, null, map);
  }

  const reading =
    endpoint === "hop-tuoi"
      ? await anthropicReading(
          payload,
          READING_MAX_TOKENS_HOP_TUOI,
          HOP_TUOI_REQUEST_TIMEOUT_MS,
        )
      : await anthropicReading(payload);
  if (!reading) {
    return ok(null, null);
  }

  if (admin) {
    const expiresAt = new Date(now + ttlForEndpoint(endpoint)).toISOString();
    await admin.from("reading_cache").upsert(
      {
        cache_key: cacheKey,
        reading,
        expires_at: expiresAt,
      },
      { onConflict: "cache_key" },
    );
  }

  return ok(reading, null);
});
