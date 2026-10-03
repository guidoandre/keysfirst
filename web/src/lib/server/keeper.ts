import type { Program } from "@anchor-lang/core";
import { LAMPORTS_PER_SOL, Transaction, sendAndConfirmTransaction, type Connection, type Keypair, type PublicKey } from "@solana/web3.js";
import type { Keysfirst } from "@/idl/keysfirst";
import { MINT } from "@/lib/config";
import { toDealData } from "@/lib/deal-data";
import { refundIx } from "@/lib/instructions";
import { isGenuineDeal, type DealAccount } from "@/lib/program";
import { isExpired, statusOf } from "@/lib/rules";
import { withTimeout } from "@/lib/timeout";

// Deal account layout: 8-byte type tag, landlord, tenant, mint (32 bytes each), deal id, amount (u64), move-in,
// deadline, created, funded, settled (i64), then the status (one byte: Open 0, Funded 1, ...).
export const MINT_OFFSET = 72;
export const STATUS_OFFSET = 160;
/** "2" is the byte 1 (Funded) in base58, the encoding getProgramAccounts filters take. */
export const FUNDED_BASE58 = "2";

// One run returns at most this many deposits and starts no new one RUN_BUDGET_MS after it began; with the 15-second
// limit on the last transaction that stays inside the function's 60 seconds. The rest go out on the next run.
export const MAX_PER_RUN = 20;
const RUN_BUDGET_MS = 35_000;
// A return costs about 0.000005 SOL, plus about 0.002 SOL if the tenant closed their token account. Below this the
// faucet can't be trusted to pay for a whole run.
const MIN_FAUCET_BALANCE = 0.05 * LAMPORTS_PER_SOL;

export interface ExpiredDeal {
  address: PublicKey;
  account: DealAccount;
}

/** Locked deposits whose handover deadline has passed, oldest first: the program lets anyone send these back to the tenant. */
export function selectExpired(items: Array<{ publicKey: PublicKey; account: DealAccount }>, now: number): ExpiredDeal[] {
  return items
    .filter(({ publicKey, account }) => isGenuineDeal(publicKey, account))
    .filter(({ account }) => statusOf(account.status) === "funded")
    .filter(({ account }) => {
      const d = toDealData(account);
      return isExpired({ moveIn: d.moveIn, deadline: d.deadline }, now);
    })
    .sort((a, b) => toDealData(a.account).deadline - toDealData(b.account).deadline)
    .map(({ publicKey, account }) => ({ address: publicKey, account }));
}

export interface KeeperResult {
  returned: Array<{ deal: string; signature: string }>;
  failed: string[];
  /** The faucet couldn't pay for the run, so nothing was sent. */
  lowFunds: boolean;
}

/**
 * The daily keeper (spec §9): sends every expired locked deposit back to its tenant, signed by the faucet as "anyone".
 * The program decides who gets the money (always the tenant), so the keeper can't send it anywhere else, and a
 * tenant or landlord who returns it first only makes the keeper's transaction for that deal fail harmlessly.
 */
export async function returnExpiredDeposits(
  connection: Connection,
  program: Program<Keysfirst>,
  faucet: Keypair,
  now = Math.floor(Date.now() / 1000),
): Promise<KeeperResult> {
  const started = Date.now();
  const items = await withTimeout(
    program.account.deal.all([
      { memcmp: { offset: MINT_OFFSET, bytes: MINT.toBase58() } },
      { memcmp: { offset: STATUS_OFFSET, bytes: FUNDED_BASE58 } },
    ]),
    15_000,
  );
  const expired = selectExpired(items, now);
  const result: KeeperResult = { returned: [], failed: [], lowFunds: false };
  if (expired.length === 0) return result;
  if ((await withTimeout(connection.getBalance(faucet.publicKey), 5_000)) < MIN_FAUCET_BALANCE) return { ...result, lowFunds: true };

  // One at a time: they share the faucet as fee payer. A deal whose return keeps failing (say, a tenant's token account
  // that refuses transfers without a memo) is skipped and doesn't count, so a few of them can't block everyone else's.
  // A failed attempt costs nothing: the network's pre-check rejects it before anything is sent.
  for (const { address, account } of expired) {
    if (result.returned.length >= MAX_PER_RUN || Date.now() - started > RUN_BUDGET_MS) break;
    try {
      const ix = await refundIx(program, address, account, faucet.publicKey);
      const signature = await withTimeout(
        sendAndConfirmTransaction(connection, new Transaction().add(ix), [faucet], { commitment: "confirmed" }),
        15_000,
      );
      result.returned.push({ deal: address.toBase58(), signature });
    } catch {
      result.failed.push(address.toBase58());
    }
  }
  return result;
}
