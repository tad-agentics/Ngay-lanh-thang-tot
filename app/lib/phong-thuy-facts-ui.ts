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
  return "";
}

function unwrapFactsRoot(data: unknown): Record<string, unknown> | null {
  const root = asRecord(data);
  if (!root) return null;
  return asRecord(root.data) ?? asRecord(root.result) ?? root;
}

export type PhongThuyDirectionCard = {
  name: string;
  sub: string;
  highlight: boolean;
};

export type PhongThuyColorSwatch = {
  name: string;
  hex: string;
};

export type PhongThuyPhiTinhCell = {
  direction: string;
  star: string;
  tone: "good" | "bad" | "neutral";
};

export type PhongThuyFactsView = {
  huongTot: PhongThuyDirectionCard[];
  huongXau: string[];
  mauMay: PhongThuyColorSwatch[];
  mauKy: string[];
  phiTinh: PhongThuyPhiTinhCell[];
  phiTinhNote: string | null;
};

function stringList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const x of raw) {
    if (typeof x === "string" && x.trim()) out.push(x.trim());
    else {
      const o = asRecord(x);
      if (o) {
        const n = pickStr(o, ["name", "label", "direction", "huong"]);
        if (n) out.push(n);
      }
    }
  }
  return out;
}

function parseDirectionCards(
  raw: unknown,
  highlightFirst = false,
): PhongThuyDirectionCard[] {
  if (!Array.isArray(raw)) {
    return stringList(raw).map((name, i) => ({
      name,
      sub: "",
      highlight: highlightFirst && i === 0,
    }));
  }
  return raw
    .map((item, i) => {
      if (typeof item === "string" && item.trim()) {
        return {
          name: item.trim(),
          sub: "",
          highlight: highlightFirst && i === 0,
        };
      }
      const o = asRecord(item);
      if (!o) return null;
      const name = pickStr(o, ["name", "label", "direction", "huong"]);
      if (!name) return null;
      return {
        name,
        sub: pickStr(o, ["sub", "subtitle", "mo_ta", "description", "type"]),
        highlight: highlightFirst && i === 0,
      };
    })
    .filter((x): x is PhongThuyDirectionCard => x != null);
}

const COLOR_HEX: Record<string, string> = {
  trắng: "#e8e6df",
  trang: "#e8e6df",
  xám: "#8a8c8c",
  xam: "#8a8c8c",
  "xanh đậm": "#1d2538",
  "xanh dam": "#1d2538",
  "xanh rêu": "#1d3129",
  "xanh reu": "#1d3129",
  đỏ: "#c5402a",
  do: "#c5402a",
  vàng: "#c8a55a",
  vang: "#c8a55a",
  nâu: "#8b6914",
  nau: "#8b6914",
};

function colorHex(name: string): string {
  const key = name.toLowerCase().trim();
  return COLOR_HEX[key] ?? "#d4cfc4";
}

function parseColorSwatches(raw: unknown): PhongThuyColorSwatch[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === "string" && item.trim()) {
        const name = item.trim();
        return { name, hex: colorHex(name) };
      }
      const o = asRecord(item);
      if (!o) return null;
      const name = pickStr(o, ["name", "label", "color"]);
      if (!name) return null;
      const hex =
        pickStr(o, ["hex", "color_hex", "value"]) || colorHex(name);
      return { name, hex };
    })
    .filter((x): x is PhongThuyColorSwatch => x != null);
}

function phiTone(star: string): "good" | "bad" | "neutral" {
  const s = star.toLowerCase();
  if (/bệnh|phá|tử|họa|kiếp|sát/.test(s)) return "bad";
  if (/tài|hỷ|văn|sinh|quý|bạch/.test(s)) return "good";
  return "neutral";
}

function parsePhiTinh(raw: unknown): PhongThuyPhiTinhCell[] {
  if (!Array.isArray(raw)) return [];
  const out: PhongThuyPhiTinhCell[] = [];
  for (const item of raw) {
    const o = asRecord(item);
    if (!o) continue;
    const direction = pickStr(o, ["direction", "huong", "dir", "label"]);
    const star = pickStr(o, ["star", "sao", "label_vi", "name"]);
    if (!direction || !star) continue;
    out.push({ direction, star, tone: phiTone(star) });
  }
  return out;
}

/** Parse `GET /v1/phong-thuy` full response for rich §04 UI. */
export function parsePhongThuyFactsView(data: unknown): PhongThuyFactsView | null {
  const root = unwrapFactsRoot(data);
  if (!root) return null;

  const huongTot = parseDirectionCards(
    root.huong_tot_nam_nay ?? root.huong_tot ?? root.huongTot,
    true,
  );
  const huongXau = stringList(
    root.huong_xau_nam_nay ?? root.huong_xau ?? root.huongXau,
  );
  const mauMay = parseColorSwatches(root.mau_may_man ?? root.mauMayMan);
  const mauKy = stringList(root.mau_ky ?? root.mauKy);
  const phiTinh = parsePhiTinh(root.phi_tinh ?? root.phiTinh);
  const phiTinhNote =
    pickStr(root, ["phi_tinh_note_vi", "phiTinhNoteVi", "note_vi"]) || null;

  if (
    huongTot.length === 0 &&
    huongXau.length === 0 &&
    mauMay.length === 0 &&
    phiTinh.length === 0 &&
    !phiTinhNote
  ) {
    return null;
  }

  return {
    huongTot,
    huongXau,
    mauMay,
    mauKy,
    phiTinh,
    phiTinhNote,
  };
}
