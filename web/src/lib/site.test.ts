import { describe, expect, it } from "vitest";
import { isAppRoute, PRODUCTION_URL, siteUrl } from "./site";

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

describe("isAppRoute", () => {
  it("matches the wallet pages, with or without a query or hash", () => {
    for (const href of ["/new", "/start", "/start#funds", "/deals", "/deals?login=1", "/deal/8cTvC1gnouTSxswytgt1as8FXgLmp1yJU6bfVopj8xTy/handover"]) {
      expect(isAppRoute(href)).toBe(true);
    }
  });
  it("leaves marketing pages alone", () => {
    for (const href of ["/", "/how-it-works#limits", "/faq#devnet", "/tenants", "/landlords", "/about", "/newsletter", "/dealbreakers"]) {
      expect(isAppRoute(href)).toBe(false);
    }
  });
});
