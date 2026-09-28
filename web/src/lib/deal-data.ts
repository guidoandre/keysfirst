import type { DealData } from "./deal-view";
import type { DealAccount } from "./program";
import { statusOf } from "./rules";

/** Anchor account (BN, PublicKey) → plain data for the views and the dashboard. */
export function toDealData(d: DealAccount): DealData {
  return {
    landlord: d.landlord.toBase58(),
    tenant: d.tenant.toBase58(),
    title: d.title,
    amount: d.amount.toString(),
    status: statusOf(d.status),
    moveIn: d.moveIn.toNumber(),
    deadline: d.deadline.toNumber(),
    createdAt: d.createdAt.toNumber(),
    fundedAt: d.fundedAt.toNumber(),
    settledAt: d.settledAt.toNumber(),
  };
}
