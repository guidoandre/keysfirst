import { describe, expect, it } from "vitest";
import { actionLabel, confirmCopy, countdownFor, dealPhase, dealRows, loginLabel, nextStep, showReleasedScreen, statusLabel, statusLine } from "./deal-view";
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
    expect(nextStep({ status: "open", role: "visitor", times: t, now: before, amount }).message).toBe(
      "Pay €600.00 into the lock. The landlord gets it only when you confirm the key handover at the door. If that doesn't happen by Sun 4 Oct, 14:00, you can take it back.",
    );
    expect(nextStep({ status: "released", role: "landlord", times: t, now: expired, amount, settledAt: moveIn + 420 }).message).toBe(
      "Your tenant confirmed the handover on Thu 1 Oct, 14:07. The deposit is in your Keysfirst balance. Withdraw it to your bank from your account menu.",
    );
    expect(nextStep({ status: "cancelled", role: "visitor", times: t, now: before, amount }).message).toBe(
      "The landlord cancelled this deal before anyone paid.",
    );
  });

  it("speaks to the viewer as you, and names the other side", () => {
    const settledAt = moveIn + 420;
    expect(nextStep({ status: "refunded", role: "landlord", times: t, now: expired, amount, settledAt }).message).toBe(
      "The deposit went back to your tenant on Thu 1 Oct, 14:07.",
    );
    expect(nextStep({ status: "refunded", role: "visitor", times: t, now: expired, amount, settledAt }).message).toBe(
      "The deposit went back to the tenant on Thu 1 Oct, 14:07.",
    );
    expect(nextStep({ status: "refunded", role: "tenant", times: t, now: expired, amount, settledAt }).message).toBe(
      "Your deposit came back to you on Thu 1 Oct, 14:07. It's in your balance: withdraw it to your bank from your account menu.",
    );
    expect(nextStep({ status: "funded", role: "landlord", times: t, now: expired, amount }).message).toBe(
      "The deadline passed without a handover. The deposit can go back to your tenant now.",
    );
  });
});

describe("showReleasedScreen", () => {
  const watched = { role: "landlord" as Role, status: "released" as DealStatus, handoverOpen: false, justReleased: true, dismissed: false };

  it("opens for the landlord when the release happens while they watch", () => {
    expect(showReleasedScreen(watched)).toBe(true);
    expect(showReleasedScreen({ ...watched, handoverOpen: true, justReleased: false })).toBe(true);
  });

  it("stays up until the landlord dismisses it", () => {
    expect(showReleasedScreen({ ...watched, handoverOpen: true, dismissed: true })).toBe(false);
  });

  it("doesn't open for an old release, another viewer or another status", () => {
    expect(showReleasedScreen({ ...watched, justReleased: false })).toBe(false);
    expect(showReleasedScreen({ ...watched, role: "tenant" })).toBe(false);
    expect(showReleasedScreen({ ...watched, role: "visitor" })).toBe(false);
    expect(showReleasedScreen({ ...watched, status: "funded", handoverOpen: true })).toBe(false);
    expect(showReleasedScreen({ ...watched, status: "refunded" })).toBe(false);
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
    expect(actionLabel("fund", "visitor", amount)).toBe("Lock €600.00 from your balance");
    expect(actionLabel("showQr", "landlord", amount)).toBe("Start the handover");
    expect(actionLabel("confirmInApp", "tenant", amount)).toBe("I have the keys: release the deposit");
    expect(actionLabel("refund", "landlord", amount)).toBe("Give the deposit back to your tenant");
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
    expect(confirmCopy("refund", "landlord", amount)?.body).toBe("€600.00 goes back to your tenant and the deal ends.");
    expect(confirmCopy("refund", "tenant", amount)).toBeNull();
    expect(confirmCopy("fund", "visitor", amount)?.body).toMatch(/leaves your balance/);
  });

  it("skips the landlord's refund confirmation once the deadline has passed", () => {
    expect(confirmCopy("refund", "landlord", amount, true)).toBeNull();
    expect(confirmCopy("refund", "landlord", amount, false)?.title).toBe("Give the deposit back?");
  });

  it("describes the status in one line", () => {
    expect(statusLine("open", "landlord")).toBe("Waiting for your tenant to pay.");
    expect(statusLine("funded", "tenant")).toBe("The money is in the lock.");
    expect(statusLine("released", "landlord")).toBe("Paid to you at the handover.");
    expect(statusLine("released", "tenant")).toBe("Paid to the landlord at the handover.");
    expect(statusLine("refunded", "tenant")).toBe("Back with you.");
    expect(statusLine("refunded", "landlord")).toBe("Back with your tenant.");
    expect(statusLine("refunded", "visitor")).toBe("Back with the tenant.");
  });

  it("says you on the status label when the money went to you", () => {
    expect(statusLabel("released", "landlord")).toBe("Released to you");
    expect(statusLabel("released", "tenant")).toBe("Released to landlord");
    expect(statusLabel("refunded", "tenant")).toBe("Returned to you");
    expect(statusLabel("refunded", "landlord")).toBe("Returned to tenant");
    expect(statusLabel("funded", "tenant")).toBe("Deposit locked");
  });
});

