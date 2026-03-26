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

/** Chuỗi hoặc mảng chuỗi (ví dụ `warnings: string[]`) — dùng cho can_luu / lưu ý. */
function pickProseList(obj: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (Array.isArray(v)) {
      const parts = v
        .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
        .map((s) => s.trim());
      if (parts.length > 0) return parts.join(" ");
    }
  }
  return "—";
}

const TONG_QUAN_FALLBACK =
  "Tháng này có biến động nhẹ — nên chủ động quan sát từng tuần.";
const CAN_LUU_FALLBACK =
  "Tránh quyết định vội vàng vào giữa tháng nếu trụ tháng xung.";

/** Dịch mã quan hệ ngũ hành tháng ↔ mệnh (GET /v1/tieu-van) — ngôn ngữ định tính. */
const ELEMENT_RELATION_VI: Record<string, string> = {
  bi_sinh:
    "Tháng bị sinh cho mệnh bạn — dễ được nuôi dưỡng, có thể tích lũy và mở rộng từ từ.",
  tuong_sinh:
    "Tháng tương sinh với mệnh bạn — nhịp tương đối thuận, thích hợp đẩy việc cần sự đồng thuận.",
  bi_khac:
    "Tháng khắc mệnh bạn — dễ có áp lực hoặc chỗ phải nhún; nên giữ nhịp, tránh giao dịch sốc.",
  tuong_khac:
    "Tháng tương khắc với mệnh bạn — dễ căng hoặc phải cạnh tranh; nên thu lại, xử lý từng việc một.",
  binh_hoa:
    "Tháng cân hoà với mệnh bạn — không quá hưng cũng không quá kém; giữ ổn định là đủ.",
};

const ELEMENT_RELATION_FALLBACK =
  "Quan hệ ngũ hành giữa tháng và mệnh bạn có nhịp riêng — đối chiếu thêm diễn giải tổng quan và Đại Vận bên dưới.";

function elementRelationToLabel(code: string | null): string | null {
  if (!code || !code.trim()) return null;
  const k = code.trim().toLowerCase().replace(/-/g, "_");
  return ELEMENT_RELATION_VI[k] ?? ELEMENT_RELATION_FALLBACK;
}

function formatUserMenh(raw: unknown): string | null {
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  const o = asRecord(raw);
  if (!o) return null;
  const name = pickStr(o, ["name", "ten", "label", "nap_am", "category"]);
  const hanh = pickStr(o, ["hanh", "element", "han"]);
  if (name !== "—" && hanh !== "—") return `${name} · ${hanh}`;
  if (name !== "—") return name;
  if (hanh !== "—") return hanh;
  return null;
}

function normalizeRelationCode(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  return raw.trim();
}

export interface TieuVanLinhVuc {
  title: string;
  body: string;
}

export interface TieuVanUi {
  tongQuan: string;
  canLuu: string;
  pillarHint: string;
  tags: string[];
  userMenhLabel: string | null;
  /** Câu định tính về quan hệ ngũ hành tháng ↔ mệnh */
  elementRelationLabel: string | null;
  elementRelationCode: string | null;
  nhatChuApi: string | null;
  dungThanApi: string | null;
  chartStrength: string | null;
  thapThanOfMonth: string | null;
  /** Gợi ý theo lĩnh vực — chỉ chữ, không điểm */
  linhVuc: TieuVanLinhVuc[];
}

