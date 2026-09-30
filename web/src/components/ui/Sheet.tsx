"use client";

import { useEffect, useId, useRef, type MouseEvent, type ReactNode } from "react";
import { cx } from "@/lib/cx";
import { Icon } from "./Icon";

/**
 * Modal built on the native <dialog> (replaces window.confirm, which in-app browsers can block):
 * the browser traps focus, Esc closes, focus returns to the opener.
 * "sheet": bottom sheet on phones, centred from sm up. "full": covers the screen (handover mode, Released).
 * `onClose` runs only when the viewer closes it (Esc, the backdrop, the close button, or a control that calls it);
 * when the parent sets `open` to false, the parent already knows. `dismissible={false}` keeps it open while work that
 * must not be abandoned is running (e.g. a transaction being sent).
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  variant = "sheet",
  className,
  dismissible = true,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  variant?: "sheet" | "full";
  className?: string;
  dismissible?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  /** True from the parent's close until its `close` event (the browser fires it in a later task). */
  const closedByParent = useRef(false);
  /** True when the current press started on the backdrop: a drag that ends there (e.g. selecting text) isn't a click on it. */
  const pressedOnBackdrop = useRef(false);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) {
      closedByParent.current = true;
      dialog.close();
    }
  }, [open]);

  function handleClose() {
    if (closedByParent.current) {
      closedByParent.current = false;
      return;
    }
    onClose();
  }

  function close() {
    if (dismissible) onClose();
  }

  function closeOnBackdrop(event: MouseEvent<HTMLDialogElement>) {
    // A click on the <dialog> element itself (not its content) is a click on the backdrop.
    if (event.target === event.currentTarget && pressedOnBackdrop.current) close();
    pressedOnBackdrop.current = false;
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={handleClose}
      onCancel={(event) => {
        // Esc: the browser would close the dialog itself.
        if (!dismissible) event.preventDefault();
      }}
      onPointerDown={(event) => {
        pressedOnBackdrop.current = event.target === event.currentTarget;
      }}
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
                onClick={close}
                disabled={!dismissible}
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
