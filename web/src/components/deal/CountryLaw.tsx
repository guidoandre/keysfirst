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
          <a
            href={`/faq#law-${country.code.toLowerCase()}`}
            target="_blank"
            rel="noreferrer"
            className="font-semibold underline underline-offset-2"
          >
            Read it in the FAQ
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </p>
      </Callout>
      {housing.note && <Callout tone="neutral">{housing.note}</Callout>}
    </div>
  );
}
