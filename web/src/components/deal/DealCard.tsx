import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { StatusChip } from "@/components/ui/StatusChip";
import { countdownLine, nextActionText, type DealSummary } from "@/lib/dashboard";
import { formatEur } from "@/lib/format";
import { STATUS_LABEL } from "@/lib/rules";

/** One deal on My deals. The whole card is one link. */
export function DealCard({ deal, now }: { deal: DealSummary; now: number }) {
  const roleLine = deal.role === "landlord" ? "You're letting" : "You're renting";
  const amount = formatEur(deal.amount);
  const next = nextActionText(deal, now);
  const countdownId = `deal-${deal.address}-countdown`;
  return (
    <Link
      href={`/deal/${deal.address}`}
      // A short, steady link name that starts with the room. Read as one name, the whole card would begin with the
      // role and change every second in the last hour (the countdown), so the countdown is the description instead.
      aria-label={`${deal.title}, ${amount}, ${STATUS_LABEL[deal.status]}. ${roleLine}. ${next}`}
      aria-describedby={countdownId}
      className="group block rounded-lg border-[1.5px] border-rule bg-canvas p-4 transition-colors duration-150 hover:border-fg"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="label text-fg-muted">{roleLine}</p>
          <p className="mt-1.5 truncate font-display text-card font-bold">{deal.title}</p>
        </div>
        <p className="shrink-0 font-display text-card font-bold tabular-nums">{amount}</p>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <StatusChip status={deal.status} size="sm" />
        <span id={countdownId} className="text-sm text-fg-muted tabular-nums">
          {countdownLine(deal, now)}
        </span>
      </div>
      <p className="mt-3 flex items-center justify-between gap-2 border-t border-rule pt-3 font-semibold">
        {next}
        <Icon name="arrow-right" size={18} className="shrink-0 transition-transform duration-150 group-hover:translate-x-0.5" />
      </p>
    </Link>
  );
}
