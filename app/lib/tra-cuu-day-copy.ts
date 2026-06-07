/** Anchor-reading helpers for Tra cứu day screen (G2). */

function firstSentence(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const m = trimmed.match(/^[^.!?…]+[.!?…]?/);
  return m ? m[0].trim() : trimmed.slice(0, 120);
}

/** Verdict block body — first sentence of anchor reading, else fallback. */
export function traCuuDayWhyFromReading(
  reading: string | null | undefined,
  fallback: string,
): string {
  if (!reading?.trim()) return fallback;
  return firstSentence(reading) ?? fallback;
}

/**
 * “Lưu ý” row — remainder of anchor prose after first sentence (plan G2).
 * Falls back to a short breakdown line when anchor is absent.
 */
export function traCuuDayLuuY(
  reading: string | null | undefined,
  breakdownLuuY: string | null | undefined,
): string | null {
  if (reading?.trim()) {
    const trimmed = reading.trim();
    const first = firstSentence(trimmed);
    if (first) {
      const rest = trimmed
        .slice(first.length)
        .trim()
        .replace(/^[.!?…\s]+/, "");
      if (rest) {
        const second = rest.match(/^[^.!?…]+[.!?…]?/);
        const snippet = (second ? second[0] : rest).trim();
        if (snippet.length >= 8) return snippet;
      }
    }
  }
  const fb = breakdownLuuY?.trim();
  return fb && fb.length >= 8 ? fb : null;
}
