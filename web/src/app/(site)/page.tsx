import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { Callout } from "@/components/ui/Callout";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { AudienceSplit } from "@/components/marketing/AudienceSplit";
import { CtaBand } from "@/components/marketing/CtaBand";
import { FaqList } from "@/components/marketing/FaqList";
import { ProblemSteps } from "@/components/marketing/ProblemSteps";
import { RulesTimetable } from "@/components/marketing/RulesTimetable";
import { ScenarioGrid } from "@/components/marketing/ScenarioGrid";
import { SectionHeader } from "@/components/marketing/SectionHeader";
import { WhySolana } from "@/components/marketing/WhySolana";
import { faqEntries, LANDING_FAQ_IDS } from "@/content/faq";
import { LANDING_SCENARIO_IDS, SCENARIOS } from "@/content/scenarios";

export const dynamic = "error";

export const metadata: Metadata = {
  // The root template doesn't reach the home page, so the title is written out in full.
  title: { absolute: "Keysfirst · The deposit moves only when the keys do" },
  description:
    "Renting a room in Europe from abroad? Keysfirst holds the deposit in a lock until the key handover: the landlord is paid when you confirm the handover at the door, otherwise you can take it back after the deadline.",
};

const FACTS = ["Works with any listing: a listing site, Facebook, a friend's sublet", "Money only goes to the tenant or the landlord", "After the deadline it can only go back to the tenant"];

export default function LandingPage() {
  const scenarios = SCENARIOS.filter((s) => LANDING_SCENARIO_IDS.includes(s.id));
  return (
    <>
      {/* Hero. On phones the example timetable follows the buttons and the facts close the hero; from lg the timetable
          sits beside the text and the facts line up under it. Entrance timing: design system §8. */}
      <section className="mx-auto grid max-w-page gap-y-8 px-4 pt-6 pb-12 sm:px-6 sm:pt-8 lg:grid-cols-[7fr_5fr] lg:gap-x-14 lg:gap-y-10 lg:px-10 lg:pt-12 lg:pb-16">
        <div>
          <p className="label enter text-fg-muted">Deposit protection for rooms in Europe</p>
          <h1 className="enter mt-3 font-display text-hero font-bold [--enter-delay:60ms]">
            The deposit moves only when the <span className="marker enter-marker [--enter-delay:620ms]">keys</span> do.
          </h1>
          <p className="enter mt-5 max-w-[44ch] text-lead text-fg-muted [--enter-delay:130ms]">
            Keysfirst holds a rental deposit in a lock until the key handover. The tenant scans the landlord&apos;s code at the door and the
            landlord is paid in seconds. No handover? The money goes back to the tenant.
          </p>
          <div className="enter mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6 [--enter-delay:200ms]">
            <ButtonLink href="/new" prefetch={false} size="lg" fullWidth className="sm:w-auto">
              Create a deposit link
            </ButtonLink>
            {/* Cut rule: if /tenants is cut, link to /how-it-works. */}
            <ButtonLink href="/tenants" variant="quiet" className="self-start sm:self-auto">
              I&apos;m renting: how it protects me
            </ButtonLink>
          </div>
        </div>
        <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center">
          <RulesTimetable />
        </div>
        <ul className="grid gap-3 border-t border-rule pt-6 text-sm text-fg-muted sm:grid-cols-3 lg:col-start-1">
          {FACTS.map((fact, i) => (
            <li key={fact} className="enter flex gap-2" style={{ "--enter-delay": `${300 + i * 70}ms` } as CSSProperties}>
              <Icon name="check" size={18} className="mt-0.5 shrink-0 text-fg" />
              {fact}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="problem" className="bg-subtle">
        <div className="mx-auto max-w-page px-4 py-14 sm:px-6 lg:px-10 lg:py-24">
          <SectionHeader
            id="problem"
            eyebrow="The problem"
            title="Fake landlords look for tenants who can't visit."
            lead="Students often rent a room in another country before they arrive. That is exactly who the fake-landlord scam targets."
          />
          <ProblemSteps />
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <div data-reveal="">
              <Callout tone="neutral" title="Booking platforms protect only their own listings." className="h-full">
                Keysfirst works with any listing: a Facebook group, a listing site, WhatsApp or a friend&apos;s sublet. The money waits until you&apos;re
                at the door.
              </Callout>
            </div>
            <div data-reveal="">
              <Callout tone="info" title="The law caps your deposit." className="h-full">
                Every country we cover limits the deposit, from one month&apos;s rent to three. Keysfirst won&apos;t let a landlord create a link
                above the limit.
              </Callout>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="how" className="mx-auto max-w-page px-4 py-14 sm:px-6 lg:px-10 lg:py-24">
        <SectionHeader id="how" eyebrow="How it works" title="Three steps on each side." />
        <AudienceSplit />
        <p data-reveal="" className="mt-8">
          <ButtonLink href="/how-it-works" variant="quiet">
            All the rules, step by step
          </ButtonLink>
        </p>
      </section>

      <section aria-labelledby="what-if" className="bg-subtle">
        <div className="mx-auto max-w-page px-4 py-14 sm:px-6 lg:px-10 lg:py-24">
          <SectionHeader id="what-if" eyebrow="What if…" title="The rules answer the hard questions." />
          <ScenarioGrid scenarios={scenarios} />
        </div>
      </section>

      <WhySolana />

      <section aria-labelledby="faq" className="bg-subtle">
        <div className="mx-auto max-w-read px-4 py-14 sm:px-6 lg:py-24">
          <SectionHeader id="faq" eyebrow="FAQ" title="Questions people ask first." />
          <div className="mt-8">
            <FaqList entries={faqEntries(LANDING_FAQ_IDS)} />
          </div>
          <p data-reveal="" className="mt-6">
            <ButtonLink href="/faq" variant="quiet">
              All questions
            </ButtonLink>
          </p>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
