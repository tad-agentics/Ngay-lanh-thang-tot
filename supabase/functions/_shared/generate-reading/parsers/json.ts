export function stripCodeFence(s: string): string {
  const t = s.trim();
  const m = t.match(/^```(?:json)?\s*([\s\S]*?)```$/im);
  return m ? m[1].trim() : t;
}

/** Parse JSON object; chịu preamble / text thừa quanh JSON. */
export function tryParseLaSoChiTietRecord(
  text: string,
): Record<string, unknown> | null {
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
