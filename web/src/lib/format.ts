export const DECIMALS = 6;
const UNITS_PER_CENT = 10n ** BigInt(DECIMALS - 2);
const eur = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" });

/** 600000000 (base units) -> "€600.00" */
export function formatEur(baseUnits: bigint | string): string {
  const cents = BigInt(baseUnits) / UNITS_PER_CENT;
  return eur.format(Number(cents) / 100);
}

/** "600", "600.5", "600,50" -> base units; null if invalid or zero. */
export function parseEur(input: string): bigint | null {
  const match = input.trim().match(/^(\d{1,7})(?:[.,](\d{1,2}))?$/);
  if (!match) return null;
  const cents = BigInt(match[1]) * 100n + BigInt((match[2] ?? "").padEnd(2, "0"));
  return cents > 0n ? cents * UNITS_PER_CENT : null;
}

export function formatDateTime(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

/** 90061 -> "1 day 1 h"; 125 -> "2 min" */
export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const days = Math.floor(s / 86_400);
  const hours = Math.floor((s % 86_400) / 3_600);
  const minutes = Math.floor((s % 3_600) / 60);
  if (days > 0) return `${days} day${days === 1 ? "" : "s"}${hours ? ` ${hours} h` : ""}`;
  if (hours > 0) return `${hours} h${minutes ? ` ${minutes} min` : ""}`;
  if (minutes > 0) return `${minutes} min`;
  return `${s} s`;
}

/** Value for <input type="datetime-local"> in the viewer's time zone. */
export function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export const explorerTx = (signature: string) => `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
export const explorerAddress = (address: string) => `https://explorer.solana.com/address/${address}?cluster=devnet`;

/** Opens `pageUrl` inside Phantom's in-app browser (needed on phones). */
export function phantomBrowseUrl(pageUrl: string): string {
  return `https://phantom.app/ul/browse/${encodeURIComponent(pageUrl)}?ref=${encodeURIComponent(new URL(pageUrl).origin)}`;
}
