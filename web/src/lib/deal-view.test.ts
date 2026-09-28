import { describe, expect, it } from "vitest";
import { actionLabel, confirmCopy, countdownFor, dealPhase, dealRows, loginLabel, nextStep, statusLine } from "./deal-view";
import { availableActions, type Action, type DealStatus, type DealTimes, type Role } from "./rules";

const DAY = 86_400;
const moveIn = Date.UTC(2026, 9, 1, 14, 0) / 1000; // Thu 1 Oct 2026, 14:00 (tests run in UTC)
const t: DealTimes = { moveIn, deadline: moveIn + 3 * DAY }; // deadline Sun 4 Oct, 14:00
const tooEarly = t.deadline - 181 * DAY;
const before = moveIn - 2 * DAY; // the handover window opens Wed 30 Sep, 14:00
const inWindow = moveIn;
const expired = t.deadline + 60;
const amount = "€600.00";

describe("dealPhase", () => {
  it("splits open and locked deals by the clock", () => {
    expect(dealPhase("open", t, before)).toBe("open");
    expect(dealPhase("open", t, tooEarly)).toBe("open-too-early");
    expect(dealPhase("open", t, expired)).toBe("open-expired");
    expect(dealPhase("funded", t, before)).toBe("funded-before");
    expect(dealPhase("funded", t, inWindow)).toBe("funded-window");
    expect(dealPhase("funded", t, t.deadline)).toBe("funded-window");
    expect(dealPhase("funded", t, expired)).toBe("funded-expired");
    expect(dealPhase("released", t, before)).toBe("released");
    expect(dealPhase("refunded", t, expired)).toBe("refunded");
    expect(dealPhase("cancelled", t, before)).toBe("cancelled");
  });
});

describe("nextStep", () => {
  const statuses: DealStatus[] = ["open", "funded", "released", "refunded", "cancelled"];
  const roles: Role[] = ["landlord", "tenant", "visitor"];
  const moments = [tooEarly, before, inWindow, t.deadline, expired];

  it("never offers an action the program would reject", () => {
    for (const status of statuses) {
      for (const role of roles) {
        for (const now of moments) {
          const view = nextStep({ status, role, times: t, now, amount, settledAt: moveIn });
          const allowed = availableActions(status, role, t, now);
          const offered = [view.primary, ...view.secondary].filter((a): a is Action => a !== undefined);
          for (const action of offered) expect(allowed).toContain(action);
        }
      }
    }
  });

  it("gives each role one clear next step", () => {
    expect(nextStep({ status: "open", role: "visitor", times: t, now: before, amount }).primary).toBe("fund");
    expect(nextStep({ status: "open", role: "landlord", times: t, now: before, amount })).toMatchObject({ primary: undefined, secondary: ["cancel"] });
    expect(nextStep({ status: "open", role: "landlord", times: t, now: expired, amount }).primary).toBe("cancel");
    expect(nextStep({ status: "funded", role: "landlord", times: t, now: before, amount })).toMatchObject({ primary: undefined, secondary: ["refund"] });
    expect(nextStep({ status: "funded", role: "landlord", times: t, now: inWindow, amount })).toMatchObject({ primary: "showQr", secondary: ["refund"] });
    expect(nextStep({ status: "funded", role: "tenant", times: t, now: inWindow, amount })).toMatchObject({ primary: undefined, secondary: ["confirmInApp"] });
    expect(nextStep({ status: "funded", role: "tenant", times: t, now: expired, amount }).primary).toBe("refund");
    expect(nextStep({ status: "funded", role: "visitor", times: t, now: expired, amount }).primary).toBe("refund");
    expect(nextStep({ status: "funded", role: "visitor", times: t, now: inWindow, amount })).toMatchObject({ primary: undefined, secondary: [] });
  });

  it("explains the state in plain words", () => {
    expect(nextStep({ status: "funded", role: "tenant", times: t, now: before, amount }).message).toBe(
      "Your deposit is locked. The handover opens Wed 30 Sep, 14:00. At the door, check the room, then scan the landlord's code.",
    );
    expect(nextStep({ status: "open", role: "visitor", times: t, now: before, amount }).message).toContain("Sun 4 Oct, 14:00");
    expect(nextStep({ status: "released", role: "landlord", times: t, now: expired, amount, settledAt: moveIn + 420 }).message).toBe(
      "The tenant confirmed the handover on Thu 1 Oct, 14:07. The deposit is in your wallet.",
    );
    expect(nextStep({ status: "cancelled", role: "visitor", times: t, now: before, amount }).message).toBe(
      "The landlord cancelled this deal before anyone paid.",
    );
  });
});

