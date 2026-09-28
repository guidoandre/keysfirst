import { cx } from "@/lib/cx";

/** Static placeholder block (no shimmer, per the motion rules). */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cx("rounded-md bg-subtle", className)} />;
}
