"use client";

import { useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { Sheet } from "@/components/ui/Sheet";
import { NavLinks, type NavItem } from "./NavLinks";

export function MobileMenu({ items, footer }: { items: NavItem[]; footer?: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="grid size-11 place-items-center rounded-md border-[1.5px] border-rule hover:bg-subtle lg:hidden"
      >
        <Icon name="menu" label="Menu" />
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
