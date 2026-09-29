import type { Country, HousingOption } from "@/content/countries";
import { formatEur } from "./format";

/** The rental type with this value, or the country's first one (a stale value from another country lands here). */
export function housingOf(country: Country, value: string): HousingOption {
  return country.housing.find((option) => option.value === value) ?? country.housing[0];
}

/** Legal maximum deposit in base units: months × the monthly rent (also in base units). */
export function depositCap(rent: bigint, housing: HousingOption): bigint {
  return rent * BigInt(housing.months);
}

export const monthsLabel = (months: number) => (months === 1 ? "1 month" : `${months} months`);

/** Live hint under the deposit field; null until the rent is known or when no deposit is allowed. */
export function capHint(country: Country, housing: HousingOption, rent: bigint | null): string | null {
  if (rent === null || housing.months === 0) return null;
  return `The most allowed in ${country.name} is ${formatEur(depositCap(rent, housing))} (${monthsLabel(housing.months)} of rent).`;
}

/** Why this deposit is illegal for this country and rental type; null if it is fine or not checkable yet. */
export function capError(country: Country, housing: HousingOption, rent: bigint | null, amount: bigint | null): string | null {
  if (housing.months === 0) return housing.blocked ?? `A deposit isn't allowed for this rental in ${country.name}.`;
  if (rent === null || amount === null) return null;
  const cap = depositCap(rent, housing);
  if (amount <= cap) return null;
  return `The most a landlord may ask in ${country.name} is ${formatEur(cap)}: ${monthsLabel(housing.months)} of the monthly rent. Lower the deposit.`;
}
