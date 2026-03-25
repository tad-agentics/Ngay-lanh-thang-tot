function asRecord(x: unknown): Record<string, unknown> | null {
  if (x && typeof x === "object" && !Array.isArray(x)) {
    return x as Record<string, unknown>;
  }
  return null;
}

function pickStr(obj: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "—";
}

const TONG_QUAN_FALLBACK =
  "Tháng này có biến động nhẹ — nên chủ động quan sát từng tuần.";
const CAN_LUU_FALLBACK =
  "Tránh quyết định vội vàng vào giữa tháng nếu trụ tháng xung.";

const FALLBACK_GIAI = [
  {
    label: "Tài vận",
    value: 65,
    note: "Điểm chi tiết theo bản mệnh — xem thêm khi mở khóa.",
  },
  {
    label: "Sự nghiệp",
    value: 68,
    note: "Điểm chi tiết theo bản mệnh — xem thêm khi mở khóa.",
  },
  {
    label: "Tình duyên",
    value: 62,
    note: "Điểm chi tiết theo bản mệnh — xem thêm khi mở khóa.",
  },
  {
    label: "Sức khoẻ",
    value: 70,
    note: "Điểm chi tiết theo bản mệnh — xem thêm khi mở khóa.",
  },
];

export interface TieuVanUi {
  tongQuan: string;
  canLuu: string;
  pillarHint: string;
  cacGiai: { label: string; value: number; note: string }[];
}

export function mapTieuVanPayload(data: unknown): TieuVanUi {
  const root = asRecord(data);
  if (!root) {
    return {
      tongQuan:
        "Tháng này nên giữ nhịp ổn định; chi tiết từng lĩnh vực có sau khi mở khóa.",
      canLuu:
        "Ngày Hắc Đạo trên lịch tháng giúp bạn chủ động lùi việc lớn nếu cần.",
      pillarHint: "—",
      cacGiai: FALLBACK_GIAI,
    };
  }

  const tongQuanRaw = pickStr(root, [
    "tong_quan",
    "tongQuan",
    "overview",
    "summary",
  ]);
  const tongQuan =
    tongQuanRaw === "—" ? TONG_QUAN_FALLBACK : tongQuanRaw;
  const canLuuRaw = pickStr(root, [
    "can_luu",
    "canLuu",
    "luu_y",
    "warnings",
  ]);
  const canLuu = canLuuRaw === "—" ? CAN_LUU_FALLBACK : canLuuRaw;
  const pillarHint = pickStr(root, [
    "tru_thang",
    "truThang",
    "month_pillar",
    "pilliar",
  ]);

  let cacGiai: { label: string; value: number; note: string }[] = [];
  const scores =
    root.cac_giai ?? root.scores ?? root.linh_vuc ?? root.dimensions;
  if (Array.isArray(scores)) {
    for (const item of scores) {
      const o = asRecord(item);
      if (!o) continue;
      const label = pickStr(o, ["label", "ten", "name", "aspect"]);
      const value = typeof o.value === "number" ? o.value : Number(o.score);
      const note = pickStr(o, ["note", "mo_ta", "desc", "hint"]);
      if (label && label !== "—") {
        cacGiai.push({
          label,
          value: Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 65,
          note,
        });
      }
    }
  }
  if (!cacGiai.length) cacGiai = FALLBACK_GIAI;

  return { tongQuan, canLuu, pillarHint, cacGiai };
}
