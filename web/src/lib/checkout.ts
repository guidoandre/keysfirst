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

// Stripe accepts a Checkout expiry between 30 minutes and 24 hours from now (a minute's margin on both ends).
const MIN_EXPIRY = 31 * 60;
const MAX_EXPIRY = 24 * 60 * 60 - 60;

/**
 * When the card page stops taking payments: at the deal's deadline, so nobody pays a deposit (and a non-refundable fee)
 * for a deal that can no longer be paid. Stripe's 30-minute minimum is the only exception, for deadlines closer than that.
 */
export function checkoutExpiry(deadline: number, now: number): number {
  return Math.min(Math.max(deadline, now + MIN_EXPIRY), now + MAX_EXPIRY);
}

const TRUSTED_HOSTS = ["localhost", "127.0.0.1", "keysfirst.io", "www.keysfirst.io"];

/** Checkout's success/cancel URLs come back from the Host header, so only trust known hosts (dev, our domain, our Vercel URLs); anything else falls back to production. */
export function returnOrigin(requestUrl: string): string {
  const url = new URL(requestUrl);
  const host = url.hostname;
  const ours = TRUSTED_HOSTS.includes(host) || (host.startsWith("keysfirst") && host.endsWith(".vercel.app"));
  return ours ? url.origin : PRODUCTION_URL;
}
