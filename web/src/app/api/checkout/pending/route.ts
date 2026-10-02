import { PublicKey } from "@solana/web3.js";
import { clientIp, isJson, rateLimiter } from "@/lib/server/limits";
import { stripeClient } from "@/lib/server/stripe";

export const dynamic = "force-dynamic";

// Called once per deal page visit; the Vercel firewall also covers /api/checkout*.
const perIp = rateLimiter(30, 10 * 60_000);

/**
 * A card payment for this deal and account that went through but was never turned into a deposit: the tab closed
 * right after paying, or the tenant came back on another device. Returns the payment so the deal page can finish it
 * with the normal fulfil step (which mints at most once), or null when there is none.
 */
export async function POST(req: Request) {
  if (!isJson(req)) return Response.json({ error: "Send JSON." }, { status: 415 });
  const stripe = stripeClient();
  if (!stripe) return Response.json({ session: null });
  if (!perIp(clientIp(req))) return Response.json({ session: null });

  let deal: string;
  let account: string;
  try {
    const body = await req.json();
    // Parsed as addresses, so only base58 characters reach the search query below.
    deal = new PublicKey(body.deal).toBase58();
    account = new PublicKey(body.account).toBase58();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    // Stripe's search can't mix AND with OR, so the status is checked below: a card payment is held
    // ("requires_capture") until fulfil charges it at the card's rate, then "succeeded".
    const found = await stripe.paymentIntents.search({
      query: `metadata['deal']:'${deal}' AND metadata['account']:'${account}'`,
      limit: 20,
    });
    const open = found.data.find(
      (intent) => (intent.status === "requires_capture" || intent.status === "succeeded") && !intent.metadata.minted,
    );
    // Fulfil takes the payment itself, whichever way it was made.
    return Response.json({ session: open?.id ?? null });
  } catch {
    // Stripe busy or search unavailable: nothing to resume this time.
    return Response.json({ session: null });
  }
}
