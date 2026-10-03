"use client";

import { useLinkStatus } from "next/link";
import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import { Icon } from "./Icon";

/**
 * The label of a ButtonLink that doesn't prefetch: a marketing page's link into a wallet page, whose code loads on tap.
 * While that navigation is pending, a spinner appears after the label. The spinner is absolutely positioned and, in a
 * filled or outlined button (`centred`), the label slides left by half the spinner's width (a transform), so label and
 * spinner stay centred and the button never changes size. Must be rendered inside the <Link> (useLinkStatus reads it).
 * `inPage`: a link to a spot on the same page (#…) loads nothing, so it never shows the spinner (the wrapper stays, so a
 * button whose link switches between the two keeps the same markup).
 */
export function PendingLabel({ children, centred, inPage = false }: { children: ReactNode; centred: boolean; inPage?: boolean }) {
  const pending = useLinkStatus().pending && !inPage;
  return (
    // -translate-x-3 = half of ml-2 (8 px) + the 16 px icon.
    <span className={cx("relative", centred && "transition-[translate] duration-150 ease-out", centred && pending && "-translate-x-3")}>
      {children}
      {pending && (
        <span className="absolute inset-y-0 left-full ml-2 flex items-center">
          <Icon name="spinner" size={16} className="animate-spin" />
        </span>
      )}
    </span>
  );
}
