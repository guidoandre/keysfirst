import { BN } from "@anchor-lang/core";
import { PublicKey } from "@solana/web3.js";
import { describe, expect, it } from "vitest";
import { toDealData } from "./deal-data";
import type { DealAccount } from "./program";

describe("toDealData", () => {
  it("turns the Anchor account into plain data", () => {
    const landlord = PublicKey.unique();
    const tenant = PublicKey.unique();
    const account = {
      landlord,
      tenant,
      mint: PublicKey.unique(),
      dealId: new BN(7),
      amount: new BN("600000000"),
      moveIn: new BN(1_790_000_000),
      deadline: new BN(1_790_259_200),
      createdAt: new BN(1_789_000_000),
      fundedAt: new BN(1_789_000_480),
      settledAt: new BN(0),
      status: { funded: {} },
      bump: 254,
      title: "Room in Vallendar",
    } as unknown as DealAccount;
    expect(toDealData(account)).toEqual({
      landlord: landlord.toBase58(),
      tenant: tenant.toBase58(),
      title: "Room in Vallendar",
      amount: "600000000",
      status: "funded",
      moveIn: 1_790_000_000,
      deadline: 1_790_259_200,
      createdAt: 1_789_000_000,
      fundedAt: 1_789_000_480,
      settledAt: 0,
    });
  });
});
