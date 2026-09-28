import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/Button";

export const dynamic = "error";

export const metadata: Metadata = {
  title: "About",
  description: "Why Keysfirst exists, how the prototype is built, and what comes next.",
};

const BUILT = [
  "A program on Solana, written with Anchor, with 42 automated tests including the money rules.",
  "Solana Pay for the code the tenant scans at the handover.",
  "A Next.js web app. Deals are read straight from Solana; there is no database.",
];

const ROADMAP = [
  "EURC, Circle's euro stablecoin, on Solana mainnet.",
  "Ways to get euro stablecoins inside the flow.",
  "Landlord verification.",
  "A verified domain, so fake copies of the site are easy to spot.",
  "Holding the deposit for the whole tenancy.",
  "Locking the program's upgrade key or sharing it between several people.",
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-read px-4 pt-10 pb-16 sm:px-6 lg:pt-16">
      <p className="label text-fg-muted">About</p>
      <h1 className="mt-3 font-display text-title font-bold">About Keysfirst</h1>

      <section aria-labelledby="why" className="mt-10 space-y-4 text-body">
        <h2 id="why" className="font-display text-section font-bold">
          Why it exists
        </h2>
        <p>
          International students often rent a room in Germany before they arrive. Fake landlords know this: they post a room, ask for the deposit
          before any viewing, and disappear. Booking platforms only protect bookings made on their own platform.
        </p>
        <p>Keysfirst turns the key handover into the moment the deposit moves: no keys, no money.</p>
      </section>

      <section aria-labelledby="what" className="mt-12 space-y-4 text-body">
        <h2 id="what" className="font-display text-section font-bold">
          What it is
        </h2>
        <p>
          A working prototype for Superteam Germany&apos;s &ldquo;Build an MVP with Solana at WHU&rdquo; challenge. It runs on Solana&apos;s test
          network with test money.
        </p>
        <ul className="list-disc space-y-2 pl-5 text-fg-muted">
          {BUILT.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="next" className="mt-12 space-y-4 text-body">
        <h2 id="next" className="font-display text-section font-bold">
          What comes next
        </h2>
        <ul className="list-disc space-y-2 pl-5 text-fg-muted">
          {ROADMAP.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="who" className="mt-12 space-y-4 text-body">
        <h2 id="who" className="font-display text-section font-bold">
          Who built it
        </h2>
        <p>Built by a business student at WHU with AI coding tools (Claude Code and solana.new).</p>
      </section>

      <div className="mt-12 flex flex-wrap gap-3">
        <ButtonLink href="/how-it-works#limits" variant="secondary">
          The honest limits
        </ButtonLink>
        <ButtonLink href="/faq" variant="quiet">
          FAQ
        </ButtonLink>
      </div>
    </div>
  );
}
