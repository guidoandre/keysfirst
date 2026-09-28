import type { Metadata } from "next";
import { SiteHeader } from "@/components/site/SiteHeader";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Page not found" };

/** Also handles every unmatched URL. Rendered inside the root layout (ribbon + footer), so it adds the header itself. */
export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-read flex-1 px-4 py-16 sm:py-24">
        <p className="label text-fg-muted">Error 404</p>
        <h1 className="mt-3 font-display text-title font-bold">
          This page isn&apos;t on the <span className="marker">timetable</span>.
        </h1>
        <p className="mt-4 text-lead text-fg-muted">
          The link may be mistyped or out of date. Deal links look like keysfirst.vercel.app/deal/ followed by a long code.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <ButtonLink href="/">Go to the homepage</ButtonLink>
          {/* prefetch={false} on links into the wallet pages: see isAppRoute in lib/site.ts */}
          <ButtonLink href="/deals" prefetch={false} variant="secondary">
            My deals
          </ButtonLink>
          <ButtonLink href="/start" prefetch={false} variant="quiet" className="sm:ml-2">
            Get started
          </ButtonLink>
        </div>
      </main>
    </>
  );
}
