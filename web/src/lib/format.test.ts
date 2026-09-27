import { describe, expect, it } from "vitest";
import { explorerTx, formatDuration, formatEur, parseEur, phantomBrowseUrl } from "./format";

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
