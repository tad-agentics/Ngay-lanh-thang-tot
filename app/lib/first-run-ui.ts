/** Direction C first-run (09–11) copy helpers. */

/** Format canh range for selection detail — e.g. Mão → "5–7h sáng". */
export function formatCanhRangeDetail(range: string, canhName: string): string {
  const base = range.trim();
  if (canhName === "Tý") return base;
  if (canhName === "Sửu" || canhName === "Dần") return `${base} sáng sớm`;
  if (canhName === "Mão" || canhName === "Thìn") return `${base} sáng`;
  if (canhName === "Tỵ") return `${base} sáng`;
  if (canhName === "Ngọ" || canhName === "Mùi") return `${base} trưa`;
  if (canhName === "Thân" || canhName === "Dậu") return `${base} chiều`;
  if (canhName === "Tuất" || canhName === "Hợi") return `${base} tối`;
  return base;
}

export function buildingCalendarQuote(menhTagline: string | null): string {
  if (menhTagline) return `"${menhTagline}"`;
  return '"Đang dựng lịch theo tứ trụ của bạn…"';
}

/** Selection detail on screen 09 — range + hour pillar from tu-tru-preview. */
export function formatCanhSelectionDetail(
  range: string,
  canhName: string,
  pillar: { label: string; hanh: string } | null,
  loading: boolean,
): string {
  const rangePart = formatCanhRangeDetail(range, canhName);
  if (loading) return `${rangePart} · đang tính trụ giờ…`;
  if (!pillar) {
    return `${rangePart} · trụ giờ theo canh ${canhName}`;
  }
  const hanhPart = pillar.hanh !== "—" ? ` · hành ${pillar.hanh}` : "";
  return `${rangePart} · trụ giờ ${pillar.label}${hanhPart}`;
}
