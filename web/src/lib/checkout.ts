import { formatEur, fromCents } from "./format";
import { cardMethod, feePercent, priceBreakdown } from "./pricing";
import { canFund, type DealStatus, type DealTimes } from "./rules";
import { PRODUCTION_URL } from "./site";

/** Why `account` can't start a card payment for this deal right now; null if it can. Mirrors the program's fund checks. */
export function checkoutProblem(o: { status: DealStatus; landlord: string; account: string; times: DealTimes; now: number }): string | null {
  if (o.status !== "open") return "This deposit can't be paid any more. Reload the page to see the deal's status.";
  if (o.account === o.landlord) return "You created this deal, so you can't pay it. Log in with the tenant's account.";
  if (!canFund(o.times, o.now)) return "This deal can't be paid right now: its handover deadline has passed or is more than 180 days away.";
  return null;
}

/** What a card pays, given its issuing country: 3.5% fee for a card issued in the EEA, 4.5% for any other (at least €12). */
export function cardCharge(depositCents: number, cardCountry: string | null | undefined) {
  const method = cardMethod(cardCountry);
  return { method, ...priceBreakdown(depositCents, method) };
}

/** What fulfil reports a card payment actually cost (from Stripe's capture). */
export interface CardCharged {
  totalCents: number;
  feeCents: number;
  /** "card" (issued in the EEA) or "cardIntl"; missing for a payment made before fees depended on the card. */
  method?: string;
}

/**
 * The receipt line after a card payment, so the tenant sees which price applied:
 * "Your card was charged €627.00: deposit €600.00 + Keysfirst fee €27.00 (4.5%, card issued outside Europe)."
 */
export function chargedSummary(c: CardCharged): string {
  const total = formatEur(fromCents(c.totalCents));
  if (!Number.isFinite(c.feeCents) || c.feeCents <= 0 || c.feeCents >= c.totalCents) return `Your card was charged ${total}.`;
  const deposit = formatEur(fromCents(c.totalCents - c.feeCents));
  const fee = formatEur(fromCents(c.feeCents));
  const why =
    c.method === "cardIntl"
      ? ` (${feePercent("cardIntl")}, card issued outside Europe)`
      : c.method === "card"
        ? ` (${feePercent("card")}, card issued in Europe)`
        : "";
  return `Your card was charged ${total}: deposit ${deposit} + Keysfirst fee ${fee}${why}.`;
}

/** Stripe's largest single charge in euros: €999,999.99. */
export const STRIPE_MAX_CENTS = 99_999_999;

const TRUSTED_HOSTS = ["localhost", "127.0.0.1", "keysfirst.io", "www.keysfirst.io", "keysfirst.vercel.app"];
// Our Vercel team's preview URLs: keysfirst-<hash or git-branch>-atlas-fee2.vercel.app. Only this team can create them.
const isOurPreview = (host: string) => host.startsWith("keysfirst-") && host.endsWith("-atlas-fee2.vercel.app");

/** Checkout's success/cancel URLs come back from the Host header, so only trust known hosts (dev, our domain, our Vercel URLs); anything else falls back to production. */
export function returnOrigin(requestUrl: string): string {
  const url = new URL(requestUrl);
  const host = url.hostname;
  return TRUSTED_HOSTS.includes(host) || isOurPreview(host) ? url.origin : PRODUCTION_URL;
}
