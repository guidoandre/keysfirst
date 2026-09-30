"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { Sheet } from "@/components/ui/Sheet";
import { NavLinks, type NavItem } from "./NavLinks";

/** Tailwind's `lg`: from here the header shows the links itself and hides the menu button. */
const DESKTOP = "(min-width: 64rem)";

export function MobileMenu({ items, footer }: { items: NavItem[]; footer?: ReactNode }) {
  const [open, setOpen] = useState(false);

  // Close the menu if the window grows to desktop width while it's open (rotated tablet, resized window).
  useEffect(() => {
    if (!open) return;
    const desktop = window.matchMedia(DESKTOP);
    const close = (event: MediaQueryListEvent) => {
      if (event.matches) setOpen(false);
    };
    desktop.addEventListener("change", close);
    return () => desktop.removeEventListener("change", close);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label="Menu"
        className="grid size-11 place-items-center rounded-md border-[1.5px] border-field hover:bg-subtle lg:hidden"
      >
        <Icon name="menu" />
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Menu">
        <nav aria-label="Main">
          <NavLinks items={items} orientation="column" onNavigate={() => setOpen(false)} />
        </nav>
        {footer && <div className="mt-4 border-t border-rule pt-4">{footer}</div>}
      </Sheet>
    </>
  );
}
