import type { DealStatus } from "./rules";

/** How far a deal has come. The program only moves a deal forward: open, then locked, then settled (released, returned or cancelled). */
export const STATUS_RANK: Record<DealStatus, number> = { open: 0, funded: 1, released: 2, refunded: 2, cancelled: 2 };

/** One poll answer: which request it answers (requests are numbered in the order they were sent) and the deal's status in it. */
export interface PollAnswer {
  seq: number;
  /** null: no deal at this address (yet). */
  status: DealStatus | null;
}

/**
 * Whether a poll answer may replace what the page shows (`shown`: the last answer applied, `{ seq: 0, status: null }` before
 * the first one). Polls overlap and can answer out of order, and the RPC's nodes can lag behind each other, so an answer is
 * dropped when a newer request's answer was already applied, or when it would move the deal backwards, for example from
 * "Released to landlord" back to "Deposit locked" (which would close the landlord's Released screen), or from a deal back
 * to "no deal here".
 */
export function acceptPoll(answer: PollAnswer, shown: PollAnswer): boolean {
  if (answer.seq < shown.seq) return false;
  if (shown.status === null) return true;
  return answer.status !== null && STATUS_RANK[answer.status] >= STATUS_RANK[shown.status];
}
