import { describe, expect, it } from "vitest";
import { checkoutProblem, returnOrigin } from "./checkout";

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
  it("trusts a *.vercel.app preview", () => {
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
