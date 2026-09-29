# Keysfirst for Europe Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Keysfirst read and behave as a Europe-wide product: the landlord picks the country of the room, the app blocks a deposit above that country's legal maximum, shows what the law says there, and the FAQ explains the rules per country.

**Architecture:** Country rules are plain typed data (`web/src/content/countries.ts`) with a small tested rules module (`web/src/lib/country-rules.ts`). `validateNewDeal` gains country, rental type and monthly rent and returns an amount error above the cap. `CreateDealFlow` asks the new questions in step 1 and shows the law in step 3. Nothing about the country is stored: the Solana program and the deal accounts do not change. The FAQ builds its per-country entries from the same data. Marketing copy says "Europe".

**Tech Stack:** Next.js (App Router), React 19, TypeScript, Tailwind v4 (semantic tokens only), vitest (`src/**/*.test.ts`). No new dependencies.

**Spec:** `docs/research/2026-09-29-country-rules.md` (sources in sections 1 to 3, decisions in section 4).

## Global Constraints

- Devnet only. Never print, paste or commit private keys or seed phrases.
- Ask the user before adding dependencies or changing the deal rules in the spec (section 6). This plan adds none and changes no program code: the cap is UI validation only.
- UI copy: plain English, no blockchain jargon; amounts in €.
- Web runs in PowerShell in `web/`: `npm run dev`, `npm test`, `npm run build`, `npm run lint`.
- `web/AGENTS.md`: this Next.js has breaking changes. This plan uses only patterns already in the repo (client components, `next/link`, static server pages). If a step needs any other Next API, read `web/node_modules/next/dist/docs/` first.
- Route groups: `web/src/app/(site)` marketing pages contain no wallet code (Lighthouse). `web/src/content/countries.ts` and `faq.ts` are pure data and may be imported there. `CountryLaw` lives in `components/deal` and is used by `(app)` only.
- Links from marketing pages into `(app)` routes use `prefetch={false}` (`isAppRoute` in `web/src/lib/site.ts`).
- Design tokens: only semantic colour utilities exist (`text-fg-muted`, `bg-accent-soft`, `text-danger`, ...). Do not invent colours.
- The working tree has uncommitted edits from earlier work (`CLAUDE.md`, `README.md`, `docs/deployments.md`, `web/src/app/not-found.tsx`, `web/src/lib/checkout.ts`, `checkout.test.ts`, `site.ts`). Never `git add -A` or `git add .`: add only the files named in each commit step.
- Commit messages end with `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- Legal wording is general information, not legal advice, and carries the "checked 29 September 2026" date (`LAW_CHECKED`).

## File Structure

| File | Responsibility |
|---|---|
| `web/src/content/countries.ts` (create) | The six countries: code, name, rental types with cap in months, "what the law says" bullets, `LAW_CHECKED`, `getCountry` |
| `web/src/content/countries.test.ts` (create) | Data integrity: unique codes, every country has a rental type and at least five bullets |
| `web/src/lib/country-rules.ts` (create) | `housingOf`, `depositCap`, `monthsLabel`, `capHint`, `capError` |
| `web/src/lib/country-rules.test.ts` (create) | Cap arithmetic and messages |
| `web/src/lib/new-deal.ts` (modify) | Form gains `country`, `housing`, `rent`; validation blocks amounts over the cap |
| `web/src/lib/new-deal.test.ts` (modify) | New validation cases |
| `web/src/components/ui/Segmented.tsx` (modify) | Optional `error` line under the group |
| `web/src/components/deal/CountryLaw.tsx` (create) | "What the law says in {country}" panel for step 3 |
| `web/src/app/(app)/new/CreateDealFlow.tsx` (modify) | Country, rental type, rent, live cap, law step |
| `web/src/content/faq.ts` (modify) | "Deposit rules by country" group, "Which countries" entry, generalised answers |
| `web/src/content/faq.test.ts` (create) | Unique entry ids, one entry per country |
| Marketing pages and metadata (modify) | "Europe" copy (task 5) |

---

### Task 1: Country data and cap rules

**Files:**
- Create: `web/src/content/countries.ts`
- Create: `web/src/content/countries.test.ts`
- Create: `web/src/lib/country-rules.ts`
- Create: `web/src/lib/country-rules.test.ts`

**Interfaces:**
- Produces (`countries.ts`):
  - `type CountryCode = "DE" | "NL" | "IE" | "ES" | "FR" | "IT"`
  - `interface HousingOption { value: string; label: string; months: number; note?: string; blocked?: string }` (`months` = legal maximum deposit in months of basic rent, 0 = no deposit allowed)
  - `interface Country { code: CountryCode; name: string; question?: string; housing: [HousingOption, ...HousingOption[]]; law: string[] }`
  - `const COUNTRIES: Country[]`, `const LAW_CHECKED: string`, `function getCountry(code: string): Country | undefined`
- Produces (`country-rules.ts`):
  - `housingOf(country: Country, value: string): HousingOption` (falls back to the first option)
  - `depositCap(rent: bigint, housing: HousingOption): bigint` (base units)
  - `monthsLabel(months: number): string`
  - `capHint(country: Country, housing: HousingOption, rent: bigint | null): string | null`
  - `capError(country: Country, housing: HousingOption, rent: bigint | null, amount: bigint | null): string | null`

- [ ] **Step 1: Write the failing tests**

Create `web/src/lib/country-rules.test.ts`:

```ts
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
    expect(capHint(de, housingOf(de, "any"), eur(300))).toBe("The most allowed in Germany is €900.00 (3 months of rent).");
    expect(capHint(de, housingOf(de, "any"), null)).toBeNull();
  });

  it("shows nothing for a lease type that allows no deposit", () => {
    const fr = country("FR");
    expect(capHint(fr, housingOf(fr, "mobilite"), eur(500))).toBeNull();
  });
});
```

Create `web/src/content/countries.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run (PowerShell, in `web/`): `npm test -- country`
Expected: FAIL, "Failed to resolve import" for `@/content/countries` and `./country-rules`.

