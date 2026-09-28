import Link from "next/link";
import { cx } from "@/lib/cx";

const INK = "#16181D";
const MARKER = "#FFE14D";

/** The key drawn as a timeline on the Highlighter plate (brand guidelines §2). `simplified` below 24 px. */
export function LogoMark({ size = 32, simplified = false, className }: { size?: number; simplified?: boolean; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false" className={cx("shrink-0", className)}>
      <rect width="48" height="48" rx="10" fill={MARKER} />
      {simplified ? (
        <>
          <circle cx="15" cy="24" r="7" fill="none" stroke={INK} strokeWidth="5" />
          <path d="M22 24H40M31 24v7" stroke={INK} strokeWidth="5" strokeLinecap="square" />
        </>
      ) : (
        <>
          <circle cx="15" cy="24" r="6.5" fill="none" stroke={INK} strokeWidth="4" />
          <path d="M21.5 24H39M30 24v6.5M37 24v5" stroke={INK} strokeWidth="4" strokeLinecap="square" />
        </>
      )}
    </svg>
  );
}

/** Lockup: mark + "Keysfirst". Links home unless `href` is null. */
export function Logo({ inverse = false, size = 32, href = "/" }: { inverse?: boolean; size?: number; href?: string | null }) {
  const lockup = (
    <span className={cx("inline-flex items-center gap-2.5", inverse ? "text-fg-inverse" : "text-fg")}>
      <LogoMark size={size} />
      <span className="font-display font-bold tracking-[-0.01em]" style={{ fontSize: Math.round(size * 0.72) }}>
        Keysfirst
      </span>
    </span>
  );
  if (href === null) return lockup;
  return (
    <Link href={href} aria-label="Keysfirst home" className="inline-flex min-h-11 items-center rounded-md">
      {lockup}
    </Link>
  );
}
