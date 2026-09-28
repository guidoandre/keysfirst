import { createAssociatedTokenAccountIdempotentInstruction, createMintToCheckedInstruction } from "@solana/spl-token";
import { Keypair, LAMPORTS_PER_SOL, SystemProgram, type Connection, type PublicKey, type TransactionInstruction } from "@solana/web3.js";
import { MINT, TOKEN_PROGRAM_ID } from "@/lib/config";
import { DECIMALS } from "@/lib/format";
import { tokenAccount } from "@/lib/program";

// Small on purpose: /api/gas is open, so every top-up is SOL anyone could drain with fresh accounts.
const SOL_TOP_UP = 0.02 * LAMPORTS_PER_SOL;
const SOL_MINIMUM = 0.01 * LAMPORTS_PER_SOL;

/** The devnet faucet wallet: mint authority of Test EUR and payer of top-ups. Null when not configured. */
export function faucetKeypair(): Keypair | null {
  const secret = process.env.FAUCET_SECRET_KEY;
  return secret ? Keypair.fromSecretKey(Uint8Array.from(JSON.parse(secret))) : null;
}

/** 0.02 SOL for network costs when the account holds less than 0.01 SOL (spec D4); null when it has enough. */
export async function topUpIx(connection: Connection, faucet: PublicKey, owner: PublicKey): Promise<TransactionInstruction | null> {
  if ((await connection.getBalance(owner)) >= SOL_MINIMUM) return null;
  return SystemProgram.transfer({ fromPubkey: faucet, toPubkey: owner, lamports: SOL_TOP_UP });
}

/** Creates the owner's Test EUR account if needed and mints `amount` (base units) into it. */
export function mintIxs(faucet: PublicKey, owner: PublicKey, amount: bigint): TransactionInstruction[] {
  const account = tokenAccount(owner);
  return [
    createAssociatedTokenAccountIdempotentInstruction(faucet, account, owner, MINT, TOKEN_PROGRAM_ID),
    createMintToCheckedInstruction(MINT, account, faucet, amount, DECIMALS, [], TOKEN_PROGRAM_ID),
  ];
}
