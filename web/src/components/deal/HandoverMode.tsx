"use client";

import { QRCodeSVG } from "qrcode.react";
import { LogoMark } from "@/components/brand/Logo";
import { Icon } from "@/components/ui/Icon";
import { Sheet } from "@/components/ui/Sheet";
import { formatCountdown } from "@/lib/format";
import { useWakeLock } from "@/lib/hooks";

const STEPS = [
  "Let your tenant check the room.",
  "They scan this code with their phone camera and confirm on their phone.",
  "Hand over the keys when this screen turns green.",
];

/**
 * The landlord's full-screen handover. The QR encodes a plain https page because the iPhone Camera cannot open
 * `solana:` codes (docs/spike.md); that page sends the tenant to the deal page (or to Phantom).
 */
export function HandoverMode({
  open,
  onClose,
  dealId,
  origin,
  title,
  amount,
  deadline,
  now,
  offline = false,
}: {
  open: boolean;
  onClose: () => void;
  dealId: string;
  origin: string;
  title: string;
  amount: string;
  deadline: number;
  now: number;
  /** The last status check failed: the green screen may be late. */
  offline?: boolean;
}) {
  useWakeLock(open);
  const url = `${origin}/deal/${dealId}/handover`;
  return (
    <Sheet open={open} onClose={onClose} title="Key handover" variant="full">
      <div className="flex min-h-dvh flex-col">
        <header className="flex items-center justify-between gap-3 bg-inverse px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 text-fg-inverse">
          <div className="flex min-w-0 items-center gap-3">
            <LogoMark size={32} />
            <div className="min-w-0">
              <p className="label text-fg-inverse-muted">Key handover</p>
              <p className="truncate font-display text-lg leading-tight font-bold">{title}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close the handover"
            className="grid size-11 shrink-0 place-items-center rounded-md hover:bg-white/10"
          >
            <Icon name="close" />
          </button>
        </header>
        <div className="mx-auto flex w-full max-w-app flex-1 flex-col items-center gap-5 px-4 py-6 text-center">
          <p className="font-display text-section font-bold tabular-nums">{amount}</p>
          <div className="rounded-lg border-2 border-fg bg-white p-3">
            <QRCodeSVG
              value={url}
              size={320}
              marginSize={2}
              title="Handover code for your tenant"
              style={{ width: "var(--qr-size)", height: "var(--qr-size)" }}
            />
          </div>
          <ol className="w-full max-w-sm space-y-2.5 text-left">
            {STEPS.map((step, i) => (
              <li key={step} className="flex gap-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-sm bg-accent font-display font-bold">{i + 1}</span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
          <p role="status" className="inline-flex items-center gap-2 font-semibold">
            <span aria-hidden="true" className="size-2.5 animate-pulse-dot rounded-full bg-accent ring-2 ring-fg" />
            {offline ? "Reconnecting… Keep the keys until this screen turns green." : "Waiting for your tenant to approve…"}
          </p>
          <p className="text-sm text-fg-muted tabular-nums">Handover deadline in {formatCountdown(deadline - now)}</p>
        </div>
      </div>
    </Sheet>
  );
}
