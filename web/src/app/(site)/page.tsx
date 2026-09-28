import type { Metadata } from "next";
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
    "Renting a room in Germany from abroad? Keysfirst holds the deposit in a lock until the key handover: the landlord is paid when you scan their code at the door, otherwise it comes back to you.",
};

const FACTS = ["Works with any listing: WG-Gesucht, Facebook, a friend's sublet", "Money only goes to the tenant or the landlord", "Automatic return after the deadline"];

export default function LandingPage() {
  const scenarios = SCENARIOS.filter((s) => LANDING_SCENARIO_IDS.includes(s.id));
  return (
    <>
      <section className="mx-auto grid max-w-page gap-10 px-4 pt-10 pb-14 sm:px-6 lg:grid-cols-[7fr_5fr] lg:items-center lg:gap-14 lg:px-10 lg:pt-16 lg:pb-24">
        <div>
          <p className="label text-fg-muted">Deposit protection for rooms in Germany</p>
          <h1 className="mt-4 font-display text-hero font-bold">
            The deposit moves only when the <span className="marker animate-marker">keys</span> do.
          </h1>
          <p className="mt-6 max-w-[36ch] text-lead text-fg-muted">
            Keysfirst holds a rental deposit in a lock until the key handover. The tenant scans the landlord&apos;s code at the door and the
            landlord is paid in seconds. No handover? The money goes back to the tenant.
          </p>
          <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-start">
            <div>
              <ButtonLink href="/new" size="lg" fullWidth className="sm:w-auto">
                Create a deposit link
              </ButtonLink>
              <p className="mt-2 text-sm text-fg-subtle">For landlords · free on devnet</p>
            </div>
            {/* Cut rule: if /tenants is cut, link to /how-it-works. */}
            <ButtonLink href="/tenants" variant="quiet" className="sm:mt-4">
              I&apos;m renting: how it protects me
            </ButtonLink>
          </div>
          <ul className="mt-10 grid gap-3 border-t border-rule pt-6 text-sm text-fg-muted sm:grid-cols-3">
            {FACTS.map((fact) => (
              <li key={fact} className="flex gap-2">
                <Icon name="check" size={18} className="mt-0.5 shrink-0 text-fg" />
                {fact}
              </li>
            ))}
          </ul>
        </div>
        <RulesTimetable />
      </section>

      <section aria-labelledby="problem" className="bg-subtle">
        <div className="mx-auto max-w-page px-4 py-14 sm:px-6 lg:px-10 lg:py-24">
          <SectionHeader
            id="problem"
            eyebrow="The problem"
            title="Fake landlords look for tenants who can't visit."
            lead="Students often rent a room in Germany before they arrive. That is exactly who the fake-landlord scam targets."
          />
          <ProblemSteps />
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <Callout tone="neutral" title="Booking platforms protect only their own listings.">
              Keysfirst works with any listing: a Facebook group, WG-Gesucht, WhatsApp or a friend&apos;s sublet. The money waits until you&apos;re at
              the door.
            </Callout>
            <Callout tone="info" title="German law is on your side.">
              You don&apos;t have to pay the full deposit before you move in: under §551 BGB you may pay it in three monthly instalments, the first due
              when the tenancy starts.
            </Callout>
          </div>
        </div>
      </section>

      <section aria-labelledby="how" className="mx-auto max-w-page px-4 py-14 sm:px-6 lg:px-10 lg:py-24">
        <SectionHeader id="how" eyebrow="How it works" title="Three steps on each side." />
        <AudienceSplit />
        <ButtonLink href="/how-it-works" variant="quiet" className="mt-8">
          All the rules, step by step
        </ButtonLink>
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
          <ButtonLink href="/faq" variant="quiet" className="mt-6">
            All questions
          </ButtonLink>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
