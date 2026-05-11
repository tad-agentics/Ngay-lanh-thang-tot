/** Query `purpose` — GET /v1/phong-thuy (OpenAPI). */
export const PHONG_THUY_PURPOSE_OPTIONS = [
  { value: "NHA_O", label: "Nhà ở" },
  { value: "VAN_PHONG", label: "Văn phòng" },
  { value: "CUA_HANG", label: "Cửa hàng" },
  { value: "PHONG_KHACH", label: "Phòng khách" },
] as const;

export type PhongThuyPurposeValue =
  (typeof PHONG_THUY_PURPOSE_OPTIONS)[number]["value"];

export type PhongThuyMapMode = "teaser" | "full";

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

function pickNum(obj: Record<string, unknown>, keys: string[]): number | null {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  return null;
}

/** Các key gợi ý object chứa payload phong thủy thật (tránh `data: {}` nuốt field ở root). */
const PHONG_THUY_UNWRAP_SIGNAL_KEYS = [
  "huong_tot",
  "huongTot",
  "user_menh",
  "userMenh",
  "dung_than",
  "dungThan",
  "phi_tinh",
  "phiTinh",
  "purpose",
  "status",
  "so_may_man",
  "soMayMan",
] as const;

function phongThuyPayloadSignalScore(obj: Record<string, unknown> | null): number {
  if (!obj) return -1;
  let n = 0;
  for (const k of PHONG_THUY_UNWRAP_SIGNAL_KEYS) {
    const v = obj[k as string];
    if (v === undefined || v === null) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    if (
      typeof v === "object" &&
      !Array.isArray(v) &&
      Object.keys(v as object).length === 0
    ) {
      continue;
    }
    n++;
  }
  return n;
}

/** Lấy object gốc từ envelope API (ưu tiên nhánh có nhiều tín hiệu payload nhất). */
export function unwrapPhongThuyPayload(data: unknown): Record<
  string,
  unknown
> | null {
  const root = asRecord(data);
  if (!root) return null;

  const candidates: (Record<string, unknown> | null)[] = [
    root,
    asRecord(root.data),
    asRecord(root.result),
    asRecord(root.phong_thuy),
  ];

  let best: Record<string, unknown> = root;
  let bestScore = phongThuyPayloadSignalScore(root);
  for (const c of candidates) {
    const s = phongThuyPayloadSignalScore(c);
    if (c != null && s > bestScore) {
      best = c;
      bestScore = s;
    }
  }
  return best;
}

export interface PhongThuyDirectionItem {
  direction: string;
  element: string | null;
  reason: string | null;
}

export interface PhongThuyColorItem {
  color: string;
  hex: string | null;
  element: string | null;
}

export interface PhongThuyGoiY {
  tieu_de: string;
  mo_ta: string;
}

export interface PhongThuyPersonalization {
  chart_strength: string | null;
  intensity: string | null;
  note: string | null;
  extra_items: unknown[];
}

export interface PhongThuyPhiTinhSlot {
  direction: string;
  star: number | null;
  star_name: string | null;
  hanh: string | null;
  nature: string | null;
  meaning: string | null;
}

export interface PhongThuyHoaGiaiItem {
  direction: string | null;
  star: number | null;
  remedy: string | null;
}

export interface PhongThuyCoupleRemedy {
  item: string;
  vi_tri: string | null;
  reason: string | null;
}

export interface PhongThuyCoupleHarmony {
  person1_hanh: string | null;
  person2_hanh: string | null;
  person1_menh_name: string | null;
  person2_menh_name: string | null;
  relation: string | null;
  remedy_element: string | null;
  explanation: string | null;
  remedies: PhongThuyCoupleRemedy[];
  colors_for_shared_space: PhongThuyColorItem[];
}

