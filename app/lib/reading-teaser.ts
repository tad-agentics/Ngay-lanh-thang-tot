/** Chia đoạn luận — nửa đầu hiện, nửa sau nằm trong vùng blur (paywall chưa gói). */
export function splitReadingAtHalf(text: string): {
  visible: string;
  locked: string;
} {
  const t = text.trim();
  if (!t) return { visible: "", locked: "" };
  if (t.length <= 48) return { visible: t, locked: "" };

  let mid = Math.floor(t.length / 2);
  const before = t.slice(0, mid);
  const punct = [". ", "! ", "? ", "… "] as const;
  let lastEnd = -1;
  for (const p of punct) {
    const i = before.lastIndexOf(p);
    if (i > lastEnd) lastEnd = i;
  }
  if (lastEnd > t.length * 0.2) {
    mid = lastEnd + 1;
  } else {
    const after = t.slice(mid);
    const rel = after.search(/[.!?…][\s\u00a0]/);
    if (rel >= 0) mid = mid + rel + 1;
  }

  let visible = t.slice(0, mid).trimEnd();
  let locked = t.slice(mid).trimStart();
  if (!locked && visible.length > 40) {
    const fallback = Math.floor(t.length * 0.52);
    visible = t.slice(0, fallback).trimEnd();
    locked = t.slice(fallback).trimStart();
  }
  if (!visible) return { visible: t, locked: "" };
  return { visible, locked };
}
