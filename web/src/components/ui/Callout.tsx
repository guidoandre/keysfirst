import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import { Icon, type IconName } from "./Icon";

export type CalloutTone = "info" | "success" | "returned" | "danger" | "neutral";

const TONES: Record<CalloutTone, { box: string; icon: IconName; iconColor: string }> = {
  info: { box: "bg-accent-soft before:bg-accent", icon: "info", iconColor: "text-fg" },
  success: { box: "bg-released-soft before:bg-released", icon: "check", iconColor: "text-released" },
  returned: { box: "bg-returned-soft before:bg-returned", icon: "return", iconColor: "text-returned" },
  danger: { box: "bg-danger-soft before:bg-danger", icon: "alert", iconColor: "text-danger" },
  neutral: { box: "bg-subtle before:bg-field", icon: "info", iconColor: "text-fg-muted" },
};

export function Callout({
  tone = "info",
  title,
  children,
  role,
  className,
}: {
  tone?: CalloutTone;
  title?: string;
  children?: ReactNode;
  role?: "status" | "alert";
  className?: string;
}) {
  const t = TONES[tone];
  return (
    <div
      role={role}
      className={cx(
        "relative flex gap-3 overflow-hidden rounded-md py-3 pr-4 pl-5 text-sm leading-relaxed text-fg before:absolute before:inset-y-0 before:left-0 before:w-1",
        t.box,
        className,
      )}
    >
      <Icon name={t.icon} size={18} className={cx("mt-0.5 shrink-0", t.iconColor)} />
      <div className="min-w-0 space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div>{children}</div>}
      </div>
    </div>
  );
}
