"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HIT_AREA } from "@/components/ui/Button";
import { cx } from "@/lib/cx";

export interface NavItem {
  href: string;
  label: string;
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
              onClick={onNavigate}
              aria-current={current ? "page" : undefined}
              className={cx(
                "font-semibold decoration-accent decoration-[3px] underline-offset-[6px] hover:underline",
                orientation === "column" ? "flex min-h-11 items-center rounded-md px-2 text-lg hover:bg-subtle" : HIT_AREA,
                current && "underline",
              )}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
