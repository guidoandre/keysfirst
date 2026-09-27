import { describe, expect, it } from "vitest";
import { PRODUCTION_URL, siteUrl } from "./site";

describe("siteUrl", () => {
  it("uses the production domain in production", () => {
    expect(siteUrl({ VERCEL_ENV: "production", VERCEL_URL: "keysfirst-abc.vercel.app" })).toBe(PRODUCTION_URL);
  });
  it("uses the branch URL on Preview deployments", () => {
    expect(siteUrl({ VERCEL_ENV: "preview", VERCEL_BRANCH_URL: "keysfirst-git-redesign-x.vercel.app", VERCEL_URL: "keysfirst-123.vercel.app" }))
      .toBe("https://keysfirst-git-redesign-x.vercel.app");
    expect(siteUrl({ VERCEL_ENV: "preview", VERCEL_URL: "keysfirst-123.vercel.app" })).toBe("https://keysfirst-123.vercel.app");
  });
  it("falls back to localhost", () => {
    expect(siteUrl({})).toBe("http://localhost:3000");
  });
});