export interface PhongThuyView {
  status: string | null;
  version: number | null;
  purpose: string | null;
  /** Nạp Âm từ API ({ name, hanh }) — ưu tiên hiển thị khi có. */
  userMenhLabel: string | null;
  dungThanApi: string | null;
  kyThanApi: string | null;
  huongTotItems: PhongThuyDirectionItem[];
  mauTotItems: PhongThuyColorItem[];
  soTotNumbers: number[];
  huongTot: string;
  huongXau: string;
  mauTot: string;
  mauKy: string;
  soTot: string;
  soKy: string;
  goiY: PhongThuyGoiY[];
  /** Block 4 — generic theo purpose; iterate keys ở UI. */
  purposeSpecific: Record<string, unknown> | null;
  personalization: PhongThuyPersonalization | null;
  phiTinhYear: number | null;
  phiTinh: PhongThuyPhiTinhSlot[];
  huongTotNamNay: string[];
  huongXauNamNay: string[];
  hoaGiai: PhongThuyHoaGiaiItem[];
  phiTinhNoteVi: string | null;
  coupleHarmony: PhongThuyCoupleHarmony | null;
}

function parseDirectionItems(arr: unknown): PhongThuyDirectionItem[] {
  if (!Array.isArray(arr)) return [];
  const out: PhongThuyDirectionItem[] = [];
  for (const item of arr) {
    const o = asRecord(item);
    if (!o) continue;
    const direction = pickStr(o, ["direction", "huong", "name", "label"]);
    if (direction === "—") continue;
    const reasonRaw = pickStr(o, ["reason", "ly_do", "giai_thich", "mo_ta"]);
    const elRaw = pickStr(o, ["element", "hanh"]);
    out.push({
      direction,
      element: elRaw === "—" ? null : elRaw,
      reason: reasonRaw === "—" ? null : reasonRaw,
    });
  }
  return out;
}

function directionItemsToRichLine(it: PhongThuyDirectionItem): string {
  let s = it.direction;
  if (it.reason) s += ` — ${it.reason}`;
  else if (it.element) s += ` (${it.element})`;
  return s;
}

function joinDirectionsFromItems(items: PhongThuyDirectionItem[]): string {
  if (!items.length) return "—";
  return items.map(directionItemsToRichLine).join(" · ");
}

