export type TextSpan = { start: number; end: number };

function extractSentenceSpans(text: string): TextSpan[] {
  const spans: TextSpan[] = [];
  let bufStart = 0;
  let i = 0;

  while (i < text.length) {
    const ch = text[i]!;
    const next = text[i + 1];
    if (/[.!?…]/.test(ch) && (next == null || /\s/u.test(next))) {
      const end = i + 1;
      const t = text.slice(bufStart, end).trim();
      if (t) spans.push({ start: bufStart, end });
      let j = end;
      while (j < text.length && /\s/u.test(text[j]!)) j++;
      bufStart = j;
      i = j;
      continue;
    }
    i++;
  }

  const tail = text.slice(bufStart).trim();
  if (tail) spans.push({ start: bufStart, end: text.length });
  return spans;
}

function spansFromBlocks(text: string, blocks: string[]): TextSpan[] {
  const spans: TextSpan[] = [];
  let cursor = 0;
  for (const block of blocks) {
    const idx = text.indexOf(block, cursor);
    if (idx === -1) return [{ start: 0, end: text.length }];
    spans.push({ start: idx, end: idx + block.length });
    cursor = idx + block.length;
  }
  return spans.length > 0 ? spans : [{ start: 0, end: text.length }];
}

/** Group luận giải prose into readable paragraph spans (preserves indices in `text`). */
export function paragraphSpansInText(
  text: string,
  sentencesPerParagraph = 2,
): TextSpan[] {
  const t = text.trim();
  if (!t) return [];

  const doubleBreak = t.split(/\n\s*\n/);
  if (doubleBreak.length > 1) {
    const blocks = doubleBreak.map((b) => b.trim()).filter(Boolean);
    return spansFromBlocks(text, blocks);
  }

  if (t.includes("\n")) {
    const lines = t.split(/\n/).map((l) => l.trim()).filter(Boolean);
    return spansFromBlocks(text, lines);
  }

  const sentences = extractSentenceSpans(text);
  if (sentences.length <= 1) {
    return [{ start: sentences[0]?.start ?? 0, end: sentences[0]?.end ?? text.length }];
  }

  const spans: TextSpan[] = [];
  for (let i = 0; i < sentences.length; i += sentencesPerParagraph) {
    const group = sentences.slice(i, i + sentencesPerParagraph);
    spans.push({
      start: group[0]!.start,
      end: group[group.length - 1]!.end,
    });
  }
  return spans;
}
