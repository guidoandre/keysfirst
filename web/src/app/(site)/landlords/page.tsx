import type { Metadata } from "next";
import { CtaBand } from "@/components/marketing/CtaBand";
import { ScenarioGrid } from "@/components/marketing/ScenarioGrid";
import { SectionHeader } from "@/components/marketing/SectionHeader";
import { StepList, type Step } from "@/components/marketing/StepList";
import { ButtonLink } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { CARD_FEES, MIN_FEE } from "@/content/fees";
import { scenariosFor } from "@/content/scenarios";

export const dynamic = "error";

export const metadata: Metadata = {
  title: "For landlords",
  description: "Show tenants abroad you're genuine and get the deposit at the door, in seconds. Your payout can't be charged back. Landlords pay nothing.",
};

const WHY: Array<{ icon: IconName; title: string; text: string }> = [
  { icon: "key", title: "Trust from the first message", text: "Your tenant can pay before arriving without taking your word for it." },
  { icon: "clock", title: "Paid at the door", text: "The deposit reaches your Keysfirst balance in seconds, before you hand over the keys, and your payout can't be charged back." },
  {
    icon: "check",
    title: "Free for landlords",
    text: `Landlords pay nothing; the tenant pays a small fee (${CARD_FEES}, at least ${MIN_FEE}). This prototype runs on test money.`,
  },
];

const STEPS: Step[] = [
  { pictogram: "laptop-wallet", title: "Create a deposit link", text: "Room, amount, move-in and the latest handover." },
  { pictogram: "share-link", title: "Send it to your tenant", text: "They pay into the lock. You see it on the deal page and in My deals." },
  { pictogram: "scan-at-door", title: "Start the handover", text: "At the door, your phone or laptop shows a code. Your tenant checks the room and scans it." },
  { pictogram: "keys-change-hands", title: "Released: hand over the keys", text: "Your screen turns green in seconds. Then the keys change hands." },
];

export default function LandlordsPage() {
  return (
    <>
      <section className="mx-auto max-w-page px-4 pt-10 pb-14 sm:px-6 lg:px-10 lg:pt-16">
        <p className="label enter text-fg-muted">For landlords</p>
        <h1 className="enter mt-3 max-w-3xl font-display text-title font-bold [--enter-delay:60ms]">
          Get the deposit at the <span className="marker enter-marker [--enter-delay:560ms]">door</span>, in seconds.
        </h1>
        <p className="enter mt-5 max-w-2xl text-lead text-fg-muted [--enter-delay:130ms]">
          Tenants abroad can&apos;t check you out before they arrive. A deposit link shows you&apos;re genuine: they pay into a lock, and you&apos;re
          paid the moment they approve the handover at the door.
        </p>
        <div className="enter mt-8 flex flex-col gap-4 sm:flex-row sm:items-center [--enter-delay:200ms]">
          <ButtonLink href="/new" prefetch={false} size="lg">
            Create a deposit link
          </ButtonLink>
          <ButtonLink href="/how-it-works" variant="quiet">
            How it works
          </ButtonLink>
        </div>
        <ul className="mt-12 grid gap-6 md:grid-cols-3">
          {WHY.map((item) => (
            <li key={item.title} data-reveal="" className="reveal-rule pt-5.5">
              <Icon name={item.icon} size={28} className="reveal-pop" />
              <h2 className="mt-3 font-display text-card font-bold">{item.title}</h2>
              <p className="mt-2 text-body text-fg-muted">{item.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="landlord-steps" className="bg-subtle">
        <div className="mx-auto grid max-w-page gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-10 lg:py-20">
          <div>
            <SectionHeader id="landlord-steps" eyebrow="How it works for you" title="From link to keys in four steps." />
            <div data-reveal="" className="mt-8">
              <StepList steps={STEPS} />
            </div>
          </div>
          <div data-reveal="" className="self-start rounded-lg border-2 border-fg bg-canvas p-6">
            <h3 className="font-display text-card font-bold">What if the tenant never comes?</h3>
            <p className="mt-3 text-body text-fg-muted">
              Then they can take the deposit back after the deadline, and you lose the time the room was reserved, not money. That&apos;s the trade:
              the tenant carries the bigger risk (paying a stranger), so the default protects them.
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="landlord-what-if" className="mx-auto max-w-page px-4 py-14 sm:px-6 lg:px-10 lg:py-20">
        <SectionHeader id="landlord-what-if" eyebrow="What if…" title="The questions landlords ask us." />
        <ScenarioGrid scenarios={scenariosFor("landlord")} />
      </section>

      <CtaBand />
    </>
  );
}