function parseColorItems(arr: unknown): PhongThuyColorItem[] {
  if (!Array.isArray(arr)) return [];
  const out: PhongThuyColorItem[] = [];
  for (const item of arr) {
    const o = asRecord(item);
    if (!o) continue;
    const color = pickStr(o, ["color", "mau", "name", "label"]);
    const hexRaw = pickStr(o, ["hex", "mau_hex", "color_hex"]);
    let hex: string | null = null;
    if (hexRaw !== "—") {
      const t = hexRaw.trim();
      if (/^#[0-9A-Fa-f]{3,8}$/.test(t)) hex = t;
      else if (/^[0-9A-Fa-f]{6}$/.test(t)) hex = `#${t}`;
    }
    const elRaw = pickStr(o, ["element", "hanh"]);
    if (color === "—" && !hex) continue;
    out.push({
      color: color === "—" ? (hex ?? "") : color,
      hex,
      element: elRaw === "—" ? null : elRaw,
    });
  }
  return out;
}

/** Chỉ tên màu (không kèm mã hex) cho copy dễ đọc; hex vẫn có trên `PhongThuyColorItem` cho swatch. */
function colorItemsToRich(items: PhongThuyColorItem[]): string {
  if (!items.length) return "—";
  const parts: string[] = [];
  for (const it of items) {
    const label = it.color.trim();
    if (!label) continue;
    if (/^#?[0-9A-Fa-f]{3,8}$/.test(label)) continue;
    parts.push(label);
  }
  return parts.length ? parts.join(" · ") : "—";
}

function joinColorLabels(arr: unknown): string {
  if (!Array.isArray(arr)) return "—";
  const parts: string[] = [];
  for (const item of arr) {
    const o = asRecord(item);
    if (!o) continue;
    const c = pickStr(o, ["color", "mau", "name", "label"]);
    if (c !== "—") parts.push(c);
  }
  return parts.length ? parts.join(", ") : "—";
}

function parseSoNumbers(arr: unknown): number[] {
  if (!Array.isArray(arr)) return [];
  return arr.filter((x) => typeof x === "number" && Number.isFinite(x)) as number[];
}

function mapVatPhamToGoiY(raw: unknown): PhongThuyGoiY[] {
  if (!Array.isArray(raw)) return [];
  const out: PhongThuyGoiY[] = [];
  for (const item of raw) {
    const o = asRecord(item);
    if (!o) continue;
    const tieu_de = pickStr(o, ["item", "title", "name", "vat_pham"]);
    const reason = pickStr(o, ["reason", "mo_ta", "description", "giai_thich"]);
    const vi_tri = pickStr(o, ["vi_tri", "viTri", "location"]);
    const el = pickStr(o, ["element", "hanh"]);
    let mo_ta =
      reason !== "—"
        ? el !== "—"
          ? `${reason} (${el})`
          : reason
        : el !== "—"
          ? `Hành ${el}`
          : "—";
    if (vi_tri !== "—" && mo_ta !== "—") mo_ta = `${mo_ta} · ${vi_tri}`;
    else if (vi_tri !== "—") mo_ta = vi_tri;
    if (tieu_de !== "—" || mo_ta !== "—") {
      out.push({
        tieu_de: tieu_de !== "—" ? tieu_de : "Gợi ý",
        mo_ta: mo_ta !== "—" ? mo_ta : "",
      });
    }
  }
  return out;
}

function normalizeGoiY(raw: unknown): PhongThuyGoiY[] {
  if (!Array.isArray(raw)) return [];
  const out: PhongThuyGoiY[] = [];
  for (const item of raw) {
    const o = asRecord(item);
    if (!o) continue;
    const tieu_de = pickStr(o, ["tieu_de", "title", "tieuDe", "heading"]);
    const mo_ta = pickStr(o, ["mo_ta", "description", "moTa", "body", "text"]);
    if (tieu_de !== "—" || mo_ta !== "—") {
      out.push({ tieu_de: tieu_de !== "—" ? tieu_de : "Gợi ý", mo_ta });
    }
  }
  return out;
}

function formatUserMenh(raw: unknown): string | null {
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  const o = asRecord(raw);
  if (!o) return null;
  const name = pickStr(o, ["name", "ten", "label", "nap_am"]);
  const hanh = pickStr(o, ["hanh", "element", "han"]);
  if (name !== "—" && hanh !== "—") return `${name} · ${hanh}`;
  if (name !== "—") return name;
  if (hanh !== "—") return hanh;
  return null;
}

function parsePurposeSpecific(raw: unknown): Record<string, unknown> | null {
  const o = asRecord(raw);
  if (!o || !Object.keys(o).length) return null;
  return o;
}

function parsePersonalization(raw: unknown): PhongThuyPersonalization | null {
  const o = asRecord(raw);
  if (!o) return null;
  const chart = pickStr(o, ["chart_strength", "chartStrength"]);
  const intensity = pickStr(o, ["intensity"]);
  const note = pickStr(o, ["note", "ghi_chu"]);
  const extra = o.extra_items ?? o.extraItems;
  const extra_items = Array.isArray(extra) ? extra : [];
  if (
    chart === "—" &&
    intensity === "—" &&
    note === "—" &&
    extra_items.length === 0
  ) {
    return null;
  }
  return {
    chart_strength: chart === "—" ? null : chart,
    intensity: intensity === "—" ? null : intensity,
    note: note === "—" ? null : note,
    extra_items,
  };
}

function parsePhiTinh(raw: unknown): PhongThuyPhiTinhSlot[] {
  if (!Array.isArray(raw)) return [];
  const out: PhongThuyPhiTinhSlot[] = [];
  for (const item of raw) {
    const o = asRecord(item);
    if (!o) continue;
    const direction = pickStr(o, ["direction", "huong"]);
    if (direction === "—") continue;
    const star = pickNum(o, ["star", "sao"]);
    const star_name = pickStr(o, ["star_name", "starName", "ten_sao"]);
    const hanh = pickStr(o, ["hanh", "element"]);
    const nature = pickStr(o, ["nature", "tinh_chat"]);
    const meaning = pickStr(o, ["meaning", "y_nghia", "mo_ta"]);
    out.push({
      direction,
      star,
      star_name: star_name === "—" ? null : star_name,
      hanh: hanh === "—" ? null : hanh,
      nature: nature === "—" ? null : nature,
      meaning: meaning === "—" ? null : meaning,
    });
  }
  return out;
}

function parseStringList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === "string" && x.length > 0);
}

