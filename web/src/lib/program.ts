import { AnchorProvider, Program, type BN, type IdlAccounts } from "@anchor-lang/core";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { PublicKey, type Connection, type Transaction, type VersionedTransaction } from "@solana/web3.js";
import idl from "@/idl/keysfirst.json";
import type { Keysfirst } from "@/idl/keysfirst";
import { MINT, TOKEN_PROGRAM_ID } from "./config";

export type DealAccount = IdlAccounts<Keysfirst>["deal"];
export const PROGRAM_ID = new PublicKey(idl.address);

// Reads accounts and builds instructions only; real wallets sign in send.ts.
const readOnlyWallet = {
  publicKey: PublicKey.default,
  signTransaction: async <T extends Transaction | VersionedTransaction>(tx: T) => tx,
  signAllTransactions: async <T extends Transaction | VersionedTransaction>(txs: T[]) => txs,
};

export function getProgram(connection: Connection): Program<Keysfirst> {
  const provider = new AnchorProvider(
    connection,
    readOnlyWallet as ConstructorParameters<typeof AnchorProvider>[1],
    { commitment: "confirmed" },
  );
  return new Program(idl as Keysfirst, provider);
}

export function dealAddress(landlord: PublicKey, dealId: BN): PublicKey {
  return PublicKey.findProgramAddressSync(
    [new TextEncoder().encode("deal"), landlord.toBytes(), Uint8Array.from(dealId.toArray("le", 8))],
    PROGRAM_ID,
  )[0];
}

export function tokenAccount(owner: PublicKey, mint: PublicKey = MINT): PublicKey {
  return getAssociatedTokenAddressSync(mint, owner, true, TOKEN_PROGRAM_ID);
}

/** Successful transactions that touched the deal, oldest first. */
export async function dealSignatures(connection: Connection, deal: PublicKey): Promise<string[]> {
  const list = await connection.getSignaturesForAddress(deal, { limit: 20 }, "confirmed");
  return list.filter((s) => !s.err).map((s) => s.signature).reverse();
}
