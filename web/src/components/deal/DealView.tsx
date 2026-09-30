"use client";

import { Callout } from "@/components/ui/Callout";
import { countdownFor, dealPhase, dealRows, nextStep, type DealData } from "@/lib/deal-view";
import { formatEur } from "@/lib/format";
import type { Action, Role } from "@/lib/rules";
import { CountdownPanel } from "./CountdownPanel";
import { DealDetails } from "./DealDetails";
import { DealHero } from "./DealHero";
import { DealTimetable } from "./DealTimetable";
import { NextStep, type CardOffer } from "./NextStep";
import { ShareBox } from "./ShareBox";

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
}

/** The deal page's layout, from plain data (the dev gallery renders it with sample deals). */
export function DealView(p: DealViewProps) {
  const { data, role, now } = p;
  const times = { moveIn: data.moveIn, deadline: data.deadline };
  const amount = formatEur(data.amount);
  const phase = dealPhase(data.status, times, now);
  const view = nextStep({ status: data.status, role, times, now, amount, settledAt: data.settledAt });
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
      {p.created && role === "landlord" && data.status === "open" && (
        <Callout tone="success" role="status" title="Your deposit link is ready">
          Send it to your tenant. This page shows it as soon as they pay.
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
      />
      {/* Spec §6.4: while the deal is open and before the deadline (also before payment opens, 180 days ahead). */}
      {role === "landlord" && (phase === "open" || phase === "open-too-early") && (
        <ShareBox url={`${p.origin}/deal/${p.id}`} text={`Pay the ${amount} deposit for "${data.title}" safely with Keysfirst:`} />
      )}
      <DealTimetable rows={rows} title={data.title} />
      <DealDetails id={p.id} times={times} />
    </div>
  );
}
