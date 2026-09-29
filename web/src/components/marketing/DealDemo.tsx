"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import {
  canSkipToDeadline,
  DEADLINE_STEP,
  DEMO_DEAL,
  DEMO_STEPS,
  nextStep,
  PHONE,
  stepLabel,
  type LandingRole,
  type MoneyAt,
} from "@/content/landing";
import { cx } from "@/lib/cx";
import { statusLabel } from "@/lib/deal-view";
import type { DealStatus } from "@/lib/rules";
import { PRODUCTION_URL } from "@/lib/site";

// Only the landlord's handover step shows a code, so the QR library loads when that step is reached, not with the page.
const QRCodeSVG = dynamic(() => import("qrcode.react").then((m) => m.QRCodeSVG), { ssr: false });

// The deal page's status band colours (DealHero, design system §6).
const BAND: Record<DealStatus, string> = {
  open: "bg-subtle text-fg",
  funded: "bg-inverse text-fg-inverse",
  released: "bg-released text-white",
  refunded: "bg-returned text-white",
  cancelled: "bg-subtle text-fg",
};

// The money tag rides a layer as wide as the track, moved by transform only; the ink fill behind it scales to match.
const TAG_AT: Record<MoneyAt, string> = { tenant: "translate-x-0", lock: "translate-x-1/2", landlord: "translate-x-full" };
const FILL_AT: Record<MoneyAt, string> = { tenant: "scale-x-0", lock: "scale-x-50", landlord: "scale-x-100" };
const PLACES: Array<{ at: MoneyAt; label: string }> = [
  { at: "tenant", label: "Tenant" },
  { at: "lock", label: "In the lock" },
  { at: "landlord", label: "Landlord" },
];

/**
 * A scripted €600.00 deal, pure client state: no wallet, no network. Both phones from `sm` (the viewer's in front),
 * only the viewer's phone below it. Under reduced motion every change is instant (globals.css).
 *
 * Sizing: the phones take the window height the rest of the demo leaves (--ph-h), so the whole demo fits on one
 * screen under the header, on a phone and on a laptop. They keep a phone's 276 × 540 proportions (--ph-w) at any
 * height, and their text scales with their width (cqi; 276 px = the design's sizes) down to readable minimums.
 */
