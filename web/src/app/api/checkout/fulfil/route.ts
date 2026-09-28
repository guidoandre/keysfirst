import { Connection, PublicKey, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import type Stripe from "stripe";
import { RPC_URL } from "@/lib/config";
import { faucetKeypair, mintIxs, topUpIx } from "@/lib/server/faucet";
import { CARD_UNAVAILABLE, stripeClient } from "@/lib/server/stripe";

export const dynamic = "force-dynamic";

const NOT_PAID = "We haven't received your card payment yet.";
const MINT_FAILED = "Your payment arrived, but we couldn't prepare the deposit yet. Try again in a minute.";

/**
 * After Stripe's page: checks the payment, mints exactly the deposit to the payer's account once, and records
 * the mint on the payment intent so a retry never mints twice (spec D6). Safe to call again.
 */
export async function POST(req: Request) {
  const stripe = stripeClient();
  const faucet = faucetKeypair();
  if (!stripe || !faucet) return Response.json({ error: CARD_UNAVAILABLE }, { status: 503 });

  let id: string;
  try {
    id = (await req.json()).session;
    if (typeof id !== "string" || !id.startsWith("cs_")) throw new Error("bad id");
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(id, { expand: ["payment_intent"] });
  } catch {
    return Response.json({ error: CARD_UNAVAILABLE }, { status: 503 });
  }
  const intent = session.payment_intent as Stripe.PaymentIntent | null;
  const meta = session.metadata ?? {};
  if (session.payment_status !== "paid" || !intent || !meta.deal || !meta.account || !meta.amount) {
    return Response.json({ error: NOT_PAID }, { status: 402 });
  }
  if (intent.metadata.minted) return Response.json({ signature: intent.metadata.minted, deal: meta.deal });

  const connection = new Connection(RPC_URL, "confirmed");
  const owner = new PublicKey(meta.account);
  let signature: string;
  try {
    const tx = new Transaction().add(...mintIxs(faucet.publicKey, owner, BigInt(meta.amount)));
    const gas = await topUpIx(connection, faucet.publicKey, owner);
    if (gas) tx.add(gas);
    signature = await sendAndConfirmTransaction(connection, tx, [faucet], { commitment: "confirmed" });
  } catch {
    return Response.json({ error: MINT_FAILED }, { status: 503 });
  }
  // Known limit (spec §6): two simultaneous calls could both mint; a webhook fixes this in production.
  await stripe.paymentIntents.update(intent.id, { metadata: { minted: signature } }).catch(() => undefined);
  return Response.json({ signature, deal: meta.deal });
}
