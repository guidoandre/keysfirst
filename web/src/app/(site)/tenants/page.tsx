import type { Metadata } from "next";
import Link from "next/link";
import { AskLandlord } from "@/components/marketing/AskLandlord";
import { CtaBand } from "@/components/marketing/CtaBand";
import { ScenarioGrid } from "@/components/marketing/ScenarioGrid";
import { SectionHeader } from "@/components/marketing/SectionHeader";
import { StepList, type Step } from "@/components/marketing/StepList";
import { ButtonLink } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { CARD_FEE_PERCENT, MIN_FEE } from "@/content/fees";
import { scenariosFor } from "@/content/scenarios";
import { isAppRoute } from "@/lib/site";

export const dynamic = "error";

export const metadata: Metadata = {
  title: "For tenants",
  description: "Pay the deposit before you arrive without trusting a stranger: it waits in a lock until you're in the room with the keys.",
};

const STEPS: Step[] = [
  { pictogram: "share-link", title: "Ask for a deposit link", text: "Your landlord creates it in a minute and sends it to you." },
  {
    pictogram: "pay-into-lock",
    title: "Pay into the lock",
    text: `By card, from your phone: the deposit plus a Keysfirst fee of ${CARD_FEE_PERCENT} (at least ${MIN_FEE}, not refunded). The deposit waits; the landlord can't take it.`,
  },
  {
    pictogram: "scan-at-door",
    title: "At the door: check, then approve",
    text: "Look at the room, then scan the landlord's code or tap “I have the keys” on your deal page, and take the keys. The landlord is paid only then.",
  },
  { pictogram: "back-to-you", title: "No handover? You take it back", text: "If the handover never happens, you can take the deposit back after the deadline." },
];

const NEEDS = [
  { href: "/start#login", title: "An email address", text: "Or a Google account. No wallet app." },
  { href: "/start#pay", title: "A card", text: "Here: Stripe's test card, so no real money." },
  { href: "/start#door", title: "Your phone", text: "To scan the landlord's code at the door." },
];

export default function TenantsPage() {
  return (
    <>
      <section className="mx-auto max-w-page px-4 pt-10 pb-14 sm:px-6 lg:px-10 lg:pt-16">
        <p className="label enter text-fg-muted">For tenants</p>
        <h1 className="enter mt-3 max-w-3xl font-display text-title font-bold [--enter-delay:60ms]">
          Pay the deposit before you arrive, without trusting a stranger.
        </h1>
        <p className="enter mt-5 max-w-2xl text-lead text-fg-muted [--enter-delay:130ms]">
          Your deposit waits in a lock until you&apos;re standing in the room with the keys. Your landlord is paid when you confirm the handover at
          the door. If that never happens, you can take it back after the deadline.
        </p>
        <div className="enter mt-8 flex flex-col gap-4 sm:flex-row sm:items-center [--enter-delay:200ms]">
          <AskLandlord />
          <ButtonLink href="/start" prefetch={false} variant="quiet">
            Get started
          </ButtonLink>
        </div>
      </section>

      <section aria-labelledby="your-steps" className="bg-subtle">
        <div className="mx-auto grid max-w-page gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-10 lg:py-20">
          <div>
            <SectionHeader id="your-steps" eyebrow="How it works for you" title="Four steps, and the money never goes to a stranger." />
            <div data-reveal="" className="mt-8">
              <StepList steps={STEPS} />
            </div>
          </div>
          <div data-reveal="" className="space-y-4">
            <h3 className="label text-fg-muted">What you need</h3>
            <ul className="grid gap-3">
              {NEEDS.map((need) => (
                <li key={need.href}>
                  <Link href={need.href} prefetch={isAppRoute(need.href) ? false : undefined} className="card-link block rounded-md border-[1.5px] border-rule bg-canvas p-4">
                    <span className="font-display text-card font-bold">{need.title}</span>
                    <span className="mt-1 block text-body text-fg-muted">{need.text}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <Callout tone="info" title="If someone won't use a deposit link, ask why.">
              An honest landlord is paid the moment you get the keys. And a deposit is limited by law: when a landlord creates a link Keysfirst
              checks it against the rent they enter, so compare it with the rent in your contract.
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
