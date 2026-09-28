import { describe, expect, it } from "vitest";
import {
  countByFilter,
  countdownLine,
  filterDeals,
  mergeDeals,
  nextActionText,
  sortDeals,
  toSummary,
  urgencyOf,
  type DealSummary,
} from "./dashboard";
import type { DealData } from "./deal-view";

const DAY = 86_400;
const now = Date.UTC(2026, 8, 29, 12, 0) / 1000; // Tue 29 Sep, 12:00 (tests run in UTC)
const ME = "Me111111111111111111111111111111111111111111";
const OTHER = "0ther1111111111111111111111111111111111111111";
const EMPTY = "11111111111111111111111111111111";

function deal(overrides: Partial<DealData>): DealData {
  return {
    landlord: ME,
    tenant: EMPTY,
    title: "Room",
    amount: "600000000",
    status: "open",
    moveIn: now + 5 * DAY,
    deadline: now + 8 * DAY,
    createdAt: now - DAY,
    fundedAt: 0,
    settledAt: 0,
    ...overrides,
  };
}

function summary(address: string, overrides: Partial<DealData>): DealSummary {
  const s = toSummary(address, deal(overrides), ME);
  if (!s) throw new Error("not my deal");
  return s;
}

const renting = (overrides: Partial<DealData>) =>
  summary("R", { landlord: OTHER, tenant: ME, status: "funded", fundedAt: now - DAY, ...overrides });

describe("toSummary", () => {
  it("detects my role from the wallet", () => {
    expect(toSummary("A", deal({}), ME)?.role).toBe("landlord");
    expect(toSummary("B", deal({ landlord: OTHER, tenant: ME, status: "funded" }), ME)?.role).toBe("tenant");
    expect(toSummary("C", deal({ landlord: OTHER }), ME)).toBeNull();
  });
});

describe("urgency, next action and countdown", () => {
  it("puts open handover windows, expired deposits and dead links first", () => {
    expect(urgencyOf(renting({ moveIn: now + 3600, deadline: now + 3 * DAY }), now)).toBe("now");
    expect(urgencyOf(renting({ moveIn: now - 5 * DAY, deadline: now - DAY }), now)).toBe("now");
    expect(urgencyOf(summary("X", { moveIn: now - DAY, deadline: now - 60 }), now)).toBe("now");
    expect(urgencyOf(summary("O", {}), now)).toBe("waiting");
    expect(urgencyOf(renting({ status: "released", settledAt: now - DAY }), now)).toBe("done");
  });

  it("says what to do next, per role", () => {
    expect(nextActionText(renting({ moveIn: now + 3600, deadline: now + 3 * DAY }), now)).toBe("At the door: scan the landlord's code");
    expect(nextActionText(summary("L", { status: "funded", tenant: OTHER, moveIn: now + 3600, deadline: now + 3 * DAY }), now)).toBe(
      "Start the handover when you meet",
    );
    expect(nextActionText(renting({ moveIn: now - 5 * DAY, deadline: now - DAY }), now)).toBe("Take the deposit back");
    expect(nextActionText(summary("O", {}), now)).toBe("Waiting for your tenant to pay");
  });

  it("counts down to the next moment", () => {
    expect(countdownLine(renting({ moveIn: now + 2 * DAY, deadline: now + 5 * DAY }), now)).toBe("Handover opens in 1 day");
    expect(countdownLine(summary("O", {}), now)).toBe("Payment closes in 8 days");
    expect(countdownLine(renting({ status: "released", settledAt: Date.UTC(2026, 9, 1, 14, 7) / 1000 }), now)).toBe("Released Thu 1 Oct, 14:07");
  });
});

describe("sorting and filtering", () => {
  const list = [
    summary("done", { status: "cancelled", settledAt: now - 3 * DAY }),
    summary("waitLater", { moveIn: now + 7 * DAY, deadline: now + 10 * DAY }),
    summary("act", { status: "funded", tenant: OTHER, moveIn: now + 3600, deadline: now + 3 * DAY }),
    summary("waitSoon", { moveIn: now + DAY, deadline: now + 2 * DAY }),
    summary("renting", { landlord: OTHER, tenant: ME, status: "released", settledAt: now - DAY }),
  ];

  it("orders by what needs me now, then the soonest milestone, then the newest settled", () => {
    expect(sortDeals(list, now).map((d) => d.address)).toEqual(["act", "waitSoon", "waitLater", "renting", "done"]);
  });

  it("filters and counts by role", () => {
    expect(filterDeals(list, "renting").map((d) => d.address)).toEqual(["renting"]);
    expect(filterDeals(list, "letting")).toHaveLength(4);
    expect(countByFilter(list)).toEqual({ all: 5, letting: 4, renting: 1 });
  });

  it("merges both lookups without duplicates", () => {
    expect(mergeDeals([list[0], list[1]], [list[1], list[4]]).map((d) => d.address)).toEqual(["done", "waitLater", "renting"]);
  });
});
