import { describe, expect, it } from "vitest";
import { COUNTRIES, getCountry } from "./countries";

describe("COUNTRIES", () => {
  it("covers the six launch countries with unique codes", () => {
    expect(COUNTRIES.map((c) => c.code)).toEqual(["DE", "NL", "IE", "ES", "FR", "IT"]);
    expect(new Set(COUNTRIES.map((c) => c.code)).size).toBe(COUNTRIES.length);
    expect(getCountry("IT")?.name).toBe("Italy");
    expect(getCountry("XX")).toBeUndefined();
  });

  it("gives every country rental types with unique values and a sane cap", () => {
    for (const country of COUNTRIES) {
      expect(country.housing.length).toBeGreaterThan(0);
      expect(new Set(country.housing.map((h) => h.value)).size).toBe(country.housing.length);
      for (const option of country.housing) {
        expect(Number.isInteger(option.months) && option.months >= 0 && option.months <= 3).toBe(true);
        if (option.months === 0) expect(option.blocked).toBeTruthy();
      }
      if (country.housing.length > 1) expect(country.question).toBeTruthy();
    }
  });

  it("explains the law in at least five short points per country", () => {
    for (const country of COUNTRIES) {
      expect(country.law.length).toBeGreaterThanOrEqual(5);
      for (const line of country.law) expect(line.length).toBeLessThan(420);
    }
  });
});
