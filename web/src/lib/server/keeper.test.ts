import { BN, utils } from "@anchor-lang/core";
import { Connection, PublicKey } from "@solana/web3.js";
import { describe, expect, it, vi } from "vitest";

// config.ts reads these when it's imported; they must exist before the imports below run.
const MINT = vi.hoisted(() => {
  const mint = "5Me8DGHKU8tbr8Q9sUdHMsvtU7Wy4QsnvFvWedGGnfPE";
  process.env.NEXT_PUBLIC_MINT = mint;
  process.env.NEXT_PUBLIC_PRIVY_APP_ID = "test-app";
  return mint;
});

import { dealAddress, getProgram, type DealAccount } from "@/lib/program";
import { FUNDED_BASE58, MAX_PER_RUN, MINT_OFFSET, STATUS_OFFSET, selectExpired } from "./keeper";

const NOW = 1_790_000_000;
const landlord = PublicKey.unique();

function deal(o: { id?: number; status?: string; deadline?: number; mint?: string } = {}): DealAccount {
  return {
    landlord,
    tenant: PublicKey.unique(),
    mint: new PublicKey(o.mint ?? MINT),
    dealId: new BN(o.id ?? 1),
    amount: new BN("600000000"),
    moveIn: new BN(NOW - 5 * 86_400),
    deadline: new BN(o.deadline ?? NOW - 60),
    createdAt: new BN(NOW - 10 * 86_400),
    fundedAt: new BN(NOW - 9 * 86_400),
    settledAt: new BN(0),
    status: { [o.status ?? "funded"]: {} },
    bump: 255,
    title: "Room in Vallendar",
  } as unknown as DealAccount;
}

/** As getProgramAccounts returns it: at the deal's own address unless `address` says otherwise. */
const item = (account: DealAccount, address?: PublicKey) => ({ publicKey: address ?? dealAddress(landlord, account.dealId), account });

describe("account layout the keeper filters on", () => {
  it("has the mint at byte 72 and the status at byte 160, Funded being 1", async () => {
    // The app's own coder (camelCase names, as the program's accounts decode); nothing is sent to this address.
    const coder = getProgram(new Connection("http://127.0.0.1:8899")).coder.accounts;
    const funded = await coder.encode("deal", deal());
    const open = await coder.encode("deal", deal({ status: "open" }));
    expect(new PublicKey(funded.subarray(MINT_OFFSET, MINT_OFFSET + 32)).toBase58()).toBe(MINT);
    expect(funded[STATUS_OFFSET]).toBe(1);
    expect(open[STATUS_OFFSET]).toBe(0);
    expect(utils.bytes.bs58.encode(Buffer.from([1]))).toBe(FUNDED_BASE58);
  });
});

describe("selectExpired", () => {
  it("picks genuine locked deposits whose deadline has passed", () => {
    const due = item(deal({ id: 1 }));
    const selected = selectExpired([due], NOW);
    expect(selected.map((d) => d.address.toBase58())).toEqual([due.publicKey.toBase58()]);
  });

  it("leaves deals the program wouldn't let anyone return yet", () => {
    const atDeadline = item(deal({ id: 2, deadline: NOW })); // the program needs now > deadline
    const notYet = item(deal({ id: 3, deadline: NOW + 60 }));
    const settled = item(deal({ id: 4, status: "released" }));
    expect(selectExpired([atDeadline, notYet, settled], NOW)).toEqual([]);
  });

  it("ignores lookalikes: a deal at someone else's address or in another token", () => {
    const elsewhere = item(deal({ id: 5 }), PublicKey.unique());
    const otherToken = item(deal({ id: 6, mint: PublicKey.unique().toBase58() }));
    expect(selectExpired([elsewhere, otherToken], NOW)).toEqual([]);
  });

  it("lists every due deal, oldest deadline first (the run, not the list, stops after MAX_PER_RUN returns)", () => {
    const many = Array.from({ length: MAX_PER_RUN + 5 }, (_, i) => item(deal({ id: 100 + i, deadline: NOW - 1_000 + i })));
    const selected = selectExpired([...many].reverse(), NOW);
    expect(selected.map((d) => d.address.toBase58())).toEqual(many.map((d) => d.publicKey.toBase58()));
  });
});
