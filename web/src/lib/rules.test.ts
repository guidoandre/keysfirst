import { describe, expect, it } from "vitest";
import {
  availableActions,
  handoverProblem,
  roleOf,
  statusOf,
  timelineSteps,
  timelineTransactionCount,
  type DealTimes,
} from "./rules";

const DAY = 86_400;
const t: DealTimes = { moveIn: 1_000_000, deadline: 1_000_000 + 3 * DAY };
const beforeWindow = t.moveIn - DAY - 1;
const inWindow = t.moveIn;
const expired = t.deadline + 1;

describe("statusOf / roleOf", () => {
  it("reads Anchor enum objects", () => {
    expect(statusOf({ funded: {} })).toBe("funded");
    expect(statusOf({ Released: {} })).toBe("released");
  });
  it("detects the viewer's role", () => {
    expect(roleOf("L", "T", "L")).toBe("landlord");
    expect(roleOf("L", "T", "T")).toBe("tenant");
    expect(roleOf("L", "T", "X")).toBe("visitor");
    expect(roleOf("L", "T", undefined)).toBe("visitor");
  });
});

describe("availableActions", () => {
  it("open deals: landlord cancels, others fund until the deadline", () => {
    expect(availableActions("open", "landlord", t, beforeWindow)).toEqual(["cancel"]);
    expect(availableActions("open", "visitor", t, beforeWindow)).toEqual(["fund"]);
    expect(availableActions("open", "visitor", t, expired)).toEqual([]);
    expect(availableActions("open", "visitor", t, t.deadline - 181 * DAY)).toEqual([]);
  });
  it("funded deals: QR and in-app confirm only inside the handover window", () => {
    expect(availableActions("funded", "landlord", t, beforeWindow)).toEqual(["refund"]);
    expect(availableActions("funded", "landlord", t, inWindow)).toEqual(["showQr", "refund"]);
    expect(availableActions("funded", "tenant", t, beforeWindow)).toEqual([]);
    expect(availableActions("funded", "tenant", t, inWindow)).toEqual(["confirmInApp"]);
    expect(availableActions("funded", "visitor", t, inWindow)).toEqual([]);
  });
  it("funded deals after the deadline: anyone can return the deposit", () => {
    expect(availableActions("funded", "tenant", t, expired)).toEqual(["refund"]);
    expect(availableActions("funded", "visitor", t, expired)).toEqual(["refund"]);
    expect(availableActions("funded", "landlord", t, expired)).toEqual(["refund"]);
  });
  it("settled deals have no actions", () => {
    for (const status of ["released", "refunded", "cancelled"] as const) {
      expect(availableActions(status, "landlord", t, inWindow)).toEqual([]);
    }
  });
});

describe("handoverProblem", () => {
  it("allows only the tenant of a funded deal inside the window", () => {
    expect(handoverProblem("funded", "T", "T", t, inWindow)).toBeNull();
    expect(handoverProblem("open", "T", "T", t, inWindow)).toMatch(/no locked deposit/);
    expect(handoverProblem("funded", "T", "X", t, inWindow)).toMatch(/Only the tenant/);
    expect(handoverProblem("funded", "T", "T", t, beforeWindow)).toMatch(/handover opens on/);
    expect(handoverProblem("funded", "T", "T", t, expired)).toMatch(/deadline has passed/);
  });
});

describe("timelineSteps", () => {
  const times = { createdAt: 1, fundedAt: 2, settledAt: 3 };
  it("maps signatures in order", () => {
    const steps = timelineSteps("released", times, ["a", "b", "c"]);
    expect(steps.map((s) => [s.label, s.done, s.signature])).toEqual([
      ["Deal created", true, "a"],
      ["Deposit locked", true, "b"],
      ["Released to landlord", true, "c"],
    ]);
  });
  it("shows pending steps without links", () => {
    const steps = timelineSteps("open", times, ["a"]);
    expect(steps[1]).toMatchObject({ label: "Deposit locked", done: false, signature: undefined });
    expect(steps[2]).toMatchObject({ label: "Key handover", done: false });
  });
  it("cancelled deals have two steps", () => {
    expect(timelineSteps("cancelled", times, ["a", "b"]).map((s) => s.label)).toEqual(["Deal created", "Cancelled"]);
  });
});

describe("timelineTransactionCount", () => {
  it("counts the transactions each status has behind it", () => {
    expect(timelineTransactionCount("open")).toBe(1);
    expect(timelineTransactionCount("funded")).toBe(2);
    expect(timelineTransactionCount("released")).toBe(3);
    expect(timelineTransactionCount("refunded")).toBe(3);
    expect(timelineTransactionCount("cancelled")).toBe(2);
  });
});
