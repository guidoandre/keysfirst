"use client";

import type { CSSProperties } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { HERO, HERO_FACTS } from "@/content/landing";
import { DealDemo } from "./DealDemo";
import { RoleSwap, RoleToggle, useLandingRole } from "./LandingRole";

/**
 * The landing hero: the role toggle rewrites the copy and brings that side's phone to the front of the demo.
 * One column up to xl (the demo under the text), two from xl, where the text and the demo both fit the window height.
 * Entrance timing: design system §8. Switching the role never reflows the column: every piece of copy keeps both
 * versions in place (RoleSwap) and the buttons keep their size, only their labels and links change.
 */
export function LandingHero() {
  const { role } = useLandingRole();
  const copy = HERO[role];
  return (
    <section
      data-wide-page=""
      aria-labelledby="hero-title"
      className="mx-auto grid max-w-wide grid-cols-[minmax(0,1fr)] items-center gap-y-10 px-4 pt-6 pb-10 sm:px-6 sm:pt-10 lg:px-10 lg:pb-16 xl:grid-cols-[minmax(0,1fr)_auto] xl:gap-x-14 xl:px-16 xl:pt-6 xl:pb-16"
    >
      <div>
        <RoleToggle className="enter" />
        <p className="label enter mt-7 text-fg-muted lg:mt-6 lg:text-sm [--enter-delay:40ms]">
          <RoleSwap as="span" tenant={HERO.tenant.eyebrow} landlord={HERO.landlord.eyebrow} />
        </p>
        <h1 id="hero-title" className="enter mt-3 font-display text-hero-xl font-bold max-lg:leading-[0.94] lg:mt-3.5 [--enter-delay:80ms]">
          The deposit moves only when the{" "}
          {/* An inline-block keeps the baseline and doesn't cover the line above; the bottom padding covers the y. */}
          <span className="inline-block rounded-sm bg-inverse px-[0.08em] pt-[0.04em] pb-[0.17em] leading-[0.84] text-accent">keys</span> do.
        </h1>
        <p className="enter mt-4.5 max-w-[44ch] text-[1.0625rem] leading-normal text-fg-muted lg:mt-5 lg:max-w-[48ch] lg:text-[1.1875rem] [--enter-delay:140ms]">
          <RoleSwap as="span" className="w-full" tenant={HERO.tenant.lead} landlord={HERO.landlord.lead} />
        </p>
        <div className="enter mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-7 lg:mt-7 [--enter-delay:200ms]">
          {/* prefetch={false} for both roles (see isAppRoute in lib/site.ts): "/new" is a wallet page, and "#ask" has
              nothing to prefetch. Keeping it fixed keeps the button's inner markup the same, so the label can glide. */}
          <ButtonLink href={copy.primary.href} prefetch={false} size="lg" fullWidth className="sm:w-auto lg:px-7">
            <span className="inline-flex items-center gap-2.5">
              <RoleSwap as="span" className="justify-items-center" tenant={HERO.tenant.primary.label} landlord={HERO.landlord.primary.label} />
              <Icon name="arrow-right" size={20} className="nudge-x" />
            </span>
          </ButtonLink>
          <ButtonLink href={copy.secondary.href} variant="quiet" className="self-start text-base sm:self-auto lg:text-[1.0625rem]">
            <RoleSwap as="span" className="[--swap-x:6px]" tenant={HERO.tenant.secondary.label} landlord={HERO.landlord.secondary.label} />
          </ButtonLink>
        </div>
        <ul className="mt-6 grid gap-2.5 border-t border-rule pt-4.5 text-[0.9375rem] leading-snug text-fg-muted sm:grid-cols-3 sm:gap-4 lg:mt-8 lg:pt-4">
          {HERO_FACTS.map((fact, i) => (
            <li key={fact} className="enter flex gap-2" style={{ "--enter-delay": `${260 + i * 70}ms` } as CSSProperties}>
              <Icon name="check" size={18} className="mt-px shrink-0 text-fg" />
              {fact}
            </li>
          ))}
        </ul>
      </div>
      <div className="enter [--enter-delay:180ms]">
        <DealDemo role={role} />
      </div>
    </section>
  );
}