- [ ] **Step 3: Write the country data**

Create `web/src/content/countries.ts`:

```ts
// What the law says about rental deposits in the countries Keysfirst covers. Sources and the points we could not
// verify: docs/research/2026-09-29-country-rules.md. General information, not legal advice: update LAW_CHECKED
// whenever a line changes, and re-check everything before a live launch.

export type CountryCode = "DE" | "NL" | "IE" | "ES" | "FR" | "IT";

export interface HousingOption {
  value: string;
  label: string;
  /** Legal maximum deposit in months of basic rent (without utilities). 0 means no deposit is allowed. */
  months: number;
  /** Extra warning shown on the last step of the create flow. */
  note?: string;
  /** Shown when months is 0. */
  blocked?: string;
}

export interface Country {
  code: CountryCode;
  name: string;
  /** Asked only when there is more than one rental type. */
  question?: string;
  housing: [HousingOption, ...HousingOption[]];
  /** Cap, when it is due, what the landlord must do after the handover, when it must come back, good to know. */
  law: string[];
}

export const LAW_CHECKED = "29 September 2026";

export const COUNTRIES: Country[] = [
  {
    code: "DE",
    name: "Germany",
    housing: [{ value: "any", label: "Room or flat", months: 3 }],
    law: [
      "A deposit may be at most three months' rent without utilities (§551 BGB). The tenant may pay it in three monthly instalments.",
      "A landlord can't demand the deposit before the tenancy starts: the first instalment is due when it begins, and a clause that says otherwise doesn't count (§551(4) BGB). Paying early through Keysfirst is the tenant's choice.",
      "After the handover the landlord must keep the deposit apart from their own money, normally in a bank account, and the interest belongs to the tenant (§551(3) BGB).",
      "The law sets no return date. Courts give the landlord a reasonable time after the tenancy ends to check for damage and utility bills, usually up to about six months.",
      "Good to know: within two weeks of moving in you must register your address (Anmeldung), and the landlord must give you a written confirmation of your move-in for that.",
    ],
  },
  {
    code: "NL",
    name: "the Netherlands",
    housing: [{ value: "any", label: "Room or flat", months: 2 }],
    law: [
      "A deposit may be at most two months' basic rent, without service charges, for contracts signed since 1 July 2023 (art. 7:261b BW).",
      "The law doesn't say when the deposit is due. Paying early through Keysfirst is the tenant's choice, never a condition for the room.",
      "After the handover the landlord may deduct only unpaid rent, service charges, damage the tenant caused and energy-label costs, and must send an itemised statement in writing. Landlords don't have to pay interest.",
      "The deposit must come back within 14 days after the tenancy ends, or within 30 days if the landlord deducts something.",
      "Good to know: rents for rooms are limited by the points system (Wet betaalbare huur), and students, also from abroad, may get a temporary contract of up to two years.",
    ],
  },
  {
    code: "IE",
    name: "Ireland",
    question: "Does the landlord live in the home too?",
    housing: [
      { value: "tenancy", label: "No, it's a separate home", months: 1 },
      {
        value: "licence",
        label: "Yes, they live there too",
        months: 1,
        note: "If the landlord shares the home with you, you usually have a licence, not a tenancy. The Residential Tenancies Board can't help, and the landlord can end it with reasonable notice. One month's rent is the safe limit for the deposit.",
      },
    ],
    law: [
      "A landlord may ask for at most one month's rent as a deposit, plus at most one month's rent in advance (section 19B, Residential Tenancies Act 2004).",
      "The cap covers any payment made to secure a tenancy. Paying early through Keysfirst is the tenant's choice.",
      "There is no official deposit protection scheme yet. The landlord must register the tenancy with the Residential Tenancies Board (RTB) within a month, and you can look an address up on rtb.ie.",
      "The landlord must return the deposit promptly when the tenancy ends. Normal wear and tear can't be deducted.",
      "Good to know: if you share the home with the landlord you usually have a licence, not a tenancy, with much less protection.",
    ],
  },
  {
    code: "ES",
    name: "Spain",
    question: "What kind of rental is it?",
    housing: [
      { value: "long", label: "Long-term, a year or more", months: 1 },
      { value: "seasonal", label: "Seasonal, such as a study year", months: 2 },
    ],
    law: [
      "The legal deposit (fianza) is one month's rent for a long-term home and two months for a seasonal rental such as a study year (arts. 3 and 36 LAU). Landlord and tenant may agree extra guarantees, up to two more months on a long-term contract.",
      "The fianza is due when the contract is signed. Money paid earlier is a reservation, not the fianza. Paying early through Keysfirst is the tenant's choice.",
      "After the handover the landlord must lodge the fianza with the regional housing body, for example INCASÒL in Catalonia or the Comunidad de Madrid, usually within 30 days to two months depending on the region. Keysfirst doesn't do this for them.",
      "The landlord must return the fianza within one month after the keys are handed back, or owes legal interest (art. 36 LAU).",
      "Good to know: rules for rooms and seasonal rentals differ by region and are changing, Catalonia since January 2026. Ask for a written contract and the energy certificate.",
    ],
  },
  {
    code: "FR",
    name: "France",
    question: "Which lease is it?",
    housing: [
      { value: "unfurnished", label: "Unfurnished", months: 1 },
      { value: "furnished", label: "Furnished or student lease", months: 2 },
      {
        value: "mobilite",
        label: "Bail mobilité (1 to 10 months)",
        months: 0,
        blocked: "A bail mobilité can't include a deposit under French law (art. 25-13 of the law of 6 July 1989). Choose another lease type, or don't use a deposit.",
      },
    ],
    law: [
      "The deposit (dépôt de garantie) is capped at one month's rent without charges for an unfurnished home, and two months for a furnished home or a student lease (arts. 22 and 25-6 of the law of 6 July 1989).",
      "The deposit is due when the lease is signed, and the law allows it to be paid through a third party. A bail mobilité can't include any deposit.",
      "At the handover landlord and tenant must complete a written condition report (état des lieux), and again when the keys come back. The two reports decide any deduction (art. 3-2).",
      "The landlord must return the deposit within one month after the keys come back if the reports match, or within two months if not. Each month of delay adds a penalty of 10% of the monthly rent.",
      "Good to know: students from abroad with a valid student visa can ask for a free guarantee from Visale before signing. Home insurance must be shown when the keys are handed over.",
    ],
  },
  {
    code: "IT",
    name: "Italy",
    housing: [{ value: "any", label: "Room or flat", months: 3 }],
    law: [
      "A deposit may be at most three months' rent (art. 11, law 392/1978).",
      "The law doesn't ban paying before the contract exists, but money paid before it is legally an advance (caparra), not the deposit. Paying early through Keysfirst is the tenant's choice.",
      "After the handover the deposit earns legal interest for the tenant, paid every year (1.60% in 2026). A clause that removes the interest doesn't count.",
      "The landlord returns the deposit when the lease ends and the home is handed back, and can't keep it without showing the damage it covers.",
      "Good to know: the lease must be in writing and the landlord must register it with the tax office (Agenzia delle Entrate) within 30 days. For that a foreign tenant needs an Italian tax code (codice fiscale).",
    ],
  },
];

export function getCountry(code: string): Country | undefined {
  return COUNTRIES.find((country) => country.code === code);
}
```

