import { parseEur } from "./format";
import { HANDOVER_OPENS_BEFORE_MOVE_IN, MAX_HANDOVER_WINDOW } from "./rules";

export const WINDOW_CHOICES = [
  { value: "1d", label: "1 day", seconds: 86_400 },
  { value: "3d", label: "3 days", seconds: 3 * 86_400 },
  { value: "7d", label: "7 days", seconds: 7 * 86_400 },
  { value: "14d", label: "14 days", seconds: MAX_HANDOVER_WINDOW },
] as const;
export type WindowChoice = (typeof WINDOW_CHOICES)[number]["value"];

export const DEFAULT_WINDOW: WindowChoice = "3d";
export const DEMO_WINDOW_SECONDS = 300;
export const DEMO_VALUES = { title: "Room in Vallendar", amount: "600" };
export const TITLE_MAX_BYTES = 64;

export interface NewDealForm {
  title: string;
  amount: string;
  /** Unix seconds; NaN until chosen. */
  moveIn: number;
  window: WindowChoice;
  demo: boolean;
}

export interface NewDealValues {
  title: string;
  amount: bigint;
  moveIn: number;
  deadline: number;
}

export type NewDealField = "title" | "amount" | "moveIn";
export type NewDealErrors = Partial<Record<NewDealField, string>>;

/** The fields checked before leaving each step. */
export const STEP_FIELDS: Record<1 | 2, NewDealField[]> = { 1: ["title", "amount"], 2: ["moveIn"] };

export const titleBytes = (title: string) => new TextEncoder().encode(title.trim()).length;

export function windowSeconds(form: Pick<NewDealForm, "window" | "demo">): number {
  if (form.demo) return DEMO_WINDOW_SECONDS;
  return WINDOW_CHOICES.find((choice) => choice.value === form.window)?.seconds ?? WINDOW_CHOICES[1].seconds;
}

export function handoverWindow(moveIn: number, seconds: number): { opens: number; deadline: number } {
  return { opens: moveIn - HANDOVER_OPENS_BEFORE_MOVE_IN, deadline: moveIn + seconds };
}

/** Mirrors create_deal's checks (title ≤ 64 bytes, amount > 0, deadline in the future), so the wallet never signs a deal the program rejects. */
export function validateNewDeal(form: NewDealForm, now: number): { values: NewDealValues | null; errors: NewDealErrors } {
  const errors: NewDealErrors = {};
  const title = form.title.trim();
  const bytes = titleBytes(title);
  if (bytes === 0) errors.title = "Describe the room, for example “Room in Vallendar”.";
  else if (bytes > TITLE_MAX_BYTES) errors.title = "That's too long: keep it under 64 characters.";

  const amount = parseEur(form.amount);
  if (amount === null) errors.amount = "Enter the deposit in euros, for example 600 or 600.50.";

  let deadline = Number.NaN;
  if (!Number.isFinite(form.moveIn)) {
    errors.moveIn = "Pick the move-in date and time.";
  } else {
    deadline = form.moveIn + windowSeconds(form);
    if (deadline <= now) errors.moveIn = "That handover deadline is already in the past. Pick a later move-in or a longer window.";
  }

  if (errors.title || errors.amount || errors.moveIn || amount === null) return { values: null, errors };
  return { values: { title, amount, moveIn: form.moveIn, deadline }, errors };
}
