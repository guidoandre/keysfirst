/** "card": issued in the EEA · "cardIntl": issued anywhere else · "bank": bank transfer. */
export type PayMethod = "card" | "cardIntl" | "bank";

// Spec D8. Basis points keep the maths in whole numbers. Cards issued outside the EEA cost Stripe 3.25% + €0.25
// instead of 1.5% + €0.25, so they pay one point more: §270a BGB bans card surcharges only where the card issuer and
// the acquirer are both in the EEA (Chapter II of Regulation (EU) 2015/751), and the extra point stays below the
// extra cost (§312a(4) BGB). The live version offers a cheaper way to pay (bank transfer); it is off in this prototype.
const RATE_BP: Record<PayMethod, number> = { card: 350, cardIntl: 450, bank: 200 };
export const MIN_FEE_CENTS = 1_200;

/** Keysfirst fee for a deposit, in cents: the method's rate, rounded to the cent, at least €12. Paid by the tenant. */
export function feeCents(depositCents: number, method: PayMethod): number {
  return Math.max(MIN_FEE_CENTS, Math.round((depositCents * RATE_BP[method]) / 10_000));
}

export function priceBreakdown(depositCents: number, method: PayMethod) {
  const fee = feeCents(depositCents, method);
  return { depositCents, feeCents: fee, totalCents: depositCents + fee };
}

/**
 * What the fee on this deposit is, for copy: "3.5%", or "minimum" where the €12 floor applies (a €200 deposit pays
 * €12, not 3.5%, so printing the percentage there would be wrong).
 */
export function feeRate(depositCents: number, method: PayMethod): string {
  return Math.round((depositCents * RATE_BP[method]) / 10_000) < MIN_FEE_CENTS ? "minimum" : feePercent(method);
}

/** "3.5%" / "4.5%" / "2%" for copy. */
export function feePercent(method: PayMethod): string {
  return `${RATE_BP[method] / 100}%`;
}

// EU 27 plus Iceland, Liechtenstein and Norway (ISO 3166-1 alpha-2, as Stripe reports a card's issuing country).
const EEA = new Set(
  "AT BE BG HR CY CZ DK EE FI FR DE GR IE IT LV LT LU MT NL PL PT RO SK SI ES SE IS LI NO".split(" "),
);

/**
 * The card rate for a card issued in `country`. An unknown country gets the lower rate: never overcharge on a guess.
 */
export function cardMethod(country: string | null | undefined): "card" | "cardIntl" {
  return !country || EEA.has(country.toUpperCase()) ? "card" : "cardIntl";
}
