import { ButtonLink } from "@/components/ui/Button";
import { StepList, type Step } from "./StepList";

const RENTING: Step[] = [
  { pictogram: "share-link", title: "Get a deposit link", text: "Ask your landlord to create one. It takes a minute." },
  { pictogram: "pay-into-lock", title: "Pay into the lock", text: "The deposit leaves your wallet app (like Phantom) but doesn't reach the landlord yet: it waits in the lock." },
  { pictogram: "scan-at-door", title: "Scan at the door", text: "Check the room, then scan the landlord's code or tap “I have the keys”. Only then are they paid. No handover? You take it back after the deadline." },
];

const LETTING: Step[] = [
  { pictogram: "laptop-wallet", title: "Create a deposit link", text: "Room, amount, move-in and the latest handover." },
  { pictogram: "share-link", title: "Send it to your tenant", text: "On WhatsApp or wherever you talk. They pay into the lock." },
  { pictogram: "keys-change-hands", title: "Show your code at the handover", text: "Your screen turns green in seconds: then hand over the keys." },
];

export function AudienceSplit() {
  return (
    <div className="mt-10 grid gap-6 lg:grid-cols-2">
      <section aria-labelledby="renting" className="rounded-lg border-2 border-fg p-6">
        <h3 id="renting" className="label text-fg-muted">
          If you&apos;re renting
        </h3>
        <div className="mt-5">
          <StepList steps={RENTING} />
        </div>
        {/* Cut rule: if /tenants is cut, link to /how-it-works. */}
        <ButtonLink href="/tenants" variant="quiet" className="mt-6">
          How it protects tenants
        </ButtonLink>
      </section>
      <section aria-labelledby="letting" className="rounded-lg border-2 border-fg p-6">
        <h3 id="letting" className="label text-fg-muted">
          If you&apos;re letting
        </h3>
        <div className="mt-5">
          <StepList steps={LETTING} />
        </div>
        <ButtonLink href="/new" prefetch={false} className="mt-6">
          Create a deposit link
        </ButtonLink>
      </section>
    </div>
  );
}