function collectLinhVucQualitative(root: Record<string, unknown>): TieuVanLinhVuc[] {
  const out: TieuVanLinhVuc[] = [];
  const seen = new Set<string>();

  function pushRow(title: string, body: string) {
    const t = title.trim();
    const b = body.trim();
    if (!t || t === "—") return;
    if (!b || b === "—") return;
    const key = `${t}|${b}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ title: t, body: b });
  }

  const scoreArrays = [
    root.cac_giai,
    root.scores,
    root.linh_vuc,
    root.dimensions,
  ];
  for (const arr of scoreArrays) {
    if (!Array.isArray(arr)) continue;
    for (const item of arr) {
      const o = asRecord(item);
      if (!o) continue;
      const label = pickStr(o, ["label", "ten", "name", "aspect", "category"]);
      const prose = pickStr(o, [
        "note",
        "mo_ta",
        "desc",
        "hint",
        "description",
        "reading",
        "text",
      ]);
      if (label !== "—" && prose !== "—") pushRow(label, prose);
    }
  }

  const details = root.details ?? root.chi_tiet;
  if (Array.isArray(details)) {
    for (const item of details) {
      const o = asRecord(item);
      if (!o) continue;
      const label = pickStr(o, ["category", "label", "ten", "name"]);
      const prose = pickStr(o, [
        "description",
        "note",
        "mo_ta",
        "desc",
        "summary",
      ]);
      if (label !== "—" && prose !== "—") pushRow(label, prose);
    }
  }

  return out;
}

function emptyUi(partial?: Partial<TieuVanUi>): TieuVanUi {
  const base: TieuVanUi = {
    tongQuan:
      "Tháng này nên giữ nhịp ổn định — mở khóa hoặc thử lại khi có kết nối để xem bản đầy đủ từ máy chủ.",
    canLuu:
      "Ngày Hắc Đạo trên lịch tháng giúp bạn chủ động lùi việc lớn nếu cần.",
    pillarHint: "—",
    tags: [],
    userMenhLabel: null,
    elementRelationLabel: null,
    elementRelationCode: null,
    nhatChuApi: null,
    dungThanApi: null,
    chartStrength: null,
    thapThanOfMonth: null,
    linhVuc: [],
  };
  return { ...base, ...partial };
}

function pickStringTags(root: Record<string, unknown>): string[] {
  const raw = root.tags ?? root.nhan_xet_tags;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    .map((s) => s.trim());
}

export function mapTieuVanPayload(data: unknown): TieuVanUi {
  const root = asRecord(data);
  if (!root) {
    return emptyUi({
      tongQuan:
        "Tháng này nên giữ nhịp ổn định; diễn giải chi tiết có sau khi mở khóa.",
    });
  }

  const tvp = asRecord(root.tieu_van_pillar) ?? asRecord(root.tieuVanPillar);
  const pillarFromNested = tvp
    ? pickStr(tvp, ["display", "can_chi", "label", "pillar"])
    : "—";
  const pillarHint = pillarFromNested !== "—"
    ? pillarFromNested
    : pickStr(root, [
        "tru_thang",
        "truThang",
        "month_pillar",
        "pilliar",
        "thang_tru",
      ]);

  const tongQuanRaw = pickStr(root, [
    "reading",
    "tong_quan",
    "tongQuan",
    "overview",
    "summary",
    "nhan_xet",
  ]);
  const tongQuan =
    tongQuanRaw === "—" ? TONG_QUAN_FALLBACK : tongQuanRaw;

  const canLuuRaw = pickProseList(root, [
    "dai_van_context",
    "daiVanContext",
    "can_luu",
    "canLuu",
    "luu_y",
    "warnings",
    "advice",
    "caution",
  ]);
  const canLuu = canLuuRaw === "—" ? CAN_LUU_FALLBACK : canLuuRaw;

  const tags = pickStringTags(root);

  const userMenhLabel =
    formatUserMenh(root.user_menh ?? root.userMenh) ??
    (pickStr(root, ["user_menh_text", "menh_thang"]) !== "—"
      ? pickStr(root, ["user_menh_text", "menh_thang"])
      : null);

  const elementRelationCode =
    normalizeRelationCode(root.element_relation) ??
    normalizeRelationCode(root.elementRelation);
  const elementRelationLabel = elementRelationToLabel(elementRelationCode);

  const nhatChuRaw = pickStr(root, ["nhat_chu", "nhatChu", "nhat_chu_text"]);
  const nhatChuApi = nhatChuRaw !== "—" ? nhatChuRaw : null;

  const dungRaw = pickStr(root, ["dung_than", "dungThan"]);
  const dungThanApi = dungRaw !== "—" ? dungRaw : null;

  const chartRaw = pickStr(root, [
    "chart_strength",
    "chartStrength",
    "suc_laso",
    "strength",
  ]);
  const chartStrength = chartRaw !== "—" ? chartRaw : null;

  const thapRaw = pickStr(root, [
    "thap_than_of_month",
    "thapThanOfMonth",
    "thap_than",
  ]);
  const thapThanOfMonth = thapRaw !== "—" ? thapRaw : null;

  const linhVuc = collectLinhVucQualitative(root);

  return {
    tongQuan,
    canLuu,
    pillarHint: pillarHint === "—" ? "—" : pillarHint,
    tags,
    userMenhLabel,
    elementRelationLabel,
    elementRelationCode,
    nhatChuApi,
    dungThanApi,
    chartStrength,
    thapThanOfMonth,
    linhVuc,
  };
}
