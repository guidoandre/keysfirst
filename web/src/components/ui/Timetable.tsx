import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import { Icon } from "./Icon";

export type RowState = "done" | "now" | "next" | "later";

export interface TimetableRow {
  key: string;
  time?: ReactNode;
  title: ReactNode;
  detail?: ReactNode;
  state: RowState;
  tone?: "released" | "returned";
}

const MARK: Record<RowState, string> = {
  done: "bg-inverse text-fg-inverse",
  now: "border-2 border-fg bg-accent",
  next: "border-2 border-fg bg-canvas",
  later: "border-2 border-dashed border-field bg-canvas",
};

// The row's state in words for screen readers; sighted users read it from the marker and the Highlighter row.
const STATE_WORD: Record<RowState, string> = { done: "Done:", now: "Now:", next: "Next:", later: "Later:" };

/** The signature component: rules and deals as timetable rows (time | what happens | outcome). */
export function Timetable({
  title,
  aside,
  rows,
  footer,
  headingLevel = "h2",
  className,
}: {
  title?: ReactNode;
  aside?: ReactNode;
  rows: TimetableRow[];
  footer?: ReactNode;
  headingLevel?: "h2" | "h3" | "p";
  className?: string;
}) {
  const Heading = headingLevel;
  return (
    <section className={cx("overflow-hidden rounded-lg border-2 border-fg bg-canvas", className)}>
      {title && (
        <div className="flex items-baseline justify-between gap-3 bg-inverse px-4 py-3 text-fg-inverse">
          <Heading className="label">{title}</Heading>
          {aside && <span className="truncate text-sm text-fg-inverse-muted">{aside}</span>}
        </div>
      )}
      <ol className="divide-y divide-rule">
        {rows.map((row) => (
          <li
            key={row.key}
            aria-current={row.state === "now" ? "step" : undefined}
            className={cx(
              "grid grid-cols-[1.25rem_1fr] gap-x-3 gap-y-0.5 px-4 py-3.5 sm:grid-cols-[1.25rem_7rem_1fr]",
              row.state === "now" && "bg-accent-soft shadow-[inset_6px_0_0_var(--k-marker)]",
            )}
          >
            <span
              className={cx(
                "mt-1 grid size-4 place-items-center rounded-[4px]",
                row.tone === "released" ? "bg-released text-white" : row.tone === "returned" ? "bg-returned text-white" : MARK[row.state],
              )}
            >
              {row.state === "done" && <Icon name="check" size={12} className="[stroke-width:3]" />}
            </span>
            {row.time !== undefined && (
              <span className="col-start-2 font-display text-[0.95rem] leading-snug font-semibold text-fg-muted tabular-nums sm:col-start-auto">
                {row.time}
              </span>
            )}
            <div className="col-start-2 min-w-0 sm:col-start-auto">
              <p className="leading-snug font-semibold">
                <span className="sr-only">{STATE_WORD[row.state]} </span>
                {row.title}
              </p>
              {row.detail && <div className="mt-0.5 text-sm text-fg-muted">{row.detail}</div>}
            </div>
          </li>
        ))}
      </ol>
      {footer && <div className="border-t border-rule px-4 py-2.5 text-xs text-fg-muted">{footer}</div>}
    </section>
  );
}
