import { HIT_AREA } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { cx } from "@/lib/cx";
import { explorerAddress, formatShortDateTime, shortAddress } from "@/lib/format";
import type { CalendarDeal, CalendarRole } from "@/lib/calendar";
import { handoverOpensAt, type DealTimes } from "@/lib/rules";
import { AddToCalendar } from "./AddToCalendar";

/** "Europe/Rome" -> "Rome"; the zone every time on the page is shown in (the viewer's device). */
function deviceZone(): string | null {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return zone ? zone.split("/").pop()!.replaceAll("_", " ") : null;
  } catch {
    return null;
  }
}

/**
 * `calendar`: the landlord or tenant of a deal that isn't settled yet can add the handover and the deadline to their
 * calendar. Keysfirst sends no emails, so this is the only reminder they get.
 */
export function DealDetails({
  id,
  times,
  calendar = null,
}: {
  id: string;
  times: DealTimes;
  calendar?: { deal: CalendarDeal; role: CalendarRole; url: string } | null;
}) {
  const zone = deviceZone();
  const rows: Array<[string, string]> = [
    ["Move-in", formatShortDateTime(times.moveIn)],
    ["Handover opens", formatShortDateTime(handoverOpensAt(times))],
    ["Handover deadline", formatShortDateTime(times.deadline)],
    ...(zone ? ([["Times shown in", `${zone} time (this device)`]] as Array<[string, string]>) : []),
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
          <dt className="text-fg-muted">Public record</dt>
          <dd>
            <a
              href={explorerAddress(id)}
              target="_blank"
              rel="noreferrer"
              className={cx("inline-flex items-center gap-1 font-semibold underline underline-offset-2", HIT_AREA)}
            >
              {shortAddress(id)}
              <Icon name="external" size={13} />
              <span className="sr-only"> of this deal on Solana Explorer (opens in a new tab)</span>
            </a>
          </dd>
        </div>
      </dl>
      {calendar && <AddToCalendar {...calendar} />}
    </section>
  );
}
