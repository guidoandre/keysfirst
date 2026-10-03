import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import type Stripe from "stripe";
import { cardCharge, type CardCharged } from "@/lib/checkout";
import { MINT, SERVER_RPC_URL } from "@/lib/config";
import { toCents } from "@/lib/format";
import { tokenAccount } from "@/lib/program";
import { faucetKeypair, mintIxs, mintOnceIx } from "@/lib/server/faucet";
import { isJson } from "@/lib/server/limits";
import { isFaucetMint, type ExpectedMint } from "@/lib/server/mint-proof";
import { CARD_UNAVAILABLE, stripeClient } from "@/lib/server/stripe";

export const dynamic = "force-dynamic";

const NOT_PAID = "We haven't received your card payment yet.";
const NOT_FOUND = "We can't find this card payment. Start the payment again.";
const MINT_FAILED = "Your payment arrived, but we couldn't prepare the deposit yet. Try again in a minute.";
const CHARGE_FAILED = "We couldn't complete your card payment yet. Try again in a minute.";

/**
 * After a card payment: checks it at Stripe and mints exactly the deposit to the payer's account, at most once per
 * payment (spec D6). The mint transaction also creates an empty marker account derived from the payment, so a retry or
 * a second tab can never mint twice: their transaction fails as a whole. Safe to call again.
 */
