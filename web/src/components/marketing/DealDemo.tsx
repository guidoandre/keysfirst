"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Button, buttonClass } from "@/components/ui/Button";
import {
  canSkipToDeadline,
  DEADLINE_STEP,
  DEMO_DEAL,
  DEMO_STEPS,
  nextDemoStep,
  PHONE,
  stepLabel,
  type LandingRole,
  type MoneyAt,
} from "@/content/landing";
import { cx } from "@/lib/cx";
import { statusLabel } from "@/lib/deal-view";
import type { DealStatus } from "@/lib/rules";
import { PRODUCTION_URL } from "@/lib/site";

// Only the landlord's handover step shows a code, so the QR library isn't part of the page's own code. It loads once the
// browser is idle (or as soon as the demo moves) and stays rendered out of sight, so reaching that step costs nothing.
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
 *
 * Motion per step, all transform and opacity (design system §8): the new status band fades in over the old one and its
 * chip flips in; the phone screens rise in line by line; the money tag glides. Nothing changes size: the "no handover"
 * link has a row of its own that is always there, so the Next button never moves.
 */
export function DealDemo({ role }: { role: LandingRole }) {
  // `from`: the status before the current one, kept until the status changes again, so its band stays under the new one
  // while that fades in (also when Next is pressed again mid-fade).
  const [{ step, from }, setDemo] = useState<{ step: number; from: DealStatus }>({ step: 0, from: "open" });
  const go = (to: number) =>
    setDemo((demo) => {
      const was = DEMO_STEPS[demo.step].status;
      return { step: to, from: DEMO_STEPS[to].status === was ? demo.from : was };
    });
  const next = () => go(nextDemoStep(step));
  const current = DEMO_STEPS[step];
  const skippable = canSkipToDeadline(step);

  const [qrIdle, setQrIdle] = useState(false);
  useEffect(() => {
    if ("requestIdleCallback" in window) {
      const id = requestIdleCallback(() => setQrIdle(true), { timeout: 4000 });
      return () => cancelIdleCallback(id);
    }
    const id = setTimeout(() => setQrIdle(true), 2000);
    return () => clearTimeout(id);
  }, []);
  const qr = qrIdle || step > 0;

  return (
    <div className="-mx-1 flex flex-col gap-3 rounded-xl bg-subtle px-3 pt-3.5 pb-3 [--ph-h:clamp(18rem,calc(100svh-24rem),31.25rem)] [--ph-w:calc(var(--ph-h)*0.511)] sm:mx-0 sm:w-[max(30rem,calc(var(--ph-w)*2.1+2rem))] sm:gap-3 sm:rounded-[1.5rem] sm:p-4 sm:[--ph-h:clamp(18rem,min(100svh-24.5rem,(100vw-5rem)*0.93),33.75rem)]">
      <p className="label self-start rounded-sm bg-accent px-2 py-1.5">Try how it works</p>

      {/* Phones: one phone wide below sm; from sm wide enough for both, the one behind peeking out */}
      <div className="relative mx-auto h-(--ph-h) w-(--ph-w) sm:w-[calc(var(--ph-w)*2.1)]">
        <Phone side="tenant" viewer={role} step={step} from={from} qr={false} onNext={next} />
        <Phone side="landlord" viewer={role} step={step} from={from} qr={qr} onNext={next} />
      </div>

      {/* overflow-hidden: the money layer slides past the track (its tag stays inside) */}
      <div className="flex flex-col gap-2.5 overflow-hidden rounded-lg border-2 border-fg bg-canvas p-3.5">
        <div aria-hidden className="relative h-12">
          <div className="absolute inset-x-8.5 top-0 h-7.5">
            <div className="absolute inset-x-0 top-3.5 h-0.5 bg-rule" />
            {/* The stretch the money has travelled, drawn in ink behind the tag */}
            <div className={cx("demo-glide absolute inset-x-0 top-3.5 h-0.5 origin-left bg-fg", FILL_AT[current.money])} />
            <div className={cx("demo-glide absolute inset-0", TAG_AT[current.money])}>
              <span className="absolute top-0 left-0 -translate-x-1/2 rounded-sm border-2 border-fg bg-accent px-2 py-0.5 font-display text-[0.9375rem] font-bold whitespace-nowrap tabular-nums">
                {DEMO_DEAL.amount}
              </span>
            </div>
          </div>
          {/* The place the money is at is ink, the others muted: by opacity, so nothing is repainted while it changes */}
          <div className="label absolute inset-x-0 bottom-0 flex justify-between text-fg">
            {PLACES.map((place) => (
              <span key={place.at} className={cx("transition-opacity duration-300", place.at !== current.money && "opacity-60")}>
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
        <div className="flex flex-col gap-1">
          <Button onClick={next} fullWidth className="px-3.5 whitespace-nowrap">
            <span key={current.next} className="demo-in">
              {current.next}
            </span>
          </Button>
          {/* The branch while the money is in the lock. Its row is always there, so nothing below or beside it moves */}
          <div className="flex h-9 items-center justify-center">
            <button
              type="button"
              inert={!skippable}
              onClick={() => go(DEADLINE_STEP)}
              className={cx(buttonClass({ variant: "quiet" }), "demo-skip text-[0.9375rem]", !skippable && "translate-y-1 opacity-0")}
            >
              What if there&apos;s no handover?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * One side's phone. From `sm` the other side's phone sits behind, smaller and faded; below it the two share one spot and
 * crossfade, sliding a little toward their side of the toggle. The phone behind can't be focused or clicked, and below
 * `sm`, where it can't be seen, it skips its animations (globals.css).
 * Below `sm` its button is hidden to save height: the controls' Next does the same.
 * Motion: .demo-phone in globals.css (own compositor layer from the start, so a swap never stalls on its first frame).
 */
function Phone({
  side,
  viewer,
  step,
  from,
  qr,
  onNext,
}: {
  side: LandingRole;
  viewer: LandingRole;
  step: number;
  from: DealStatus;
  qr: boolean;
  onNext: () => void;
}) {
  const front = side === viewer;
  const screen = PHONE[side][step];
  const status = DEMO_STEPS[step].status;
  const pad = "px-[max(0.625rem,5.8cqi)]";
  return (
    <div
      inert={!front}
      className={cx(
        "demo-phone @container absolute top-0 left-0 flex h-full w-(--ph-w) flex-col overflow-hidden rounded-[calc(var(--ph-w)*0.14)] border-[length:max(4px,calc(var(--ph-w)*0.022))] border-fg bg-canvas shadow-pop",
        side === "tenant" ? "sm:origin-left" : "sm:right-0 sm:left-auto sm:origin-right",
        front
          ? "z-2"
          : cx(
              "z-1 max-sm:scale-96 max-sm:opacity-0 sm:scale-90 sm:opacity-55",
              side === "tenant" ? "max-sm:-translate-x-[6%] sm:translate-x-[14.5%]" : "max-sm:translate-x-[6%] sm:-translate-x-[14.5%]",
            ),
      )}
    >
      <div className={cx("flex h-[max(1.75rem,16cqi)] shrink-0 items-center justify-between border-b border-rule text-[length:max(0.625rem,4.4cqi)] font-semibold", pad)}>
        <span>{side === "tenant" ? "Tenant's phone" : "Landlord's phone"}</span>
        <span className={cx("demo-you rounded-[0.25rem] bg-accent px-1.5 py-0.5", !front && "scale-75 opacity-0")}>You</span>
      </div>
      {/* The previous status's band stays underneath while the new one fades in over it (keyed: it mounts once per
          status, so stepping within the same status changes nothing) */}
      <div className="relative shrink-0">
        <Band status={from === status ? status : from} side={side} hidden={from !== status} />
        {from !== status && <Band key={status} status={status} side={side} className="demo-band-in absolute inset-0" />}
      </div>
      <div className={cx("flex min-h-0 flex-1 flex-col gap-[max(0.375rem,4cqi)] py-[max(0.5rem,5.8cqi)]", pad)}>
        {/* Keyed by step: each step's screen rises in line by line. The code sits between the two groups and is never
            re-rendered: it's shown at its step and stays mounted, out of sight, the rest of the time. */}
        <div key={`text-${step}`} className="demo-stagger contents">
          <p className="text-[length:max(0.75rem,5.4cqi)] leading-[1.42]">{screen.body}</p>
        </div>
        {qr && (
          <div className={cx("demo-qr size-[max(3.75rem,47cqi)] shrink-0 place-items-center self-center rounded-md border-2 border-fg", screen.qr ? "grid" : "hidden")}>
            <QRCodeSVG value={`${PRODUCTION_URL}/how-it-works`} size={100} marginSize={0} aria-hidden className="size-[77%]" />
          </div>
        )}
        <div key={`rest-${step}`} className="demo-stagger demo-stagger-late contents">
          {screen.meta && <p className="inline-flex items-center gap-1 text-[length:max(0.6875rem,4.7cqi)] text-fg-subtle">{screen.meta}</p>}
          {screen.button && (
            <Button
              onClick={onNext}
              aria-label={`Demo: ${screen.button}`}
              fullWidth
              className="mt-auto min-h-11 px-2 text-[length:max(0.75rem,5.8cqi)] text-balance max-sm:hidden"
            >
              {screen.button}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/** The deal page's status band: title, amount, and the status chip (which flips in when its band fades in). */
function Band({ status, side, hidden = false, className }: { status: DealStatus; side: LandingRole; hidden?: boolean; className?: string }) {
  return (
    <div aria-hidden={hidden || undefined} className={cx("px-[max(0.625rem,5.8cqi)] py-[max(0.5rem,6cqi)]", BAND[status], className)}>
      <p className="label text-[length:max(0.5625rem,4.4cqi)] opacity-80">{DEMO_DEAL.title}</p>
      <p className="my-[max(0.25rem,3cqi)] font-display text-[length:max(1.625rem,16cqi)] leading-none font-bold tabular-nums">{DEMO_DEAL.amount}</p>
      <span className="inline-block [perspective:400px]">
        <span className="demo-chip inline-flex rounded-sm border-[1.5px] border-current px-[max(0.375rem,2.9cqi)] py-[max(0.125rem,1.5cqi)] text-[length:max(0.6875rem,4.7cqi)] font-semibold">
          {statusLabel(status, side)}
        </span>
      </span>
    </div>
  );
}
