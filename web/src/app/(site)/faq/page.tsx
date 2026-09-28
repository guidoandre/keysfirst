import type { Metadata } from "next";
import { CtaBand } from "@/components/marketing/CtaBand";
import { FaqList } from "@/components/marketing/FaqList";
import { OpenHashDetails } from "@/components/marketing/OpenHashDetails";
import { FAQ } from "@/content/faq";

export const dynamic = "error";

export const metadata: Metadata = {
  title: "Questions and answers",
  description: "How Keysfirst works, who holds the money, what German law says about deposits, your account, test money and the prototype.",
};

export default function FaqPage() {
  return (
    <>
      <OpenHashDetails />
      <div className="mx-auto max-w-read px-4 pt-10 pb-16 sm:px-6 lg:pt-16">
        <p className="label enter text-fg-muted">FAQ</p>
        <h1 className="enter mt-3 font-display text-title font-bold [--enter-delay:60ms]">Questions and answers</h1>
        <p className="enter mt-4 text-lead text-fg-muted [--enter-delay:130ms]">Plain answers about the deposit, the handover, your account and this prototype.</p>
        {FAQ.map((group) => (
          <section key={group.id} aria-labelledby={`faq-${group.id}`} className="mt-12">
            <h2 id={`faq-${group.id}`} data-reveal="" className="label mb-3 text-fg-muted">
              {group.title}
            </h2>
            <FaqList entries={group.entries} />
          </section>
        ))}
      </div>
      <CtaBand />
    </>
  );
}
