import { formatDoorTime } from "./format";

// Mirrors programs/keysfirst/src/constants.rs. Keep in sync.
export const HANDOVER_OPENS_BEFORE_MOVE_IN = 24 * 60 * 60;
export const MAX_HANDOVER_WINDOW = 14 * 24 * 60 * 60;
export const MAX_LOCK_DURATION = 180 * 24 * 60 * 60;

export type DealStatus = "open" | "funded" | "released" | "refunded" | "cancelled";
export type Role = "landlord" | "tenant" | "visitor";
export type Action = "fund" | "showQr" | "confirmInApp" | "refund" | "cancel";
export interface DealTimes {
  moveIn: number;
  deadline: number;
}

/** Anchor decodes enums as { funded: {} }. */
export function statusOf(raw: object): DealStatus {
  return Object.keys(raw)[0].toLowerCase() as DealStatus;
}

export const STATUS_LABEL: Record<DealStatus, string> = {
  open: "Waiting for deposit",
  funded: "Deposit locked",
  released: "Released to landlord",
  refunded: "Returned to tenant",
  cancelled: "Cancelled",
};

export function roleOf(landlord: string, tenant: string, wallet?: string | null): Role {
  if (!wallet) return "visitor";
  if (wallet === landlord) return "landlord";
  if (wallet === tenant) return "tenant";
  return "visitor";
}

export const handoverOpensAt = (d: DealTimes) => d.moveIn - HANDOVER_OPENS_BEFORE_MOVE_IN;
export const canFund = (d: DealTimes, now: number) => now <= d.deadline && d.deadline - now <= MAX_LOCK_DURATION;
export const canConfirm = (d: DealTimes, now: number) => now >= handoverOpensAt(d) && now <= d.deadline;
export const isExpired = (d: DealTimes, now: number) => now > d.deadline;

/** Buttons the viewer may use right now. Mirrors the program's checks. */
export function availableActions(status: DealStatus, role: Role, d: DealTimes, now: number): Action[] {
  if (status === "open") {
    if (role === "landlord") return ["cancel"];
    return canFund(d, now) ? ["fund"] : [];
  }
  if (status !== "funded") return [];
  if (role === "landlord") return canConfirm(d, now) ? ["showQr", "refund"] : ["refund"];
  if (isExpired(d, now)) return ["refund"];
  if (role === "tenant" && canConfirm(d, now)) return ["confirmInApp"];
  return [];
}

/** Why the handover QR cannot give `account` a transaction right now; null if it can. */
export function handoverProblem(
  status: DealStatus,
  tenant: string,
  account: string,
  d: DealTimes,
  now: number,
): string | null {
  if (status !== "funded") return "There is no locked deposit to release for this deal.";
  if (account !== tenant) return "Only the tenant who paid the deposit can confirm the handover. Switch Phantom to that wallet.";
  if (now < handoverOpensAt(d)) return `The handover opens on ${formatDoorTime(handoverOpensAt(d))}.`;
  if (now > d.deadline) return "The handover deadline has passed: the deposit can now be taken back to the tenant on the deal page.";
  return null;
}

export interface TimelineStep {
  label: string;
  done: boolean;
  time?: number;
  signature?: string;
}

/** How many successful transactions a deal in this status has behind it (one per timeline step). */
export function timelineTransactionCount(status: DealStatus): number {
  if (status === "open") return 1;
  if (status === "funded" || status === "cancelled") return 2;
  return 3;
}

/** Successful transactions touching a deal, oldest first: create, fund, settle (or create, cancel). */
export function timelineSteps(
  status: DealStatus,
  times: { createdAt: number; fundedAt: number; settledAt: number },
  signatures: string[],
): TimelineStep[] {
  const created: TimelineStep = { label: "Deal created", done: true, time: times.createdAt, signature: signatures[0] };
  if (status === "cancelled") {
    return [created, { label: "Cancelled", done: true, time: times.settledAt, signature: signatures[1] }];
  }
  const funded = status !== "open";
  const settled = status === "released" || status === "refunded";
  return [
    created,
    {
      label: "Deposit locked",
      done: funded,
      time: funded ? times.fundedAt : undefined,
      signature: funded ? signatures[1] : undefined,
    },
    {
      label: status === "released" ? "Released to landlord" : status === "refunded" ? "Returned to tenant" : "Key handover",
      done: settled,
      time: settled ? times.settledAt : undefined,
      signature: settled ? signatures[2] : undefined,
    },
  ];
}
