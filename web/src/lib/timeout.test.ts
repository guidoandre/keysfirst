import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { withTimeout } from "./timeout";

describe("withTimeout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("answers like the promise when it settles in time, and clears its timer", async () => {
    await expect(withTimeout(Promise.resolve("deal"), 3_000)).resolves.toBe("deal");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("passes a rejection through and clears its timer", async () => {
    await expect(withTimeout(Promise.reject(new Error("429 Too Many Requests")), 3_000)).rejects.toThrow("429 Too Many Requests");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("rejects once the time is up", async () => {
    const hanging = withTimeout(new Promise<string>(() => {}), 3_000);
    const outcome = expect(hanging).rejects.toThrow("Timed out after 3000 ms");
    await vi.advanceTimersByTimeAsync(2_999);
    expect(vi.getTimerCount()).toBe(1);
    await vi.advanceTimersByTimeAsync(1);
    await outcome;
    expect(vi.getTimerCount()).toBe(0);
  });

  it("ignores a late answer after the time is up", async () => {
    let answer: (value: string) => void = () => {};
    const late = withTimeout(new Promise<string>((resolve) => (answer = resolve)), 100);
    const outcome = expect(late).rejects.toThrow("Timed out after 100 ms");
    await vi.advanceTimersByTimeAsync(100);
    answer("deal");
    await outcome;
  });
});
