import { canFund, type DealStatus, type DealTimes } from "./rules";

/** Why `account` can't start a card payment for this deal right now; null if it can. Mirrors the program's fund checks. */
export function checkoutProblem(o: { status: DealStatus; landlord: string; account: string; times: DealTimes; now: number }): string | null {
  if (o.status !== "open") return "This deposit can't be paid any more. Reload the page to see the deal's status.";
  if (o.account === o.landlord) return "You created this deal, so you can't pay it. Log in with the tenant's account.";
  if (!canFund(o.times, o.now)) return "This deal can't be paid right now: its handover deadline has passed or is more than 180 days away.";
  return null;
}

/** Checkout's success/cancel URLs come back from the Host header, so only trust known hosts (devnet + Vercel); anything else falls back to production. */
export function returnOrigin(requestUrl: string): string {
  const requestOrigin = new URL(requestUrl).origin;
  const host = new URL(requestOrigin).hostname;
  return host === "localhost" || host === "127.0.0.1" || host.endsWith(".vercel.app") ? requestOrigin : "https://keysfirst.vercel.app";
}
