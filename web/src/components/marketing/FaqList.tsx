import Link from "next/link";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import type { FaqEntry } from "@/content/faq";
import { isAppRoute } from "@/lib/site";

/** Native <details>: keyboard and screen-reader friendly, no JavaScript. */
export function FaqList({ entries }: { entries: FaqEntry[] }) {
  return (
    <div className="divide-y divide-rule border-y border-rule">
      {entries.map((entry) => (
        <details key={entry.id} id={entry.id} className="group scroll-mt-24">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 font-display text-card font-bold [&::-webkit-details-marker]:hidden">
            {entry.question}
            <Icon name="chevron-down" size={22} className="shrink-0 transition-transform duration-150 group-open:rotate-180" />
          </summary>
          <div className="space-y-3 pb-5 text-body text-fg-muted">
            {entry.answer.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {entry.link && (
              <p>
                <Link href={entry.link.href} prefetch={isAppRoute(entry.link.href) ? false : undefined} className={buttonClass({ variant: "quiet" })}>
                  {entry.link.label}
                </Link>
              </p>
            )}
          </div>
        </details>
      ))}
    </div>
  );
}
