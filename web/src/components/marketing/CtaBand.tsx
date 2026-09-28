import Link from "next/link";
import { ButtonLink, buttonClass } from "@/components/ui/Button";
import { cx } from "@/lib/cx";
import { AskLandlord } from "./AskLandlord";

export function CtaBand() {
  return (
    <section aria-labelledby="cta" className="bg-inverse text-fg-inverse">
      <div className="mx-auto grid max-w-page gap-12 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-10 lg:py-20">
        <div>
          <h2 id="cta" className="font-display text-section font-bold">
            Renting from abroad? Ask for a deposit link.
          </h2>
          <p className="mt-3 max-w-md text-fg-inverse-muted">Send your landlord a short message. If someone won&apos;t use a deposit link, ask why.</p>
          <div className="mt-6">
            <AskLandlord tone="dark" />
          </div>
        </div>
        <div>
          <h2 className="font-display text-section font-bold">Letting a room? Create a link in a minute.</h2>
          <p className="mt-3 max-w-md text-fg-inverse-muted">Your tenant pays into the lock, and you&apos;re paid at the door.</p>
          <ButtonLink href="/new" prefetch={false} variant="secondary" className="mt-6">
            Create a deposit link
          </ButtonLink>
        </div>
        <p className="lg:col-span-2">
          <Link href="/start" prefetch={false} className={cx(buttonClass({ variant: "quiet" }), "text-fg-inverse")}>
            New to wallets? Get started in 5 minutes
          </Link>
        </p>
      </div>
    </section>
  );
}
