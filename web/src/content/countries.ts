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
      "The first instalment is due when the tenancy begins (§551(2) BGB), and a clause that is worse for the tenant doesn't count (§551(4) BGB). So a landlord can't demand the full deposit up front. Paying early through Keysfirst is the tenant's choice.",
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
      "As far as we know, Dutch law doesn't say when the deposit is due. Paying early through Keysfirst is the tenant's choice, never a condition for the room.",
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
      "The law doesn't ban paying before the contract exists. Money paid before it is usually treated as an advance (caparra) rather than the deposit, and how that applies to a payment held by a platform isn't settled. Paying early through Keysfirst is the tenant's choice.",
      "After the handover the deposit earns legal interest for the tenant, paid every year (1.60% in 2026). A clause that removes the interest doesn't count.",
      "The landlord returns the deposit when the lease ends and the home is handed back, and can't keep it without showing the damage it covers.",
      "Good to know: the lease must be in writing and the landlord must register it with the tax office (Agenzia delle Entrate) within 30 days. For that a foreign tenant needs an Italian tax code (codice fiscale).",
    ],
  },
];

export function getCountry(code: string): Country | undefined {
  return COUNTRIES.find((country) => country.code === code);
}
