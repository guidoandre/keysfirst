import { describe, expect, it } from "vitest";
import { getCountry, type Country } from "@/content/countries";
import { capError, capHint, depositCap, housingOf, monthsLabel } from "./country-rules";

const eur = (n: number) => BigInt(n) * 1_000_000n; // base units: 6 decimals
const country = (code: string): Country => {
  const found = getCountry(code);
  if (!found) throw new Error(`no country ${code}`);
  return found;
};

describe("housingOf", () => {
  it("finds a rental type by value and falls back to the first one", () => {
    expect(housingOf(country("ES"), "seasonal").months).toBe(2);
    expect(housingOf(country("ES"), "long").months).toBe(1);
    expect(housingOf(country("FR"), "furnished").months).toBe(2);
    expect(housingOf(country("FR"), "mobilite").months).toBe(0);
    expect(housingOf(country("FR"), "not-a-type").value).toBe("unfurnished");
    expect(housingOf(country("DE"), "").months).toBe(3);
  });
});

describe("depositCap", () => {
  it("multiplies the monthly rent by the legal months", () => {
    expect(depositCap(eur(300), housingOf(country("DE"), "any"))).toBe(eur(900));
    expect(depositCap(eur(450), housingOf(country("NL"), "any"))).toBe(eur(900));
    expect(depositCap(eur(800), housingOf(country("IE"), "tenancy"))).toBe(eur(800));
    expect(depositCap(eur(500), housingOf(country("IT"), "any"))).toBe(eur(1500));
  });
});

describe("monthsLabel", () => {
  it("says month or months", () => {
    expect(monthsLabel(1)).toBe("1 month");
    expect(monthsLabel(3)).toBe("3 months");
  });
});

describe("capError", () => {
  const de = country("DE");
  const any = housingOf(de, "any");

  it("accepts a deposit at or below the cap", () => {
    expect(capError(de, any, eur(200), eur(600))).toBeNull();
    expect(capError(de, any, eur(200), eur(100))).toBeNull();
  });

  it("blocks a deposit above the cap and names the country, the maximum and the months", () => {
    const message = capError(de, any, eur(200), eur(601));
    expect(message).toMatch(/Germany/);
    expect(message).toMatch(/€600\.00/);
    expect(message).toMatch(/3 months/);
    expect(message).toMatch(/Lower the deposit/);
  });

  it("uses each country's own maximum", () => {
    expect(capError(country("IE"), housingOf(country("IE"), "licence"), eur(700), eur(701))).toMatch(/€700\.00/);
    expect(capError(country("ES"), housingOf(country("ES"), "long"), eur(400), eur(401))).toMatch(/1 month/);
    expect(capError(country("ES"), housingOf(country("ES"), "seasonal"), eur(400), eur(800))).toBeNull();
    expect(capError(country("ES"), housingOf(country("ES"), "seasonal"), eur(400), eur(801))).toMatch(/2 months/);
    expect(capError(country("FR"), housingOf(country("FR"), "furnished"), eur(500), eur(1000))).toBeNull();
    expect(capError(country("NL"), housingOf(country("NL"), "any"), eur(400), eur(801))).toMatch(/2 months/);
  });

  it("blocks every deposit for a lease type that allows none, even before the amounts are filled in", () => {
    const fr = country("FR");
    const mobilite = housingOf(fr, "mobilite");
    expect(capError(fr, mobilite, eur(500), eur(1))).toMatch(/bail mobilité/);
    expect(capError(fr, mobilite, null, null)).toMatch(/bail mobilité/);
  });

  it("says nothing until both the rent and the deposit are valid", () => {
    expect(capError(de, any, null, eur(600))).toBeNull();
    expect(capError(de, any, eur(200), null)).toBeNull();
  });
});

describe("capHint", () => {
  it("shows the maximum once the rent is known", () => {
    const de = country("DE");
    expect(capHint(de, housingOf(de, "any"), eur(300))).toBe("The legal deposit in Germany is at most €900.00 (3 months of rent).");
    expect(capHint(de, housingOf(de, "any"), null)).toBeNull();
  });

  it("shows nothing for a lease type that allows no deposit", () => {
    const fr = country("FR");
    expect(capHint(fr, housingOf(fr, "mobilite"), eur(500))).toBeNull();
  });
});
