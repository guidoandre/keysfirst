export type PayMethod = "card" | "bank";

// Spec D8. Basis points keep the maths in whole numbers.
const RATE_BP: Record<PayMethod, number> = { card: 350, bank: 200 };
export const MIN_FEE_CENTS = 1_200;

/** Keysfirst fee for a deposit, in cents: the method's rate, rounded to the cent, at least €12. Paid by the tenant. */
export function feeCents(depositCents: number, method: PayMethod): number {
  return Math.max(MIN_FEE_CENTS, Math.round((depositCents * RATE_BP[method]) / 10_000));
}

export function priceBreakdown(depositCents: number, method: PayMethod) {
  const fee = feeCents(depositCents, method);
  return { depositCents, feeCents: fee, totalCents: depositCents + fee };
}

/** "3.5%" / "2%" for copy. */
export function feePercent(method: PayMethod): string {
  return `${RATE_BP[method] / 100}%`;
}
