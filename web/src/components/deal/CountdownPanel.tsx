import { Icon } from "@/components/ui/Icon";
import type { CountdownInfo } from "@/lib/deal-view";
import { formatCountdown, formatShortDateTime } from "@/lib/format";

/** Counts down to the next moment that matters. Not a live region: it would announce every second. */
export function CountdownPanel({ info, now }: { info: CountdownInfo | null; now: number }) {
  if (!info) return null;
  const left = info.at - now;
  const future = left > 0;
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border-2 border-fg px-4 py-3">
      <div className="flex items-center gap-3">
        <Icon name="clock" size={22} className="shrink-0" />
        <div>
          <p className="text-sm text-fg-muted">{info.label}</p>
          <p className="font-display text-[1.5rem] leading-tight font-bold tabular-nums">
            {future ? formatCountdown(left) : formatShortDateTime(info.at)}
          </p>
        </div>
      </div>
      {future && <p className="text-right text-sm text-fg-muted tabular-nums">{formatShortDateTime(info.at)}</p>}
    </div>
  );
}
