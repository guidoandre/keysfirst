import { toCents } from "@/lib/format";
import { payableDeal, priceForCard, readCardRequest } from "@/lib/server/card-payment";

export const dynamic = "force-dynamic";

/**
 * The exact price for the card the tenant just entered, before anything is charged: Stripe reports where the card was
 * issued, and the fee follows (3.5% for a card issued in the EEA, 4.5% for any other card, at least €12).
 */
export async function POST(req: Request) {
  const request = await readCardRequest(req);
  if ("error" in request) return request.error;
  const payable = await payableDeal(request.deal, request.account);
  if ("error" in payable) return payable.error;
  const priced = await priceForCard(request.stripe, request.token, toCents(payable.data.amount));
  if ("error" in priced) return priced.error;
  const { card, due } = priced;
  return Response.json({
    method: due.method,
    depositCents: due.depositCents,
    feeCents: due.feeCents,
    totalCents: due.totalCents,
    brand: card.brand,
    last4: card.last4,
    country: card.country,
  });
}