- [ ] **Step 4: Write the rules module**

Create `web/src/lib/country-rules.ts`:

```ts
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
```

- [ ] **Step 5: Run the tests to verify they pass**

Run (PowerShell, in `web/`): `npm test -- country`
Expected: PASS (`country-rules.test.ts` and `countries.test.ts`).

- [ ] **Step 6: Commit**

```bash
git switch -c europe
git add web/src/content/countries.ts web/src/content/countries.test.ts web/src/lib/country-rules.ts web/src/lib/country-rules.test.ts docs/research/2026-09-29-country-rules.md docs/superpowers/plans/2026-09-29-keysfirst-europe.md
git commit -m "feat(web): country rules for six European countries and the deposit cap check" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Block a deposit above the cap in `validateNewDeal`

**Files:**
- Modify: `web/src/lib/new-deal.ts`
- Modify: `web/src/lib/new-deal.test.ts`

**Interfaces:**
- Consumes: `getCountry`, `CountryCode` (task 1, `@/content/countries`); `capError`, `housingOf` (task 1, `./country-rules`); `parseEur` (`./format`).
- Produces:
  - `NewDealForm` gains `country: CountryCode | ""`, `housing: string`, `rent: string`.
  - `NewDealField = "country" | "title" | "rent" | "amount" | "moveIn"`.
  - `STEP_FIELDS[1] = ["country", "title", "rent", "amount"]`.
  - `DEMO_VALUES = { country: "DE", housing: "any", title: "Room in Vallendar", rent: "300", amount: "600" }` (typed `as const`).
  - `NewDealValues` is unchanged (country is not stored).

- [ ] **Step 1: Write the failing tests**

In `web/src/lib/new-deal.test.ts`, replace the `good` definition and add the new cases. Change line 6 to:

```ts
const good: NewDealForm = { country: "DE", housing: "any", title: "Room in Vallendar", rent: "300", amount: "600", moveIn: now + DAY, window: "3d", demo: false };
```

Add inside `describe("validateNewDeal", ...)`, after the "rejects a deadline that is already in the past" test:

```ts
  it("needs a country", () => {
    const { values, errors } = validateNewDeal({ ...good, country: "" }, now);
    expect(errors.country).toMatch(/Choose the country/);
    expect(values).toBeNull();
  });

  it("needs a monthly rent in euros", () => {
    expect(validateNewDeal({ ...good, rent: "" }, now).errors.rent).toMatch(/monthly rent/);
    expect(validateNewDeal({ ...good, rent: "abc" }, now).values).toBeNull();
    expect(validateNewDeal({ ...good, rent: "450,50" }, now).errors.rent).toBeUndefined();
  });

  it("blocks a deposit above the country's legal maximum", () => {
    expect(validateNewDeal({ ...good, rent: "200", amount: "600" }, now).errors.amount).toBeUndefined(); // 3 × 200, Germany
    const over = validateNewDeal({ ...good, rent: "200", amount: "600.01" }, now);
    expect(over.errors.amount).toMatch(/Germany.*€600\.00.*3 months/);
    expect(over.values).toBeNull();
  });

  it("applies the rental type's cap", () => {
    const es = { ...good, country: "ES" as const, rent: "400" };
    expect(validateNewDeal({ ...es, housing: "long", amount: "401" }, now).errors.amount).toMatch(/1 month/);
    expect(validateNewDeal({ ...es, housing: "seasonal", amount: "800" }, now).errors.amount).toBeUndefined();
    expect(validateNewDeal({ ...es, housing: "seasonal", amount: "801" }, now).errors.amount).toMatch(/2 months/);
    // a rental type left over from another country falls back to that country's first type (Spain: long-term, 1 month)
    expect(validateNewDeal({ ...es, housing: "mobilite", amount: "401" }, now).errors.amount).toMatch(/1 month/);
  });

  it("refuses any deposit for a lease type that allows none", () => {
    const mobilite = { ...good, country: "FR" as const, housing: "mobilite", rent: "500", amount: "1" };
    expect(validateNewDeal(mobilite, now).errors.amount).toMatch(/bail mobilité/);
    expect(validateNewDeal(mobilite, now).values).toBeNull();
  });

  it("keeps the amount error about the format when the amount isn't a number", () => {
    expect(validateNewDeal({ ...good, amount: "abc" }, now).errors.amount).toMatch(/euros/);
  });
