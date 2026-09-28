import { describe, expect, it } from "vitest";
import { accountLabel, pickSigningWallet } from "./account";

describe("pickSigningWallet", () => {
  const wallets = [{ address: "PHANTOM" }, { address: "EMBEDDED" }];
  it("signs with the connected wallet that is the account's primary wallet", () => {
    expect(pickSigningWallet(wallets, "EMBEDDED")).toEqual({ address: "EMBEDDED" });
  });
  it("returns null when logged out or when that wallet isn't connected yet", () => {
    expect(pickSigningWallet(wallets, null)).toBeNull();
    expect(pickSigningWallet(wallets, "OTHER")).toBeNull();
  });
});

describe("accountLabel", () => {
  const address = "7xKpQ2abcdefghij3mQe";
  it("prefers the email the user logged in with", () => {
    expect(accountLabel({ email: { address: "ana@example.com" } }, address)).toBe("ana@example.com");
    expect(accountLabel({ google: { email: "ana@gmail.com" } }, address)).toBe("ana@gmail.com");
    expect(accountLabel({ apple: { email: "x@privaterelay.appleid.com" } }, address)).toBe("x@privaterelay.appleid.com");
  });
  it("falls back to the short account number (wallet logins)", () => {
    expect(accountLabel({}, address)).toBe("7xKp…3mQe");
    expect(accountLabel(null, address)).toBe("7xKp…3mQe");
  });
});
