import { describe, expect, it } from "vitest";
import { DEMO_WINDOW_SECONDS, handoverWindow, paymentOpensAt, titleBytes, validateNewDeal, windowSeconds, type NewDealForm } from "./new-deal";

const DAY = 86_400;
const now = 1_790_000_000;
const good: NewDealForm = { country: "DE", housing: "any", title: "Room in Vallendar", rent: "300", amount: "600", moveIn: now + DAY, window: "3d", demo: false };

describe("validateNewDeal", () => {
  it("accepts a complete deal and computes the deadline", () => {
    const { values, errors } = validateNewDeal(good, now);
    expect(errors).toEqual({});
    expect(values).toEqual({ title: "Room in Vallendar", amount: 600_000_000n, moveIn: now + DAY, deadline: now + DAY + 3 * DAY });
  });

  it("trims the title and checks its length in bytes, like the program", () => {
    expect(validateNewDeal({ ...good, title: "  Room  " }, now).values?.title).toBe("Room");
    expect(validateNewDeal({ ...good, title: "   " }, now).errors.title).toMatch(/Describe the room/);
    expect(validateNewDeal({ ...good, title: "x".repeat(64) }, now).errors.title).toBeUndefined();
    expect(validateNewDeal({ ...good, title: "x".repeat(65) }, now).errors.title).toMatch(/64/);
    expect(validateNewDeal({ ...good, title: "ü".repeat(33) }, now).errors.title).toMatch(/64/); // 66 bytes
    expect(titleBytes("ü")).toBe(2);
  });

  it("rejects missing amounts and move-in times", () => {
    expect(validateNewDeal({ ...good, amount: "0" }, now).errors.amount).toMatch(/euros/);
    expect(validateNewDeal({ ...good, amount: "abc" }, now).values).toBeNull();
    expect(validateNewDeal({ ...good, moveIn: Number.NaN }, now).errors.moveIn).toMatch(/move-in/);
  });

  it("rejects a deadline that is already in the past", () => {
    expect(validateNewDeal({ ...good, moveIn: now - 5 * DAY }, now).errors.moveIn).toMatch(/already in the past/);
  });

  it("gives the tenant at least an hour to pay, except in the demo", () => {
    const late = { ...good, window: "1d" as const, moveIn: now - DAY + 30 * 60 };
    expect(validateNewDeal(late, now).errors.moveIn).toMatch(/less than an hour/);
    expect(validateNewDeal({ ...good, moveIn: now - 60, demo: true }, now).errors.moveIn).toBeUndefined();
  });

  it("refuses a move-in more than a year away (a typo in the year)", () => {
    expect(validateNewDeal({ ...good, moveIn: now + 400 * DAY }, now).errors.moveIn).toMatch(/Check the year/);
    expect(validateNewDeal({ ...good, moveIn: now + 300 * DAY }, now).errors.moveIn).toBeUndefined();
  });

  it("needs a country", () => {
    const { values, errors } = validateNewDeal({ ...good, country: "" }, now);
    expect(errors.country).toMatch(/Choose the country/);
    expect(values).toBeNull();
  });

  it("needs a monthly rent in euros", () => {
    expect(validateNewDeal({ ...good, rent: "" }, now).errors.rent).toMatch(/monthly rent/);
    expect(validateNewDeal({ ...good, rent: "abc" }, now).values).toBeNull();
    expect(validateNewDeal({ ...good, rent: "450,50" }, now).errors.rent).toBeUndefined();
  });

  it("blocks a deposit above the country's legal maximum", () => {
    expect(validateNewDeal({ ...good, rent: "200", amount: "600" }, now).errors.amount).toBeUndefined(); // 3 × 200, Germany
    const over = validateNewDeal({ ...good, rent: "200", amount: "600.01" }, now);
    expect(over.errors.amount).toMatch(/Germany.*€600\.00.*3 months/);
    expect(over.values).toBeNull();
  });

  it("applies the rental type's cap", () => {
    const es = { ...good, country: "ES" as const, rent: "400" };
    expect(validateNewDeal({ ...es, housing: "long", amount: "401" }, now).errors.amount).toMatch(/1 month/);
    expect(validateNewDeal({ ...es, housing: "seasonal", amount: "800" }, now).errors.amount).toBeUndefined();
    expect(validateNewDeal({ ...es, housing: "seasonal", amount: "801" }, now).errors.amount).toMatch(/2 months/);
    // a rental type left over from another country falls back to that country's first type (Spain: long-term, 1 month)
    expect(validateNewDeal({ ...es, housing: "mobilite", amount: "401" }, now).errors.amount).toMatch(/1 month/);
  });

  it("refuses any deposit for a lease type that allows none", () => {
    const mobilite = { ...good, country: "FR" as const, housing: "mobilite", rent: "500", amount: "1" };
    expect(validateNewDeal(mobilite, now).errors.amount).toMatch(/bail mobilité/);
    expect(validateNewDeal(mobilite, now).values).toBeNull();
  });

  it("keeps the amount error about the format when the amount isn't a number", () => {
    expect(validateNewDeal({ ...good, amount: "abc" }, now).errors.amount).toMatch(/euros/);
  });

  it("uses the 5-minute window in demo mode", () => {
    expect(windowSeconds({ window: "14d", demo: true })).toBe(DEMO_WINDOW_SECONDS);
    expect(windowSeconds({ window: "7d", demo: false })).toBe(7 * DAY);
    expect(validateNewDeal({ ...good, moveIn: now, demo: true }, now).values?.deadline).toBe(now + 300);
  });

  it("describes the handover window", () => {
    expect(handoverWindow(now, 3 * DAY)).toEqual({ opens: now - DAY, deadline: now + 3 * DAY });
  });
});

describe("deposit limits", () => {
  it("caps the deposit below Stripe's largest card charge", () => {
    expect(validateNewDeal({ ...good, rent: "9999999", amount: "900000" }, now).errors.amount).toBeUndefined();
    expect(validateNewDeal({ ...good, rent: "9999999", amount: "900000.01" }, now).errors.amount).toMatch(/up to €900,000\.00/);
  });
});

describe("paymentOpensAt", () => {
  it("opens payment 180 days before the deadline (the program's longest lock)", () => {
    expect(paymentOpensAt(now + 200 * DAY)).toBe(now + 20 * DAY);
  });
});