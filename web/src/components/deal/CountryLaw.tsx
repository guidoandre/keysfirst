import { Icon } from "@/components/ui/Icon";
import { LAW_CHECKED, type Country, type HousingOption } from "@/content/countries";

/**
 * "What the law says in {country}" for the landlord's last step: closed by default so the review stays about the deal
 * (native <details>: keyboard and screen-reader friendly, no JavaScript). General information, so it says so and links
 * to the FAQ entry.
 */
export function CountryLaw({ country, housing }: { country: Country; housing: HousingOption }) {
  return (
    <details className="disclosure group rounded-md border-[1.5px] border-field bg-canvas">
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 rounded-md px-4 py-3 hover:bg-subtle [&::-webkit-details-marker]:hidden">
        <Icon name="info" size={18} className="shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">What the law says in {country.name}</span>
          <span className="block text-sm text-fg-muted">Deposit limit, instalments and when it comes back</span>
        </span>
        <Icon name="chevron-down" size={20} className="shrink-0 transition-transform duration-150 group-open:rotate-180" />
      </summary>
      <div className="space-y-3 border-t border-rule px-4 pt-3 pb-4 text-sm leading-relaxed">
        <ul className="list-disc space-y-1.5 pl-4">
          {country.law.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        {housing.note && <p className="rounded-sm bg-subtle p-3">{housing.note}</p>}
        <p className="text-fg-muted">
          General information, not legal advice. Checked {LAW_CHECKED}.{" "}
          <a
            href={`/faq#law-${country.code.toLowerCase()}`}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-fg underline underline-offset-2"
          >
            Read it in the FAQ
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </p>
      </div>
    </details>
  );
}
