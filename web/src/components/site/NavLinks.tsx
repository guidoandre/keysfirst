"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HIT_AREA } from "@/components/ui/Button";
import { cx } from "@/lib/cx";

export interface NavItem {
  href: string;
  label: string;
  /** false: don't prefetch (a wallet page linked from a marketing page). */
  prefetch?: false;
}

export function NavLinks({
  items,
  orientation = "row",
  onNavigate,
}: {
  items: NavItem[];
  orientation?: "row" | "column";
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <ul className={orientation === "row" ? "flex items-center gap-7" : "flex flex-col gap-1"}>
      {items.map((item) => {
        const current = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              prefetch={item.prefetch}
              onClick={onNavigate}
              aria-current={current ? "page" : undefined}
              className={cx("font-semibold", orientation === "column" ? "flex min-h-11 items-center rounded-md px-2 text-lg hover:bg-subtle" : HIT_AREA)}
            >
              {/* The Highlighter stroke draws in on hover and stays under the current page (.link-draw) */}
              <span className="link-draw">{item.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
