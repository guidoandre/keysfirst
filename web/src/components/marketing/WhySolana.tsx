import { Icon, type IconName } from "@/components/ui/Icon";
import idl from "@/idl/keysfirst.json";
import { explorerAddress } from "@/lib/format";
import { SectionHeader } from "./SectionHeader";

const FACTS: Array<{ icon: IconName; title: string; text: string }> = [
  {
    icon: "clock",
    title: "Final in seconds",
    text: "Payment on Solana settles in seconds and can't be charged back, so the landlord can hand over the keys the moment the screen turns green. A bank transfer can take a day.",
  },
  {
    icon: "lock",
    title: "Rules in a public program",
    text: "A program on Solana holds each deposit. Its rules allow two ways out: to the landlord when the tenant approves at the handover, or back to the tenant.",
  },
  {
    icon: "return",
    // Controller-directed deviation from the brief (honesty ruling): the devnet program can still be
    // upgraded by its deploy key, so an absolute "nobody controls" claim is out (global constraint).
    title: "The clock decides, not a person",
    text: "After the deadline, anyone can send the deposit back to the tenant. No support ticket, no waiting for someone to decide.",
  },
];

export function WhySolana() {
  return (
    <section aria-labelledby="why-solana" className="mx-auto max-w-page px-4 py-14 sm:px-6 lg:px-10 lg:py-24">
      <SectionHeader id="why-solana" eyebrow="Why Solana" title="Why it runs on Solana." />
      <ul className="mt-10 grid gap-6 md:grid-cols-3">
        {FACTS.map((fact) => (
          <li key={fact.title} className="border-t-2 border-fg pt-5">
            <Icon name={fact.icon} size={28} />
            <h3 className="mt-3 font-display text-card font-bold">{fact.title}</h3>
            <p className="mt-2 text-body text-fg-muted">{fact.text}</p>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-sm text-fg-muted">
        Every step leaves a public receipt.{" "}
        <a href={explorerAddress(idl.address)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-fg underline underline-offset-2">
          See the program on Solana Explorer
          <Icon name="external" size={14} />
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </p>
    </section>
  );
}
