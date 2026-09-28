import type { Metadata } from "next";
import Link from "next/link";
import { AskLandlord } from "@/components/marketing/AskLandlord";
import { CtaBand } from "@/components/marketing/CtaBand";
import { ScenarioGrid } from "@/components/marketing/ScenarioGrid";
import { SectionHeader } from "@/components/marketing/SectionHeader";
import { StepList, type Step } from "@/components/marketing/StepList";
import { ButtonLink } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { scenariosFor } from "@/content/scenarios";

export const dynamic = "error";

export const metadata: Metadata = {
  title: "For tenants",
  description: "Pay the deposit before you arrive without trusting a stranger: it waits in a lock until you're in the room with the keys.",
};

const STEPS: Step[] = [
  { pictogram: "share-link", title: "Ask for a deposit link", text: "Your landlord creates it in a minute and sends it to you." },
  { pictogram: "pay-into-lock", title: "Pay into the lock", text: "From your phone, inside Phantom. The money waits; the landlord can't take it." },
  { pictogram: "scan-at-door", title: "At the door: check, then scan", text: "Look at the room, take the keys, then scan the landlord's code. Only then are they paid." },
  { pictogram: "back-to-you", title: "No handover? It comes back", text: "If you never scan, the deposit returns to you after the deadline." },
];

const NEEDS = [
  { href: "/start#install", title: "Phantom", text: "A wallet app for your phone." },
  { href: "/start#devnet", title: "Solana Devnet", text: "The test network, switched on in Phantom." },
  { href: "/start#funds", title: "Test money", text: "Free: 1,000 Test EUR from the guide." },
];

export default function TenantsPage() {
  return (
    <>
      <section className="mx-auto max-w-page px-4 pt-10 pb-14 sm:px-6 lg:px-10 lg:pt-16">
        <p className="label text-fg-muted">For tenants</p>
        <h1 className="mt-3 max-w-3xl font-display text-title font-bold">Pay the deposit before you arrive, without trusting a stranger.</h1>
        <p className="mt-5 max-w-2xl text-lead text-fg-muted">
          Your deposit waits in a lock until you&apos;re standing in the room with the keys. Your landlord is paid when you scan their code at the
          door. If that never happens, it comes back to you.
        </p>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
          <AskLandlord />
          <ButtonLink href="/start" variant="quiet">
            Get started
          </ButtonLink>
        </div>
      </section>

      <section aria-labelledby="your-steps" className="bg-subtle">
        <div className="mx-auto grid max-w-page gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-10 lg:py-20">
          <div>
            <SectionHeader id="your-steps" eyebrow="How it works for you" title="Four steps, and the money never goes to a stranger." />
            <div className="mt-8">
              <StepList steps={STEPS} />
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="label text-fg-muted">What you need</h3>
            <ul className="grid gap-3">
              {NEEDS.map((need) => (
                <li key={need.href}>
                  <Link href={need.href} className="block rounded-md border-[1.5px] border-rule bg-canvas p-4 hover:border-fg">
                    <span className="font-display text-card font-bold">{need.title}</span>
                    <span className="mt-1 block text-body text-fg-muted">{need.text}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <Callout tone="info" title="If someone won't use a deposit link, ask why.">
              An honest landlord is paid the moment you get the keys. And under §551 BGB you don&apos;t have to pay the full deposit before the tenancy
              starts.
            </Callout>
          </div>
        </div>
      </section>

      <section aria-labelledby="tenant-what-if" className="mx-auto max-w-page px-4 py-14 sm:px-6 lg:px-10 lg:py-20">
        <SectionHeader id="tenant-what-if" eyebrow="What if…" title="The questions tenants ask us." />
        <ScenarioGrid scenarios={scenariosFor("tenant")} />
      </section>

      <CtaBand />
    </>
  );
}
