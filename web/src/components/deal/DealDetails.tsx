import { HIT_AREA } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { cx } from "@/lib/cx";
import { explorerAddress, formatShortDateTime, shortAddress } from "@/lib/format";
import { handoverOpensAt, type DealTimes } from "@/lib/rules";

export function DealDetails({ id, times }: { id: string; times: DealTimes }) {
  const rows: Array<[string, string]> = [
    ["Move-in", formatShortDateTime(times.moveIn)],
    ["Handover opens", formatShortDateTime(handoverOpensAt(times))],
    ["Handover deadline", formatShortDateTime(times.deadline)],
  ];
  return (
    <section aria-labelledby="details-title" className="rounded-lg border-[1.5px] border-rule p-5">
      <h2 id="details-title" className="label text-fg-muted">
        Details
      </h2>
      <dl className="mt-3 divide-y divide-rule text-sm">
        {rows.map(([term, value]) => (
          <div key={term} className="flex justify-between gap-4 py-2.5">
            <dt className="text-fg-muted">{term}</dt>
            <dd className="text-right font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
        <div className="flex justify-between gap-4 py-2.5">
          <dt className="text-fg-muted">This deal on Solana</dt>
          <dd>
            <a
              href={explorerAddress(id)}
              target="_blank"
              rel="noreferrer"
              className={cx("inline-flex items-center gap-1 font-semibold underline underline-offset-2", HIT_AREA)}
            >
              {shortAddress(id)}
              <Icon name="external" size={13} />
              <span className="sr-only"> (opens Solana Explorer in a new tab)</span>
            </a>
          </dd>
        </div>
      </dl>
    </section>
  );
}
