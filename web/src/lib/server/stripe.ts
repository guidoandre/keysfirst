import Stripe from "stripe";

/** Test mode only (spec §1): a live key would take real money, so anything but sk_test_ is refused. */
export function stripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || !key.startsWith("sk_test_")) return null;
  return new Stripe(key);
}

export { CARD_UNAVAILABLE } from "@/lib/checkout";
