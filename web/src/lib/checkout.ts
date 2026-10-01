import { canFund, type DealStatus, type DealTimes } from "./rules";
import { PRODUCTION_URL } from "./site";

/** Why `account` can't start a card payment for this deal right now; null if it can. Mirrors the program's fund checks. */
export function checkoutProblem(o: { status: DealStatus; landlord: string; account: string; times: DealTimes; now: number }): string | null {
  if (o.status !== "open") return "This deposit can't be paid any more. Reload the page to see the deal's status.";
  if (o.account === o.landlord) return "You created this deal, so you can't pay it. Log in with the tenant's account.";
  if (!canFund(o.times, o.now)) return "This deal can't be paid right now: its handover deadline has passed or is more than 180 days away.";
  return null;
}

/** Stripe's largest single charge in euros: €999,999.99. */
export const STRIPE_MAX_CENTS = 99_999_999;

// Stripe's shortest Checkout expiry is 30 minutes (plus a minute's margin).
const CHECKOUT_LIFETIME = 31 * 60;

/**
 * When the card page stops taking payments: as soon as Stripe allows. A card page left open for hours (a second tab,
 * Back from Stripe) could otherwise still be paid after someone else paid the deal or the landlord cancelled it,
 * leaving the deposit in the payer's balance and the non-refundable fee spent for nothing.
 */
export function checkoutExpiry(now: number): number {
  return now + CHECKOUT_LIFETIME;
}

const TRUSTED_HOSTS = ["localhost", "127.0.0.1", "keysfirst.io", "www.keysfirst.io", "keysfirst.vercel.app"];
// Our Vercel team's preview URLs: keysfirst-<hash or git-branch>-atlas-fee2.vercel.app. Only this team can create them.
const isOurPreview = (host: string) => host.startsWith("keysfirst-") && host.endsWith("-atlas-fee2.vercel.app");

/** Checkout's success/cancel URLs come back from the Host header, so only trust known hosts (dev, our domain, our Vercel URLs); anything else falls back to production. */
export function returnOrigin(requestUrl: string): string {
  const url = new URL(requestUrl);
  const host = url.hostname;
  return TRUSTED_HOSTS.includes(host) || isOurPreview(host) ? url.origin : PRODUCTION_URL;
}
