/** Strip LLM meta (greetings, markdown section titles) from NLTT luận prose. */

const SECTION_HEADER_NORM =
  /^(tong quan tinh cach|tinh cach|su nghiep va tai van|su nghiep|tai van|suc khoe|tinh duyen|menh tong quan)(\s|$)/;

function stripDiacritics(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function normalizeHeaderToken(line: string): string {
  return stripDiacritics(line.replace(/\*\*/g, "").trim()).replace(/\s+/g, " ");
}

function isStandaloneSectionHeader(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  const inner = trimmed.replace(/^\*\*(.+)\*\*\.?$/u, "$1").trim();
  const norm = normalizeHeaderToken(inner);
  if (SECTION_HEADER_NORM.test(norm)) return true;
  return (
    inner.length < 72 &&
    !/[.!?…]/.test(inner) &&
    /^(tổng quan|tính cách|sự nghiệp|tài vận|sức khỏe|tình duyên|mệnh tổng quan)/iu.test(
      inner,
    )
  );
}

/** Remove opening greeting / meta intro sentences. */
export function stripNlttLuanOpeningGreeting(text: string): string {
  let t = text.trim();
  t = t.replace(/^(chào bạn|xin chào)[^.?!…]*[.?!…]\s*/iu, "");
  t = t.replace(/^đây là (những )?luận giải[^.?!…]*[.?!…]\s*/iu, "");
  t = t.replace(/^dưới đây là[^.?!…]*[.?!…]\s*/iu, "");
  return t.trim();
}

export function sanitizeNlttLuanProse(raw: string): string {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) return "";

  const keptLines: string[] = [];
  for (const line of trimmed.split("\n")) {
    if (isStandaloneSectionHeader(line)) continue;
    keptLines.push(line);
  }

  const paragraphs = keptLines
    .join("\n")
    .split(/\n\n+/)
    .map((p) => {
      let para = p.trim();
      para = para.replace(/^\*\*[^*]+\*\*\s*/u, "");
      para = para.replace(/\*\*([^*]+)\*\*/g, "$1");
      para = stripNlttLuanOpeningGreeting(para);
      return para.trim();
    })
    .filter((p) => p.length > 0);

  while (paragraphs.length > 0) {
    const first = paragraphs[0].toLowerCase();
    if (
      (/^(chào bạn|xin chào|đây là những luận)/.test(first) ||
        /luận giải chi tiết về lá số/.test(first)) &&
      first.length < 200
    ) {
      paragraphs.shift();
      continue;
    }
    break;
  }

  return paragraphs.join("\n\n");
}

export function splitNlttLuanParagraphs(text: string): string[] {
  return sanitizeNlttLuanProse(text)
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}
