import { Connection, PublicKey } from "@solana/web3.js";
import { checkoutProblem, returnOrigin } from "@/lib/checkout";
import { RPC_URL } from "@/lib/config";
import { toDealData } from "@/lib/deal-data";
import { fromCents, toCents } from "@/lib/format";
import { feePercent, priceBreakdown } from "@/lib/pricing";
import { getProgram, type DealAccount } from "@/lib/program";
import { CARD_UNAVAILABLE, stripeClient } from "@/lib/server/stripe";

export const dynamic = "force-dynamic";

/** Starts a card payment for an open deal: deposit + Keysfirst fee on Stripe's test Checkout (spec §4.3). */
export async function POST(req: Request) {
  const stripe = stripeClient();
  if (!stripe) return Response.json({ error: CARD_UNAVAILABLE }, { status: 503 });

  let deal: PublicKey;
  let account: PublicKey;
  try {
    const body = await req.json();
    deal = new PublicKey(body.deal);
    account = new PublicKey(body.account);
    if (!PublicKey.isOnCurve(account.toBytes())) throw new Error("not an account");
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  let raw: DealAccount | null;
  try {
    raw = await getProgram(new Connection(RPC_URL, "confirmed")).account.deal.fetchNullable(deal);
  } catch (err) {
    // A syntactically valid pubkey that isn't a Keysfirst deal account fails Anchor's decode, not the RPC.
    const message = err instanceof Error ? err.message : String(err);
    if (/discriminator|owner/i.test(message)) return Response.json({ error: "We can't find this deal." }, { status: 404 });
    return Response.json({ error: CARD_UNAVAILABLE }, { status: 503 });
  }
  if (!raw) return Response.json({ error: "We can't find this deal." }, { status: 404 });
  const d = toDealData(raw);
  const problem = checkoutProblem({
    status: d.status,
    landlord: d.landlord,
    account: account.toBase58(),
    times: { moveIn: d.moveIn, deadline: d.deadline },
    now: Math.floor(Date.now() / 1000),
  });
  if (problem) return Response.json({ error: problem }, { status: 409 });
  // Stripe charges whole cents: a deposit with a fraction of a cent could never be locked in full.
  if (BigInt(d.amount) !== fromCents(toCents(d.amount))) {
    return Response.json({ error: "This deposit amount can't be paid by card." }, { status: 409 });
  }

  const price = priceBreakdown(toCents(d.amount), "card");
  const origin = returnOrigin(req.url);
  // Everything fulfil needs is decided here, on the server, from the on-chain deal. Mint exactly what was
  // charged (derived from the cents actually billed), not the deal's raw base-unit amount.
  const metadata = { deal: deal.toBase58(), account: account.toBase58(), amount: fromCents(price.depositCents).toString() };
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: price.depositCents,
            product_data: { name: `Deposit: ${d.title}`, description: "Held in the lock until you confirm the key handover." },
          },
        },
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: price.feeCents,
            product_data: { name: `Keysfirst fee (${feePercent("card")})`, description: "Not refunded if the deposit comes back to you." },
          },
        },
      ],
      metadata,
      payment_intent_data: { metadata },
      success_url: `${origin}/deal/${deal.toBase58()}?paid={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/deal/${deal.toBase58()}`,
    });
    if (!session.url) throw new Error("no url");
    return Response.json({ url: session.url, session: session.id });
  } catch {
    return Response.json({ error: CARD_UNAVAILABLE }, { status: 503 });
  }
}
