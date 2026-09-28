"use client";

import { useEffect, useId, useRef, type MouseEvent, type ReactNode } from "react";
import { cx } from "@/lib/cx";
import { Icon } from "./Icon";

/**
 * Modal built on the native <dialog> (replaces window.confirm, which in-app browsers can block):
 * the browser traps focus, Esc closes, focus returns to the opener.
 * "sheet": bottom sheet on phones, centred from sm up. "full": covers the screen (handover mode, Released).
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  variant = "sheet",
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  variant?: "sheet" | "full";
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function closeOnBackdrop(event: MouseEvent<HTMLDialogElement>) {
    // A click on the <dialog> element itself (not its content) is a click on the backdrop.
    if (event.target === event.currentTarget) onClose();
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={variant === "sheet" ? closeOnBackdrop : undefined}
      className={cx(
        "p-0 text-fg",
        variant === "sheet"
          ? "m-0 mt-auto w-full max-w-none overflow-hidden rounded-t-xl bg-canvas shadow-sheet backdrop:bg-inverse/50 max-sm:animate-sheet sm:m-auto sm:max-w-md sm:rounded-xl sm:animate-rise"
          : "m-0 h-dvh max-h-none w-full max-w-none bg-canvas backdrop:bg-inverse",
        className,
      )}
    >
      {open &&
        (variant === "sheet" ? (
          <div className="max-h-[85dvh] overflow-y-auto px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 id={titleId} className="font-display text-card font-bold">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="-mr-2 grid size-11 shrink-0 place-items-center rounded-md hover:bg-subtle"
              >
                <Icon name="close" />
              </button>
            </div>
            {children}
          </div>
        ) : (
          <>
            <h2 id={titleId} className="sr-only">
              {title}
            </h2>
            {children}
          </>
        ))}
    </dialog>
  );
}
