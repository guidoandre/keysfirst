import type { DealData } from "./deal-view";
import type { DealAccount } from "./program";
import { statusOf } from "./rules";

/**
 * Seconds from an on-chain i64. BN.toNumber() throws above 2^53, and the program accepts any future deadline:
 * one absurd deal created outside the app must not break a whole dashboard or API route.
 */
const seconds = (bn: { toString: () => string }) => Number(bn.toString());

/** Anchor account (BN, PublicKey) → plain data for the views and the dashboard. */
export function toDealData(d: DealAccount): DealData {
  return {
    landlord: d.landlord.toBase58(),
    tenant: d.tenant.toBase58(),
    title: d.title,
    amount: d.amount.toString(),
    status: statusOf(d.status),
    moveIn: seconds(d.moveIn),
    deadline: seconds(d.deadline),
    createdAt: seconds(d.createdAt),
    fundedAt: seconds(d.fundedAt),
    settledAt: seconds(d.settledAt),
  };
}
