import type { Metadata } from "next";
import { CtaBand } from "@/components/marketing/CtaBand";
import { ScenarioGrid } from "@/components/marketing/ScenarioGrid";
import { SectionHeader } from "@/components/marketing/SectionHeader";
import { Icon } from "@/components/ui/Icon";
import { StatusChip } from "@/components/ui/StatusChip";
import { Timetable } from "@/components/ui/Timetable";
import { SCENARIOS } from "@/content/scenarios";
import idl from "@/idl/keysfirst.json";
import { explorerAddress } from "@/lib/format";

export const dynamic = "error";

export const metadata: Metadata = {
  title: "How it works and safety",
  description: "Two rules and a clock: only the tenant's scan at the handover pays the landlord, and only the deadline sends the deposit back. Plus the honest limits.",
};

// Product spec §6, in plain words. Keep in step with the program.
const RULES = [
  "Only the landlord can create a deal, and they can cancel it until someone pays.",
  "The tenant pays the exact amount into the lock, before the deadline. The landlord can't pay their own deal.",
  "Paying only works if the money would be locked for at most 180 days.",
  "Only the tenant who paid can release the deposit to the landlord, from 24 hours before move-in until the deadline.",
  "The landlord can give the deposit back to the tenant at any time.",
  "After the deadline, anyone can send the deposit back to the tenant.",
  "Every deal settles once. The money only ever goes to the tenant or the landlord, and the deal stays on Solana as a receipt.",
];

// Product spec §10, in plain words. Never soften these.
const LIMITS = [
  "Someone pressured into scanning from far away close to move-in can still be tricked. The 24-hour rule and clear wallet messages reduce this risk; they don't remove it.",
  "At the door the tenant scans first, so a landlord could take the money and keep the keys. That would be theft by a known person at a real address, far rarer than the anonymous online scam.",
  "A fake copy of this website isn't covered. A verified domain is on the roadmap.",
  "Keysfirst proves the room exists and the keys work, not that the person may legally rent it out. Landlord verification is on the roadmap.",
  "Disputes after move-in, such as damage, are ordinary tenancy law.",
  "A tenant who doesn't show up gets the deposit back; the landlord loses only the time the room was reserved.",
  "On devnet the program can still be updated by its deploy key. Before real money it would be frozen or controlled by several people.",
  "How the service would be regulated hasn't been assessed yet.",
];

export default function HowItWorksPage() {
  return (
    <>
      <section className="mx-auto max-w-page px-4 pt-10 pb-14 sm:px-6 lg:px-10 lg:pt-16">
        <p className="label text-fg-muted">How it works and safety</p>
        <h1 className="mt-3 max-w-3xl font-display text-title font-bold">
          Two rules and a <span className="marker">clock</span>.
        </h1>
        <p className="mt-5 max-w-2xl text-lead text-fg-muted">
          Keysfirst doesn&apos;t decide anything. A public program on Solana applies the same rules to every deal: only the tenant&apos;s approval at
          the handover pays the landlord, and only the clock sends the deposit back.
        </p>

        <div className="mt-10 grid gap-6 lg:grid-cols-[3fr_2fr] lg:items-start">
          <Timetable
            title="A deal, start to finish"
            rows={[
              { key: "create", time: "Step 1", title: "The landlord creates the deal", detail: "Room, amount, move-in and the latest handover, at most 14 days after move-in.", state: "done" },
              { key: "pay", time: "Step 2", title: "The tenant pays into the lock", detail: "The exact amount, before the deadline.", state: "done" },
              { key: "window", time: "24 h before move-in", title: "The handover window opens", detail: "From now until the deadline, the tenant can release the deposit.", state: "now" },
              { key: "door", time: "At the door", title: "The tenant scans the landlord's code", detail: "100% goes to the landlord, in seconds.", state: "next" },
              { key: "deadline", time: "After the deadline", title: "No handover?", detail: "100% goes back to the tenant. Anyone can trigger it.", state: "later" },
            ]}
          />
          <div className="grid gap-4">
            <div className="rounded-lg bg-released-soft p-5">
              <StatusChip status="released" />
              <p className="mt-3 text-body">When the tenant scans the landlord&apos;s code at the handover and approves in Phantom.</p>
            </div>
            <div className="rounded-lg bg-returned-soft p-5">
              <StatusChip status="refunded" />
              <p className="mt-3 text-body">When there&apos;s no handover by the deadline, or the landlord gives the deposit back earlier.</p>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="rules" className="bg-subtle">
        <div className="mx-auto max-w-page px-4 py-14 sm:px-6 lg:px-10 lg:py-20">
          <SectionHeader id="rules" eyebrow="The rules" title="Who can do what, and when." />
          <ol className="mt-8 grid gap-3 md:grid-cols-2">
            {RULES.map((rule, i) => (
              <li key={rule} className="flex gap-3 rounded-md bg-canvas p-4">
                <span className="font-display text-card font-bold text-fg-subtle tabular-nums">{i + 1}</span>
                <span className="text-body">{rule}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="what-if" className="mx-auto max-w-page px-4 py-14 sm:px-6 lg:px-10 lg:py-20">
        <SectionHeader id="what-if" eyebrow="What if…" title="Every hard question has a rule behind it." />
        <ScenarioGrid scenarios={SCENARIOS} />
      </section>

      <section aria-labelledby="no-arbiter" className="bg-subtle">
        <div className="mx-auto grid max-w-page gap-8 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-10 lg:py-20">
          <SectionHeader id="no-arbiter" eyebrow="Design choice" title="Why there's no judge in the middle." />
          <div className="space-y-4 text-body text-fg-muted">
            <p>
              Software can&apos;t see whether a room exists, and a judge chosen by the landlord could be the scammer&apos;s friend. The only reliable
              witness is the tenant standing in the room.
            </p>
            <p>
              So the tenant&apos;s approval is the only way to pay the landlord, and the clock is the only way back to the tenant. The worst case for
              an honest landlord: a tenant who never comes gets their deposit back, and the landlord loses time, not money.
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="limits" className="mx-auto max-w-page px-4 py-14 sm:px-6 lg:px-10 lg:py-20">
        <SectionHeader id="limits" eyebrow="Honest limits" title="What Keysfirst doesn't do (yet)." lead="This is a prototype. Here is everything we know it can't protect against." />
        <ul className="mt-8 grid gap-3 md:grid-cols-2">
          {LIMITS.map((limit) => (
            <li key={limit} className="flex gap-3 rounded-md border-[1.5px] border-rule p-4">
              <Icon name="alert" size={20} className="mt-0.5 shrink-0 text-fg-muted" />
              <span className="text-body">{limit}</span>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-sm text-fg-muted">
          Every step of every deal leaves a public receipt.{" "}
          <a href={explorerAddress(idl.address)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-fg underline underline-offset-2">
            See the program on Solana Explorer
            <Icon name="external" size={14} />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </p>
      </section>

      <CtaBand />
    </>
  );
}