```

Also update the import on line 2 to add nothing new (the existing names are enough).

- [ ] **Step 2: Run the tests to verify they fail**

Run (PowerShell, in `web/`): `npm test -- new-deal`
Expected: FAIL (type errors are not checked by vitest, but the new tests fail: `errors.country`, `errors.rent` and the cap messages are undefined).

- [ ] **Step 3: Implement**

In `web/src/lib/new-deal.ts`:

Replace the import line 1-2 block with:

```ts
import { getCountry, type CountryCode } from "@/content/countries";
import { capError, housingOf } from "./country-rules";
import { parseEur } from "./format";
import { HANDOVER_OPENS_BEFORE_MOVE_IN, MAX_HANDOVER_WINDOW } from "./rules";
```

Replace `DEMO_VALUES`:

```ts
export const DEMO_VALUES = { country: "DE", housing: "any", title: "Room in Vallendar", rent: "300", amount: "600" } as const;
```

Replace `NewDealForm`:

```ts
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
  demo: boolean;
}
```

Replace the field types and `STEP_FIELDS`:

```ts
export type NewDealField = "country" | "title" | "rent" | "amount" | "moveIn";
export type NewDealErrors = Partial<Record<NewDealField, string>>;

/** The fields checked before leaving each step, in the order they appear. */
export const STEP_FIELDS: Record<1 | 2, NewDealField[]> = { 1: ["country", "title", "rent", "amount"], 2: ["moveIn"] };
```

Replace the doc comment and the start of `validateNewDeal` down to the `moveIn` block. The whole function becomes:

```ts
/**
 * Mirrors create_deal's checks (title ≤ 64 bytes, amount > 0, deadline in the future), so the wallet never signs a deal the program rejects,
 * and adds the country's legal maximum for the deposit, which only this form enforces.
 */