export function DealDemo({ role }: { role: LandingRole }) {
  const [step, setStep] = useState(0);
  const current = DEMO_STEPS[step];
  const next = () => setStep(nextStep(step));

  return (
    <div className="-mx-1 flex flex-col gap-3 rounded-xl bg-subtle px-3 pt-3.5 pb-3 [--ph-h:clamp(18rem,calc(100svh-22rem),31.25rem)] [--ph-w:calc(var(--ph-h)*0.511)] sm:mx-0 sm:w-[max(30rem,calc(var(--ph-w)*2.1+2rem))] sm:gap-3 sm:rounded-[1.5rem] sm:p-4 sm:[--ph-h:clamp(18rem,min(100svh-22.5rem,(100vw-5rem)*0.93),33.75rem)]">
      <p className="label self-start rounded-sm bg-accent px-2 py-1.5">Try how it works</p>

      {/* Phones: one phone wide below sm; from sm wide enough for both, the one behind peeking out */}
      <div className="relative mx-auto h-(--ph-h) w-(--ph-w) sm:w-[calc(var(--ph-w)*2.1)]">
        <Phone side="tenant" viewer={role} step={step} onNext={next} />
        <Phone side="landlord" viewer={role} step={step} onNext={next} />
      </div>

      {/* overflow-hidden: the money layer slides past the track (its tag stays inside) */}
      <div className="flex flex-col gap-2.5 overflow-hidden rounded-lg border-2 border-fg bg-canvas p-3.5">
        <div aria-hidden className="relative h-12">
          <div className="absolute inset-x-8.5 top-0 h-7.5">
            <div className="absolute inset-x-0 top-3.5 h-0.5 bg-rule" />
            {/* The stretch the money has travelled, drawn in ink behind the tag */}
            <div className={cx("absolute inset-x-0 top-3.5 h-0.5 origin-left bg-fg transition-transform duration-700 ease-settle", FILL_AT[current.money])} />
            <div className={cx("absolute inset-0 transition-transform duration-700 ease-settle", TAG_AT[current.money])}>
              <span className="absolute top-0 left-0 -translate-x-1/2 rounded-sm border-2 border-fg bg-accent px-2 py-0.5 font-display text-[0.9375rem] font-bold whitespace-nowrap tabular-nums">
                {DEMO_DEAL.amount}
              </span>
            </div>
          </div>
          <div className="label absolute inset-x-0 bottom-0 flex justify-between">
            {PLACES.map((place) => (
              <span key={place.at} className={cx("transition-colors duration-300", place.at === current.money ? "text-fg" : "text-fg-muted")}>
                {place.label}
              </span>
            ))}
          </div>
        </div>
        <p aria-live="polite" className="border-t border-rule pt-2.5 text-[0.9375rem] leading-snug">
          <span key={step} className="demo-in inline-block">
            <span className="font-semibold">{stepLabel(step)}</span> {current.caption}
          </span>
        </p>
        <div className="flex gap-2">
          {canSkipToDeadline(step) && (
            <Button variant="secondary" onClick={() => setStep(DEADLINE_STEP)} className="demo-pop px-3.5 whitespace-nowrap">
              No handover?
            </Button>
          )}
          <Button onClick={next} className="flex-1 px-3.5 whitespace-nowrap">
            <span key={current.next} className="demo-in">
              {current.next}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * One side's phone. The other side's phone sits behind, smaller and faded, and can't be focused or clicked.
 * Below `sm` its button is hidden to save height: the controls' Next does the same.
 */
function Phone({ side, viewer, step, onNext }: { side: LandingRole; viewer: LandingRole; step: number; onNext: () => void }) {
  const front = side === viewer;
  const screen = PHONE[side][step];
  const status = DEMO_STEPS[step].status;
  return (
    <div
      inert={!front}
      className={cx(
        "@container flex h-full w-(--ph-w) flex-col overflow-hidden rounded-[calc(var(--ph-w)*0.14)] border-[length:max(4px,calc(var(--ph-w)*0.022))] border-fg bg-canvas shadow-pop sm:absolute sm:top-0",
        "[transition:translate_450ms_var(--ease-settle),scale_450ms_var(--ease-settle),opacity_350ms_var(--ease-out)]",
        side === "tenant" ? "origin-left sm:left-0" : "origin-right sm:right-0",
        front ? "z-2" : cx("z-1 scale-90 opacity-55 max-sm:hidden", side === "tenant" ? "translate-x-[14.5%]" : "-translate-x-[14.5%]"),
      )}
    >
      <div className="flex h-[max(1.75rem,16cqi)] shrink-0 items-center justify-between border-b border-rule px-[max(0.625rem,5.8cqi)] text-[length:max(0.625rem,4.4cqi)] font-semibold">
        <span>{side === "tenant" ? "Tenant's phone" : "Landlord's phone"}</span>
        {front && <span className="rounded-[0.25rem] bg-accent px-1.5 py-0.5">You</span>}
      </div>
      <div className={cx("shrink-0 px-[max(0.625rem,5.8cqi)] py-[max(0.5rem,6cqi)] transition-colors duration-350", BAND[status])}>
        <p className="label text-[length:max(0.5625rem,4.4cqi)] opacity-80">{DEMO_DEAL.title}</p>
        <p className="my-[max(0.25rem,3cqi)] font-display text-[length:max(1.625rem,16cqi)] leading-none font-bold tabular-nums">{DEMO_DEAL.amount}</p>
        {/* The chip flips like a departure board when the status changes (the band recolours underneath) */}
        <span className="inline-block [perspective:400px]">
          <span
            key={status}
            className="inline-flex animate-flip rounded-sm border-[1.5px] border-current px-[max(0.375rem,2.9cqi)] py-[max(0.125rem,1.5cqi)] text-[length:max(0.6875rem,4.7cqi)] font-semibold"
          >
            {statusLabel(status, side)}
          </span>
        </span>
      </div>
      {/* Keyed by step: each step's screen rises in line by line */}
      <div key={step} className="demo-stagger flex min-h-0 flex-1 flex-col gap-[max(0.375rem,4cqi)] px-[max(0.625rem,5.8cqi)] py-[max(0.5rem,5.8cqi)]">
        <p className="text-[length:max(0.75rem,5.4cqi)] leading-[1.42]">{screen.body}</p>
        {screen.qr && (
          <div className="grid size-[max(3.75rem,47cqi)] shrink-0 place-items-center self-center rounded-md border-2 border-fg">
            <QRCodeSVG value={`${PRODUCTION_URL}/how-it-works`} size={100} marginSize={0} aria-hidden className="size-[77%]" />
          </div>
        )}
        {screen.meta && (
          <p className="inline-flex items-center gap-1 text-[length:max(0.6875rem,4.7cqi)] text-fg-subtle">
            {screen.meta}
            {screen.explorer && <Icon name="external" size={13} />}
          </p>
        )}
        {screen.button && (
          <Button
            onClick={onNext}
            aria-label={`Demo: ${screen.button}`}
            fullWidth
            className="mt-auto min-h-11 px-2 text-[length:max(0.75rem,5.8cqi)] whitespace-nowrap max-sm:hidden"
          >
            {screen.button}
          </Button>
        )}
      </div>
    </div>
  );
}
