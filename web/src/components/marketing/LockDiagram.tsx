import type { ReactNode } from "react";
import { Icon, PlayIcon } from "@/components/ui/Icon";
import { StatusChip } from "@/components/ui/StatusChip";
import { DEMO_DEAL } from "@/content/landing";
import { cx } from "@/lib/cx";

/**
 * Tenant → the lock → exactly two ways out. One row from xl; stacked with down arrows below it.
 * Pointer reactions (globals.css, PlayOnPointer): the lock arrives open and clicks shut, and jumps and locks again when
 * the pointer settles on it; resting on the tenant or a real way out leans that arrow toward where the money goes
 * (data-lean); "To Keysfirst" shakes its head.
 */
export function LockDiagram() {
  return (
    <div data-reveal="" data-flow="" className="mt-8 flex flex-col lg:mt-12 xl:grid xl:grid-cols-[15rem_3.5rem_18.75rem_3.5rem_minmax(0,1fr)] xl:items-center">
      <div data-lean="in" className="rounded-lg border-2 border-fg px-4.5 py-4 xl:px-5 xl:py-5.5">
        <p className="label text-fg-muted">Tenant</p>
        <p className="mt-1.5 font-display text-2xl leading-[1.1] font-bold xl:mt-2.5 xl:text-[1.625rem]">Pays {DEMO_DEAL.amount} into the lock</p>
        <p className="mt-1 text-[0.9375rem] text-fg-muted xl:mt-2">By card, before arriving.</p>
      </div>
      <Arrow into />
      <div
        data-play=""
        className="lock-shuts grid grid-cols-[3rem_1fr] items-start gap-3.5 rounded-[1rem] bg-inverse px-4.5 py-5 text-fg-inverse xl:flex xl:flex-col xl:rounded-xl xl:px-7 xl:py-8"
      >
        {/* Two layers: the pop when the block arrives and the jump on hover each own an element, so neither restarts the other */}
        <div className="reveal-pop w-fit">
          <div className="play-hop grid size-12 place-items-center rounded-md bg-accent text-fg xl:size-14 xl:rounded-[0.75rem]">
            <PlayIcon name="lock" strokeWidth={2.2} className="size-6.5 xl:size-7.5" />
          </div>
        </div>
        <div>
          <p className="font-display text-[1.75rem] leading-none font-bold xl:text-[1.875rem]">The lock</p>
          <p className="mt-1.5 text-[0.9375rem] leading-[1.45] text-fg-inverse-muted xl:mt-3.5 xl:text-base">
            A program on Solana holds this deal&apos;s {DEMO_DEAL.amount}. Anyone can read its rules and every step it takes.
          </p>
        </div>
      </div>
      <Arrow />
      <ul className="flex flex-col gap-2.5 xl:gap-3">
        <Exit chip={<StatusChip status="released" size="sm" />}>
          <strong>Only</strong> when the tenant approves at the handover, from 24 hours before move-in until the deadline.
        </Exit>
        <Exit chip={<StatusChip status="refunded" size="sm" />}>The landlord can give it back at any time. After the deadline, anyone can.</Exit>
        <Exit
          muted
          chip={
            <s className="play-shake inline-flex rounded-sm border-[1.5px] border-field px-2 py-1 font-display text-[0.8125rem] font-semibold">
              <span className="sr-only">Not possible: </span>To Keysfirst
            </s>
          }
        >
          There is no third way out. Not to us, not to anyone else.
        </Exit>
      </ul>
    </div>
  );
}

/** `into`: the arrow into the lock; otherwise the one out of it. A hover nudge moves along the arrow's own axis (down when stacked). */
function Arrow({ into = false }: { into?: boolean }) {
  return (
    <div aria-hidden className={cx("flow-arrow grid h-9 place-items-center xl:h-auto", into ? "flow-arrow-in" : "flow-arrow-out")}>
      <Icon name="arrow-right" size={24} className="rotate-90 xl:size-8 xl:rotate-0" />
    </div>
  );
}

function Exit({ chip, muted = false, children }: { chip: ReactNode; muted?: boolean; children: ReactNode }) {
  return (
    <li
      data-play=""
      data-lean={muted ? undefined : "out"}
      className={
        muted
          ? "flex flex-col items-start gap-1.5 rounded-lg border-2 border-dashed border-field px-4 py-3 text-fg-muted xl:grid xl:grid-cols-[auto_1fr] xl:items-center xl:gap-4 xl:px-5 xl:py-3.5"
          : "flex flex-col items-start gap-2 rounded-lg border-2 border-fg px-4 py-3.5 xl:grid xl:grid-cols-[auto_1fr] xl:items-center xl:gap-4 xl:px-5 xl:py-4.5"
      }
    >
      {chip}
      <span className="text-[0.9375rem] leading-snug xl:text-base">{children}</span>
    </li>
  );
}
