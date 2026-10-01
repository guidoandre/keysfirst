import { PublicKey } from "@solana/web3.js";
import { clientIp, isJson, rateLimiter } from "@/lib/server/limits";
import { stripeClient } from "@/lib/server/stripe";

export const dynamic = "force-dynamic";

// Called once per deal page visit; the Vercel firewall also covers /api/checkout*.
const perIp = rateLimiter(30, 10 * 60_000);

/**
 * A card payment for this deal and account that went through but was never turned into a deposit: the tab closed
 * before Stripe sent the tenant back, or they came back on another device. Returns its Checkout session so the deal
 * page can finish it with the normal fulfil step (which mints at most once), or null when there is none.
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
    const paid = await stripe.paymentIntents.search({
      query: `metadata['deal']:'${deal}' AND metadata['account']:'${account}' AND status:'succeeded'`,
      limit: 10,
    });
    const open = paid.data.find((intent) => !intent.metadata.minted);
    if (!open) return Response.json({ session: null });
    const sessions = await stripe.checkout.sessions.list({ payment_intent: open.id, limit: 1 });
    return Response.json({ session: sessions.data[0]?.id ?? null });
  } catch {
    // Stripe busy or search unavailable: nothing to resume this time.
    return Response.json({ session: null });
  }
}
