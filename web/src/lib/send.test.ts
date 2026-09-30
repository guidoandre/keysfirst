import { describe, expect, it } from "vitest";
import { friendlyError, needsTopUp } from "./send";

describe("friendlyError", () => {
  it("surfaces the program's own message", () => {
    const e = new Error(
      "Simulation failed. Logs: [\"Program log: AnchorError occurred. Error Code: HandoverNotOpenYet. Error Number: 6010. Error Message: The handover opens 24 hours before move-in.\"]",
    );
    expect(friendlyError(e)).toBe("The handover opens 24 hours before move-in.");
  });
  it("explains common wallet problems", () => {
    expect(friendlyError(new Error("User rejected the request."))).toBe("You cancelled the request.");
    expect(friendlyError(new Error("Attempt to debit an account but found no record of a prior credit."))).toMatch(/being topped up/);
    expect(friendlyError(new Error("Program log: Error: insufficient funds"))).toMatch(/balance doesn't cover/);
    expect(friendlyError(new Error("Log in first."))).toBe("Log in first.");
  });
  it("explains a wallet that can't pay for a new deal's accounts (seen when creating a 7th deal on one faucet top-up)", () => {
    const e = new Error(
      [
        "Simulation failed. ",
        "Message: Transaction simulation failed: Error processing Instruction 0: custom program error: 0x1. ",
        "Logs: [",
        '  "Program 11111111111111111111111111111111 invoke [2]",',
        '  "Transfer: insufficient lamports 2570769, need 1818640",',
        '  "Program 11111111111111111111111111111111 failed: custom program error: 0x1"',
        "].",
      ].join("\n"),
    );
    expect(friendlyError(e)).toMatch(/being topped up/);
    expect(needsTopUp(friendlyError(e))).toBe(true);
    expect(needsTopUp(friendlyError(new Error("Program log: Error: insufficient funds")))).toBe(false);
    expect(needsTopUp(friendlyError(new Error("User rejected the request.")))).toBe(false);
    expect(needsTopUp(null)).toBe(false);
  });
  it("explains a settlement that already happened (the vault is closed)", () => {
    const e = new Error(
      "Simulation failed. Logs: [\"Program log: AnchorError caused by account: vault. Error Code: AccountNotInitialized. Error Number: 3012. Error Message: The program expected this account to be already initialized.\"]",
    );
    expect(friendlyError(e)).toBe("This deal has already been settled. Reload the page to see its status.");
  });
  it("asks for a top-up when network costs or rent can't be paid (not for the deposit)", () => {
    const rent = new Error("Transaction simulation failed: Transaction results in an account (0) with insufficient funds for rent");
    const fee = new Error("Transaction simulation failed: Insufficient funds for fee");
    expect(needsTopUp(friendlyError(rent))).toBe(true);
    expect(needsTopUp(friendlyError(fee))).toBe(true);
  });
  it("words a low balance for a withdrawal without suggesting a card", () => {
    expect(friendlyError(new Error("Program log: Error: insufficient funds"), "withdraw")).toMatch(/lower than this amount/);
  });
  it("tells a payer with no Test EUR account that the balance doesn't cover it (not 'already settled')", () => {
    const e = new Error(
      "Simulation failed. Logs: [\"Program log: AnchorError caused by account: tenant_token. Error Code: AccountNotInitialized. Error Number: 3012.\"]",
    );
    expect(friendlyError(e)).toMatch(/balance doesn't cover/);
  });
  it("explains devnet rate limits", () => {
    const e = new Error('429 : {"jsonrpc":"2.0","error":{"code": 429, "message":"Too many requests for a specific RPC call"}}');
    expect(friendlyError(e)).toMatch(/Solana devnet is busy/);
  });
  it("falls back to a generic hint", () => {
    expect(friendlyError("boom")).toBe("Something went wrong. Try again. If you use Phantom, check that it is set to Solana Devnet.");
  });
});
