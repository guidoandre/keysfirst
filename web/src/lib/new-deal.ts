import { getCountry, type CountryCode } from "@/content/countries";
import { capError, housingOf } from "./country-rules";
import { formatEur, parseEur } from "./format";
import { HANDOVER_OPENS_BEFORE_MOVE_IN, MAX_HANDOVER_WINDOW, MAX_LOCK_DURATION } from "./rules";

export const WINDOW_CHOICES = [
  { value: "1d", label: "1 day", seconds: 86_400 },
  { value: "3d", label: "3 days", seconds: 3 * 86_400 },
  { value: "7d", label: "7 days", seconds: 7 * 86_400 },
  { value: "14d", label: "14 days", seconds: MAX_HANDOVER_WINDOW },
] as const;
export type WindowChoice = (typeof WINDOW_CHOICES)[number]["value"];

export const DEFAULT_WINDOW: WindowChoice = "3d";
export const TITLE_MAX_BYTES = 64;
/** Largest deposit: deposit + card fee must stay under Stripe's €999,999.99 charge limit. Base units (6 decimals). */
export const MAX_DEPOSIT = 900_000n * 1_000_000n;
/** The tenant gets at least an hour to pay. */
const MIN_TIME_TO_PAY = 60 * 60;
/** A move-in further ahead than this is refused as a likely typo in the year. */
const MAX_MOVE_IN_AHEAD = 365 * 86_400;

export interface NewDealForm {
  /** Only used to check the deposit against the country's legal maximum: never stored on the deal. */
  country: CountryCode | "";
  /** A HousingOption.value of that country. */
  housing: string;
  title: string;
  /** Monthly basic rent in euros, as typed. */
  rent: string;
  amount: string;
  /** Unix seconds; NaN until chosen. */
  moveIn: number;
  window: WindowChoice;
}

export interface NewDealValues {
  title: string;
  amount: bigint;
  moveIn: number;
  deadline: number;
}

export type NewDealField = "country" | "title" | "rent" | "amount" | "moveIn";
export type NewDealErrors = Partial<Record<NewDealField, string>>;

/** The fields checked before leaving each step, in the order they appear. */
export const STEP_FIELDS: Record<1 | 2, NewDealField[]> = { 1: ["country", "title", "rent", "amount"], 2: ["moveIn"] };

export const titleBytes = (title: string) => new TextEncoder().encode(title.trim()).length;

export function windowSeconds(form: Pick<NewDealForm, "window">): number {
  return WINDOW_CHOICES.find((choice) => choice.value === form.window)?.seconds ?? WINDOW_CHOICES[1].seconds;
}

export function handoverWindow(moveIn: number, seconds: number): { opens: number; deadline: number } {
  return { opens: moveIn - HANDOVER_OPENS_BEFORE_MOVE_IN, deadline: moveIn + seconds };
}

/**
 * Mirrors create_deal's checks (title ≤ 64 bytes, amount > 0, deadline in the future), so the wallet never signs a deal the program rejects,
 * and adds the country's legal maximum for the deposit, which only this form enforces.
 */
export function validateNewDeal(form: NewDealForm, now: number): { values: NewDealValues | null; errors: NewDealErrors } {
  const errors: NewDealErrors = {};
  const country = getCountry(form.country);
  if (!country) errors.country = `Choose the country where the room is.`;

  const title = form.title.trim();
  const bytes = titleBytes(title);
  if (bytes === 0) errors.title = 'Describe the room, for example “Room in Vallendar”.';
  else if (bytes > TITLE_MAX_BYTES) errors.title = `That's too long: shorten it. Up to 64 letters fit; ü, é and emoji take the room of two or more.`;

  const rent = parseEur(form.rent);
  if (rent === null) errors.rent = `Enter the monthly rent in euros, without heating and other running costs, for example 450.`;

  const amount = parseEur(form.amount);
  const overCap = country ? capError(country, housingOf(country, form.housing), rent, amount) : null;
  if (overCap) errors.amount = overCap;
  else if (amount !== null && amount > MAX_DEPOSIT) errors.amount = `Keysfirst takes deposits up to ${formatEur(MAX_DEPOSIT)}.`;
  else if (amount === null) errors.amount = `Enter the deposit in euros, for example 600 or 600.50.`;

  let deadline = Number.NaN;
  if (!Number.isFinite(form.moveIn)) {
    errors.moveIn = `Pick the move-in date and time.`;
  } else {
    deadline = form.moveIn + windowSeconds(form);
    if (deadline <= now) errors.moveIn = `That handover deadline is already in the past. Pick a later move-in or a longer window.`;
    // A deadline minutes away would expire before the tenant could even open the link.
    else if (deadline < now + MIN_TIME_TO_PAY) errors.moveIn = `That leaves your tenant less than an hour to pay. Pick a later move-in or a longer window.`;
    // Almost always a typo in the year (dates on the deal page only show the year when it isn't this one).
    else if (form.moveIn > now + MAX_MOVE_IN_AHEAD) errors.moveIn = `That move-in is more than a year away. Check the year.`;
  }

  if (Object.keys(errors).length > 0 || amount === null) return { values: null, errors };
  return { values: { title, amount, moveIn: form.moveIn, deadline }, errors };
}

/**
 * When the tenant can start paying: the program only takes a deposit locked for at most 180 days, so for a far-off
 * deadline payment opens 180 days before it. At or before `now` means straight away.
 */
export function paymentOpensAt(deadline: number): number {
  return deadline - MAX_LOCK_DURATION;
}