import { describe, expect, it } from "vitest";
import { DEMO_WINDOW_SECONDS, handoverWindow, titleBytes, validateNewDeal, windowSeconds, type NewDealForm } from "./new-deal";

const DAY = 86_400;
const now = 1_790_000_000;
const good: NewDealForm = { title: "Room in Vallendar", amount: "600", moveIn: now + DAY, window: "3d", demo: false };

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

  it("uses the 5-minute window in demo mode", () => {
    expect(windowSeconds({ window: "14d", demo: true })).toBe(DEMO_WINDOW_SECONDS);
    expect(windowSeconds({ window: "7d", demo: false })).toBe(7 * DAY);
    expect(validateNewDeal({ ...good, moveIn: now, demo: true }, now).values?.deadline).toBe(now + 300);
  });

  it("describes the handover window", () => {
    expect(handoverWindow(now, 3 * DAY)).toEqual({ opens: now - DAY, deadline: now + 3 * DAY });
  });
});
