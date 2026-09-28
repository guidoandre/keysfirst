"use client";

import { useState } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Sheet } from "@/components/ui/Sheet";
import { useAccount } from "./AccountProvider";

/** The logged-in state: email (or short account number) + a menu. */
export function WalletChip() {
  const { address, label, logout } = useAccount();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  if (!address || !label) return null;
  const accountNumber = address.toBase58();

  async function copy() {
    try {
      await navigator.clipboard.writeText(accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="inline-flex h-11 max-w-[14rem] items-center gap-2 rounded-full border-[1.5px] border-field px-3.5 text-sm font-semibold hover:bg-subtle"
      >
        <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-released" />
        <span className="sr-only">Your account: </span>
        <span className="truncate">{label}</span>
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Your account">
        <p className="text-fg-muted">{label}</p>
        <div className="mt-4 grid gap-2">
          <ButtonLink href="/deals" variant="secondary" fullWidth onClick={() => setOpen(false)}>
            My deals
          </ButtonLink>
          <Button variant="secondary" fullWidth onClick={copy}>
            <Icon name={copied ? "check" : "copy"} size={18} />
            {copied ? "Copied" : "Copy account number"}
          </Button>
          <p aria-live="polite" className="sr-only">
            {copied ? "Copied to the clipboard" : ""}
          </p>
          <Button
            variant="quiet"
            className="mt-2 justify-center"
            onClick={() => {
              logout().catch(() => undefined);
              setOpen(false);
            }}
          >
            <Icon name="logout" size={18} />
            Log out
          </Button>
        </div>
      </Sheet>
    </>
  );
}
