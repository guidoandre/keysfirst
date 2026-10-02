import type Stripe from "stripe";
import { returnOrigin } from "@/lib/checkout";
import { fromCents, toCents } from "@/lib/format";
import { payableDeal, priceForCard, readCardRequest } from "@/lib/server/card-payment";
import { CARD_UNAVAILABLE } from "@/lib/server/stripe";

export const dynamic = "force-dynamic";

/**
 * Charges the card the tenant entered exactly the price they were shown (spec §4.3, D8): the deal is checked again
 * right before charging, the price is worked out again from the card, and a different total is refused instead of
 * charged. The deposit is minted afterwards by /api/checkout/fulfil, at most once per payment.
 */
export async function POST(req: Request) {
  const request = await readCardRequest(req);
  if ("error" in request) return request.error;
  const { stripe, deal, account, token, body } = request;
  const payable = await payableDeal(deal, account);
  if ("error" in payable) return payable.error;
  const { data } = payable;
  const priced = await priceForCard(stripe, token, toCents(data.amount));
  if ("error" in priced) return priced.error;
  const { due } = priced;
  if (body.totalCents !== due.totalCents) {
    return Response.json({ error: "The price for this card changed. Check it and pay again." }, { status: 409 });
  }

  // Everything fulfil needs is decided here, on the server, from the on-chain deal and the card.
  const metadata = {
    deal: deal.toBase58(),
    account: account.toBase58(),
    amount: fromCents(due.depositCents).toString(),
    deposit_cents: String(due.depositCents),
    fee_rate: due.method,
    fee_cents: String(due.feeCents),
  };
  let intent: Stripe.PaymentIntent;
  try {
    intent = await stripe.paymentIntents.create(
      {
        amount: due.totalCents,
        currency: "eur",
        payment_method_types: ["card"],
        confirm: true,
        confirmation_token: token,
        description: `Deposit: ${data.title} + Keysfirst fee`,
        metadata,
        // Only used when the bank asks for a check (3-D Secure) that needs a redirect.
        return_url: `${returnOrigin(req.url)}/deal/${deal.toBase58()}`,
      },
      // The same card entry can only ever make one payment, even if Pay is tapped twice.
      { idempotencyKey: `pay-${token}` },
    );
  } catch (err) {
    // A declined card: Stripe's message is written for the cardholder ("Your card was declined.").
    const e = err as { type?: string; message?: string };
    if (e.type === "StripeCardError" && e.message) return Response.json({ error: e.message }, { status: 402 });
    return Response.json({ error: CARD_UNAVAILABLE }, { status: 503 });
  }
  if (intent.status === "succeeded") return Response.json({ payment: intent.id });
  if (intent.status === "requires_action" && intent.client_secret) {
    return Response.json({ payment: intent.id, clientSecret: intent.client_secret });
  }
  return Response.json({ error: "Your card wasn't charged. Try again or use another card." }, { status: 402 });
}
