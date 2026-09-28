import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { StatusChip } from "@/components/ui/StatusChip";
import { countdownLine, nextActionText, type DealSummary } from "@/lib/dashboard";
import { formatEur } from "@/lib/format";

/** One deal on My deals. The whole card is one link. */
export function DealCard({ deal, now }: { deal: DealSummary; now: number }) {
  return (
    <Link
      href={`/deal/${deal.address}`}
      className="group block rounded-lg border-[1.5px] border-rule bg-canvas p-4 transition-colors duration-150 hover:border-fg"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="label text-fg-muted">{deal.role === "landlord" ? "You're letting" : "You're renting"}</p>
          <p className="mt-1.5 truncate font-display text-card font-bold">{deal.title}</p>
        </div>
        <p className="shrink-0 font-display text-card font-bold tabular-nums">{formatEur(deal.amount)}</p>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <StatusChip status={deal.status} size="sm" />
        <span className="text-sm text-fg-muted tabular-nums">{countdownLine(deal, now)}</span>
      </div>
      <p className="mt-3 flex items-center justify-between gap-2 border-t border-rule pt-3 font-semibold">
        {nextActionText(deal, now)}
        <Icon name="arrow-right" size={18} className="shrink-0 transition-transform duration-150 group-hover:translate-x-0.5" />
      </p>
    </Link>
  );
}
