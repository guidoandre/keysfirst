"use client";

import { BackToDeals } from "./BackToDeals";
import { Callout } from "@/components/ui/Callout";
import { countdownFor, dealPhase, dealRows, nextStep, type DealData } from "@/lib/deal-view";
import { formatEur } from "@/lib/format";
import type { Action, Role } from "@/lib/rules";
import { CountdownPanel } from "./CountdownPanel";
import { DealDetails } from "./DealDetails";
import { DealHero } from "./DealHero";
import { DealTimetable } from "./DealTimetable";
import { NextStep, type CardOffer } from "./NextStep";
import { ShareLink } from "./ShareLink";

export interface DealViewProps {
  id: string;
  origin: string;
  data: DealData;
  role: Role;
  now: number;
  connected: boolean;
  created: boolean;
  signatures: string[];
  statusChanged: boolean;
  busy: Action | null;
  error: string | null;
  signature: string | null;
  onAction: (action: Action) => void;
  card?: CardOffer | null;
  cardBusy?: boolean;
  onPayByCard?: () => void;
  /** The tenant came from the handover page: releasing is the main button. */
  atDoor?: boolean;
  /** The last status check failed: what's on screen may be a few seconds old. */
  offline?: boolean;
}

/** The deal page's layout, from plain data (the dev gallery renders it with sample deals). */
export function DealView(p: DealViewProps) {
  const { data, role, now } = p;
  const times = { moveIn: data.moveIn, deadline: data.deadline };
  const amount = formatEur(data.amount);
  const phase = dealPhase(data.status, times, now);
  const view = nextStep({ status: data.status, role, times, now, amount, settledAt: data.settledAt, atDoor: p.atDoor });
  const rows = dealRows({
    status: data.status,
    role,
    times: { ...times, createdAt: data.createdAt, fundedAt: data.fundedAt, settledAt: data.settledAt },
    signatures: p.signatures,
    now,
    amount,
  });

  return (
    <div className="enter-stack mx-auto max-w-app space-y-5 px-4 py-6 sm:py-10">
      {p.connected && <BackToDeals />}
      {p.created && role === "landlord" && data.status === "open" && (
        <Callout tone="success" role="status" title="Your deposit link is ready">
          Send it to your tenant. This page shows it as soon as they pay.
        </Callout>
      )}
      {p.offline && (
        <Callout tone="neutral" role="status" title="Reconnecting…">
          We can&apos;t reach the network right now, so this page may be a few seconds behind. It updates by itself.
        </Callout>
      )}
      <DealHero title={data.title} amount={amount} status={data.status} role={role} animate={p.statusChanged} />
      <CountdownPanel info={countdownFor(phase, times)} now={now} />
      <NextStep
        view={view}
        role={role}
        amount={amount}
        connected={p.connected}
        settled={data.status !== "open" && data.status !== "funded"}
        paid={data.status === "funded"}
        busy={p.busy}
        error={p.error}
        signature={p.signature}
        onAction={p.onAction}
        card={p.card}
        cardBusy={p.cardBusy}
        onPayByCard={p.onPayByCard}
        // Spec §6.4: while the deal is open and before the deadline (also before payment opens, 180 days ahead).
        // Sending the link is the landlord's next step, so it sits in that box, above "Cancel this deal".
        share={
          role === "landlord" && (phase === "open" || phase === "open-too-early") ? (
            <ShareLink
              url={`${p.origin}/deal/${p.id}`}
              text={`Pay the ${amount} deposit for "${data.title}" safely with Keysfirst:`}
              subject={`Deposit link for "${data.title}"`}
            />
          ) : null
        }
      />
      <DealTimetable rows={rows} title={data.title} />
      <DealDetails
        id={p.id}
        times={times}
        // The landlord from the start; the tenant once they have paid (before that, a visitor may never pay).
        calendarFor={
          now > data.deadline
            ? null
            : role === "landlord" && (data.status === "open" || data.status === "funded")
            ? "landlord"
            : role === "tenant" && data.status === "funded"
              ? "tenant"
              : null
        }
      />
    </div>
  );
}
