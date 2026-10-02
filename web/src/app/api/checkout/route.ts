import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { cardHold, checkoutExpiry, checkoutProblem, returnOrigin, STRIPE_MAX_CENTS } from "@/lib/checkout";
import { SERVER_RPC_URL } from "@/lib/config";
import { toDealData } from "@/lib/deal-data";
import { formatEur, fromCents, toCents } from "@/lib/format";
import { feePercent, priceBreakdown } from "@/lib/pricing";
import { fetchDeal, getProgram, type DealAccount } from "@/lib/program";
import { faucetKeypair } from "@/lib/server/faucet";
import { isJson } from "@/lib/server/limits";
import { CARD_UNAVAILABLE, stripeClient } from "@/lib/server/stripe";

export const dynamic = "force-dynamic";

// Each mint after a card payment costs the faucet about 0.003 SOL: below this, stop taking money we couldn't turn into a deposit.
const MINT_FLOOR = 0.05 * LAMPORTS_PER_SOL;

/** Starts a card payment for an open deal: deposit + Keysfirst fee on Stripe's test Checkout (spec §4.3). */
export async function POST(req: Request) {
  if (!isJson(req)) return Response.json({ error: "Invalid request." }, { status: 415 });
  const stripe = stripeClient();
  const faucet = faucetKeypair();
  // Without the faucet the payment could be taken but never become a deposit.
  if (!stripe || !faucet) return Response.json({ error: CARD_UNAVAILABLE }, { status: 503 });

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
    const connection = new Connection(SERVER_RPC_URL, "confirmed");
    const [found, faucetBalance] = await Promise.all([
      // null for anything that isn't a genuine Keysfirst deal (another account, a lookalike, another token).
      fetchDeal(getProgram(connection), deal),
      connection.getBalance(faucet.publicKey),
    ]);
    if (faucetBalance < MINT_FLOOR) return Response.json({ error: CARD_UNAVAILABLE }, { status: 503 });
    raw = found;
  } catch {
    return Response.json({ error: CARD_UNAVAILABLE }, { status: 503 });
  }
  if (!raw) return Response.json({ error: "We can't find this deal." }, { status: 404 });
  const d = toDealData(raw);
  const now = Math.floor(Date.now() / 1000);
  const problem = checkoutProblem({
    status: d.status,
    landlord: d.landlord,
    account: account.toBase58(),
    times: { moveIn: d.moveIn, deadline: d.deadline },
    now,
  });
  if (problem) return Response.json({ error: problem }, { status: 409 });
  // Stripe charges whole cents: a deposit with a fraction of a cent could never be locked in full.
  if (BigInt(d.amount) !== fromCents(toCents(d.amount))) {
    return Response.json({ error: "This deposit amount can't be paid by card." }, { status: 409 });
  }

  // Held at the international rate; fulfil charges an EEA card the lower one once Stripe knows where it was issued.
  const price = cardHold(toCents(d.amount));
  const eea = priceBreakdown(price.depositCents, "card");
  if (price.totalCents > STRIPE_MAX_CENTS) {
    return Response.json({ error: "This deposit is too large to pay by card. Pay it from your balance instead." }, { status: 409 });
  }
  const origin = returnOrigin(req.url);
  // Everything fulfil needs is decided here, on the server, from the on-chain deal. Mint exactly what was
  // charged (derived from the cents actually billed), not the deal's raw base-unit amount.
  const metadata = {
    deal: deal.toBase58(),
    account: account.toBase58(),
    amount: fromCents(price.depositCents).toString(),
    deposit_cents: String(price.depositCents),
  };
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
            product_data: {
              name: `Keysfirst fee (${feePercent("cardIntl")}, or ${feePercent("card")} with a card issued in Europe)`,
              description: "Not refunded if the deposit comes back to you.",
            },
          },
        },
      ],
      metadata,
      // Hold now, charge once the card's issuing country is known (fulfil). Never more than this hold.
      payment_intent_data: { metadata, capture_method: "manual" },
      custom_text: {
        submit: {
          message: `A card issued in Europe (EEA) is charged ${formatEur(fromCents(eea.totalCents))}: the ${formatEur(fromCents(price.totalCents - eea.totalCents))} difference is released at once. Other cards are charged the amount shown.`,
        },
      },
      expires_at: checkoutExpiry(now),
      success_url: `${origin}/deal/${deal.toBase58()}?paid={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/deal/${deal.toBase58()}`,
    });
    if (!session.url) throw new Error("no url");
    return Response.json({ url: session.url, session: session.id });
  } catch {
    return Response.json({ error: CARD_UNAVAILABLE }, { status: 503 });
  }
}
