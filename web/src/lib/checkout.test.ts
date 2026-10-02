import { describe, expect, it } from "vitest";
import { cardCharge, cardHold, chargedSummary, checkoutExpiry, checkoutProblem, returnOrigin } from "./checkout";

const now = 1_800_000_000;
const times = { moveIn: now + 3 * 86_400, deadline: now + 4 * 86_400 };
const base = { status: "open" as const, landlord: "LANDLORD", account: "TENANT", times, now };

describe("checkoutProblem", () => {
  it("lets a tenant-to-be pay an open deal in its payment window", () => {
    expect(checkoutProblem(base)).toBeNull();
  });
  it("refuses a deal that is no longer open", () => {
    expect(checkoutProblem({ ...base, status: "funded" })).toMatch(/can't be paid any more/);
  });
  it("refuses the landlord", () => {
    expect(checkoutProblem({ ...base, account: "LANDLORD" })).toMatch(/You created this deal/);
  });
  it("refuses outside the payment window (program rule canFund)", () => {
    expect(checkoutProblem({ ...base, now: times.deadline + 1 })).toMatch(/can't be paid right now/);
    expect(checkoutProblem({ ...base, times: { moveIn: now + 200 * 86_400, deadline: now + 201 * 86_400 } })).toMatch(/can't be paid right now/);
  });
});

describe("returnOrigin", () => {
  it("trusts localhost (dev)", () => {
    expect(returnOrigin("http://localhost:3000/api/checkout")).toBe("http://localhost:3000");
  });
  it("trusts our own *.vercel.app previews only", () => {
    expect(returnOrigin("https://someone-else.vercel.app/api/checkout")).toBe("https://www.keysfirst.io");
    // Anyone can name a Vercel project keysfirst-something: only our team's suffix counts.
    expect(returnOrigin("https://keysfirst-evil.vercel.app/api/checkout")).toBe("https://www.keysfirst.io");
    expect(returnOrigin("https://keysfirst-git-euro-atlas-fee2.vercel.app/api/checkout")).toBe("https://keysfirst-git-euro-atlas-fee2.vercel.app");
  });
  it("trusts keysfirst.vercel.app", () => {
    expect(returnOrigin("https://keysfirst.vercel.app/api/checkout")).toBe("https://keysfirst.vercel.app");
  });
  it("trusts keysfirst.io with and without www (production)", () => {
    expect(returnOrigin("https://www.keysfirst.io/api/checkout")).toBe("https://www.keysfirst.io");
    expect(returnOrigin("https://keysfirst.io/api/checkout")).toBe("https://keysfirst.io");
  });
  it("falls back to production for any other host", () => {
    expect(returnOrigin("https://evil.example.com/api/checkout")).toBe("https://www.keysfirst.io");
    expect(returnOrigin("https://keysfirst.io.evil.com/api/checkout")).toBe("https://www.keysfirst.io");
  });
});

describe("checkoutExpiry", () => {
  it("closes the card page after Stripe's 30-minute minimum, whatever the deadline", () => {
    expect(checkoutExpiry(now)).toBe(now + 31 * 60);
  });
});
describe("cardHold and cardCharge", () => {
  it("holds the international price and charges an EEA card the lower one", () => {
    expect(cardHold(60_000)).toEqual({ depositCents: 60_000, feeCents: 2_700, totalCents: 62_700 });
    expect(cardCharge(60_000, "DE")).toEqual({ method: "card", depositCents: 60_000, feeCents: 2_100, totalCents: 62_100 });
    expect(cardCharge(60_000, "US")).toEqual({ method: "cardIntl", depositCents: 60_000, feeCents: 2_700, totalCents: 62_700 });
  });
  it("never charges more than the hold, from the €12 minimum to large deposits", () => {
    for (const cents of [1, 30_000, 60_000, 120_000, 999_000_00]) {
      for (const country of ["DE", "US", null]) expect(cardCharge(cents, country).totalCents).toBeLessThanOrEqual(cardHold(cents).totalCents);
    }
  });
});
describe("chargedSummary", () => {
  it("tells the tenant which price their card paid", () => {
    expect(chargedSummary({ totalCents: 62_700, feeCents: 2_700, method: "cardIntl" })).toBe(
      "Your card was charged €627.00: deposit €600.00 + Keysfirst fee €27.00 (4.5%, card issued outside Europe).",
    );
    expect(chargedSummary({ totalCents: 62_100, feeCents: 2_100, method: "card" })).toBe(
      "Your card was charged €621.00: deposit €600.00 + Keysfirst fee €21.00 (3.5%, card issued in Europe).",
    );
  });
  it("falls back to the total when the fee isn't known", () => {
    expect(chargedSummary({ totalCents: 62_100, feeCents: Number.NaN })).toBe("Your card was charged €621.00.");
  });
});
