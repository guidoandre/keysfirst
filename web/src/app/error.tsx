"use client";

import { ErrorView } from "@/components/site/ErrorView";

/** Shown only when a group layout itself fails. The root layout has no <main> (the group layouts do), so this adds it. */
export default function ErrorPage(props: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main id="main" className="flex-1">
      <ErrorView {...props} />
    </main>
  );
}
