import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import type Stripe from "stripe";
import { cardCharge, checkoutProblem, STRIPE_MAX_CENTS } from "@/lib/checkout";
import { SERVER_RPC_URL } from "@/lib/config";
import { toDealData } from "@/lib/deal-data";
import type { DealData } from "@/lib/deal-view";
import { fromCents, toCents } from "@/lib/format";
import { priceBreakdown } from "@/lib/pricing";
import { fetchDeal, getProgram } from "@/lib/program";
import { faucetKeypair } from "./faucet";
import { isJson } from "./limits";
import { CARD_UNAVAILABLE, stripeClient } from "./stripe";

// Each mint after a card payment costs the faucet about 0.003 SOL: below this, stop taking money we couldn't turn into a deposit.
const MINT_FLOOR = 0.05 * LAMPORTS_PER_SOL;

type Failure = { error: Response };
const fail = (error: string, status: number): Failure => ({ error: Response.json({ error }, { status }) });

export interface CardRequest {
  stripe: Stripe;
  deal: PublicKey;
  account: PublicKey;
  /** The ConfirmationToken Stripe's card form created in the browser (the card, not yet charged). */
  token: string;
  body: Record<string, unknown>;
}

/** Parses a card-payment request ({ deal, account, token }): the setup both /quote and /pay share. */
export async function readCardRequest(req: Request): Promise<CardRequest | Failure> {
  if (!isJson(req)) return fail("Invalid request.", 415);
  const stripe = stripeClient();
  // Without the faucet the payment could be taken but never become a deposit.
  if (!stripe || !faucetKeypair()) return fail(CARD_UNAVAILABLE, 503);
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const deal = new PublicKey(body.deal as string);
    const account = new PublicKey(body.account as string);
    if (!PublicKey.isOnCurve(account.toBytes())) throw new Error("not an account");
    const token = body.token;
    if (typeof token !== "string" || !token.startsWith("ctoken_")) throw new Error("no card");
    return { stripe, deal, account, token, body };
  } catch {
    return fail("Invalid request.", 400);
  }
}

/** The deal, when `account` can pay it by card right now (open, in its payment window, not the landlord, whole cents). */
export async function payableDeal(deal: PublicKey, account: PublicKey): Promise<{ data: DealData } | Failure> {
  const faucet = faucetKeypair();
  if (!faucet) return fail(CARD_UNAVAILABLE, 503);
  let data: DealData | null;
  try {
    const connection = new Connection(SERVER_RPC_URL, "confirmed");
    const [found, faucetBalance] = await Promise.all([
      // null for anything that isn't a genuine Keysfirst deal (another account, a lookalike, another token).
      fetchDeal(getProgram(connection), deal),
      connection.getBalance(faucet.publicKey),
    ]);
    if (faucetBalance < MINT_FLOOR) return fail(CARD_UNAVAILABLE, 503);
    data = found ? toDealData(found) : null;
  } catch {
    return fail(CARD_UNAVAILABLE, 503);
  }
  if (!data) return fail("We can't find this deal.", 404);
  const problem = checkoutProblem({
    status: data.status,
    landlord: data.landlord,
    account: account.toBase58(),
    times: { moveIn: data.moveIn, deadline: data.deadline },
    now: Math.floor(Date.now() / 1000),
  });
  if (problem) return fail(problem, 409);
  // Stripe charges whole cents: a deposit with a fraction of a cent could never be locked in full.
  if (BigInt(data.amount) !== fromCents(toCents(data.amount))) return fail("This deposit amount can't be paid by card.", 409);
  if (priceBreakdown(toCents(data.amount), "cardIntl").totalCents > STRIPE_MAX_CENTS) {
    return fail("This deposit is too large to pay by card. Pay it from your balance instead.", 409);
  }
  return { data };
}

/** The exact price for the card in `token`: the fee depends on where the card was issued (3.5% EEA, 4.5% elsewhere). */
export async function priceForCard(stripe: Stripe, token: string, depositCents: number) {
  let card: Stripe.ConfirmationToken.PaymentMethodPreview.Card | undefined;
  try {
    card = (await stripe.confirmationTokens.retrieve(token)).payment_method_preview?.card ?? undefined;
  } catch (err) {
    if ((err as { code?: string })?.code === "resource_missing") return fail("Enter your card again.", 400);
    return fail(CARD_UNAVAILABLE, 503);
  }
  if (!card) return fail("Enter a card to pay with.", 400);
  return { card, due: cardCharge(depositCents, card.country) };
}
