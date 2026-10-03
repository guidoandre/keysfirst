import { formatEur } from "./format";
import type { DealTimes } from "./rules";

/** Who the calendar file speaks to: the wording differs, the times don't. */
export type CalendarRole = "landlord" | "tenant";

export interface CalendarDeal {
  /** The deal's address: the events' UIDs, so a second download updates the same two events. */
  id: string;
  title: string;
  /** Base units (6 decimals) as a string. */
  amount: string;
  times: DealTimes;
}

interface CalendarEvent {
  uid: string;
  start: number;
  end: number;
  summary: string;
  description: string;
  /** Minutes before the start that the calendar reminds. */
  alarm: number;
}

/** 20261004T120000Z (iCalendar UTC time). */
function stamp(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** RFC 5545 §3.3.11: backslash, semicolon, comma and line breaks are escaped in text values. */
export function escapeText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** RFC 5545 §3.1: lines longer than 75 bytes continue on the next line after a space, never inside a character. */
export function foldLine(line: string): string {
  const encoder = new TextEncoder();
  const parts: string[] = [];
  let current = "";
  let bytes = 0;
  for (const char of line) {
    const size = encoder.encode(char).length;
    // The first line holds 75 bytes; each continuation starts with a space, so it holds 74 more.
    if (bytes + size > (parts.length === 0 ? 75 : 74)) {
      parts.push(current);
      current = "";
      bytes = 0;
    }
    current += char;
    bytes += size;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

function eventLines(e: CalendarEvent, url: string, now: number): string[] {
  return [
    "BEGIN:VEVENT",
    `UID:${e.uid}`,
    `DTSTAMP:${stamp(now)}`,
    `DTSTART:${stamp(e.start)}`,
    `DTEND:${stamp(e.end)}`,
    `SUMMARY:${escapeText(e.summary)}`,
    `DESCRIPTION:${escapeText(e.description)}`,
    `URL:${url}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeText(e.summary)}`,
    `TRIGGER:-PT${e.alarm}M`,
    "END:VALARM",
    "END:VEVENT",
  ];
}

/**
 * The deal's two dates as an .ics file: the key handover (at move-in) and the handover deadline. Nothing reminds
 * anyone otherwise (Keysfirst keeps no emails), and the deadline is the tenant's safety net.
 */
export function dealCalendar(deal: CalendarDeal, role: CalendarRole, url: string, now = Math.floor(Date.now() / 1000)): string {
  const amount = formatEur(deal.amount);
  const { moveIn, deadline } = deal.times;
  const tenant = role === "tenant";
  const events: CalendarEvent[] = [
    {
      uid: `${deal.id}-handover@keysfirst.io`,
      start: moveIn,
      end: moveIn + 60 * 60,
      summary: `Key handover: ${deal.title}`,
      description: tenant
        ? `Check the room first. Then scan the landlord's code or tap “I have the keys” on the deal page, and ${amount} goes to the landlord. Never release it because someone asks you to by message. Open the deal: ${url}`
        : `Meet your tenant. Open the deal, tap “Start the handover” and show your code. Hand over the keys when your screen turns green. Open the deal: ${url}`,
      alarm: 24 * 60,
    },
    {
      uid: `${deal.id}-deadline@keysfirst.io`,
      start: deadline,
      end: deadline + 30 * 60,
      summary: `Handover deadline: ${deal.title}`,
      description: tenant
        ? `If you didn't get the keys, don't release the deposit. After this time ${amount} goes back to you: take it back on the deal page, or Keysfirst sends it back within a day. Open the deal: ${url}`
        : `The handover closes. If it didn't happen, ${amount} can only go back to your tenant. Open the deal: ${url}`,
      alarm: 2 * 60,
    },
  ];
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Keysfirst//Deposit deal//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events.flatMap((e) => eventLines(e, url, now)),
    "END:VCALENDAR",
  ];
  return lines.map(foldLine).join("\r\n") + "\r\n";
}
