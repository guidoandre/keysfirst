"use client";

import { HIT_AREA } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Sheet } from "@/components/ui/Sheet";
import { cx } from "@/lib/cx";
import { explorerTx, formatShortDateTime } from "@/lib/format";
import { useWakeLock } from "@/lib/hooks";

/** "Released: hand over the keys." Enters once (animate-released), then stays still. */
export function ReleasedScreen({
  open,
  onClose,
  title,
  amount,
  settledAt,
  receipt,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  amount: string;
  settledAt: number;
  receipt?: string;
}) {
  useWakeLock(open);
  return (
    <Sheet open={open} onClose={onClose} title="Released: hand over the keys" variant="full" className="bg-released">
      <div className="flex min-h-dvh animate-released flex-col justify-between bg-released px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] text-white">
        <div role="status" className="mx-auto w-full max-w-app">
          <p className="label">
            {title}
            {settledAt ? ` · ${formatShortDateTime(settledAt)}` : ""}
          </p>
          <p className="mt-8 font-display text-[clamp(3rem,13vw,4.75rem)] leading-[0.92] font-bold">
            Released:
            <br />
            hand over the keys.
          </p>
          <p className="mt-8 font-display text-amount font-bold tabular-nums">{amount}</p>
          <p className="text-lg">is in your wallet now.</p>
        </div>
        <div className="mx-auto w-full max-w-app space-y-4">
          {receipt && (
            <a
              href={explorerTx(receipt)}
              target="_blank"
              rel="noreferrer"
              className={cx("inline-flex items-center gap-1.5 font-semibold underline underline-offset-2", HIT_AREA)}
            >
              View the receipt on Solana Explorer
              <Icon name="external" size={16} />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          )}
          <button
            type="button"
            onClick={onClose}
            className="min-h-(--btn-h) w-full rounded-md border-2 border-white px-5 font-semibold hover:bg-white/10"
          >
            Back to the deal
          </button>
        </div>
      </div>
    </Sheet>
  );
}
