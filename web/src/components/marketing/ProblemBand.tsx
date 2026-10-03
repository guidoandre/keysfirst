"use client";

import { PROBLEM } from "@/content/landing";
import { LaterRoleSwap } from "./LandingRole";

/**
 * The problem, told to the side the toggle picked: the fake-landlord scam, from the tenant's or the landlord's end.
 * Both versions stay in place (LaterRoleSwap: a frame after the hero), so switching the role glides the text without
 * moving the band.
 */
export function ProblemBand() {
  const { tenant, landlord } = PROBLEM;
  return (
    <section aria-labelledby="problem" className="bg-inverse text-fg-inverse">
      <div className="mx-auto max-w-wide px-4 py-14 sm:px-6 lg:px-10 lg:py-20 xl:px-16">
        <div data-reveal="">
          <p className="label text-accent lg:text-sm">The problem</p>
          <h2
            id="problem"
            className="mt-3 max-w-[62.5rem] font-display text-[clamp(2.25rem,1.5rem_+_2.4vw,3.75rem)] leading-[0.96] font-bold tracking-[-0.015em] lg:mt-4"
          >
            <LaterRoleSwap as="span" className="w-full" tenant={tenant.title} landlord={landlord.title} />
          </h2>
          <p className="mt-4 max-w-[60ch] text-[1.0625rem] leading-normal text-fg-inverse-muted lg:mt-5 lg:text-lg">
            <LaterRoleSwap as="span" className="w-full" tenant={tenant.lead} landlord={landlord.lead} />
          </p>
        </div>
        <ol className="mt-8 md:mt-12 md:grid md:grid-cols-3 md:border-t-[1.5px] md:border-fg-muted">
          {tenant.items.map((_, i) => (
            <li
              key={i}
              data-reveal=""
              className="grid grid-cols-[2.25rem_1fr] gap-2 border-t-[1.5px] border-fg-muted py-5 md:flex md:flex-col md:gap-3.5 md:border-t-0 md:pt-8 md:pr-10 md:pb-0"
            >
              <span className="pt-1 font-display text-[1.0625rem] font-bold text-accent tabular-nums md:pt-0 md:text-xl">0{i + 1}</span>
              <LaterRoleSwap tenant={<ProblemItem {...tenant.items[i]} />} landlord={<ProblemItem {...landlord.items[i]} />} />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function ProblemItem({ title, text }: { title: string; text: string }) {
  return (
    <>
      <h3 className="font-display text-[1.625rem] leading-[1.08] font-bold lg:text-[1.875rem] lg:leading-[1.06]">{title}</h3>
      <p className="mt-1.5 leading-normal text-fg-inverse-muted md:mt-3.5 lg:text-[1.0625rem]">{text}</p>
    </>
  );
}
