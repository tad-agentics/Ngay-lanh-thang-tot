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
  huongTot: string;
  mauTot: string;
  soTot: string;
  canKy: string;
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

function buildCanKyFromArrays(nested: Record<string, unknown>): string {
  const badDir = joinDirections(nested.huong_xau ?? nested.huongXau);
  const badCol = joinColorLabels(nested.mau_ky ?? nested.mauKy);
  const badNum = joinNumbers(nested.so_ky ?? nested.soKy);
  const parts: string[] = [];
  if (badDir !== "—") parts.push(`Tránh hướng: ${badDir}`);
  if (badCol !== "—") parts.push(`Màu kỵ: ${badCol}`);
  if (badNum !== "—") parts.push(`Số kỵ: ${badNum}`);
  const merged = parts.length ? parts.join(". ") : "—";
  if (merged !== "—") return merged;
  return pickStr(nested, ["can_ky", "canKy", "avoid", "kieng_ky"]);
}

/** Map GET /v1/phong-thuy JSON → màn hình (tu-tru-api: mảng hướng/màu/số). */
export function phongThuyPayloadToView(data: unknown): PhongThuyView | null {
  const root = asRecord(data);
  if (!root) return null;
  const nested =
    asRecord(root.data) ?? asRecord(root.result) ?? asRecord(root.phong_thuy) ?? root;

  let huongTot = joinDirections(nested.huong_tot ?? nested.huongTot);
  if (huongTot === "—") {
    huongTot = pickStr(nested, [
      "huong_tot",
      "huongTot",
      "huong_tốt",
      "good_directions",
      "direction_good",
    ]);
  }

  let mauTot = joinColorLabels(nested.mau_may_man ?? nested.mauMayMan);
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

  let canKy = buildCanKyFromArrays(nested);

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
    huongTot,
    mauTot,
    soTot,
    canKy,
    goiY,
  };
}