describe("countdownFor", () => {
  it("counts towards the next moment that matters", () => {
    expect(countdownFor("open", t)).toEqual({ label: "Payment closes in", at: t.deadline });
    expect(countdownFor("funded-before", t)).toEqual({ label: "Handover opens in", at: moveIn - DAY });
    expect(countdownFor("funded-window", t)).toEqual({ label: "Handover deadline in", at: t.deadline });
    expect(countdownFor("funded-expired", t)).toEqual({ label: "Deadline passed", at: t.deadline });
    expect(countdownFor("released", t)).toBeNull();
  });
});

describe("labels", () => {
  it("names each action for the viewer", () => {
    expect(actionLabel("fund", "visitor", amount)).toBe("Pay €600.00 into the lock");
    expect(actionLabel("showQr", "landlord", amount)).toBe("Start the handover");
    expect(actionLabel("confirmInApp", "tenant", amount)).toBe("I have the keys: release the deposit");
    expect(actionLabel("refund", "landlord", amount)).toBe("Give the deposit back to the tenant");
    expect(actionLabel("refund", "tenant", amount)).toBe("Take the deposit back");
    expect(actionLabel("refund", "visitor", amount)).toBe("Return the deposit to the tenant");
    expect(actionLabel("cancel", "landlord", amount)).toBe("Cancel this deal");
    expect(loginLabel("fund")).toBe("Log in to pay");
    expect(loginLabel("refund")).toBe("Log in to return it");
  });

  it("asks for confirmation only before irreversible steps", () => {
    expect(confirmCopy("confirmInApp", "tenant", amount)?.body).toContain("€600.00 goes to the landlord immediately");
    expect(confirmCopy("cancel", "landlord", amount)?.danger).toBe(true);
    expect(confirmCopy("refund", "landlord", amount)?.title).toBe("Give the deposit back?");
    expect(confirmCopy("refund", "tenant", amount)).toBeNull();
    expect(confirmCopy("fund", "visitor", amount)).toBeNull();
  });

  it("skips the landlord's refund confirmation once the deadline has passed", () => {
    expect(confirmCopy("refund", "landlord", amount, true)).toBeNull();
    expect(confirmCopy("refund", "landlord", amount, false)?.title).toBe("Give the deposit back?");
  });

  it("describes the status in one line", () => {
    expect(statusLine("open", "landlord")).toBe("Waiting for your tenant to pay.");
    expect(statusLine("funded", "tenant")).toBe("The money is in the lock.");
  });
});

describe("dealRows", () => {
  const times = { ...t, createdAt: moveIn - 4 * DAY, fundedAt: moveIn - 4 * DAY + 480, settledAt: 0 };

  it("shows the handover as the current row inside the window", () => {
    const rows = dealRows({ status: "funded", times, signatures: ["s1", "s2"], now: inWindow, amount });
    expect(rows.map((r) => [r.key, r.state])).toEqual([
      ["created", "done"],
      ["locked", "done"],
      ["handover", "now"],
      ["fallback", "later"],
    ]);
    expect(rows[1].signature).toBe("s2");
  });

  it("marks the fallback row once the deadline passed", () => {
    const rows = dealRows({ status: "funded", times, signatures: [], now: expired, amount });
    expect(rows.find((r) => r.key === "fallback")?.state).toBe("now");
  });

  it("waits for the payment while open", () => {
    const rows = dealRows({ status: "open", times: { ...times, fundedAt: 0 }, signatures: ["s1"], now: before, amount });
    expect(rows.map((r) => [r.key, r.state])).toEqual([
      ["created", "done"],
      ["locked", "now"],
      ["handover", "later"],
      ["fallback", "later"],
    ]);
  });

  it("ends with the settlement row", () => {
    const released = dealRows({ status: "released", times: { ...times, settledAt: moveIn + 420 }, signatures: ["a", "b", "c"], now: expired, amount });
    expect(released.at(-1)).toMatchObject({ key: "settled", title: "Released to landlord", tone: "released", signature: "c", time: "Thu 1 Oct, 14:07" });
    const cancelled = dealRows({ status: "cancelled", times: { ...times, fundedAt: 0, settledAt: moveIn - DAY }, signatures: ["a", "b"], now: before, amount });
    expect(cancelled.map((r) => r.key)).toEqual(["created", "cancelled"]);
  });
});