export function validateNewDeal(form: NewDealForm, now: number): { values: NewDealValues | null; errors: NewDealErrors } {
  const errors: NewDealErrors = {};
  const country = getCountry(form.country);
  if (!country) errors.country = "Choose the country where the room is.";

  const title = form.title.trim();
  const bytes = titleBytes(title);
  if (bytes === 0) errors.title = "Describe the room, for example “Room in Vallendar”.";
  else if (bytes > TITLE_MAX_BYTES) errors.title = "That's too long: keep it under 64 characters.";

  const rent = parseEur(form.rent);
  if (rent === null) errors.rent = "Enter the monthly rent in euros, without heating and other running costs, for example 450.";

  const amount = parseEur(form.amount);
  const overCap = country ? capError(country, housingOf(country, form.housing), rent, amount) : null;
  if (overCap) errors.amount = overCap;
  else if (amount === null) errors.amount = "Enter the deposit in euros, for example 600 or 600.50.";

  let deadline = Number.NaN;
  if (!Number.isFinite(form.moveIn)) {
    errors.moveIn = "Pick the move-in date and time.";
  } else {
    deadline = form.moveIn + windowSeconds(form);
    if (deadline <= now) errors.moveIn = "That handover deadline is already in the past. Pick a later move-in or a longer window.";
  }

  if (Object.keys(errors).length > 0 || amount === null) return { values: null, errors };
  return { values: { title, amount, moveIn: form.moveIn, deadline }, errors };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run (PowerShell, in `web/`): `npm test -- new-deal`
Expected: PASS, including the six original tests.

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/new-deal.ts web/src/lib/new-deal.test.ts
git commit -m "feat(web): block a deposit above the country's legal maximum in the create form" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

(The build is broken between this task and the next because `CreateDealFlow` still builds the old form. Do task 3 right away; do not push in between.)

---

### Task 3: Country, rent, live cap and the law step in the create flow

**Files:**
- Modify: `web/src/components/ui/Segmented.tsx`
- Create: `web/src/components/deal/CountryLaw.tsx`
- Modify: `web/src/app/(app)/new/CreateDealFlow.tsx`

**Interfaces:**
- Consumes: everything produced by tasks 1 and 2.
- Produces: `Segmented` accepts `error?: string`; `CountryLaw({ country, housing })`.

- [ ] **Step 1: Add an `error` line to `Segmented`**

In `web/src/components/ui/Segmented.tsx`, add the import after the `cx` import:

```tsx
import { Icon } from "./Icon";
```

Add `error,` to the destructured props and `error?: string;` to the prop types (after `className?: string;`). Change the `<fieldset>` opening tag and add the error line after the closing `</div>` of the options wrapper (before `</fieldset>`):

```tsx
    <fieldset disabled={disabled} aria-describedby={error ? `${name}-error` : undefined} className={cx("min-w-0", className)}>
```

```tsx
      {error && (
        <p id={`${name}-error`} className="mt-2 flex items-start gap-1.5 text-sm font-semibold text-danger">
          <Icon name="alert" size={16} className="mt-0.5 shrink-0" />
          {error}
        </p>
      )}
```

- [ ] **Step 2: Create the law panel**

Create `web/src/components/deal/CountryLaw.tsx`:

```tsx
import Link from "next/link";
import { Callout } from "@/components/ui/Callout";
import { LAW_CHECKED, type Country, type HousingOption } from "@/content/countries";

/** "What the law says in {country}" for the landlord's last step. General information, so it says so and links to the FAQ entry. */
export function CountryLaw({ country, housing }: { country: Country; housing: HousingOption }) {
  return (
    <div className="space-y-3">
      <Callout tone="info" title={`What the law says in ${country.name}`}>
        <ul className="mt-1 list-disc space-y-1.5 pl-4">
          {country.law.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className="mt-2 text-fg-muted">
          General information, not legal advice. Checked {LAW_CHECKED}.{" "}
          <Link href={`/faq#law-${country.code.toLowerCase()}`} className="font-semibold underline underline-offset-2">
            Read it in the FAQ
          </Link>
        </p>
      </Callout>
      {housing.note && <Callout tone="neutral">{housing.note}</Callout>}
    </div>
  );
}
```

- [ ] **Step 3: Wire the create flow**

In `web/src/app/(app)/new/CreateDealFlow.tsx`:

1. Imports. Replace the `@/lib/format` import line and the `@/lib/new-deal` import block, and add the new imports (keep alphabetical order as in the file):

```tsx
import { CountryLaw } from "@/components/deal/CountryLaw";
import { COUNTRIES, getCountry, type CountryCode } from "@/content/countries";
import { capHint, housingOf } from "@/lib/country-rules";
import { formatEur, formatShortDateTime, parseEur, toLocalInputValue } from "@/lib/format";
```

(`parseEur` is exported from `@/lib/format`.) The `@/lib/new-deal` import block stays as is.

2. Field lists. Replace the two constants:

```tsx
const ALL_FIELDS: NewDealField[] = ["country", "title", "rent", "amount", "moveIn"];
const FIELD_ID: Record<NewDealField, string> = { country: "country-DE", title: "title", rent: "rent", amount: "amount", moveIn: "move-in" };
```

3. State. After `const [amount, setAmount] = useState("");` add:

```tsx
  const [country, setCountry] = useState<CountryCode | "">("");
  const [housing, setHousing] = useState("");
  const [rent, setRent] = useState("");
```

4. Derived values. Replace `const form = { title, amount, moveIn, window: windowChoice, demo };` with:

```tsx
  const form = { country, housing, title, rent, amount, moveIn, window: windowChoice, demo };
```

and after the `const remaining = ...` line add:

```tsx
  const selected = getCountry(country);
  const housingOption = selected ? housingOf(selected, housing) : null;
  const deposit = selected && housingOption ? capHint(selected, housingOption, parseEur(rent)) : null;

  function chooseCountry(code: CountryCode | "") {
    setCountry(code);
    setHousing(getCountry(code)?.housing[0].value ?? "");
  }
```

5. Demo values. In `fillDemoValues`, after `setTitle(DEMO_VALUES.title);` add:

```tsx
    setCountry(DEMO_VALUES.country);
    setHousing(DEMO_VALUES.housing);
    setRent(DEMO_VALUES.rent);
```

6. Step 1 JSX. Replace everything from `<TextField id="title" ...` through the `amount` `TextField` (the block between the intro `<p>` and the demo `<Callout>`) with:

```tsx
              <Segmented<CountryCode | "">
                name="country"
                legend="Country of the room"
                value={country}
                onChange={chooseCountry}
                error={shown("country")}
                options={COUNTRIES.map((c) => ({ value: c.code, label: c.name.replace(/^the /, "") }))}
              />
              {selected && housingOption && selected.housing.length > 1 && (
                <Segmented
                  name="housing"
                  legend={selected.question ?? "Rental type"}
                  value={housingOption.value}
                  onChange={setHousing}
                  options={selected.housing.map((option) => ({ value: option.value, label: option.label }))}
                />
              )}
              {housingOption?.months === 0 && <Callout tone="danger">{housingOption.blocked}</Callout>}
              <TextField
                id="title"
                label="Room"
                hint="Public and permanent: no names, street addresses or phone numbers. For example “Room in Vallendar, 14 m²”."
                counter={`${Math.max(remaining, 0)} left`}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                error={shown("title")}
                autoComplete="off"
              />
              <TextField
                id="rent"
                label="Monthly rent in euros"
                hint="The basic rent per month, without heating, water or other running costs. It sets the legal maximum for the deposit."
                inputMode="decimal"
                placeholder="300"
                value={rent}
                onChange={(event) => setRent(event.target.value)}
                error={shown("rent")}
                autoComplete="off"
              />
              <TextField
                id="amount"
                label="Deposit in euros"
                hint={deposit ?? "The exact amount your tenant pays into the lock."}
                inputMode="decimal"
                placeholder="600"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                error={shown("amount")}
                autoComplete="off"
              />
