import { describe, expect, it } from "vitest";
import { clientIp, isJson, rateLimiter } from "./limits";

describe("rateLimiter", () => {
  it("allows max hits per key in the window, then refuses until the window moves on", () => {
    const allow = rateLimiter(2, 1_000);
    expect(allow("a", 0)).toBe(true);
    expect(allow("a", 10)).toBe(true);
    expect(allow("a", 20)).toBe(false);
    expect(allow("b", 20)).toBe(true);
    expect(allow("a", 1_001)).toBe(true);
  });
});

describe("request helpers", () => {
  it("reads the client IP from Vercel's headers", () => {
    expect(clientIp(new Request("https://x", { headers: { "x-forwarded-for": "1.2.3.4, 10.0.0.1" } }))).toBe("1.2.3.4");
    expect(clientIp(new Request("https://x"))).toBe("unknown");
  });
  it("accepts only JSON bodies", () => {
    expect(isJson(new Request("https://x", { method: "POST", headers: { "Content-Type": "application/json" } }))).toBe(true);
    expect(isJson(new Request("https://x", { method: "POST", headers: { "Content-Type": "text/plain" } }))).toBe(false);
  });
});
