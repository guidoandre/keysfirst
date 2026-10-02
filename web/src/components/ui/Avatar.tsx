import { cx } from "@/lib/cx";
import { Icon } from "./Icon";

/** The logged-in mark: a person in a Highlighter circle. Decorative: the control around it carries the words. */
export function Avatar({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cx("grid size-8 shrink-0 place-items-center rounded-full bg-accent text-fg", className)}>
      <Icon name="user" size={18} />
    </span>
  );
}
