"use client";

import { ErrorView } from "@/components/site/ErrorView";

export default function ErrorPage(props: { error: Error & { digest?: string }; retry: () => void }) {
  return <ErrorView {...props} />;
}
