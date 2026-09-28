"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";

/** Shared body of the error boundaries. Next 16.3 passes `retry()`, which re-fetches and re-renders the segment. */
export function ErrorView({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="mx-auto w-full max-w-read px-4 py-16 sm:py-24">
      <p className="label text-fg-muted">Something went wrong</p>
      <h1 className="mt-3 font-display text-title font-bold">This page hit a problem.</h1>
      <p className="mt-4 text-lead text-fg-muted">Try again. If it keeps happening, reload the page or come back in a minute.</p>
      <Callout className="mt-6" tone="info">
        Nothing moves without your approval.
      </Callout>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button onClick={() => retry()}>Try again</Button>
        <ButtonLink href="/" variant="secondary">
          Go to the homepage
        </ButtonLink>
      </div>
    </div>
  );
}
