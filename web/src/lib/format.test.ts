import { describe, expect, it } from "vitest";
import {
  explorerTx,
  formatCountdown,
  formatDuration,
  formatEur,
  formatShortDateTime,
  fromCents,
  parseEur,
  phantomBrowseUrl,
  shortAddress,
  toCents,
  whatsappUrl,
} from "./format";

describe("formatEur", () => {
  it("formats base units as euros", () => {
    expect(formatEur(600_000_000n)).toBe("€600.00");
    expect(formatEur("600500000")).toBe("€600.50");
    expect(formatEur(1_234_560_000n)).toBe("€1,234.56");
  });
});

describe("parseEur", () => {
  it("accepts whole euros and cents with dot or comma", () => {
    expect(parseEur("600")).toBe(600_000_000n);
    expect(parseEur("600.5")).toBe(600_500_000n);
    expect(parseEur(" 600,50 ")).toBe(600_500_000n);
  });
  it("rejects zero, garbage and sub-cent precision", () => {
    expect(parseEur("0")).toBeNull();
    expect(parseEur("abc")).toBeNull();
    expect(parseEur("1.234")).toBeNull();
    expect(parseEur("")).toBeNull();
  });
});

describe("formatDuration", () => {
  it("uses the two largest units", () => {
    expect(formatDuration(172_800)).toBe("2 days");
    expect(formatDuration(90_061)).toBe("1 day 1 h");
    expect(formatDuration(3_660)).toBe("1 h 1 min");
    expect(formatDuration(125)).toBe("2 min");
    expect(formatDuration(5)).toBe("5 s");
    expect(formatDuration(-10)).toBe("0 s");
  });
});

describe("links", () => {
  it("points Explorer at devnet", () => {
    expect(explorerTx("abc")).toBe("https://explorer.solana.com/tx/abc?cluster=devnet");
  });
  it("opens a page inside Phantom's browser", () => {
    expect(phantomBrowseUrl("https://k.app/deal/x")).toBe(
      "https://phantom.app/ul/browse/https%3A%2F%2Fk.app%2Fdeal%2Fx?ref=https%3A%2F%2Fk.app",
    );
  });
});

describe("formatCountdown", () => {
  it("shows two units above an hour and ticks in seconds below it", () => {
    expect(formatCountdown(90_061)).toBe("1 day 1 h");
    expect(formatCountdown(3_660)).toBe("1 h 1 min");
    expect(formatCountdown(252)).toBe("4 min 12 s");
    expect(formatCountdown(240)).toBe("4 min");
    expect(formatCountdown(45)).toBe("45 s");
    expect(formatCountdown(-3)).toBe("0 s");
  });
});

describe("formatShortDateTime", () => {
  const wed30Sep1400Utc = Date.UTC(2026, 8, 30, 14, 0) / 1000;
  it("formats as weekday, day, month and 24-hour time", () => {
    expect(formatShortDateTime(wed30Sep1400Utc, "UTC")).toBe("Wed 30 Sep, 14:00");
    expect(formatShortDateTime(Date.UTC(2026, 9, 4, 9, 5) / 1000, "UTC")).toBe("Sun 4 Oct, 09:05");
  });
  it("uses the given time zone", () => {
    expect(formatShortDateTime(wed30Sep1400Utc - 2 * 3600, "Europe/Berlin")).toBe("Wed 30 Sep, 14:00");
  });
  it("defaults to the viewer's time zone (UTC in tests)", () => {
    expect(formatShortDateTime(wed30Sep1400Utc)).toBe("Wed 30 Sep, 14:00");
  });
});

describe("shortAddress / whatsappUrl", () => {
  it("shortens wallet addresses", () => {
    expect(shortAddress("7xKpQ2mZr9sT4uV6wX8yA1bC3dE5fG7hJ9kL3mQe")).toBe("7xKp…3mQe");
    expect(shortAddress("short")).toBe("short");
  });
  it("builds a WhatsApp share link", () => {
    expect(whatsappUrl("Pay here: https://k.app/deal/x")).toBe("https://wa.me/?text=Pay%20here%3A%20https%3A%2F%2Fk.app%2Fdeal%2Fx");
  });
});

describe("cents", () => {
  it("converts base units (6 decimals) to cents and back", () => {
    expect(toCents(600_000_000n)).toBe(60_000);
    expect(toCents("600500000")).toBe(60_050);
    expect(fromCents(60_050)).toBe(600_500_000n);
  });
});
