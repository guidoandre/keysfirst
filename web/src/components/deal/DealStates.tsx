"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Callout } from "@/components/ui/Callout";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

/** Loading skeleton; after 3 s (or on an error) it says what's happening, since phones have no dev tools. */
export function DealLoading({ loadError }: { loadError: string | null }) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 3_000);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div className="mx-auto max-w-app space-y-5 px-4 py-8" aria-busy="true">
      <p role="status" className="sr-only">
        Loading the deal…
      </p>
      <Skeleton className="h-52" />
      <Skeleton className="h-16" />
      <Skeleton className="h-40" />
      {(slow || loadError) && (
        <Callout tone="neutral" role="status" title="Still loading the deal…">
          {loadError ? "The network is busy. Trying again…" : "This can take a few seconds on a busy network."}
        </Callout>
      )}
      <Skeleton className="h-64" />
    </div>
  );
}

/** Every page has exactly one h1; the invalid-link and not-found states have no other heading, so this is it. */
export function DealMessage({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mx-auto max-w-app px-4 py-12">
      <EmptyState pictogram="fake-listing" title={title} action={action} headingLevel="h1">
        {children}
      </EmptyState>
    </div>
  );
}
