import { describe, expect, it } from "vitest";

import {
  buildGoogleCalendarReminderUrl,
  buildGoogleCalendarUrl,
  buildSavedPickIcsContent,
} from "./saved-pick-calendar";

describe("saved-pick-calendar", () => {
  const input = {
    dayIso: "2026-06-15",
    label: "Đám cưới",
    note: "Nhà thờ",
    score: 88,
  };

  it("builds Google Calendar template URL for all-day event", () => {
    const url = buildGoogleCalendarUrl(input);
    expect(url).toContain("calendar.google.com");
    expect(url).toContain("action=TEMPLATE");
    expect(url).toContain("dates=20260615%2F20260616");
    expect(url).toContain("text=Ng");
    expect(url).toContain("%C4%90%C3%A1m+c%C6%B0%E1%BB%9Bi");
  });

  it("builds reminder URL on previous day", () => {
    const url = buildGoogleCalendarReminderUrl(input);
    expect(url).toContain("dates=20260614%2F20260615");
    expect(url).toContain("text=Nh");
    expect(url).toContain("%C4%90%C3%A1m+c%C6%B0%E1%BB%9Bi");
  });

  it("builds ICS with VALARM and reminder event", () => {
    const ics = buildSavedPickIcsContent(input);
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("DTSTART;VALUE=DATE:20260615");
    expect(ics).toContain("BEGIN:VALARM");
    expect(ics).toContain("TRIGGER:-P1D");
    expect(ics).toContain("DTSTART;VALUE=DATE:20260614");
  });
});