```

The button label drops the leading "the" ("the Netherlands" becomes "Netherlands"); `Country.name` keeps it because it is used inside sentences ("The most allowed in the Netherlands is ...").

7. Demo callout text. Change `(Room in Vallendar, €600.00, move-in now, 5-minute window)` to `(Germany, room in Vallendar, €300 rent, €600.00 deposit, move-in now, 5-minute window)`.

8. Step 3. Inside `{step === 3 && ( <> ... )}`, add as the first child of the fragment, above the `values && handover ?` conditional:

```tsx
              {selected && housingOption && <CountryLaw country={selected} housing={housingOption} />}
```

- [ ] **Step 4: Type-check, lint and run the unit tests**

Run (PowerShell, in `web/`):
`npx tsc --noEmit ; npm run lint ; npm test`
Expected: no type errors, no lint errors, all tests pass.

- [ ] **Step 5: Check the flow in the browser**

Start the dev server with `preview_start` `{name: "web"}` and open `/new`. Check, reading the page with `read_page` and taking one screenshot at the end:
1. Step 1 shows the country choices first. Press Next with nothing filled: the first error is "Choose the country where the room is." and focus goes to the first country option.
2. Choose Germany, enter room "Room in Vallendar", rent 200, deposit 700: Next shows "The most a landlord may ask in Germany is €600.00: 3 months of the monthly rent. Lower the deposit." Set 600: the hint above says "The most allowed in Germany is €600.00 (3 months of rent)." and Next continues.
3. Choose France: a lease question appears; choose "Bail mobilité": a danger callout says no deposit is allowed and Next blocks. Choose Spain, "Long-term": rent 400 accepts 400 and blocks 401; "Seasonal" accepts 800.
4. Choose Ireland: the "Does the landlord live in the home too?" question appears.
5. "Use demo values" fills Germany, €300, €600 and jumps to step 3.
6. Step 3 shows "What the law says in Germany" with five bullets, the "General information, not legal advice" line and the FAQ link; with Ireland "Yes, they live there too", the neutral licence note appears below it.
7. `read_console_messages` shows no errors. Then resize to mobile (`resize_window` preset `mobile`), screenshot step 1, and reset with preset `desktop`.

- [ ] **Step 6: Commit**

```bash
git add web/src/components/ui/Segmented.tsx web/src/components/deal/CountryLaw.tsx "web/src/app/(app)/new/CreateDealFlow.tsx"
git commit -m "feat(web): pick the country, check the deposit cap live and show what the law says" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 4: FAQ: deposit rules by country

**Files:**
- Modify: `web/src/content/faq.ts`
- Create: `web/src/content/faq.test.ts`
- Modify: `web/src/app/(site)/faq/page.tsx`

**Interfaces:**
- Consumes: `COUNTRIES`, `LAW_CHECKED` (task 1).
- Produces: FAQ entry ids `law-de`, `law-nl`, `law-ie`, `law-es`, `law-fr`, `law-it` (linked from `CountryLaw`) and `countries`.

- [ ] **Step 1: Write the failing test**

Create `web/src/content/faq.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run (PowerShell, in `web/`): `npm test -- faq`
Expected: FAIL (`law-de` entry and `countries` entry missing).

- [ ] **Step 3: Update `faq.ts`**

At the top of `web/src/content/faq.ts` add:

```ts
import { COUNTRIES, LAW_CHECKED } from "./countries";
```

Replace the comment above `export const FAQ` with:

```ts
// Legal statements: only what the country entries in countries.ts (checked 29 September 2026) and the privacy policy support, worded as written there. Honest caveats stay in (brand guidelines §8).
```

In the `who-for` entry, replace "rent a room in Germany before they arrive" with "rent a room in Europe before they arrive".

Add a new entry right after `who-for`:

```ts
      {
        id: "countries",
        question: "Which countries does it cover?",
        answer: [
          "Germany, the Netherlands, Ireland, Spain, France and Italy. In these countries we checked the deposit rules, and when a landlord creates a link Keysfirst stops a deposit above the legal maximum.",
          "Rooms in other countries aren't covered yet.",
        ],
        link: { href: "/faq#law", label: "Deposit rules by country" },
      },
