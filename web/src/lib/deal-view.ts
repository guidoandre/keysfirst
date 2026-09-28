import { formatShortDateTime } from "./format";
import {
  availableActions,
  canFund,
  handoverOpensAt,
  isExpired,
  MAX_LOCK_DURATION,
  STATUS_LABEL,
  timelineSteps,
  type Action,
  type DealStatus,
  type DealTimes,
  type Role,
} from "./rules";

/** A deal as plain data (converted from the Anchor account by toDealData). */
export interface DealData {
  landlord: string;
  tenant: string;
  title: string;
  /** Base units (6 decimals) as a string. */
  amount: string;
  status: DealStatus;
  moveIn: number;
  deadline: number;
  createdAt: number;
  fundedAt: number;
  settledAt: number;
}

export type Phase =
  | "open"
  | "open-too-early"
  | "open-expired"
  | "funded-before"
  | "funded-window"
  | "funded-expired"
  | "released"
  | "refunded"
  | "cancelled";

/** Where a deal stands right now; the clock rules mirror rules.ts (and the program). */
export function dealPhase(status: DealStatus, t: DealTimes, now: number): Phase {
  switch (status) {
    case "open":
      if (isExpired(t, now)) return "open-expired";
      return canFund(t, now) ? "open" : "open-too-early";
    case "funded":
      if (isExpired(t, now)) return "funded-expired";
      return now >= handoverOpensAt(t) ? "funded-window" : "funded-before";
    default:
      return status;
  }
}

export interface CountdownInfo {
  label: string;
  at: number;
}

export function countdownFor(phase: Phase, t: DealTimes): CountdownInfo | null {
  switch (phase) {
    case "open":
      return { label: "Payment closes in", at: t.deadline };
    case "open-too-early":
      return { label: "Payment opens in", at: t.deadline - MAX_LOCK_DURATION };
    case "open-expired":
      return { label: "Payment closed", at: t.deadline };
    case "funded-before":
      return { label: "Handover opens in", at: handoverOpensAt(t) };
    case "funded-window":
      return { label: "Handover deadline in", at: t.deadline };
    case "funded-expired":
      return { label: "Deadline passed", at: t.deadline };
    default:
      return null;
  }
}

export const ROLE_LINE: Record<Role, string> = {
  landlord: "You're the landlord",
  tenant: "You're the tenant",
  visitor: "Deposit link",
};

export function statusLine(status: DealStatus, role: Role): string {
  switch (status) {
    case "open":
      return role === "landlord" ? "Waiting for your tenant to pay." : "Waiting for the deposit.";
    case "funded":
      return "The money is in the lock.";
    case "released":
      return "Paid to the landlord at the handover.";
    case "refunded":
      return "Back with the tenant.";
    case "cancelled":
      return "Closed before anyone paid.";
  }
}

export interface NextStepView {
  /** One sentence above the buttons. */
  message: string;
  /** The single primary action for this viewer right now, if any. */
  primary?: Action;
  /** Secondary actions (quiet buttons). */
  secondary: Action[];
}

