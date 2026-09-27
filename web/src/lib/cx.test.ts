import { describe, expect, it } from "vitest";
import { cx } from "./cx";

describe("cx", () => {
  it("joins class names and skips falsy parts", () => {
    expect(cx("a", false, "b", null, undefined, "", "c")).toBe("a b c");
    expect(cx()).toBe("");
  });
});
