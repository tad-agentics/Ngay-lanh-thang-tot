import type { LaSoChiTietSection } from "./types.ts";
import { LA_SO_ASPECT_TITLES } from "../parsers/la-so.ts";
import {
  normalizeDayReadingsRecord,
  parseChonNgayDayReadingsJson,
} from "../parsers/chon-ngay.ts";
import { tryParseLaSoChiTietRecord } from "../parsers/json.ts";

export function stableStringify(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "null";
  if (typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((v) => stableStringify(v)).join(",")}]`;
  }
  const o = value as Record<string, unknown>;
  const keys = Object.keys(o).sort();
  const parts = keys.map((k) => {
    const v = o[k];
    return `${JSON.stringify(k)}:${stableStringify(v === undefined ? null : v)}`;
  });
  return `{${parts.join(",")}}`;
}

export async function sha256Prefix16(text: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text),
  );
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hex.slice(0, 16);
}

export function readCachedBody(
  endpoint: string,
  reading: string,
): {
  reading: string | null;
  sections: LaSoChiTietSection[] | null;
  dayReadings: Record<string, string> | null;
} {
  if (endpoint === "chon-ngay-cards") {
    try {
      const o = JSON.parse(reading) as { day_readings?: unknown };
      const map = normalizeDayReadingsRecord(o.day_readings);
      if (map) return { reading: null, sections: null, dayReadings: map };
    } catch {
      const map = parseChonNgayDayReadingsJson(reading);
      if (map) return { reading: null, sections: null, dayReadings: map };
    }
    return { reading: null, sections: null, dayReadings: null };
  }
  if (endpoint === "la-so-chi-tiet") {
    try {
      const o = JSON.parse(reading) as { sections?: unknown };
      if (Array.isArray(o.sections) && o.sections.length > 0) {
        const sections: LaSoChiTietSection[] = [];
        for (const row of o.sections) {
          if (!row || typeof row !== "object" || Array.isArray(row)) continue;
          const r = row as Record<string, unknown>;
          const id = typeof r.id === "string" ? r.id : "";
          const title = typeof r.title === "string" ? r.title : "";
          const text = typeof r.text === "string" ? r.text.trim() : "";
          if (!id || !text) continue;
          sections.push({
            id,
            title: title || (LA_SO_ASPECT_TITLES[id] ?? id),
            text,
          });
        }
        if (sections.length > 0) {
          return { reading: null, sections, dayReadings: null };
        }
      }
    } catch {
      /* fall through */
    }
    return { reading: null, sections: null, dayReadings: null };
  }
  if (endpoint === "tieu-van" || endpoint === "luu-nien") {
    try {
      const o = JSON.parse(reading) as { sections?: unknown };
      if (Array.isArray(o.sections) && o.sections.length > 0) {
        const sections: LaSoChiTietSection[] = [];
        for (const row of o.sections) {
          if (!row || typeof row !== "object" || Array.isArray(row)) continue;
          const r = row as Record<string, unknown>;
          const id = typeof r.id === "string" ? r.id.trim() : "";
          const title = typeof r.title === "string" ? r.title.trim() : "";
          const text = typeof r.text === "string" ? r.text.trim() : "";
          if (!id || !text) continue;
          sections.push({
            id,
            title: title.length > 0 ? title : id,
            text,
          });
        }
        if (sections.length > 0) {
          return { reading: null, sections, dayReadings: null };
        }
      }
    } catch {
      /* cache cũ: một chuỗi văn */
    }
    const plain = reading.trim();
    return plain.length > 0
      ? { reading: plain, sections: null, dayReadings: null }
      : { reading: null, sections: null, dayReadings: null };
  }
  return { reading, sections: null, dayReadings: null };
}
