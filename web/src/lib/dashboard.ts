import { dealPhase, type DealData } from "./deal-view";
import { formatCountdown, formatShortDateTime } from "./format";
import { handoverOpensAt, MAX_LOCK_DURATION } from "./rules";

export type DealRole = "landlord" | "tenant";
export interface DealSummary extends DealData {
  address: string;
  role: DealRole;
}
export type DealFilter = "all" | "letting" | "renting";
export type Urgency = "now" | "waiting" | "done";

export function toSummary(address: string, data: DealData, wallet: string): DealSummary | null {
  if (data.landlord === wallet) return { ...data, address, role: "landlord" };
  if (data.tenant === wallet) return { ...data, address, role: "tenant" };
  return null;
}

/** The landlord and tenant lookups can overlap only in theory; keep the first copy of each deal. */
export function mergeDeals(...lists: DealSummary[][]): DealSummary[] {
  const byAddress = new Map<string, DealSummary>();
  for (const d of lists.flat()) if (!byAddress.has(d.address)) byAddress.set(d.address, d);
  return [...byAddress.values()];
}

const phaseOf = (d: DealSummary, now: number) => dealPhase(d.status, { moveIn: d.moveIn, deadline: d.deadline }, now);

export function urgencyOf(d: DealSummary, now: number): Urgency {
  switch (phaseOf(d, now)) {
    case "funded-window":
    case "funded-expired":
      return "now";
    case "open-expired":
      return d.role === "landlord" ? "now" : "done";
    case "open":
    case "open-too-early":
    case "funded-before":
      return "waiting";
    default:
      return "done";
  }
}

export function nextActionText(d: DealSummary, now: number): string {
  const landlord = d.role === "landlord";
  switch (phaseOf(d, now)) {
    case "open":
      return "Waiting for your tenant to pay";
    case "open-too-early":
      return "Waiting until your tenant can pay";
    case "open-expired":
      return "Nobody paid: cancel the deal";
    case "funded-before":
      return landlord ? "Waiting for the handover" : "Get ready for the handover";
    case "funded-window":
      return landlord ? "Start the handover when you meet" : "At the door: scan the landlord's code";
    case "funded-expired":
      return landlord ? "Give the deposit back" : "Take the deposit back";
    case "released":
      return landlord ? "Deposit received" : "Deposit paid to the landlord";
    case "refunded":
      return landlord ? "Deposit returned to your tenant" : "Deposit back with you";
    case "cancelled":
      return "Deal cancelled";
  }
}

export function countdownLine(d: DealSummary, now: number): string {
  switch (phaseOf(d, now)) {
    case "open":
      return `Payment closes in ${formatCountdown(d.deadline - now)}`;
    case "open-too-early":
      return `Payment opens ${formatShortDateTime(d.deadline - MAX_LOCK_DURATION)}`;
    case "open-expired":
      return `Payment closed ${formatShortDateTime(d.deadline)}`;
    case "funded-before":
      return `Handover opens in ${formatCountdown(handoverOpensAt(d) - now)}`;
    case "funded-window":
      return `Handover deadline in ${formatCountdown(d.deadline - now)}`;
    case "funded-expired":
      return `Deadline passed ${formatShortDateTime(d.deadline)}`;
    case "released":
      return `Released ${formatShortDateTime(d.settledAt)}`;
    case "refunded":
      return `Returned ${formatShortDateTime(d.settledAt)}`;
    case "cancelled":
      return `Cancelled ${formatShortDateTime(d.settledAt)}`;
  }
}

const URGENCY_ORDER: Record<Urgency, number> = { now: 0, waiting: 1, done: 2 };

function nextMilestone(d: DealSummary, now: number): number {
  const phase = phaseOf(d, now);
  if (phase === "funded-before") return handoverOpensAt(d);
  if (phase === "open-too-early") return d.deadline - MAX_LOCK_DURATION;
  return d.deadline;
}

/** Needs you now (soonest deadline first), then waiting (soonest milestone first), then done (newest first). */
export function sortDeals(deals: DealSummary[], now: number): DealSummary[] {
  return [...deals].sort((a, b) => {
    const ua = urgencyOf(a, now);
    const ub = urgencyOf(b, now);
    if (ua !== ub) return URGENCY_ORDER[ua] - URGENCY_ORDER[ub];
    if (ua === "done") return (b.settledAt || b.createdAt) - (a.settledAt || a.createdAt);
    return nextMilestone(a, now) - nextMilestone(b, now);
  });
}

export function filterDeals(deals: DealSummary[], filter: DealFilter): DealSummary[] {
  if (filter === "all") return deals;
  const role: DealRole = filter === "letting" ? "landlord" : "tenant";
  return deals.filter((d) => d.role === role);
}

export function countByFilter(deals: DealSummary[]): Record<DealFilter, number> {
  const letting = deals.filter((d) => d.role === "landlord").length;
  return { all: deals.length, letting, renting: deals.length - letting };
}
