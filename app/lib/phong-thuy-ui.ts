/** Query `purpose` — GET /v1/phong-thuy (OpenAPI). */
export const PHONG_THUY_PURPOSE_OPTIONS = [
  { value: "NHA_O", label: "Nhà ở" },
  { value: "VAN_PHONG", label: "Văn phòng" },
  { value: "CUA_HANG", label: "Cửa hàng" },
  { value: "PHONG_KHACH", label: "Phòng khách" },
] as const;

export type PhongThuyPurposeValue =
  (typeof PHONG_THUY_PURPOSE_OPTIONS)[number]["value"];

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

function joinDirections(arr: unknown): string {
  if (!Array.isArray(arr)) return "—";
  const parts: string[] = [];
  for (const item of arr) {
    const o = asRecord(item);
    if (!o) continue;
    const d = pickStr(o, ["direction", "huong", "name", "label"]);
    if (d !== "—") parts.push(d);
  }
  return parts.length ? parts.join(", ") : "—";
}

/** Hướng + lý do / hành (GET /v1/phong-thuy). */
function joinDirectionsRich(arr: unknown): string {
  if (!Array.isArray(arr)) return "—";
  const parts: string[] = [];
  for (const item of arr) {
    const o = asRecord(item);
    if (!o) continue;
    const d = pickStr(o, ["direction", "huong", "name", "label"]);
    if (d === "—") continue;
    const reason = pickStr(o, ["reason", "ly_do", "giai_thich", "mo_ta"]);
    const el = pickStr(o, ["element", "hanh"]);
    let s = d;
    if (reason !== "—") s += ` — ${reason}`;
    else if (el !== "—") s += ` (${el})`;
    parts.push(s);
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

/** Tên màu + mã hex khi API có (đưa tay thợ). */
function joinColorLabelsRich(arr: unknown): string {
  if (!Array.isArray(arr)) return "—";
  const parts: string[] = [];
  for (const item of arr) {
    const o = asRecord(item);
    if (!o) continue;
    const c = pickStr(o, ["color", "mau", "name", "label"]);
    const hexRaw = pickStr(o, ["hex", "mau_hex", "color_hex"]);
    let hex: string | null = null;
    if (hexRaw !== "—") {
      const t = hexRaw.trim();
      if (/^#[0-9A-Fa-f]{3,8}$/.test(t)) hex = t;
      else if (/^[0-9A-Fa-f]{6}$/.test(t)) hex = `#${t}`;
    }
    if (c !== "—") {
      parts.push(hex ? `${c} ${hex}` : c);
    } else if (hex) {
      parts.push(hex);
    }
  }
  return parts.length ? parts.join(" · ") : "—";
}

function joinNumbers(arr: unknown): string {
  if (!Array.isArray(arr)) return "—";
  const nums = arr.filter((x) => typeof x === "number" && Number.isFinite(x));
  return nums.length ? nums.join(", ") : "—";
}

function mapVatPhamToGoiY(raw: unknown): PhongThuyGoiY[] {
  if (!Array.isArray(raw)) return [];
  const out: PhongThuyGoiY[] = [];
  for (const item of raw) {
    const o = asRecord(item);
    if (!o) continue;
    const tieu_de = pickStr(o, ["item", "title", "name", "vat_pham"]);
    const reason = pickStr(o, ["reason", "mo_ta", "description", "giai_thich"]);
    const el = pickStr(o, ["element", "hanh"]);
    const mo_ta =
      reason !== "—"
        ? el !== "—"
          ? `${reason} (${el})`
          : reason
        : el !== "—"
          ? `Hành ${el}`
          : "—";
    if (tieu_de !== "—" || mo_ta !== "—") {
      out.push({
        tieu_de: tieu_de !== "—" ? tieu_de : "Gợi ý",
        mo_ta: mo_ta !== "—" ? mo_ta : "",
      });
    }
  }
  return out;
}

export interface PhongThuyGoiY {
  tieu_de: string;
  mo_ta: string;
}

export interface PhongThuyView {
  /** Nạp Âm từ API ({ name, hanh }) — ưu tiên hiển thị khi có. */
  userMenhLabel: string | null;
  /** Dụng / Kỵ từ response (có thể khác snapshot lá số nếu API tính lại theo giờ sinh). */
  dungThanApi: string | null;
  kyThanApi: string | null;
  huongTot: string;
  huongXau: string;
  mauTot: string;
  mauKy: string;
  soTot: string;
  soKy: string;
  goiY: PhongThuyGoiY[];
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

/** Map GET /v1/phong-thuy JSON → màn hình (tu-tru-api: mảng hướng/màu/số). */
export function phongThuyPayloadToView(data: unknown): PhongThuyView | null {
  const root = asRecord(data);
  if (!root) return null;
  const nested =
    asRecord(root.data) ?? asRecord(root.result) ?? asRecord(root.phong_thuy) ?? root;

  const userMenhLabel =
    formatUserMenh(nested.user_menh ?? nested.userMenh) ??
    (pickStr(nested, ["user_menh_label", "menh_label"]) !== "—"
      ? pickStr(nested, ["user_menh_label", "menh_label"])
      : null);
  const dungThanRaw = pickStr(nested, ["dung_than", "dungThan"]);
  const kyThanRaw = pickStr(nested, ["ky_than", "kyThan"]);
  const dungThanApi = dungThanRaw !== "—" ? dungThanRaw : null;
  const kyThanApi = kyThanRaw !== "—" ? kyThanRaw : null;

  const huArr = nested.huong_tot ?? nested.huongTot;
  let huongTot = joinDirectionsRich(huArr);
  if (huongTot === "—") huongTot = joinDirections(huArr);
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
  let mauTot = joinColorLabelsRich(mauArr);
  if (mauTot === "—") mauTot = joinColorLabels(mauArr);
  if (mauTot === "—") {
    mauTot = pickStr(nested, [
      "mau_tot",
      "mauTot",
      "colors",
      "mau_chu_dao",
    ]);
  }

  let soTot = joinNumbers(nested.so_may_man ?? nested.soMayMan);
  if (soTot === "—") {
    soTot = pickStr(nested, [
      "so_tot",
      "soTot",
      "lucky_numbers",
      "con_so",
    ]);
  }

  const hxArr = nested.huong_xau ?? nested.huongXau;
  let huongXau = joinDirectionsRich(hxArr);
  if (huongXau === "—") huongXau = joinDirections(hxArr);
  if (huongXau === "—") {
    huongXau = pickStr(nested, ["huong_xau_text", "bad_directions"]);
  }

  const mkRaw = nested.mau_ky ?? nested.mauKy;
  let mauKy = "—";
  if (typeof mkRaw === "string" && mkRaw.trim()) {
    mauKy = mkRaw.trim();
  } else {
    mauKy = joinColorLabelsRich(mkRaw);
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

  let soKy = joinNumbers(nested.so_ky ?? nested.soKy);
  if (soKy === "—") {
    soKy = pickStr(nested, ["so_ky_text", "unlucky_numbers"]);
  }

  if (huongXau === "—" && mauKy === "—" && soKy === "—") {
    const fallback = pickStr(nested, ["can_ky", "canKy", "avoid", "kieng_ky"]);
    if (fallback !== "—") {
      huongXau = fallback;
    }
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

  return {
    userMenhLabel,
    dungThanApi,
    kyThanApi,
    huongTot,
    huongXau,
    mauTot,
    mauKy,
    soTot,
    soKy,
    goiY,
  };
}
