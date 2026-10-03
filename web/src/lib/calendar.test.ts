import { describe, expect, it } from "vitest";
import { dealCalendar, dealEvents, escapeText, foldLine, googleCalendarUrl } from "./calendar";

const DAY = 86_400;
const moveIn = Date.UTC(2026, 9, 1, 14, 0) / 1000; // Thu 1 Oct 2026, 14:00 UTC
const deal = { id: "Deal1111", title: "Room in Vallendar, near WHU", amount: "600000000", times: { moveIn, deadline: moveIn + 3 * DAY } };
const url = "https://www.keysfirst.io/deal/Deal1111";
const now = moveIn - 10 * DAY;

/** Undo line folding, the way a calendar app reads the file. */
const unfold = (ics: string) => ics.replace(/\r\n /g, "");

describe("escapeText", () => {
  it("escapes the characters iCalendar reserves", () => {
    expect(escapeText("a,b;c\\d\ne")).toBe("a\\,b\\;c\\\\d\\ne");
  });

  it("can't be used to start a new line from a title", () => {
    const title = "Room\rEND:VEVENT\r\nBEGIN:VEVENT\nURL:https://evil.example\u2028x\u0000\u001b";
    const escaped = escapeText(title);
    expect(escaped).not.toMatch(/[\r\n\u2028\u0000-\u001f]/);
    expect(escaped).toBe("Room\\nEND:VEVENT\\nBEGIN:VEVENT\\nURL:https://evil.example\\nx");
    expect(escapeText("Move-in 2028/2029")).toBe("Move-in 2028/2029");
  });
});

describe("foldLine", () => {
  it("leaves short lines alone", () => {
    expect(foldLine("SUMMARY:Key handover")).toBe("SUMMARY:Key handover");
  });

  it("keeps every physical line within 75 bytes and never splits a character", () => {
    const line = `DESCRIPTION:${"Zimmer in Köln “möbliert” – ".repeat(12)}`;
    const folded = foldLine(line);
    const encoder = new TextEncoder();
    for (const physical of folded.split("\r\n")) expect(encoder.encode(physical).length).toBeLessThanOrEqual(75);
    expect(folded.replace(/\r\n /g, "")).toBe(line);
  });
});

describe("dealCalendar", () => {
  it("has the handover at move-in and the deadline, in UTC, with CRLF line ends", () => {
    const ics = dealCalendar(deal, "tenant", url, now);
    expect(ics.startsWith("BEGIN:VCALENDAR\r\nVERSION:2.0\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics.replace(/\r\n/g, "")).not.toMatch(/\n/);
    const flat = unfold(ics);
    expect(flat).toContain("UID:Deal1111-handover@keysfirst.io\r\nDTSTAMP:20260921T140000Z\r\nDTSTART:20261001T140000Z\r\nDTEND:20261001T150000Z");
    expect(flat).toContain("UID:Deal1111-deadline@keysfirst.io\r\nDTSTAMP:20260921T140000Z\r\nDTSTART:20261004T140000Z\r\nDTEND:20261004T143000Z");
    expect(flat.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(flat.match(/BEGIN:VALARM/g)).toHaveLength(2);
  });

  it("escapes the title and links the deal", () => {
    const flat = unfold(dealCalendar(deal, "tenant", url, now));
    expect(flat).toContain("SUMMARY:Key handover: Room in Vallendar\\, near WHU");
    expect(flat).toContain(`URL:${url}`);
  });

  it("speaks to the tenant about the safety net and to the landlord about the handover", () => {
    const tenant = unfold(dealCalendar(deal, "tenant", url, now));
    const landlord = unfold(dealCalendar(deal, "landlord", url, now));
    expect(tenant).toContain("€600.00 goes back to you");
    expect(tenant).toContain("Never release it because someone asks you to by message");
    expect(landlord).toContain("tap “Start the handover”");
    expect(landlord).toContain("can only go back to your tenant");
  });
});

describe("googleCalendarUrl", () => {
  it("fills in one event: title, UTC times and the description with the deal link", () => {
    const [handover, deadline] = dealEvents(deal, "tenant", url);
    const link = new URL(googleCalendarUrl(handover));
    expect(link.origin + link.pathname).toBe("https://calendar.google.com/calendar/render");
    expect(link.searchParams.get("action")).toBe("TEMPLATE");
    expect(link.searchParams.get("text")).toBe("Key handover: Room in Vallendar, near WHU");
    expect(link.searchParams.get("dates")).toBe("20261001T140000Z/20261001T150000Z");
    expect(link.searchParams.get("details")).toContain(url);
    expect(new URL(googleCalendarUrl(deadline)).searchParams.get("dates")).toBe("20261004T140000Z/20261004T143000Z");
  });
});
