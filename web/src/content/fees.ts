import { formatEur, fromCents } from "@/lib/format";
import { feePercent, MIN_FEE_CENTS, priceBreakdown } from "@/lib/pricing";

// Fee figures for marketing and legal copy, always built from pricing.ts so the pages can't drift from what checkout charges.

/** 1200 -> "€12", 2150 -> "€21.50": whole euros read better in prose. */
export function eurText(cents: number): string {
  return cents % 100 === 0 ? `€${cents / 100}` : formatEur(fromCents(cents));
}

export const CARD_FEE_PERCENT = feePercent("card");
export const BANK_FEE_PERCENT = feePercent("bank");
export const MIN_FEE = eurText(MIN_FEE_CENTS);

/** The worked example used across the site: a €600 deposit paid by card. */
export const EXAMPLE_PRICE = priceBreakdown(60_000, "card");

/** "a Keysfirst fee of 3.5% by card, at least €12" */
export const CARD_FEE_SHORT = `a Keysfirst fee of ${CARD_FEE_PERCENT} by card, at least ${MIN_FEE}`;

/** "€600 deposit + €21 Keysfirst fee (3.5%, not refunded)" */
export function feeLine(depositCents: number): string {
  const price = priceBreakdown(depositCents, "card");
  return `${eurText(price.depositCents)} deposit + ${eurText(price.feeCents)} Keysfirst fee (${CARD_FEE_PERCENT}, not refunded)`;
}
