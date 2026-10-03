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

/** 600500000 (base units) -> 60050 (cents). Deals are created from parseEur, so amounts are whole cents. */
export function toCents(baseUnits: bigint | string): number {
  return Number(BigInt(baseUnits) / UNITS_PER_CENT);
}

export function fromCents(cents: number): bigint {
  return BigInt(cents) * UNITS_PER_CENT;
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

/** Time left, ticking: 90061 -> "1 day 1 h", 3660 -> "1 h 1 min", 252 -> "4 min 12 s", 45 -> "45 s" */
export function formatCountdown(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  if (s >= 3_600) return formatDuration(s);
  const minutes = Math.floor(s / 60);
  const rest = s % 60;
  if (minutes > 0) return `${minutes} min${rest ? ` ${rest} s` : ""}`;
  return `${rest} s`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * "Wed 30 Sep, 14:00" in the viewer's time zone (or `timeZone`), with the year ("Tue 5 Oct 2027, 14:00") when it isn't
 * the current one, so a typo in the year can't hide. Built from parts so every browser prints the same.
 */
export function formatShortDateTime(unixSeconds: number, timeZone?: string, nowSeconds = Date.now() / 1000): string {
  const format = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    weekday: "short",
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = format.formatToParts(new Date(unixSeconds * 1000));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";
  const thisYear = format.formatToParts(new Date(nowSeconds * 1000)).find((p) => p.type === "year")?.value;
  const year = part("year") === thisYear ? "" : ` ${part("year")}`;
  // en-GB's CLDR data zero-pads the day when day+month are both requested as "numeric" (e.g. "04/10"); strip it back to a plain number.
  return `${part("weekday")} ${Number(part("day"))} ${MONTHS[Number(part("month")) - 1]}${year}, ${part("hour")}:${part("minute")}`;
}

// Server-rendered times (clock in UTC) name the handover's time zone: it happens at a door in Europe, so
// Central European time is shown (Ireland is one hour behind).
const CENTRAL_EUROPEAN_TIME = "Europe/Berlin";
/** "Wed 30 Sep, 14:00 (Central European time)", the same wherever the code runs. */
export const formatDoorTime = (unixSeconds: number) =>
  `${formatShortDateTime(unixSeconds, CENTRAL_EUROPEAN_TIME)} (Central European time)`;

/** "7xKpQ2…3mQe" -> "7xKp…3mQe" */
export function shortAddress(address: string): string {
  return address.length > 10 ? `${address.slice(0, 4)}…${address.slice(-4)}` : address;
}

export const whatsappUrl = (text: string) => `https://wa.me/?text=${encodeURIComponent(text)}`;
export const emailUrl = (subject: string, body: string) =>
  `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