function parseHoaGiai(raw: unknown): PhongThuyHoaGiaiItem[] {
  if (!Array.isArray(raw)) return [];
  const out: PhongThuyHoaGiaiItem[] = [];
  for (const item of raw) {
    const o = asRecord(item);
    if (!o) continue;
    const direction = pickStr(o, ["direction", "huong"]);
    const star = pickNum(o, ["star", "sao"]);
    const remedy = pickStr(o, ["remedy", "cach_hoa", "goi_y"]);
    if (direction === "—" && remedy === "—") continue;
    out.push({
      direction: direction === "—" ? null : direction,
      star,
      remedy: remedy === "—" ? null : remedy,
    });
  }
  return out;
}

function parseCoupleHarmony(raw: unknown): PhongThuyCoupleHarmony | null {
  const o = asRecord(raw);
  if (!o) return null;
  const remediesRaw = o.remedies;
  const remedies: PhongThuyCoupleRemedy[] = [];
  if (Array.isArray(remediesRaw)) {
    for (const item of remediesRaw) {
      const r = asRecord(item);
      if (!r) continue;
      const itemName = pickStr(r, ["item", "title"]);
      const vi_tri = pickStr(r, ["vi_tri", "viTri", "location"]);
      const reason = pickStr(r, ["reason", "mo_ta"]);
      if (itemName !== "—") {
        remedies.push({
          item: itemName,
          vi_tri: vi_tri === "—" ? null : vi_tri,
          reason: reason === "—" ? null : reason,
        });
      }
    }
  }
  const colorsRaw = o.colors_for_shared_space ?? o.colorsForSharedSpace;
  const colors_for_shared_space = parseColorItems(colorsRaw);

  const person1_hanh = pickStr(o, ["person1_hanh", "person1Hanh"]);
  const person2_hanh = pickStr(o, ["person2_hanh", "person2Hanh"]);
  const relation = pickStr(o, ["relation"]);
  const explanation = pickStr(o, ["explanation", "giai_thich"]);
  const remedy_element = pickStr(o, ["remedy_element", "remedyElement"]);
  const p1n = pickStr(o, ["person1_menh_name", "person1MenhName"]);
  const p2n = pickStr(o, ["person2_menh_name", "person2MenhName"]);

  const empty =
    person1_hanh === "—" &&
    person2_hanh === "—" &&
    relation === "—" &&
    explanation === "—" &&
    remedy_element === "—" &&
    p1n === "—" &&
    p2n === "—" &&
    !remedies.length &&
    colors_for_shared_space.length === 0;

  if (empty) return null;

  return {
    person1_hanh: person1_hanh === "—" ? null : person1_hanh,
    person2_hanh: person2_hanh === "—" ? null : person2_hanh,
    person1_menh_name: p1n === "—" ? null : p1n,
    person2_menh_name: p2n === "—" ? null : p2n,
    relation: relation === "—" ? null : relation,
    remedy_element: remedy_element === "—" ? null : remedy_element,
    explanation: explanation === "—" ? null : explanation,
    remedies,
    colors_for_shared_space,
  };
}