describe("dealRows", () => {
  const times = { ...t, createdAt: moveIn - 4 * DAY, fundedAt: moveIn - 4 * DAY + 480, settledAt: 0 };

  it("shows the handover as the current row inside the window", () => {
    const rows = dealRows({ status: "funded", role: "tenant", times, signatures: ["s1", "s2"], now: inWindow, amount });
    expect(rows.map((r) => [r.key, r.state])).toEqual([
      ["created", "done"],
      ["locked", "done"],
      ["handover", "now"],
      ["fallback", "later"],
    ]);
    expect(rows[1].signature).toBe("s2");
  });

  it("marks the fallback row once the deadline passed", () => {
    const rows = dealRows({ status: "funded", role: "tenant", times, signatures: [], now: expired, amount });
    expect(rows.find((r) => r.key === "fallback")?.state).toBe("now");
  });

  it("waits for the payment while open", () => {
    const rows = dealRows({ status: "open", role: "visitor", times: { ...times, fundedAt: 0 }, signatures: ["s1"], now: before, amount });
    expect(rows.map((r) => [r.key, r.state])).toEqual([
      ["created", "done"],
      ["locked", "now"],
      ["handover", "later"],
      ["fallback", "later"],
    ]);
  });

  it("ends with the settlement row", () => {
    const released = dealRows({ status: "released", role: "visitor", times: { ...times, settledAt: moveIn + 420 }, signatures: ["a", "b", "c"], now: expired, amount });
    expect(released.at(-1)).toMatchObject({ key: "settled", title: "Released to landlord", tone: "released", signature: "c", time: "Thu 1 Oct, 14:07" });
    const cancelled = dealRows({ status: "cancelled", role: "visitor", times: { ...times, fundedAt: 0, settledAt: moveIn - DAY }, signatures: ["a", "b"], now: before, amount });
    expect(cancelled.map((r) => r.key)).toEqual(["created", "cancelled"]);
  });

  it("words every row for the viewer", () => {
    const funded = { status: "funded" as const, times, signatures: [], now: inWindow, amount };
    const detail = (rows: ReturnType<typeof dealRows>, key: string) => rows.find((r) => r.key === key)?.detail;
    const asTenant = dealRows({ ...funded, role: "tenant" });
    expect(detail(asTenant, "handover")).toBe("Until Sun 4 Oct, 14:00. You scan the landlord's code and €600.00 goes to them.");
    expect(detail(asTenant, "fallback")).toBe("€600.00 goes back to you. Anyone can trigger it.");
    const asLandlord = dealRows({ ...funded, role: "landlord" });
    expect(detail(asLandlord, "handover")).toBe("Until Sun 4 Oct, 14:00. Your tenant scans your code and €600.00 goes to you.");
    expect(detail(asLandlord, "fallback")).toBe("€600.00 goes back to your tenant. Anyone can trigger it.");
    const asVisitor = dealRows({ ...funded, role: "visitor" });
    expect(detail(asVisitor, "fallback")).toBe("€600.00 goes back to the tenant. Anyone can trigger it.");

    // Before anyone pays, a visitor is the tenant-to-be.
    const open = { status: "open" as const, times: { ...times, fundedAt: 0 }, signatures: [], now: before, amount };
    expect(dealRows({ ...open, role: "visitor" }).find((r) => r.key === "locked")?.title).toBe("You pay the deposit");
    expect(dealRows({ ...open, role: "landlord" }).find((r) => r.key === "locked")?.title).toBe("Your tenant pays the deposit");

    const settledAt = moveIn + 420;
    const released = dealRows({ status: "released", role: "landlord", times: { ...times, settledAt }, signatures: [], now: expired, amount });
    expect(released.at(-1)).toMatchObject({ title: "Released to you", detail: "€600.00 went to you." });
    const refunded = dealRows({ status: "refunded", role: "tenant", times: { ...times, settledAt }, signatures: [], now: expired, amount });
    expect(refunded.at(-1)).toMatchObject({ title: "Returned to you", detail: "€600.00 came back to you." });
    const cancelled = dealRows({ status: "cancelled", role: "landlord", times: { ...times, settledAt }, signatures: [], now: expired, amount });
    expect(cancelled.at(-1)?.detail).toBe("You withdrew the deal before anyone paid.");
  });
});
