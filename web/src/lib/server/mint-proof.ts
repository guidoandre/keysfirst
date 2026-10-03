import type { ParsedTransactionWithMeta } from "@solana/web3.js";
import { createHash, createHmac } from "node:crypto";

/**
 * Seed of a card payment's marker (see mintOnceIx): an HMAC of the payment id, keyed by the faucet's secret, so only
 * this server can work out the marker's address. With a public seed, anyone who learned a payment id could send a few
 * lamports to the marker first: its creation, and with it the mint, would then fail for good.
 */
export function markerSeed(secret: Uint8Array, paymentId: string): string {
  return createHmac("sha256", secret).update(`keysfirst-mint-marker:${paymentId}`).digest("base64url").slice(0, 32);
}

/** The public seed markers had until 3 Oct 2026. Still looked up, so a payment minted back then is never minted again. */
export function legacyMarkerSeed(paymentId: string): string {
  return createHash("sha256").update(paymentId).digest("base64url").slice(0, 32);
}

/** What a card payment's mint transaction must have done (all addresses base58). */
export interface ExpectedMint {
  faucet: string;
  marker: string;
  mint: string;
  /** The payer's Test EUR account. */
  account: string;
  /** Base units. */
  amount: bigint;
}

type Parsed = { program?: string; parsed?: { type?: string; info?: Record<string, unknown> } };

/**
 * True when `tx` is the faucet's own mint for this payment: it succeeded, the faucet signed it, it created the marker,
 * and it minted exactly the deposit into the payer's account. Anything else touching the marker (e.g. someone else's
 * transfer to it) is not proof that the deposit was minted.
 */
export function isFaucetMint(tx: ParsedTransactionWithMeta | null, e: ExpectedMint): boolean {
  if (!tx || !tx.meta || tx.meta.err) return false;
  const { accountKeys, instructions } = tx.transaction.message;
  if (!accountKeys.some((key) => key.signer && key.pubkey.toBase58() === e.faucet)) return false;
  const parsed = instructions as Parsed[];
  const created = parsed.some((ix) => {
    const info = ix.parsed?.info;
    return ix.program === "system" && ix.parsed?.type === "createAccountWithSeed" && info?.newAccount === e.marker && info?.base === e.faucet;
  });
  const minted = parsed.some((ix) => {
    const info = ix.parsed?.info;
    const amount = (info?.tokenAmount as { amount?: unknown } | undefined)?.amount;
    return (
      ix.program === "spl-token" &&
      ix.parsed?.type === "mintToChecked" &&
      info?.mint === e.mint &&
      info?.account === e.account &&
      info?.mintAuthority === e.faucet &&
      amount === e.amount.toString()
    );
  });
  return created && minted;
}
