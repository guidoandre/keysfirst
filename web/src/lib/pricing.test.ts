import { describe, expect, it } from "vitest";
import { MIN_FEE_CENTS, cardMethod, feeCents, feePercent, feeRate, priceBreakdown } from "./pricing";

describe("feeCents", () => {
  it("charges 3.5% by card and 2% by bank transfer", () => {
    expect(feeCents(60_000, "card")).toBe(2_100);
    expect(feeCents(100_000, "card")).toBe(3_500);
    expect(feeCents(100_000, "bank")).toBe(2_000);
    expect(feeCents(200_000, "bank")).toBe(4_000);
  });
  it("charges 4.5% for a card issued outside the EEA", () => {
    expect(feeCents(60_000, "cardIntl")).toBe(2_700);
    expect(feeCents(120_000, "cardIntl")).toBe(5_400);
    expect(feeCents(20_000, "cardIntl")).toBe(1_200);
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

describe("feeRate", () => {
  it("names the percentage, or the minimum where the €12 floor applies", () => {
    expect(feeRate(60_000, "card")).toBe("3.5%");
    expect(feeRate(60_000, "cardIntl")).toBe("4.5%");
    expect(feeRate(20_000, "card")).toBe("minimum");
    expect(feeRate(30_000, "cardIntl")).toBe("4.5%"); // €13.50
    expect(feeRate(26_000, "cardIntl")).toBe("minimum"); // €11.70 -> €12
  });
});

describe("feePercent", () => {
  it("prints the rate for copy", () => {
    expect(feePercent("card")).toBe("3.5%");
    expect(feePercent("bank")).toBe("2%");
    expect(feePercent("cardIntl")).toBe("4.5%");
  });
});

describe("cardMethod", () => {
  it("gives EEA cards the card rate, including Norway, Iceland and Liechtenstein", () => {
    for (const c of ["DE", "fr", "IT", "NO", "IS", "LI"]) expect(cardMethod(c)).toBe("card");
  });
  it("gives cards from the rest of the world, the UK and Switzerland included, the international rate", () => {
    for (const c of ["US", "IN", "CN", "GB", "CH", "TR"]) expect(cardMethod(c)).toBe("cardIntl");
  });
  it("never charges the higher rate when the country is unknown", () => {
    expect(cardMethod(null)).toBe("card");
    expect(cardMethod(undefined)).toBe("card");
    expect(cardMethod("")).toBe("card");
  });
});
