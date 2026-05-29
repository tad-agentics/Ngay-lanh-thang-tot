import { toast } from "sonner";

import { weekdayFromIso } from "~/lib/lich-format";
import { addDaysToIso } from "~/lib/tu-tru-dates";

const APP_ORIGIN =
  typeof window !== "undefined" ? window.location.origin : "https://ngaylanhthangtot.vn";

export type SavedPickCalendarInput = {
  dayIso: string;
  label: string;
  note?: string | null;
  score?: number | null;
};

export const ADD_TO_GOOGLE_CALENDAR_STORAGE_KEY = "nltt:add-to-google-calendar";

export function readAddToGoogleCalendarPreference(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(ADD_TO_GOOGLE_CALENDAR_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeAddToGoogleCalendarPreference(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ADD_TO_GOOGLE_CALENDAR_STORAGE_KEY, enabled ? "1" : "0");
  } catch {
    /* ignore quota / private mode */
  }
}

function isoToGoogleAllDayRange(dayIso: string): string {
  const start = dayIso.trim().slice(0, 10).replace(/-/g, "");
  const end = addDaysToIso(dayIso, 1).replace(/-/g, "");
  return `${start}/${end}`;
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function buildEventDescription(input: SavedPickCalendarInput): string {
  const dayUrl = `${APP_ORIGIN}/ngay/${input.dayIso}`;
  const lines = [
    input.note?.trim(),
    input.score != null ? `Điểm ngày: ${input.score}` : null,
    `${weekdayFromIso(input.dayIso)} · ${input.dayIso}`,
    `Xem chi tiết: ${dayUrl}`,
    "Ngày Lành Tháng Tốt · ngaylanhthangtot.vn",
  ].filter(Boolean);
  return lines.join("\n");
}

/** Opens Google Calendar “create event” with an all-day entry on `dayIso`. */
export function buildGoogleCalendarUrl(input: SavedPickCalendarInput): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Ngày lành · ${input.label.trim()}`,
    dates: isoToGoogleAllDayRange(input.dayIso),
    details: buildEventDescription(input),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Reminder event on the day before (all-day). */
export function buildGoogleCalendarReminderUrl(input: SavedPickCalendarInput): string {
  const remindIso = addDaysToIso(input.dayIso, -1);
  const dayUrl = `${APP_ORIGIN}/ngay/${input.dayIso}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Nhắc · ${input.label.trim()}`,
    dates: isoToGoogleAllDayRange(remindIso),
    details: [
      `Ngày mai (${input.dayIso}) bạn đã đánh dấu cho: ${input.label.trim()}.`,
      input.note?.trim(),
      `Chi tiết: ${dayUrl}`,
    ]
      .filter(Boolean)
      .join("\n"),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function icsStampUtc(): string {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** ICS with main day + reminder day + VALARM 24h before (Apple/Outlook). */
export function buildSavedPickIcsContent(input: SavedPickCalendarInput): string {
  const day = input.dayIso.slice(0, 10);
  const nextDay = addDaysToIso(day, 1).replace(/-/g, "");
  const dayCompact = day.replace(/-/g, "");
  const remindDay = addDaysToIso(day, -1);
  const remindCompact = remindDay.replace(/-/g, "");
  const remindNext = day.replace(/-/g, "");
  const summary = escapeIcsText(`Ngày lành · ${input.label.trim()}`);
  const description = escapeIcsText(buildEventDescription(input));
  const remindSummary = escapeIcsText(`Nhắc · ${input.label.trim()}`);

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Ngay Lanh Thang Tot//NLTT//VI",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:nltt-${day}@ngaylanhthangtot.vn`,
    `DTSTAMP:${icsStampUtc()}`,
    `DTSTART;VALUE=DATE:${dayCompact}`,
    `DTEND;VALUE=DATE:${nextDay}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    "DESCRIPTION:Nhắc ngày lành",
    "END:VALARM",
    "END:VEVENT",
    "BEGIN:VEVENT",
    `UID:nltt-remind-${day}@ngaylanhthangtot.vn`,
    `DTSTAMP:${icsStampUtc()}`,
    `DTSTART;VALUE=DATE:${remindCompact}`,
    `DTEND;VALUE=DATE:${remindNext}`,
    `SUMMARY:${remindSummary}`,
    `DESCRIPTION:${escapeIcsText(`Ngày mai là ${input.label.trim()}.`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function openGoogleCalendarUrl(url: string): void {
  window.open(url, "_blank", "noopener,noreferrer");
}

export function downloadSavedPickIcs(input: SavedPickCalendarInput): void {
  const blob = new Blob([buildSavedPickIcsContent(input)], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `ngay-lanh-${input.dayIso}.ics`;
  anchor.click();
  URL.revokeObjectURL(url);
}

/** After a successful save — toast + try opening Google Calendar (popup may be blocked until toast tap). */
export function offerGoogleCalendarAfterSave(input: SavedPickCalendarInput): void {
  const mainUrl = buildGoogleCalendarUrl(input);
  const remindUrl = buildGoogleCalendarReminderUrl(input);

  toast.success("Đã lưu vào sổ.", {
    description: "Xác nhận sự kiện trên Google Calendar (tab mới).",
    duration: 12_000,
    action: {
      label: "Google Calendar",
      onClick: () => openGoogleCalendarUrl(mainUrl),
    },
  });

  toast("Nhắc trước 1 ngày", {
    duration: 11_000,
    action: {
      label: "Nhắc hôm trước",
      onClick: () => openGoogleCalendarUrl(remindUrl),
    },
  });

  toast("Lịch iPhone / Outlook", {
    duration: 10_000,
    action: {
      label: "Tải .ics",
      onClick: () => downloadSavedPickIcs(input),
    },
  });

  openGoogleCalendarUrl(mainUrl);
}
