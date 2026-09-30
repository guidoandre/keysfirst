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

/**
 * True for a deal Keysfirst itself created in Test EUR. Anchor only checks an account's 8-byte type tag, which is
 * public: another program can write a lookalike "Funded" deal naming any landlord. Only the program can create an
 * account at the deal's own address, and a deal in another token would be shown in € without being euros.
 */
export function isGenuineDeal(address: PublicKey, data: DealAccount): boolean {
  return dealAddress(data.landlord, data.dealId).equals(address) && data.mint.equals(MINT);
}

/** Reads a deal: null when nothing, something that isn't a deal, or a lookalike lives at this address. Network errors throw. */
export async function fetchDeal(program: Program<Keysfirst>, address: PublicKey): Promise<DealAccount | null> {
  const info = await program.provider.connection.getAccountInfo(address, "confirmed");
  if (!info || !info.owner.equals(PROGRAM_ID)) return null;
  let data: DealAccount;
  try {
    data = program.coder.accounts.decode<DealAccount>("deal", info.data);
  } catch {
    return null;
  }
  return isGenuineDeal(address, data) ? data : null;
}

export function tokenAccount(owner: PublicKey, mint: PublicKey = MINT): PublicKey {
  return getAssociatedTokenAddressSync(mint, owner, true, TOKEN_PROGRAM_ID);
}

/** Successful transactions that touched the deal, oldest first. */
export async function dealSignatures(connection: Connection, deal: PublicKey): Promise<string[]> {
  const list = await connection.getSignaturesForAddress(deal, { limit: 20 }, "confirmed");
  return list.filter((s) => !s.err).map((s) => s.signature).reverse();
}
