function asRecord(x: unknown): Record<string, unknown> | null {
  if (x && typeof x === "object" && !Array.isArray(x)) {
    return x as Record<string, unknown>;
  }
  return null;
}

/** Human-readable lines from POST /v1/chon-ngay/detail response. */
export function extractDetailReasonLines(data: unknown): string[] {
  const root = asRecord(data);
  if (!root) return [];

  const directKeys = [
    "reasons",
    "ly_do",
    "lyDo",
    "details",
    "explanations",
    "messages",
    "notes",
    "highlights",
  ];
  for (const k of directKeys) {
    const v = root[k];
    if (Array.isArray(v)) {
      const lines = v.filter((x) => typeof x === "string") as string[];
      if (lines.length) return lines;
    }
  }

  const text =
    root.reason_vi ??
    root.summary_vi ??
    root.verdict_vi ??
    root.detail ??
    root.explanation ??
    root.summary;
  if (typeof text === "string" && text.trim()) {
    return text
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const layer3 = asRecord(root.layer3);
  const breakdown = layer3?.breakdown;
  if (Array.isArray(breakdown)) {
    const lines: string[] = [];
    for (const item of breakdown) {
      const o = asRecord(item);
      if (!o) continue;
      const rv = o.reason_vi;
      if (typeof rv === "string" && rv.trim()) lines.push(rv.trim());
    }
    if (lines.length) return lines;
  }

  const lines: string[] = [];
  for (const [k, v] of Object.entries(root)) {
    if (
      typeof v === "string" &&
      v.length > 2 &&
      /^(why|note|hint|luu_y)/i.test(k)
    ) {
      lines.push(v);
    }
  }
  return lines;
}
