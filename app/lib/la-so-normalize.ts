/** OpenAPI 0.1.2 — normalize `LaSoResponse` / `TuTruResponse` for display mappers. */

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

function thanElementFromUnknown(raw: unknown): string {
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  const o = asRecord(raw);
  if (!o) return "";
  return pickStr(o, ["element", "name", "label", "ten", "hanh"]);
}

/** GET /v1/la-so — `PillarsContract` at top level. */
export function isLaSoResponseShape(raw: Record<string, unknown>): boolean {
  const pillars = asRecord(raw.pillars);
  const day = pillars ? asRecord(pillars.day) : null;
  return Boolean(day && (day.can != null || day.chi != null));
}

/** POST /v1/tu-tru — lighter onboarding cache shape. */
export function isTuTruResponseShape(raw: Record<string, unknown>): boolean {
  if (isLaSoResponseShape(raw)) return false;
  return (
    typeof raw.birth_date === "string" &&
    (typeof raw.birth_year_can_chi === "string" ||
      raw.engine_version != null ||
      asRecord(raw.menh) != null)
  );
}

/** Map `TuTruResponse` fields → la-so display keys (REQ-P2-04 adapter). */
export function adaptTuTruToLaSoShape(
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...raw };
  const menh = asRecord(raw.menh);

  if (menh) {
    const napAm = pickStr(menh, ["nap_am_name", "napAmName", "name", "label"]);
    if (napAm) out.menh = napAm;

    if (typeof raw.dung_than !== "string") {
      const dt =
        thanElementFromUnknown(raw.dung_than) ||
        pickStr(menh, ["duong_than", "dung_than", "dungThan"]);
      if (dt) out.dung_than = dt;
    }
    if (typeof raw.ky_than !== "string") {
      const kt =
        thanElementFromUnknown(raw.ky_than) ||
        pickStr(menh, ["ky_than", "kyThan"]);
      if (kt) out.ky_than = kt;
    }
  } else {
    if (typeof raw.dung_than !== "string") {
      const dt = thanElementFromUnknown(raw.dung_than);
      if (dt) out.dung_than = dt;
    }
    if (typeof raw.ky_than !== "string") {
      const kt = thanElementFromUnknown(raw.ky_than);
      if (kt) out.ky_than = kt;
    }
  }

  if (raw.element_counts != null && out._raw == null) {
    out._raw = { element_counts: raw.element_counts };
  }

  return out;
}

/** Prefer canonical OpenAPI layer before legacy alias scanning. */
export function normalizeLaSoPayload(raw: unknown): unknown {
  const root = asRecord(raw);
  if (!root) return raw;

  if (isLaSoResponseShape(root)) return root;

  const unwrapped =
    asRecord(root.data) ??
    asRecord(root.result) ??
    asRecord(root.tu_tru) ??
    root;

  if (isLaSoResponseShape(unwrapped)) return unwrapped;
  if (isTuTruResponseShape(unwrapped)) return adaptTuTruToLaSoShape(unwrapped);
  if (isTuTruResponseShape(root)) return adaptTuTruToLaSoShape(root);

  return unwrapped;
}
