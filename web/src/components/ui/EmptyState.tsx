import type { ReactNode } from "react";
import { Pictogram, type PictogramName } from "@/components/brand/Pictogram";

/**
 * `headingLevel` (default "h2"): the title's heading element. Pass "h1" when EmptyState is the page's only heading
 * (e.g. a "deal not found" page): every page has exactly one h1.
 */
export function EmptyState({
  pictogram,
  title,
  children,
  action,
  headingLevel = "h2",
}: {
  pictogram: PictogramName;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  headingLevel?: "h1" | "h2";
}) {
  const Heading = headingLevel;
  return (
    <div className="rounded-lg border-[1.5px] border-dashed border-field px-5 py-10 text-center">
      <Pictogram name={pictogram} size={64} className="mx-auto" />
      <Heading className="mt-4 font-display text-section font-bold">{title}</Heading>
      {children && <div className="mx-auto mt-2 max-w-md text-body text-fg-muted">{children}</div>}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}
