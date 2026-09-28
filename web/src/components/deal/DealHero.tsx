import { StatusChip } from "@/components/ui/StatusChip";
import { cx } from "@/lib/cx";
import { ROLE_LINE, statusLine } from "@/lib/deal-view";
import type { DealStatus, Role } from "@/lib/rules";

const BAND: Record<DealStatus, { band: string; sub: string }> = {
  open: { band: "bg-subtle text-fg", sub: "text-fg-muted" },
  funded: { band: "bg-inverse text-fg-inverse", sub: "text-fg-inverse-muted" },
  released: { band: "bg-released text-white", sub: "text-white" },
  refunded: { band: "bg-returned text-white", sub: "text-white" },
  cancelled: { band: "bg-subtle text-fg", sub: "text-fg-muted" },
};

/** Status band in the status colour (design system §6): room, amount, chip, one line. */
export function DealHero({ title, amount, status, role, animate }: { title: string; amount: string; status: DealStatus; role: Role; animate: boolean }) {
  const look = BAND[status];
  return (
    <section aria-labelledby="deal-title" className={cx("rounded-lg px-5 pt-5 pb-6", look.band)}>
      <p className={cx("label", look.sub)}>{ROLE_LINE[role]}</p>
      <h1 id="deal-title" className="mt-2 font-display text-card font-bold break-words">
        {title}
      </h1>
      <p className="mt-1 font-display text-amount font-bold tabular-nums">{amount}</p>
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        <StatusChip status={status} tone="onBand" animate={animate} />
        <p role="status" className={cx("text-sm", look.sub)}>
          {statusLine(status, role)}
        </p>
      </div>
    </section>
  );
}