```

In the `contract` entry, replace "follow normal German tenancy law" with "follow the tenancy law of the country where the room is".

Replace the whole `law` group (`id: "law", title: "German law"`, its entries `law`, `choice`, `after-handover`; keep `regulated` and `data` as they are) so the group reads:

```ts
  {
    id: "law",
    title: "Deposit rules by country",
    entries: [
      {
        id: "law",
        question: "What does the law say about deposits?",
        answer: [
          "Every country we cover limits how much a landlord may ask for, and says what the landlord must do with the deposit afterwards. Open your country below.",
          "This is general information, not legal advice.",
        ],
      },
      ...COUNTRIES.map((country) => ({
        id: `law-${country.code.toLowerCase()}`,
        question: `Renting in ${country.name}`,
        answer: [...country.law, `General information, not legal advice. Checked ${LAW_CHECKED}.`],
      })),
      {
        id: "choice",
        question: "Can a landlord make me use Keysfirst?",
        answer: [
          "No. Keysfirst is for tenants who choose to pay early without the risk, never a condition for getting the room. In Germany, for example, a landlord can't demand the full deposit before the tenancy starts (§551(4) BGB), and in France and Spain the deposit is due when the lease is signed.",
        ],
      },
      {
        id: "after-handover",
        question: "What happens to the deposit after the handover?",
        answer: [
          "It is the landlord's to hold as security, under the deposit rules of the country: in Germany the landlord must keep it apart from their own money, in Spain lodge it with a regional body, in Italy pay interest on it. Open your country above for the details. A live version would point landlords to these steps when the deposit is released.",
        ],
      },
      {
        id: "regulated",
        question: "Is Keysfirst a bank or a payment service?",
        answer: [
          "No. Keysfirst never holds the money: the program on Solana does, and pays it out only by its published rules. This prototype also moves only test money with no value.",
          "Before a live version with real euros, the program's update key would be removed, so nobody, Keysfirst included, could ever change the rules or reach a deposit. We would also ask BaFin, Germany's financial regulator, to confirm whether the model needs a licence under German payment services law (ZAG) or the EU's crypto rules (MiCA), and work with a licensed partner if it does.",
        ],
      },
      {
        id: "data",
        question: "What happens to my data?",
        answer: [
          "Keysfirst has no database and no tracking. Logging in is handled by Privy, card payments by Stripe; neither shares your card details or password with us. Deals are public on the blockchain and can't be deleted by anyone, so the room title must never contain names, street addresses or phone numbers.",
        ],
        link: { href: "/privacy", label: "Privacy policy" },
      },
    ],
  },
```

The `regulated` and `data` entries are the ones already in the file, unchanged; the group's old `law`, `choice` and `after-handover` entries are replaced by the ones above.

- [ ] **Step 4: Update the FAQ page description**

In `web/src/app/(site)/faq/page.tsx`, replace the `description` with:

```ts
  description: "How Keysfirst works, who holds the money, the deposit rules in each country, your account, test money and the prototype.",
```

- [ ] **Step 5: Run the tests and check the page**

Run (PowerShell, in `web/`): `npm test ; npm run lint`
Expected: all tests pass, no lint errors.

With the dev server from task 3 running, open `/faq#law-ie`: the Ireland entry opens and takes focus; `/faq#law` opens the intro; the group heading reads "Deposit rules by country"; `read_console_messages` shows no errors.

- [ ] **Step 6: Commit**

