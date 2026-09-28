import { BN, type Program } from "@anchor-lang/core";
import { ASSOCIATED_TOKEN_PROGRAM_ID, createBurnCheckedInstruction } from "@solana/spl-token";
import { SystemProgram, type PublicKey, type TransactionInstruction } from "@solana/web3.js";
import type { Keysfirst } from "@/idl/keysfirst";
import { MINT, TOKEN_PROGRAM_ID } from "./config";
import { DECIMALS } from "./format";
import { dealAddress, tokenAccount, type DealAccount } from "./program";

type KeysfirstProgram = Program<Keysfirst>;

const PROGRAMS = {
  tokenProgram: TOKEN_PROGRAM_ID,
  associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
  systemProgram: SystemProgram.programId,
};

/** Random u64 so each deal gets its own address. */
export function randomDealId(): BN {
  return new BN(crypto.getRandomValues(new Uint8Array(8)), 10, "le");
}

export interface NewDeal {
  dealId: BN;
  amount: BN;
  moveIn: BN;
  deadline: BN;
  title: string;
}

export async function createDealIx(
  program: KeysfirstProgram,
  landlord: PublicKey,
  deal: NewDeal,
): Promise<{ ix: TransactionInstruction; address: PublicKey }> {
  const address = dealAddress(landlord, deal.dealId);
  const ix = await program.methods
    .createDeal(deal.dealId, deal.amount, deal.moveIn, deal.deadline, deal.title)
    .accountsPartial({
      landlord,
      deal: address,
      mint: MINT,
      vault: tokenAccount(address),
      landlordToken: tokenAccount(landlord),
      ...PROGRAMS,
    })
    .instruction();
  return { ix, address };
}

export function fundIx(program: KeysfirstProgram, deal: PublicKey, tenant: PublicKey, data: DealAccount) {
  return program.methods
    .fund()
    .accountsPartial({
      tenant,
      deal,
      mint: data.mint,
      tenantToken: tokenAccount(tenant, data.mint),
      vault: tokenAccount(deal, data.mint),
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .instruction();
}

export function confirmHandoverIx(program: KeysfirstProgram, deal: PublicKey, data: DealAccount) {
  return program.methods
    .confirmHandover()
    .accountsPartial({
      tenant: data.tenant,
      deal,
      landlord: data.landlord,
      mint: data.mint,
      vault: tokenAccount(deal, data.mint),
      landlordToken: tokenAccount(data.landlord, data.mint),
      ...PROGRAMS,
    })
    .instruction();
}

export function refundIx(program: KeysfirstProgram, deal: PublicKey, data: DealAccount, caller: PublicKey) {
  return program.methods
    .refund()
    .accountsPartial({
      caller,
      deal,
      tenant: data.tenant,
      landlord: data.landlord,
      mint: data.mint,
      vault: tokenAccount(deal, data.mint),
      tenantToken: tokenAccount(data.tenant, data.mint),
      ...PROGRAMS,
    })
    .instruction();
}

export function cancelDealIx(program: KeysfirstProgram, deal: PublicKey, data: DealAccount) {
  return program.methods
    .cancelDeal()
    .accountsPartial({
      landlord: data.landlord,
      deal,
      mint: data.mint,
      vault: tokenAccount(deal, data.mint),
      landlordToken: tokenAccount(data.landlord, data.mint),
      ...PROGRAMS,
    })
    .instruction();
}

/** Withdraw to bank (spec D7): the Test EUR leave circulation; the bank payout itself is simulated. */
export function withdrawIx(owner: PublicKey, amount: bigint): TransactionInstruction {
  return createBurnCheckedInstruction(tokenAccount(owner), MINT, owner, amount, DECIMALS, [], TOKEN_PROGRAM_ID);
}
