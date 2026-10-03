import { formatEur, fromCents } from "@/lib/format";
import { feePercent, MIN_FEE_CENTS, priceBreakdown } from "@/lib/pricing";

// Fee figures for marketing and legal copy, always built from pricing.ts so the pages can't drift from what checkout
// charges (and from the pitch deck: 3.5% EEA card, 4.5% other cards, 2% bank transfer, minimum €12).

/** 1200 -> "€12", 2150 -> "€21.50": whole euros read better in prose. */
export function eurText(cents: number): string {
  return cents % 100 === 0 ? `€${cents / 100}` : formatEur(fromCents(cents));
}

export const CARD_FEE_PERCENT = feePercent("card");
export const INTL_CARD_FEE_PERCENT = feePercent("cardIntl");
export const BANK_FEE_PERCENT = feePercent("bank");
export const MIN_FEE = eurText(MIN_FEE_CENTS);

/** "3.5% with a card issued in Europe, 4.5% with other cards" */
export const CARD_FEES = `${CARD_FEE_PERCENT} with a card issued in Europe, ${INTL_CARD_FEE_PERCENT} with other cards`;

/** The worked example used across the site: a €600 deposit, by a card issued in Europe and by any other card. */
export const EXAMPLE_PRICE = priceBreakdown(60_000, "card");
export const EXAMPLE_INTL_PRICE = priceBreakdown(60_000, "cardIntl");

/** "€600 + €21 card fee (€627 with a non-European card)": short enough for the landing demo's small phone. */
export function feeLine(depositCents: number): string {
  const eea = priceBreakdown(depositCents, "card");
  const intl = priceBreakdown(depositCents, "cardIntl");
  return `${eurText(eea.depositCents)} + ${eurText(eea.feeCents)} card fee (${eurText(intl.totalCents)} with a non-European card)`;
}
