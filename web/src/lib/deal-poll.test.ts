import { describe, expect, it } from "vitest";
import { acceptPoll } from "./deal-poll";

describe("acceptPoll", () => {
  it("takes the first answer, found or not", () => {
    expect(acceptPoll({ seq: 1, status: "open" }, { seq: 0, status: null })).toBe(true);
    expect(acceptPoll({ seq: 1, status: null }, { seq: 0, status: null })).toBe(true);
    expect(acceptPoll({ seq: 2, status: "funded" }, { seq: 1, status: null })).toBe(true);
  });

  it("takes the same status or a later one", () => {
    expect(acceptPoll({ seq: 5, status: "funded" }, { seq: 4, status: "funded" })).toBe(true);
    expect(acceptPoll({ seq: 5, status: "funded" }, { seq: 4, status: "open" })).toBe(true);
    expect(acceptPoll({ seq: 5, status: "released" }, { seq: 4, status: "funded" })).toBe(true);
    expect(acceptPoll({ seq: 5, status: "refunded" }, { seq: 4, status: "funded" })).toBe(true);
    expect(acceptPoll({ seq: 5, status: "cancelled" }, { seq: 4, status: "open" })).toBe(true);
    expect(acceptPoll({ seq: 5, status: "released" }, { seq: 4, status: "released" })).toBe(true);
  });

  it("never moves the deal backwards", () => {
    expect(acceptPoll({ seq: 5, status: "funded" }, { seq: 4, status: "released" })).toBe(false);
    expect(acceptPoll({ seq: 5, status: "funded" }, { seq: 4, status: "refunded" })).toBe(false);
    expect(acceptPoll({ seq: 5, status: "open" }, { seq: 4, status: "funded" })).toBe(false);
    expect(acceptPoll({ seq: 5, status: "open" }, { seq: 4, status: "cancelled" })).toBe(false);
    expect(acceptPoll({ seq: 5, status: null }, { seq: 4, status: "released" })).toBe(false);
  });

  it("drops an answer older than the one on screen", () => {
    expect(acceptPoll({ seq: 3, status: "released" }, { seq: 4, status: "funded" })).toBe(false);
    expect(acceptPoll({ seq: 3, status: "funded" }, { seq: 4, status: "funded" })).toBe(false);
    expect(acceptPoll({ seq: 1, status: null }, { seq: 2, status: null })).toBe(false);
  });
});
