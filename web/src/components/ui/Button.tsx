import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/cx";
import { Icon } from "./Icon";
import { PendingLabel } from "./PendingLabel";

export type ButtonVariant = "primary" | "secondary" | "quiet" | "danger";
export type ButtonSize = "sm" | "md" | "lg";
export interface ButtonLook {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

/**
 * An invisible hit area of at least 44 × 44 px, centred on a small link or button (design system §5: touch targets).
 * Nothing moves or changes colour; it only widens where a tap lands. Leave at least 8 px to the next target.
 */
export const HIT_AREA =
  "relative after:absolute after:top-1/2 after:left-1/2 after:h-[max(100%,2.75rem)] after:w-[max(100%,2.75rem)] after:-translate-x-1/2 after:-translate-y-1/2";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-md text-center font-semibold leading-tight transition-[background-color,color,border-color] duration-150 ease-out active:translate-y-px disabled:cursor-not-allowed disabled:active:translate-y-0";
const SIZES: Record<ButtonSize, string> = {
  // 40 px tall (header only); HIT_AREA pads the tap area to 44 px.
  sm: `min-h-(--btn-h-sm) px-4 py-1.5 text-[0.9375rem] ${HIT_AREA}`,
  md: "min-h-(--btn-h) px-5 py-2.5 text-base",
  lg: "min-h-(--btn-h-lg) px-6 py-3 text-lg",
};
const VARIANTS: Record<Exclude<ButtonVariant, "quiet">, string> = {
  // Hover: a 4 px Highlighter bar inside the bottom edge (design system §5).
  primary:
    "bg-inverse text-fg-inverse hover:[background-image:linear-gradient(to_top,var(--k-marker)_4px,transparent_4px)] disabled:bg-subtle disabled:text-fg-subtle disabled:[background-image:none]",
  secondary: "border-2 border-fg bg-canvas text-fg hover:bg-subtle disabled:border-rule disabled:bg-canvas disabled:text-fg-subtle",
  danger: "border-2 border-danger bg-canvas text-danger hover:bg-danger-soft disabled:border-rule disabled:text-fg-subtle",
};
const QUIET = `inline-flex items-center gap-1.5 rounded-sm font-semibold text-fg underline decoration-accent decoration-2 underline-offset-4 hover:decoration-[3px] ${HIT_AREA}`;

export function buttonClass({ variant = "primary", size = "md", fullWidth = false }: ButtonLook = {}): string {
  if (variant === "quiet") return QUIET;
  return cx(BASE, SIZES[size], VARIANTS[variant], fullWidth && "w-full");
}

export function Button({
  variant,
  size,
  fullWidth,
  loading = false,
  loadingText,
  className,
  children,
  disabled,
  type = "button",
  ...rest
}: ButtonLook & { loading?: boolean; loadingText?: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(buttonClass({ variant, size, fullWidth }), className)}
      {...rest}
    >
      {loading ? (
        <>
          <Icon name="spinner" size={18} className="animate-spin" />
          {loadingText ?? children}
        </>
      ) : (
        children
      )}
    </button>
  );
}

/** `prefetch={false}` (a marketing page's link into a wallet page): a spinner shows after the label while that page loads. */
export function ButtonLink({
  href,
  variant,
  size,
  fullWidth,
  external = false,
  prefetch,
  className,
  children,
  ...rest
}: ButtonLook & { href: string; external?: boolean; prefetch?: boolean; children: ReactNode } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  const cls = cx(buttonClass({ variant, size, fullWidth }), className);
  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={cls} {...rest}>
        {children}
        <Icon name="external" size={16} />
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    );
  }
  return (
    <Link href={href} prefetch={prefetch} className={cls} {...rest}>
      {prefetch === false ? <PendingLabel centred={variant !== "quiet"}>{children}</PendingLabel> : children}
    </Link>
  );
}
