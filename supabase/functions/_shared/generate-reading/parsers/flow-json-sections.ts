/** Shared JSON field helpers for tieu-van / luu-nien 3-part parsers. */

export function snakeToCamelAlias(snake: string): string {
  return snake.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

export function coerceFlowSectionText(v: unknown): string | null {
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
    return coerceFlowSectionText(nest);
  }
  return null;
}

export function pickFlowJsonField(
  record: Record<string, unknown>,
  snake: string,
): string | null {
  const camel = snakeToCamelAlias(snake);
  return (
    coerceFlowSectionText(record[snake]) ??
    coerceFlowSectionText(record[camel])
  );
}
