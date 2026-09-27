import { describe, expect, it } from "vitest";
import { friendlyError } from "./send";

describe("friendlyError", () => {
  it("surfaces the program's own message", () => {
    const e = new Error(
      "Simulation failed. Logs: [\"Program log: AnchorError occurred. Error Code: HandoverNotOpenYet. Error Number: 6010. Error Message: The handover opens 24 hours before move-in.\"]",
    );
    expect(friendlyError(e)).toBe("The handover opens 24 hours before move-in.");
  });
  it("explains common wallet problems", () => {
    expect(friendlyError(new Error("User rejected the request."))).toBe("You cancelled the request in your wallet.");
    expect(friendlyError(new Error("Attempt to debit an account but found no record of a prior credit."))).toMatch(/no devnet SOL/);
    expect(friendlyError(new Error("Program log: Error: insufficient funds"))).toMatch(/Not enough Test EUR/);
    expect(friendlyError(new Error("Connect your wallet first."))).toBe("Connect your wallet first.");
  });
  it("explains devnet rate limits", () => {
    const e = new Error('429 : {"jsonrpc":"2.0","error":{"code": 429, "message":"Too many requests for a specific RPC call"}}');
    expect(friendlyError(e)).toMatch(/Solana devnet is busy/);
  });
  it("falls back to a generic hint", () => {
    expect(friendlyError("boom")).toMatch(/Solana Devnet/);
  });
});
