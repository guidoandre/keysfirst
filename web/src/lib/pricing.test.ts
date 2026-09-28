import { describe, expect, it } from "vitest";
import { MIN_FEE_CENTS, feeCents, feePercent, priceBreakdown } from "./pricing";

describe("feeCents", () => {
  it("charges 3.5% by card and 2% by bank transfer", () => {
    expect(feeCents(60_000, "card")).toBe(2_100);
    expect(feeCents(100_000, "card")).toBe(3_500);
    expect(feeCents(100_000, "bank")).toBe(2_000);
    expect(feeCents(200_000, "bank")).toBe(4_000);
  });
  it("never charges less than €12", () => {
    expect(MIN_FEE_CENTS).toBe(1_200);
    expect(feeCents(30_000, "card")).toBe(1_200);
    expect(feeCents(60_000, "bank")).toBe(1_200);
    expect(feeCents(1, "card")).toBe(1_200);
  });
  it("rounds to the nearest cent", () => {
    expect(feeCents(123_45 * 10, "card")).toBe(4_321); // 123450 × 3.5% = 4320.75
    expect(feeCents(100_010, "card")).toBe(3_500); // 3500.35
  });
});

describe("priceBreakdown", () => {
  it("adds the fee on top of the deposit", () => {
    expect(priceBreakdown(60_000, "card")).toEqual({ depositCents: 60_000, feeCents: 2_100, totalCents: 62_100 });
  });
});

describe("feePercent", () => {
  it("prints the rate for copy", () => {
    expect(feePercent("card")).toBe("3.5%");
    expect(feePercent("bank")).toBe("2%");
  });
});
