/** Teaser luận trên lịch tờ — khớp maket `CTodayReasoning` (~2–3 câu). */
export const INLINE_READING_MAX_SENTENCES = 3;
export const INLINE_READING_MAX_CHARS = 260;

/** Rút gọn đoạn luận AI cho khối inline trên lịch tờ. */
export function shortenInlineReading(
  text: string,
  maxSentences: number = INLINE_READING_MAX_SENTENCES,
  maxChars: number = INLINE_READING_MAX_CHARS,
): string {
  const t = text.trim();
  if (!t) return t;

  const sentences: string[] = [];
  let buf = "";
  for (let i = 0; i < t.length; i++) {
    const ch = t[i]!;
    buf += ch;
    const next = t[i + 1];
    if (/[.!?…]/.test(ch) && (next == null || /\s/u.test(next))) {
      const s = buf.trim();
      if (s) sentences.push(s);
      buf = "";
    }
  }
  const tail = buf.trim();
  if (tail) sentences.push(tail);

  let out =
    sentences.length > 0
      ? sentences.slice(0, maxSentences).join(" ")
      : t;

  if (out.length <= maxChars) return out;

  out = out.slice(0, maxChars);
  const lastSpace = out.lastIndexOf(" ");
  if (lastSpace > maxChars * 0.55) {
    out = out.slice(0, lastSpace);
  }
  out = out.replace(/[,;:\s]+$/u, "");
  if (!/[.!?…]$/u.test(out)) out += "…";
  return out;
}
