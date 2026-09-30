import { createAssociatedTokenAccountIdempotentInstruction, createMintToCheckedInstruction } from "@solana/spl-token";
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, type Connection, type TransactionInstruction } from "@solana/web3.js";
import { createHash } from "node:crypto";
import { MINT, TOKEN_PROGRAM_ID } from "@/lib/config";
import { DECIMALS } from "@/lib/format";
import { tokenAccount } from "@/lib/program";

// Small on purpose: /api/gas is open (rate-limited per account and IP), so every top-up is SOL someone could drain with fresh accounts.
const SOL_TOP_UP = 0.02 * LAMPORTS_PER_SOL;
const SOL_MINIMUM = 0.01 * LAMPORTS_PER_SOL;

// Top-ups stop while the faucet holds less than this, so the SOL that pays for card-payment mints is never given away.
const FAUCET_RESERVE = 0.5 * LAMPORTS_PER_SOL;

/** The devnet faucet wallet: mint authority of Test EUR and payer of top-ups. Null when not configured. */
export function faucetKeypair(): Keypair | null {
  const secret = process.env.FAUCET_SECRET_KEY;
  if (!secret) return null;
  try {
    return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(secret)));
  } catch {
    // Never let the parse error (which quotes the start of the secret) reach the logs.
    console.error("FAUCET_SECRET_KEY is not a JSON array of 64 numbers.");
    return null;
  }
}

/**
 * 0.02 SOL for network costs when the account holds less than 0.01 SOL (spec D4); null when it has enough,
 * or when the faucet is down to its reserve.
 */
export async function topUpIx(connection: Connection, faucet: PublicKey, owner: PublicKey): Promise<TransactionInstruction | null> {
  const [balance, faucetBalance] = await Promise.all([connection.getBalance(owner), connection.getBalance(faucet)]);
  if (balance >= SOL_MINIMUM || faucetBalance < FAUCET_RESERVE + SOL_TOP_UP) return null;
  return SystemProgram.transfer({ fromPubkey: faucet, toPubkey: owner, lamports: SOL_TOP_UP });
}

/**
 * An empty account at an address derived from the payment: creating it in the same transaction as the mint makes
 * the mint happen at most once per payment, because a second creation (a retry, a second tab) fails the whole
 * transaction. Returns the marker's address and the instruction that creates it.
 */
export async function mintOnceIx(connection: Connection, faucet: PublicKey, paymentId: string) {
  // Seeds are at most 32 characters: a hash of the payment id always fits.
  const seed = createHash("sha256").update(paymentId).digest("base64url").slice(0, 32);
  const marker = await PublicKey.createWithSeed(faucet, seed, SystemProgram.programId);
  const lamports = await connection.getMinimumBalanceForRentExemption(0);
  const ix = SystemProgram.createAccountWithSeed({
    fromPubkey: faucet,
    basePubkey: faucet,
    seed,
    newAccountPubkey: marker,
    lamports,
    space: 0,
    programId: SystemProgram.programId,
  });
  return { marker, ix };
}

/** Creates the owner's Test EUR account if needed and mints `amount` (base units) into it. */
export function mintIxs(faucet: PublicKey, owner: PublicKey, amount: bigint): TransactionInstruction[] {
  const account = tokenAccount(owner);
  return [
    createAssociatedTokenAccountIdempotentInstruction(faucet, account, owner, MINT, TOKEN_PROGRAM_ID),
    createMintToCheckedInstruction(MINT, account, faucet, amount, DECIMALS, [], TOKEN_PROGRAM_ID),
  ];
}