/** The deal page's next-step matrix (spec §6.4). Only ever offers actions from availableActions(). */
export function nextStep(o: { status: DealStatus; role: Role; times: DealTimes; now: number; amount: string; settledAt?: number }): NextStepView {
  const { status, role, times: t, now, amount } = o;
  const allowed = availableActions(status, role, t, now);
  const pick = (primary: Action | undefined, secondary: Action[]) => ({
    primary: primary && allowed.includes(primary) ? primary : undefined,
    secondary: secondary.filter((a) => allowed.includes(a)),
  });
  const opens = formatShortDateTime(handoverOpensAt(t));
  const deadline = formatShortDateTime(t.deadline);
  const payFrom = formatShortDateTime(t.deadline - MAX_LOCK_DURATION);
  const settled = o.settledAt ? formatShortDateTime(o.settledAt) : "";

  switch (dealPhase(status, t, now)) {
    case "open":
      return role === "landlord"
        ? { message: "Send the link to your tenant. Once they pay, the deposit stays locked until the key handover.", ...pick(undefined, ["cancel"]) }
        : {
            message: `Pay ${amount} into the lock. The landlord gets it only when you confirm the key handover at the door. If that doesn't happen by ${deadline}, you can take it back.`,
            ...pick("fund", []),
          };
    case "open-too-early":
      return role === "landlord"
        ? { message: `Your tenant can pay from ${payFrom}, so the money is never locked for more than 180 days.`, ...pick(undefined, ["cancel"]) }
        : { message: `You can pay from ${payFrom}, so the money is never locked for more than 180 days.`, ...pick(undefined, []) };
    case "open-expired":
      return role === "landlord"
        ? { message: "Nobody paid before the deadline. Cancel the deal to close it.", ...pick("cancel", []) }
        : { message: "This link expired before anyone paid. Ask the landlord for a new one.", ...pick(undefined, []) };
    case "funded-before":
      if (role === "landlord") return { message: `The deposit is locked. Your handover opens ${opens}.`, ...pick(undefined, ["refund"]) };
      if (role === "tenant") {
        return {
          message: `Your deposit is locked. The handover opens ${opens}. At the door, check the room, then scan the landlord's code.`,
          ...pick(undefined, []),
        };
      }
      return { message: `The deposit is locked until the key handover or ${deadline}.`, ...pick(undefined, []) };
    case "funded-window":
      if (role === "landlord") {
        return {
          message: "When you meet, start the handover and show your code. Hand over the keys when your screen turns green.",
          ...pick("showQr", ["refund"]),
        };
      }
      if (role === "tenant") {
        return { message: "At the door, check the room first. Then scan the landlord's code with your phone camera.", ...pick(undefined, ["confirmInApp"]) };
      }
      return { message: `The deposit is locked until the key handover or ${deadline}.`, ...pick(undefined, []) };
    case "funded-expired":
      if (role === "landlord") return { message: "The deadline passed without a handover. The deposit can go back to the tenant now.", ...pick("refund", []) };
      if (role === "tenant") return { message: "The deadline passed without a handover. You can take your deposit back now.", ...pick("refund", []) };
      return { message: "The deadline passed without a handover. Anyone can now return the deposit to the tenant.", ...pick("refund", []) };
    case "released":
      if (role === "landlord") return { message: `The tenant confirmed the handover on ${settled}. The deposit is in your wallet.`, secondary: [] };
      if (role === "tenant") return { message: `You confirmed the handover on ${settled}. The deposit went to the landlord.`, secondary: [] };
      return { message: `The tenant confirmed the handover on ${settled}. The deposit went to the landlord.`, secondary: [] };
    case "refunded":
      return {
        message: role === "tenant" ? `Your deposit came back to you on ${settled}.` : `The deposit went back to the tenant on ${settled}.`,
        secondary: [],
      };
    case "cancelled":
      return {
        message: role === "landlord" ? "You cancelled this deal before anyone paid." : "The landlord cancelled this deal before anyone paid.",
        secondary: [],
      };
  }
}

/**
 * Whether the landlord's Released screen is up (spec §6.5): the deal was released while this page watched it, or while
 * handover mode was open, and the landlord hasn't dismissed the screen themself.
 */
export function showReleasedScreen(o: { role: Role; status: DealStatus; handoverOpen: boolean; justReleased: boolean; dismissed: boolean }): boolean {
  return o.role === "landlord" && o.status === "released" && !o.dismissed && (o.handoverOpen || o.justReleased);
}

export function actionLabel(action: Action, role: Role, amount: string): string {
  switch (action) {
    case "fund":
      return `Pay ${amount} into the lock`;
    case "showQr":
      return "Start the handover";
    case "confirmInApp":
      return "I have the keys: release the deposit";
    case "refund":
      if (role === "landlord") return "Give the deposit back to the tenant";
      return role === "tenant" ? "Take the deposit back" : "Return the deposit to the tenant";
    case "cancel":
      return "Cancel this deal";
  }
}

