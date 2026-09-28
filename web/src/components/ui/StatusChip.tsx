import { cx } from "@/lib/cx";
import { STATUS_LABEL, type DealStatus } from "@/lib/rules";
import { Icon, type IconName } from "./Icon";

const LOOK: Record<DealStatus, { chip: string; icon: IconName; onBandIcon: string }> = {
  open: { chip: "border-[1.5px] border-field bg-canvas text-fg", icon: "hourglass", onBandIcon: "text-fg" },
  funded: { chip: "bg-inverse text-fg-inverse", icon: "lock", onBandIcon: "text-fg" },
  released: { chip: "bg-released text-white", icon: "check", onBandIcon: "text-released" },
  refunded: { chip: "bg-returned text-white", icon: "return", onBandIcon: "text-returned" },
  cancelled: { chip: "bg-subtle text-fg-muted", icon: "close", onBandIcon: "text-fg-muted" },
};

/**
 * One of the five fixed status labels (product spec §8), never uppercased.
 * tone "onBand": a white chip for use on a coloured deal band. `animate`: flips in; pass true only when
 * the status changed while the page was open.
 */
export function StatusChip({
  status,
  size = "md",
  tone = "default",
  animate = false,
  className,
}: {
  status: DealStatus;
  size?: "sm" | "md";
  tone?: "default" | "onBand";
  animate?: boolean;
  className?: string;
}) {
  const look = LOOK[status];
  return (
    <span className={cx("inline-block [perspective:400px]", className)}>
      <span
        key={status}
        className={cx(
          "inline-flex items-center gap-1.5 rounded-sm font-display font-semibold",
          size === "md" ? "px-2.5 py-1.5 text-[0.9375rem]" : "px-2 py-1 text-[0.8125rem]",
          tone === "onBand" ? "bg-canvas text-fg" : look.chip,
          animate && "animate-flip",
        )}
      >
        <Icon
          name={look.icon}
          size={size === "md" ? 16 : 14}
          className={cx(tone === "onBand" ? look.onBandIcon : status === "funded" && "text-accent")}
        />
        {STATUS_LABEL[status]}
      </span>
    </span>
  );
}
