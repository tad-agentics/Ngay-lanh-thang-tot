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

/** Map GET /v1/phong-thuy JSON → màn hình (OpenAPI response schema trống — keys linh hoạt). */
export function phongThuyPayloadToView(data: unknown): PhongThuyView | null {
  const root = asRecord(data);
  if (!root) return null;
  const nested =
    asRecord(root.data) ?? asRecord(root.result) ?? asRecord(root.phong_thuy) ?? root;

  const huongTot = pickStr(nested, [
    "huong_tot",
    "huongTot",
    "huong_tốt",
    "good_directions",
    "direction_good",
  ]);
  const mauTot = pickStr(nested, [
    "mau_tot",
    "mauTot",
    "colors",
    "mau_chu_dao",
  ]);
  const soTot = pickStr(nested, [
    "so_tot",
    "soTot",
    "lucky_numbers",
    "con_so",
  ]);
  const canKy = pickStr(nested, [
    "can_ky",
    "canKy",
    "avoid",
    "kieng_ky",
  ]);

  let goiY = normalizeGoiY(nested.goi_y ?? nested.goiY ?? nested.suggestions);

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