export function loginLabel(action: Action): string {
  if (action === "fund") return "Log in to pay";
  if (action === "refund") return "Log in to return it";
  return "Log in";
}

export interface ConfirmCopy {
  title: string;
  body: string;
  confirm: string;
  danger: boolean;
}

/**
 * In-page confirmation before irreversible steps; null means "just ask the wallet".
 * `expired` (spec §6.4): once the deadline has passed, the landlord's refund needs no confirmation dialog,
 * same as everyone else's refund.
 */
export function confirmCopy(action: Action, role: Role, amount: string, expired = false): ConfirmCopy | null {
  if (action === "confirmInApp") {
    return {
      title: "Release the deposit?",
      body: `Only continue if you are holding the keys. ${amount} goes to the landlord immediately and can't be undone.`,
      confirm: "Yes, release it",
      danger: false,
    };
  }
  if (action === "cancel") {
    return { title: "Cancel this deal?", body: "The link stops working. Nobody has paid, so no money moves.", confirm: "Cancel the deal", danger: true };
  }
  if (action === "refund" && role === "landlord" && !expired) {
    return { title: "Give the deposit back?", body: `${amount} goes back to the tenant and the deal ends.`, confirm: "Give it back", danger: true };
  }
  return null;
}

export interface DealRow {
  key: string;
  time: string;
  title: string;
  detail?: string;
  state: "done" | "now" | "next" | "later";
  tone?: "released" | "returned";
  signature?: string;
}

/** Timetable rows for the deal page, with receipts from the transaction list (oldest first). */
export function dealRows(o: {
  status: DealStatus;
  times: DealTimes & { createdAt: number; fundedAt: number; settledAt: number };
  signatures: string[];
  now: number;
  amount: string;
}): DealRow[] {
  const { status, times: t, signatures, now, amount } = o;
  const steps = timelineSteps(status, t, signatures);
  const created: DealRow = { key: "created", time: formatShortDateTime(t.createdAt), title: "Deal created", state: "done", signature: steps[0].signature };

  if (status === "cancelled") {
    return [
      created,
      {
        key: "cancelled",
        time: formatShortDateTime(t.settledAt),
        title: STATUS_LABEL.cancelled,
        detail: "The landlord withdrew the deal before anyone paid.",
        state: "done",
        signature: steps[1]?.signature,
      },
    ];
  }

  const locked: DealRow =
    status === "open"
      ? {
          key: "locked",
          time: `By ${formatShortDateTime(t.deadline)}`,
          title: "The tenant pays the deposit",
          detail: `${amount} goes into the lock.`,
          state: isExpired(t, now) ? "later" : "now",
        }
      : { key: "locked", time: formatShortDateTime(t.fundedAt), title: STATUS_LABEL.funded, detail: `${amount} is in the lock.`, state: "done", signature: steps[1]?.signature };

  if (status === "released" || status === "refunded") {
    const released = status === "released";
    return [
      created,
      locked,
      {
        key: "settled",
        time: formatShortDateTime(t.settledAt),
        title: STATUS_LABEL[status],
        detail: released ? `${amount} went to the landlord.` : `${amount} went back to the tenant.`,
        state: "done",
        tone: released ? "released" : "returned",
        signature: steps[2]?.signature,
      },
    ];
  }

  const opens = handoverOpensAt(t);
  const expired = isExpired(t, now);
  const inWindow = status === "funded" && now >= opens && !expired;
  return [
    created,
    locked,
    {
      key: "handover",
      time: formatShortDateTime(opens),
      title: "Key handover",
      detail: `Until ${formatShortDateTime(t.deadline)}. The tenant scans the landlord's code and ${amount} goes to the landlord.`,
      state: status === "open" || expired ? "later" : inWindow ? "now" : "next",
    },
    {
      key: "fallback",
      time: formatShortDateTime(t.deadline),
      title: "No handover by then?",
      detail: `${amount} goes back to the tenant. Anyone can trigger it.`,
      state: status === "funded" && expired ? "now" : "later",
    },
  ];
}
