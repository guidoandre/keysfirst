import { describe, expect, it } from "vitest";
import { CARD_FEE_SHORT, eurText, EXAMPLE_INTL_PRICE, EXAMPLE_PRICE, feeLine } from "./fees";

describe("fee copy", () => {
  it("formats whole euros without cents and keeps cents otherwise", () => {
    expect(eurText(1_200)).toBe("€12");
    expect(eurText(2_150)).toBe("€21.50");
  });

  it("builds the fee lines from pricing, matching the deck", () => {
    expect(CARD_FEE_SHORT).toBe("a Keysfirst fee of 3.5% with a card issued in Europe, 4.5% with other cards, at least €12");
    expect(feeLine(60_000)).toBe("€600 deposit + €21 fee with a card issued in Europe (€627 with other cards)");
    expect(feeLine(20_000)).toBe("€200 deposit + €12 fee with a card issued in Europe (€212 with other cards)");
    expect(EXAMPLE_PRICE.totalCents).toBe(62_100);
    expect(EXAMPLE_INTL_PRICE.totalCents).toBe(62_700);
  });
});
