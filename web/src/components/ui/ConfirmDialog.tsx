"use client";

import { Button } from "./Button";
import { Sheet } from "./Sheet";

/** In-page confirmation for irreversible actions (release, cancel, landlord refund). */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  danger = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Sheet open={open} onClose={onCancel} title={title}>
      <p className="text-body text-fg-muted">{body}</p>
      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        <Button variant="secondary" fullWidth onClick={onCancel}>
          Go back
        </Button>
        <Button variant={danger ? "danger" : "primary"} fullWidth onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Sheet>
  );
}
