import Link from "next/link";
import { cx } from "@/lib/cx";
import { MarkSvg } from "./mark";

/** The padlock-K mark on the Highlighter plate (brand guidelines §2). One drawing at every size. */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return <MarkSvg size={size} className={cx("shrink-0", className)} />;
}

/** Lockup: mark + "Keysfirst" in Barlow ExtraBold. Links home unless `href` is null. */
export function Logo({ inverse = false, size = 32, href = "/" }: { inverse?: boolean; size?: number; href?: string | null }) {
  const lockup = (
    <span className={cx("inline-flex items-center", inverse ? "text-fg-inverse" : "text-fg")} style={{ gap: Math.round(size * 0.3) }}>
      <LogoMark size={size} />
      <span className="font-sans leading-none font-extrabold tracking-[-0.02em]" style={{ fontSize: Math.round(size * 0.74) }}>
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
