import { describe, expect, it } from "vitest";
import { COUNTRIES } from "./countries";
import { FAQ, LANDING_FAQ_IDS, faqEntries } from "./faq";

const entries = FAQ.flatMap((group) => group.entries);

describe("FAQ", () => {
  it("has unique entry ids, so links and #hash opening work", () => {
    const ids = entries.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has one deposit-rules entry per country, with the country's points and a date", () => {
    for (const country of COUNTRIES) {
      const entry = entries.find((e) => e.id === `law-${country.code.toLowerCase()}`);
      expect(entry, country.code).toBeDefined();
      expect(entry!.answer.slice(0, country.law.length)).toEqual(country.law);
      expect(entry!.answer.join(" ")).toMatch(/not legal advice/);
    }
  });

  it("says which countries are covered", () => {
    const answer = entries.find((e) => e.id === "countries")?.answer.join(" ") ?? "";
    for (const name of ["Germany", "the Netherlands", "Ireland", "Spain", "France", "Italy"]) expect(answer).toContain(name);
  });

  it("still finds every landing FAQ entry", () => {
    expect(faqEntries(LANDING_FAQ_IDS)).toHaveLength(LANDING_FAQ_IDS.length);
  });
});