export async function POST(req: Request) {
  if (!isJson(req)) return Response.json({ error: "Invalid request." }, { status: 415 });
  const stripe = stripeClient();
  const faucet = faucetKeypair();
  if (!stripe || !faucet) return Response.json({ error: CARD_UNAVAILABLE }, { status: 503 });

  let id: string;
  try {
    id = (await req.json()).session;
    // A payment from the card form on the deal page (pi_), or a Stripe Checkout session from before it (cs_).
    if (typeof id !== "string" || !/^(pi|cs)_[A-Za-z0-9_]+$/.test(id)) throw new Error("bad id");
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  let intent: Stripe.PaymentIntent;
  try {
    let intentId = id;
    if (id.startsWith("cs_")) {
      const session = await stripe.checkout.sessions.retrieve(id);
      const pi = session.payment_intent;
      if (session.status !== "complete" || !pi) return Response.json({ error: NOT_PAID }, { status: 402 });
      intentId = typeof pi === "string" ? pi : pi.id;
    }
    intent = await stripe.paymentIntents.retrieve(intentId, { expand: ["latest_charge"] });
  } catch (err) {
    // A payment Stripe doesn't know (another account, a changed key) will never be found: say so for good.
    if ((err as { code?: string })?.code === "resource_missing") return Response.json({ error: NOT_FOUND }, { status: 404 });
    return Response.json({ error: CARD_UNAVAILABLE }, { status: 503 });
  }
  const meta = intent.metadata;
  // "succeeded": charged (the card form charges the exact price). "requires_capture": an older Checkout payment held
  // at the higher rate, charged below at the rate for the card's issuing country.
  const held = intent.status === "requires_capture";
  if (!(held || intent.status === "succeeded") || !meta.deal || !meta.account || !meta.amount) {
    return Response.json({ error: NOT_PAID }, { status: 402 });
  }

  if (held) {
    // Charge only what this card owes and release the rest of the hold. The idempotency key makes a retry or a second
    // tab return the same capture instead of charging twice.
    const charge = intent.latest_charge as Stripe.Charge | null;
    const depositCents = Number(meta.deposit_cents ?? toCents(meta.amount));
    const due = cardCharge(depositCents, charge?.payment_method_details?.card?.country);
    try {
      intent = await stripe.paymentIntents.capture(
        intent.id,
        { amount_to_capture: Math.min(due.totalCents, intent.amount), metadata: { fee_rate: due.method, fee_cents: String(due.feeCents) } },
        { idempotencyKey: `capture-${intent.id}` },
      );
    } catch {
      return Response.json({ error: CHARGE_FAILED }, { status: 503 });
    }
    if (intent.status !== "succeeded") return Response.json({ error: CHARGE_FAILED }, { status: 503 });
  }
  const paymentId = intent.id;
  // What the card actually paid, so the deal page can say which price applied (/pay or the capture above recorded
  // the fee).
  const charged: CardCharged = {
    totalCents: intent.amount_received,
    feeCents: Number(intent.metadata.fee_cents),
    method: intent.metadata.fee_rate,
  };
  const paid = { deal: meta.deal, account: meta.account, charged };
  if (intent.metadata.minted) return Response.json({ signature: intent.metadata.minted, ...paid });

  const connection = new Connection(SERVER_RPC_URL, "confirmed");
  const record = async (signature: string) => {
    await stripe.paymentIntents.update(paymentId, { metadata: { minted: signature } }).catch(() => undefined);
    return Response.json({ signature, ...paid });
  };

  let tx: Transaction;
  let expected: ExpectedMint;
  try {
    const owner = new PublicKey(meta.account);
    const amount = BigInt(meta.amount);
    const once = await mintOnceIx(connection, faucet, paymentId);
    const proof = (marker: PublicKey): ExpectedMint => ({
      faucet: faucet.publicKey.toBase58(),
      marker: marker.toBase58(),
      mint: MINT.toBase58(),
      account: tokenAccount(owner).toBase58(),
      amount,
    });
    expected = proof(once.marker);
    // Minted by an earlier call whose record didn't reach Stripe (a timeout, a second tab), possibly while markers
    // still had public addresses (legacyMarker): don't mint again.
    const earlier = (await mintedBy(connection, expected)) ?? (await mintedBy(connection, proof(once.legacyMarker)));
    if (earlier) return await record(earlier);
    tx = new Transaction().add(once.ix, ...mintIxs(faucet.publicKey, owner, amount));
  } catch {
    return Response.json({ error: MINT_FAILED }, { status: 503 });
  }

  let signature: string | undefined;
  try {
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
    tx.feePayer = faucet.publicKey;
    tx.recentBlockhash = blockhash;
    tx.sign(faucet);
    signature = await connection.sendRawTransaction(tx.serialize());
    const result = await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");
    // A failed transaction (e.g. the marker already exists because another call minted first) minted nothing.
    if (result.value.err) {
      const other = await mintedBy(connection, expected).catch(() => null);
      return other ? await record(other) : Response.json({ error: MINT_FAILED }, { status: 503 });
    }
  } catch {
    // Usually a second call (a reload, a second tab) whose send was refused because the first one's marker exists:
    // look for that mint for a few seconds before reporting a failure. If there is none, the outcome is unknown and
    // nothing is recorded; the marker makes the retry safe: it either finds this mint or makes the only one.
    for (let i = 0; i < 4; i++) {
      const other = await mintedBy(connection, expected).catch(() => null);
      if (other) return await record(other);
      await new Promise((resolve) => setTimeout(resolve, 1_500));
    }
    return Response.json({ error: MINT_FAILED }, { status: 503 });
  }

  // Network costs for the lock are covered by the deal page (/api/gas, rate-limited) right before it locks, not
  // here: a free test card would otherwise let anyone collect top-ups from the faucet with fresh accounts.
  return await record(signature);
}

/**
 * The faucet's own mint for this payment, found through its marker, or null when there is none. An account at the
 * marker address proves nothing by itself: only a transaction that passes isFaucetMint counts.
 */
async function mintedBy(connection: Connection, expected: ExpectedMint): Promise<string | null> {
  const marker = new PublicKey(expected.marker);
  const info = await connection.getAccountInfo(marker, "confirmed");
  if (!info) return null;
  // Oldest first: creating the marker is its first transaction, so later transfers to the address can't hide it.
  const list = (await connection.getSignaturesForAddress(marker, { limit: 1000 }, "confirmed")).filter((s) => !s.err).reverse();
  for (const { signature } of list.slice(0, 5)) {
    const tx = await connection.getParsedTransaction(signature, { commitment: "confirmed", maxSupportedTransactionVersion: 0 });
    if (isFaucetMint(tx, expected)) return signature;
  }
  return null;
}
