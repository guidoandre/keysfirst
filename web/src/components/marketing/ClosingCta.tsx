"use client";

import Link from "next/link";
import { ButtonLink, buttonClass } from "@/components/ui/Button";
import { CLOSING, LANDLORD_TERMS } from "@/content/landing";
import { cx } from "@/lib/cx";
import { whatsappUrl } from "@/lib/format";
import { CopyMessageButton, useLandlordMessage } from "./AskLandlord";
import { useLandingRole } from "./LandingRole";

/**
 * The closing Highlighter band. Tenant: the message to send the landlord, WhatsApp or copy. Landlord: create a link,
 * and what it costs them. The hero's "Ask your landlord for a deposit link" lands here (#ask).
 * On phones the items stack in source order; from lg the text and its buttons sit left, the message or terms right.
 */
export function ClosingCta() {
  const { role } = useLandingRole();
  const message = useLandlordMessage();
  const cta = CLOSING[role];
  return (
    <section id="ask" aria-labelledby="closing-title" className="scroll-mt-(--header-h) bg-accent">
      <div className="mx-auto grid max-w-wide gap-y-7 px-4 py-14 sm:px-6 lg:grid-cols-[7fr_5fr] lg:gap-x-16 lg:gap-y-8.5 lg:px-10 lg:py-20 xl:px-16">
        <div data-reveal="" className="lg:self-end">
          <h2 id="closing-title" className="font-display text-display font-bold">
            {cta.title}
          </h2>
          <p className="mt-3.5 max-w-[40ch] text-[1.0625rem] leading-normal lg:mt-5 lg:text-lg">{cta.text}</p>
        </div>

        {role === "tenant" ? (
          <div data-reveal="" className="flex flex-col gap-3 lg:self-end lg:gap-3.5">
            <p className="label">Your message to the landlord</p>
            <p className="rounded-[1.25rem_1.25rem_1.25rem_0.25rem] border-2 border-fg bg-canvas px-4.5 py-4 leading-normal [overflow-wrap:anywhere] lg:px-6 lg:py-5.5 lg:text-[1.0625rem]">
              {message}
            </p>
          </div>
        ) : (
          <dl data-reveal="" className="overflow-hidden rounded-[1rem] border-2 border-fg bg-canvas lg:self-end">
            {LANDLORD_TERMS.map((term, i) => (
              <div key={term.label} className={cx("flex justify-between gap-3 px-4 py-3.5 lg:px-5.5 lg:py-4.5 lg:text-[1.0625rem]", i > 0 && "border-t border-rule")}>
                <dt>{term.label}</dt>
                <dd className="text-right font-semibold">{term.value}</dd>
              </div>
            ))}
          </dl>
        )}

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
          {role === "tenant" ? (
            <ButtonLink href={whatsappUrl(message)} external size="lg">
              Ask your landlord on WhatsApp
            </ButtonLink>
          ) : (
            <>
              <ButtonLink href="/new" prefetch={false} size="lg">
                Create a deposit link
              </ButtonLink>
              <Link href="/start" prefetch={false} className={cx(buttonClass({ variant: "quiet" }), "self-center text-base decoration-fg! lg:text-[1.0625rem]")}>
                New here? Get started in 5 minutes
              </Link>
            </>
          )}
        </div>
        {/* On phones it follows the WhatsApp button 12 px below (the grid gap is 28); from lg it sits under the message. */}
        {role === "tenant" && <CopyMessageButton message={message} variant="secondary" className="max-lg:-mt-4 lg:self-start lg:justify-self-start" />}
      </div>
    </section>
  );
}
