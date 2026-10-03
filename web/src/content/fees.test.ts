import { describe, expect, it } from "vitest";
import { CARD_FEES, eurText, EXAMPLE_INTL_PRICE, EXAMPLE_PRICE, feeLine, MIN_FEE } from "./fees";

describe("fee copy", () => {
  it("formats whole euros without cents and keeps cents otherwise", () => {
    expect(eurText(1_200)).toBe("€12");
    expect(eurText(2_150)).toBe("€21.50");
  });

  it("builds the fee lines from pricing, matching the deck", () => {
    expect(CARD_FEES).toBe("3.5% with a card issued in Europe, 4.5% with other cards");
    expect(MIN_FEE).toBe("€12");
    expect(feeLine(60_000)).toBe("€600 + €21 card fee (€627 with a non-European card)");
    expect(feeLine(20_000)).toBe("€200 + €12 card fee (€212 with a non-European card)");
    expect(EXAMPLE_PRICE.totalCents).toBe(62_100);
    expect(EXAMPLE_INTL_PRICE.totalCents).toBe(62_700);
  });
});
