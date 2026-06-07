/** First 1–2 sentences of menh_tong_quan for home/paywall teasers. */
export function truncateMenhProsePreview(prose: string, maxSentences = 2): string {
  const trimmed = prose.trim();
  if (!trimmed) return "";

  const sentences = trimmed.match(/[^.!?…]+[.!?…]+/gu);
  if (!sentences || sentences.length === 0) {
    return trimmed.length > 140 ? `${trimmed.slice(0, 140).trim()}…` : trimmed;
  }
  if (sentences.length <= maxSentences) return trimmed;
  return `${sentences.slice(0, maxSentences).join(" ").replace(/\s+/g, " ").trim()}…`;
}
