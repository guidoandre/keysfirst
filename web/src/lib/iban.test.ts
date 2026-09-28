import { describe, expect, it } from "vitest";
import { isValidIban, maskIban, normalizeIban } from "./iban";

describe("IBAN", () => {
  it("normalizes spaces and case", () => {
    expect(normalizeIban(" de89 3704 0044 0532 0130 00 ")).toBe("DE89370400440532013000");
  });
  it("accepts valid IBANs (mod 97)", () => {
    expect(isValidIban("DE89 3704 0044 0532 0130 00")).toBe(true);
    expect(isValidIban("GB82WEST12345698765432")).toBe(true);
    expect(isValidIban("NL91ABNA0417164300")).toBe(true);
  });
  it("rejects typos and junk", () => {
    expect(isValidIban("DE89 3704 0044 0532 0130 01")).toBe(false);
    expect(isValidIban("DE89")).toBe(false);
    expect(isValidIban("hello world")).toBe(false);
    expect(isValidIban("")).toBe(false);
  });
  it("masks all but the country, check digits and last four", () => {
    expect(maskIban("DE89 3704 0044 0532 0130 00")).toBe("DE89 …3000");
  });
});
