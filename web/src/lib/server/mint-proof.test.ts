import { PublicKey, type ParsedTransactionWithMeta } from "@solana/web3.js";
import { describe, expect, it } from "vitest";
import { isFaucetMint, legacyMarkerSeed, markerSeed, type ExpectedMint } from "./mint-proof";

const FAUCET = "5s735wKnBWKptwuGp7qSh2YYDNdyUuXhzwafDd2UAZ1b";
const MINT = "5Me8DGHKU8tbr8Q9sUdHMsvtU7Wy4QsnvFvWedGGnfPE";
const MARKER = "5qVGo3bK3mMEiJ975ge8xz2ij3Cg1Z2KaDeqehTJ7Shw";
const ACCOUNT = "DCc4BnxQtcZ2kio16tUyxSzcyTZ8Lz8JrzUHQMgx41eE";
const STRANGER = "Gp2Z9RUd1Zm1W1QMXtVvanWpmRbJoDNLR9jSxT4nCgFk";

const expected: ExpectedMint = { faucet: FAUCET, marker: MARKER, mint: MINT, account: ACCOUNT, amount: 600_000_000n };

/** Shaped like devnet's jsonParsed card mint 2Xc1AQ7t…jwQGvr (marker creation, token account, mint). */
function mintTx(o: { signer?: string; err?: unknown; marker?: string; amount?: string; account?: string } = {}) {
  const signer = o.signer ?? FAUCET;
  return {
    meta: { err: o.err ?? null },
    transaction: {
      message: {
        accountKeys: [
          { pubkey: new PublicKey(signer), signer: true, writable: true },
          { pubkey: new PublicKey(MINT), signer: false, writable: true },
        ],
        instructions: [
          {
            program: "system",
            parsed: { type: "createAccountWithSeed", info: { base: signer, newAccount: o.marker ?? MARKER, source: signer, space: 0 } },
          },
          { program: "spl-associated-token-account", parsed: { type: "createIdempotent", info: { account: ACCOUNT, mint: MINT } } },
          {
            program: "spl-token",
            parsed: {
              type: "mintToChecked",
              info: { account: o.account ?? ACCOUNT, mint: MINT, mintAuthority: signer, tokenAmount: { amount: o.amount ?? "600000000", decimals: 6 } },
            },
          },
        ],
      },
    },
  } as unknown as ParsedTransactionWithMeta;
}

/** Someone else's plain transfer to the marker address (the pre-funding attack). */
function strangerTransfer() {
  return {
    meta: { err: null },
    transaction: {
      message: {
        accountKeys: [{ pubkey: new PublicKey(STRANGER), signer: true, writable: true }],
        instructions: [{ program: "system", parsed: { type: "transfer", info: { source: STRANGER, destination: MARKER, lamports: 1_000_000 } } }],
      },
    },
  } as unknown as ParsedTransactionWithMeta;
}

describe("markerSeed", () => {
  it("is 32 characters, stable, and can't be worked out from the payment id alone", () => {
    const secret = new Uint8Array(64).fill(7);
    const seed = markerSeed(secret, "pi_123");
    expect(seed).toHaveLength(32);
    expect(markerSeed(secret, "pi_123")).toBe(seed);
    expect(markerSeed(secret, "pi_124")).not.toBe(seed);
    expect(markerSeed(new Uint8Array(64).fill(8), "pi_123")).not.toBe(seed);
    expect(seed).not.toBe(legacyMarkerSeed("pi_123"));
  });

  it("keeps the public seed the old markers used", () => {
    expect(legacyMarkerSeed("pi_123")).toHaveLength(32);
    expect(legacyMarkerSeed("pi_123")).toBe(legacyMarkerSeed("pi_123"));
  });
});

describe("isFaucetMint", () => {
  it("accepts the faucet's mint of exactly the deposit into the payer's account", () => {
    expect(isFaucetMint(mintTx(), expected)).toBe(true);
  });

  it("rejects someone else's transfer to the marker", () => {
    expect(isFaucetMint(strangerTransfer(), expected)).toBe(false);
  });

  it("rejects failed, foreign-signed, wrong-marker, wrong-amount and wrong-account transactions", () => {
    expect(isFaucetMint(null, expected)).toBe(false);
    expect(isFaucetMint(mintTx({ err: { InstructionError: [0, { Custom: 0 }] } }), expected)).toBe(false);
    expect(isFaucetMint(mintTx({ signer: STRANGER }), expected)).toBe(false);
    expect(isFaucetMint(mintTx({ marker: STRANGER }), expected)).toBe(false);
    expect(isFaucetMint(mintTx({ amount: "1" }), expected)).toBe(false);
    expect(isFaucetMint(mintTx({ account: STRANGER }), expected)).toBe(false);
  });
});
