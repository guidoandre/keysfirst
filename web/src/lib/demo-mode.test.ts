import { describe, expect, it } from "vitest";
import { demoModeKey, readDemoMode, writeDemoMode } from "./demo-mode";

function memoryStore() {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  };
}

const blocked = {
  getItem: () => {
    throw new Error("SecurityError");
  },
  setItem: () => {
    throw new Error("QuotaExceededError");
  },
  removeItem: () => {
    throw new Error("SecurityError");
  },
};

describe("demo mode", () => {
  it("is off until the account switches it on, and off again after", () => {
    const store = memoryStore();
    expect(readDemoMode("alice", store)).toBe(false);
    writeDemoMode("alice", true, store);
    expect(readDemoMode("alice", store)).toBe(true);
    expect(store.data.get(demoModeKey("alice"))).toBe("1");
    writeDemoMode("alice", false, store);
    expect(readDemoMode("alice", store)).toBe(false);
    expect(store.data.size).toBe(0);
  });

  it("belongs to one account: another login on the same browser doesn't get it", () => {
    const store = memoryStore();
    writeDemoMode("landlord", true, store);
    expect(readDemoMode("tenant", store)).toBe(false);
  });

  it("is always off without an account (logged out) and saves nothing", () => {
    const store = memoryStore();
    writeDemoMode(null, true, store);
    expect(store.data.size).toBe(0);
    expect(readDemoMode(null, store)).toBe(false);
  });

  it("stays off, without throwing, when storage is blocked or missing", () => {
    expect(() => writeDemoMode("alice", true, blocked)).not.toThrow();
    expect(readDemoMode("alice", blocked)).toBe(false);
    expect(readDemoMode("alice", null)).toBe(false);
  });
});