function readMetaVersion(nested: Record<string, unknown>): number | null {
  const v = nested.version ?? nested.schema_version;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number.parseInt(v, 10);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function phongThuyPayloadToViewInner(
  data: unknown,
  mode: PhongThuyMapMode,
): PhongThuyView | null {
  const nested = unwrapPhongThuyPayload(data);
  if (!nested) return null;

  const statusRaw = pickStr(nested, ["status"]);
  const status = statusRaw !== "—" ? statusRaw : null;
  const version = readMetaVersion(nested);
  const purposeRaw = pickStr(nested, ["purpose"]);
  const purpose = purposeRaw !== "—" ? purposeRaw : null;

  const userMenhLabel =
    formatUserMenh(nested.user_menh ?? nested.userMenh) ??
    (pickStr(nested, ["user_menh_label", "menh_label"]) !== "—"
      ? pickStr(nested, ["user_menh_label", "menh_label"])
      : null);
  const dungThanRaw = pickStr(nested, ["dung_than", "dungThan"]);
  const dungThanApi = dungThanRaw !== "—" ? dungThanRaw : null;

  const huArr = nested.huong_tot ?? nested.huongTot;
  const huongTotItems = parseDirectionItems(huArr);
  let huongTot = joinDirectionsFromItems(huongTotItems);
  if (huongTot === "—") {
    huongTot = pickStr(nested, [
      "huong_tot",
      "huongTot",
      "huong_tốt",
      "good_directions",
      "direction_good",
    ]);
  }

  const mauArr = nested.mau_may_man ?? nested.mauMayMan;
  const mauTotItems = parseColorItems(mauArr);
  let mauTot = colorItemsToRich(mauTotItems);
  if (mauTot === "—") mauTot = joinColorLabels(mauArr);
  if (mauTot === "—") {
    mauTot = pickStr(nested, [
      "mau_tot",
      "mauTot",
      "colors",
      "mau_chu_dao",
    ]);
  }

  const soTotNumbers = parseSoNumbers(nested.so_may_man ?? nested.soMayMan);
  let soTot = soTotNumbers.length ? soTotNumbers.join(", ") : "—";
  if (soTot === "—") {
    soTot = pickStr(nested, [
      "so_tot",
      "soTot",
      "lucky_numbers",
      "con_so",
    ]);
  }

  if (mode === "teaser") {
    return {
      status,
      version,
      purpose,
      userMenhLabel,
      dungThanApi,
      kyThanApi: null,
      huongTotItems,
      mauTotItems,
      soTotNumbers,
      huongTot,
      mauTot,
      soTot,
      huongXau: "—",
      mauKy: "—",
      soKy: "—",
      goiY: [],
      purposeSpecific: null,
      personalization: null,
      phiTinhYear: null,
      phiTinh: [],
      huongTotNamNay: [],
      huongXauNamNay: [],
      hoaGiai: [],
      phiTinhNoteVi: null,
      coupleHarmony: null,
    };
  }

  const kyThanRaw = pickStr(nested, ["ky_than", "kyThan"]);
  const kyThanApi = kyThanRaw !== "—" ? kyThanRaw : null;

  const hxArr = nested.huong_xau ?? nested.huongXau;
  const hxItems = parseDirectionItems(hxArr);
  let huongXau = joinDirectionsFromItems(hxItems);
  if (huongXau === "—") {
    const fall = hxItems.map((i) => i.direction).join(", ");
    huongXau = fall || "—";
  }
  if (huongXau === "—") {
    huongXau = pickStr(nested, ["huong_xau_text", "bad_directions"]);
  }

  const mkRaw = nested.mau_ky ?? nested.mauKy;
  let mauKy = "—";
  if (typeof mkRaw === "string" && mkRaw.trim()) {
    mauKy = mkRaw.trim();
  } else {
    const mkItems = parseColorItems(mkRaw);
    mauKy = colorItemsToRich(mkItems);
    if (mauKy === "—") mauKy = joinColorLabels(mkRaw);
  }
  if (mauKy === "—") {
    mauKy = pickStr(nested, [
      "mau_ky_text",
      "mauKyText",
      "bad_colors",
      "colors_to_avoid",
      "avoid_colors",
    ]);
  }

  let soKy = joinNumbersLegacy(nested.so_ky ?? nested.soKy);
  if (soKy === "—") {
    soKy = pickStr(nested, ["so_ky_text", "unlucky_numbers"]);
  }

  if (huongXau === "—" && mauKy === "—" && soKy === "—") {
    const fallback = pickStr(nested, ["can_ky", "canKy", "avoid", "kieng_ky"]);
    if (fallback !== "—") huongXau = fallback;
  }

  let goiY = normalizeGoiY(nested.goi_y ?? nested.goiY ?? nested.suggestions);
  const fromVatPham = mapVatPhamToGoiY(nested.vat_pham ?? nested.vatPham);
  if (fromVatPham.length) {
    goiY = goiY.length ? [...goiY, ...fromVatPham] : fromVatPham;
  }
  if (!goiY.length) {
    const single = pickStr(nested, ["goi_y_text", "advice", "full_text"]);
    if (single !== "—") {
      goiY = [{ tieu_de: "Gợi ý chi tiết", mo_ta: single }];
    }
  }

  const purposeSpecific = parsePurposeSpecific(
    nested.purpose_specific ?? nested.purposeSpecific,
  );
  const personalization = parsePersonalization(
    nested.personalization,
  );

  const yearRaw = nested.phi_tinh_year ?? nested.phiTinhYear;
  let phiTinhYear: number | null = null;
  if (typeof yearRaw === "number" && Number.isFinite(yearRaw)) {
    phiTinhYear = yearRaw;
  } else if (typeof yearRaw === "string") {
    const y = Number.parseInt(yearRaw, 10);
    if (Number.isFinite(y)) phiTinhYear = y;
  }

  const phiTinh = parsePhiTinh(nested.phi_tinh ?? nested.phiTinh);
  const huongTotNamNay = parseStringList(
    nested.huong_tot_nam_nay ?? nested.huongTotNamNay,
  );
  const huongXauNamNay = parseStringList(
    nested.huong_xau_nam_nay ?? nested.huongXauNamNay,
  );
  const hoaGiai = parseHoaGiai(nested.hoa_giai ?? nested.hoaGiai);
  const noteRaw = pickStr(nested, ["phi_tinh_note_vi", "phiTinhNoteVi"]);
  const phiTinhNoteVi = noteRaw !== "—" ? noteRaw : null;
  const coupleHarmony = parseCoupleHarmony(
    nested.couple_harmony ?? nested.coupleHarmony,
  );

  return {
    status,
    version,
    purpose,
    userMenhLabel,
    dungThanApi,
    kyThanApi,
    huongTotItems,
    mauTotItems,
    soTotNumbers,
    huongTot,
    huongXau,
    mauTot,
    mauKy,
    soTot,
    soKy,
    goiY,
    purposeSpecific,
    personalization,
    phiTinhYear,
    phiTinh,
    huongTotNamNay,
    huongXauNamNay,
    hoaGiai,
    phiTinhNoteVi,
    coupleHarmony,
  };
}

function joinNumbersLegacy(arr: unknown): string {
  if (!Array.isArray(arr)) return "—";
  const nums = arr.filter((x) => typeof x === "number" && Number.isFinite(x));
  return nums.length ? nums.join(", ") : "—";
}

/** Chỉ block tốt: meta + mệnh + Dụng Thần + hướng/màu/số tốt — không Kỵ Thần và không map paywall fields. */
export function phongThuyPayloadToTeaserView(data: unknown): PhongThuyView | null {
  return phongThuyPayloadToViewInner(data, "teaser");
}

/** Map đầy đủ GET /v1/phong-thuy → view (block 1–8). */
export function phongThuyPayloadToView(data: unknown): PhongThuyView | null {
  return phongThuyPayloadToViewInner(data, "full");
}