```bash
git add web/src/content/faq.ts web/src/content/faq.test.ts "web/src/app/(site)/faq/page.tsx"
git commit -m "feat(web): FAQ with the deposit rules of each country" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 5: "Europe" copy on the marketing pages and metadata

**Files:**
- Modify: `web/src/app/layout.tsx:12`, `web/src/app/opengraph-image.tsx:8`
- Modify: `web/src/app/(site)/page.tsx` (lines 23, 26, 36, 73, 79, 84-87)
- Modify: `web/src/app/(site)/about/page.tsx:38`, `web/src/app/(site)/tenants/page.tsx:74-75`, `web/src/app/(site)/terms/page.tsx:47-48`
- Modify: `web/src/components/marketing/ProblemSteps.tsx:4`
- Modify: `web/src/app/(app)/deal/[id]/handover/page.tsx:19-21`
- Modify: `web/src/lib/legal.ts` (`LEGAL_UPDATED`)

Leave alone: the two "Superteam Germany" mentions (about, terms, impressum: they name the challenge), the operator address, the terms' governing-law clause ("German law applies", consumer carve-out) and the privacy policy.

- [ ] **Step 1: Edit each string**

| File | Old | New |
|---|---|---|
| `app/layout.tsx` (description) | `A deposit link for renting a room in Germany from abroad.` | `A deposit link for renting a room in Europe from abroad.` |
| `app/opengraph-image.tsx` (subtitle) | `A deposit link for renting a room in Germany from abroad.` | `A deposit link for renting a room in Europe from abroad.` |
| `(site)/page.tsx` metadata description | `Renting a room in Germany from abroad? Keysfirst holds` | `Renting a room in Europe from abroad? Keysfirst holds` |
| `(site)/page.tsx` `FACTS[0]` | `Works with any listing: WG-Gesucht, Facebook, a friend's sublet` | `Works with any listing: a listing site, Facebook, a friend's sublet` |
| `(site)/page.tsx` hero label | `Deposit protection for rooms in Germany` | `Deposit protection for rooms in Europe` |
| `(site)/page.tsx` problem lead | `Students often rent a room in Germany before they arrive. That is exactly who the fake-landlord scam targets.` | `Students often rent a room in another country before they arrive. That is exactly who the fake-landlord scam targets.` |
| `(site)/page.tsx` callout body | `a Facebook group, WG-Gesucht, WhatsApp or a friend&apos;s sublet` | `a Facebook group, a listing site, WhatsApp or a friend&apos;s sublet` |
| `(site)/page.tsx` law callout | title `German law is on your side.`, body `You don&apos;t have to pay the full deposit before you move in: under §551 BGB you may pay it in three monthly instalments, the first due when the tenancy starts.` | title `The law caps your deposit.`, body `Every country we cover limits the deposit, from one month&apos;s rent to three. Keysfirst won&apos;t let a landlord create a link above the limit.` |
| `(site)/about/page.tsx` | `International students often rent a room in Germany before they arrive.` | `International students often rent a room abroad before they arrive.` |
| `(site)/tenants/page.tsx` callout | `And under §551 BGB you don&apos;t have to pay the full deposit before the tenancy starts.` (spans two lines) | `And you should never pay more than the law allows: Keysfirst checks the limit when the landlord creates the link.` |
| `(site)/terms/page.tsx` | `under German tenancy law. The information on this site about §551 BGB is general and not legal advice.` (spans two lines) | `under the tenancy law of the country where the room is. The information on this site about deposit rules is general and not legal advice.` |
| `components/marketing/ProblemSteps.tsx` | `in a Facebook group or on WG-Gesucht.` | `in a Facebook group or on a listing site.` |
| `handover/page.tsx` | comment `the handover happens at a door in Germany.`; `const GERMAN_TIME = "Europe/Berlin";`; `(German time)` | comment `the handover happens at a door in Europe; Central European time is shown (Ireland is one hour behind).`; `const CENTRAL_EUROPEAN_TIME = "Europe/Berlin";` (and the use in `at`); `(Central European time)` |
| `lib/legal.ts` | `export const LEGAL_UPDATED = "28 September 2026";` | `export const LEGAL_UPDATED = "29 September 2026";` |

- [ ] **Step 2: Find anything missed**

Run: use the Grep tool for `German|Germany|BGB|WG-Gesucht` in `web/src` (excluding tests).
Expected remaining matches only: the two "Superteam Germany" lines (about, terms, impressum), `legal.ts` `country: "Germany"`, the terms governing-law and product-liability lines, the privacy line about the German state, `countries.ts` (Germany's own rules) and `faq.ts` ("Germany" in the examples, `regulated` entry). Anything else: change it to "Europe" wording.

- [ ] **Step 3: Verify**

Run (PowerShell, in `web/`): `npx tsc --noEmit ; npm run lint ; npm test ; npm run build`
Expected: all pass. The build must keep `/`, `/faq`, `/about`, `/tenants`, `/terms` static (`export const dynamic = "error"` would fail the build otherwise). Then with the dev server: `/` hero says "Deposit protection for rooms in Europe", the callout says "The law caps your deposit."; `/tenants` and `/about` read correctly; `read_console_messages` shows no errors.

- [ ] **Step 4: Commit**

```bash
git add web/src/app/layout.tsx web/src/app/opengraph-image.tsx "web/src/app/(site)/page.tsx" "web/src/app/(site)/about/page.tsx" "web/src/app/(site)/tenants/page.tsx" "web/src/app/(site)/terms/page.tsx" web/src/components/marketing/ProblemSteps.tsx "web/src/app/(app)/deal/[id]/handover/page.tsx" web/src/lib/legal.ts
git commit -m "docs(web): Europe wording on the marketing pages and the hand-off page" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Final check and notes

**Files:**
- Modify: `CLAUDE.md` (project root)
- Modify: `docs/superpowers/plans/2026-09-29-keysfirst-europe.md` (tick the boxes)

- [ ] **Step 1: Full check**

Run (PowerShell, in `web/`): `npx tsc --noEmit ; npm run lint ; npm test ; npm run build`
Expected: all pass. Confirm `git status` shows only the pre-existing uncommitted files plus nothing new from this plan.

- [ ] **Step 2: Walk the whole flow once more**

With the dev server: on mobile width (`resize_window` `mobile`, reset to `desktop` afterwards) walk `/new` for Netherlands (rent 400: deposit 800 passes, 801 blocked), Italy (rent 500: 1500 passes) and Ireland, and confirm each step 3 shows that country's five points. Take one screenshot of step 3 for the user.

- [ ] **Step 3: Update the project notes**

In `CLAUDE.md` add one line under the existing notes:

```
- Europe (Sep 2026): the landlord picks the country in /new; the deposit is blocked above that country's legal maximum (web/src/content/countries.ts, checked 29 Sep 2026; rules and sources in docs/research/2026-09-29-country-rules.md). The country is UI-only, never stored on the deal. Update LAW_CHECKED and the FAQ (generated from the same data) whenever a rule changes. Marketing says "Europe"; the FAQ lists the six countries. Later: deal-page checklists and the landlord's Released list (need the country on the share link).
```

`CLAUDE.md` already has uncommitted edits from earlier work: do not commit it. Tell the user it is edited and left with their other pending changes.

- [ ] **Step 4: Tick the boxes and commit the plan**

```bash
git add docs/superpowers/plans/2026-09-29-keysfirst-europe.md
git commit -m "docs: tick the Europe plan" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 5: Report to the user**

What works (country choice, cap check, law step, FAQ, Europe wording), what doesn't (nothing about the country on the deal page; the cap is not enforced on-chain, so someone using the program directly can bypass it; the hand-off page shows Central European time, an hour ahead of Ireland; law text is general information and needs a lawyer's check before a live launch), what's next (deal-page checklists and the landlord's Released list, then merge to `main` after the user has seen the Preview).

---

## Not in this plan (by decision)

- Deal-page checklists and the landlord's "Released" list (need the country on the deal page).
- Any program change, a country field on the deal, enforcing the cap on-chain, releasing funds only after a registered contract.
- Belgium, the UK and countries outside the euro area.
- Other languages.
