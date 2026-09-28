export function normalizeIban(input: string): string {
  return input.replace(/\s+/g, "").toUpperCase();
}

/** ISO 13616: two letters, two check digits, 11–30 letters or digits, and the mod-97 remainder is 1. */
export function isValidIban(input: string): boolean {
  const iban = normalizeIban(input);
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) return false;
  let remainder = 0;
  for (const ch of iban.slice(4) + iban.slice(0, 4)) {
    const value = ch >= "A" ? ch.charCodeAt(0) - 55 : Number(ch);
    remainder = Number(`${remainder}${value}`) % 97;
  }
  return remainder === 1;
}

/** "DE89 3704 0044 0532 0130 00" -> "DE89 …3000" */
export function maskIban(input: string): string {
  const iban = normalizeIban(input);
  return `${iban.slice(0, 4)} …${iban.slice(-4)}`;
}
