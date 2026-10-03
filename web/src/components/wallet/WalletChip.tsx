"use client";

import { useState } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { Sheet } from "@/components/ui/Sheet";
import { cx } from "@/lib/cx";
import { useDemoMode } from "@/lib/demo-mode";
import { formatEur } from "@/lib/format";
import { useAccount } from "./AccountProvider";
import { WithdrawSheet } from "./WithdrawSheet";

/** The logged-in state: email (or short account number) + a menu. */
export function WalletChip() {
  const { address, label, balance, logout, refreshBalance } = useAccount();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [demoMode, setDemoMode] = useDemoMode(address?.toBase58() ?? null);
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
        onClick={() => {
          setOpen(true);
          void refreshBalance();
        }}
        aria-haspopup="dialog"
        className="inline-flex h-11 max-w-[9.5rem] min-w-0 items-center gap-2 rounded-full border-[1.5px] border-field pr-3.5 pl-1 text-sm font-semibold hover:bg-subtle sm:max-w-[15rem]"
      >
        <Avatar />
        <span className="sr-only">Your account: </span>
        <span className="truncate">{label}</span>
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Your account">
        <p className="text-fg-muted">{label}</p>
        <p className="mt-1 text-sm text-fg-muted">
          Balance: <span className="font-semibold text-fg tabular-nums">{balance === null ? "…" : formatEur(balance)}</span>
        </p>
        <div className="mt-4 grid gap-2">
          {balance ? (
            <Button
              fullWidth
              onClick={() => {
                setOpen(false);
                setWithdrawing(true);
              }}
            >
              Withdraw to bank
            </Button>
          ) : null}
          <ButtonLink href="/deals" variant="secondary" fullWidth onClick={() => setOpen(false)}>
            My deals
          </ButtonLink>
          <Button variant="secondary" fullWidth onClick={copy}>
            <Icon name={copied ? "check" : "copy"} size={18} />
            {copied ? "Copied" : "Copy your account number"}
          </Button>
          <p aria-live="polite" className="sr-only">
            {copied ? "Copied to the clipboard" : ""}
          </p>
          {/* A setting, not an action: a switch row (role="switch"), the whole row is the hit area */}
          <button
            type="button"
            role="switch"
            aria-checked={demoMode}
            onClick={() => setDemoMode(!demoMode)}
            className="mt-2 flex w-full items-center justify-between gap-4 rounded-md border-[1.5px] border-field px-4 py-3 text-left hover:bg-subtle"
          >
            <span>
              <span className="block font-semibold">Demo mode</span>
              <span className="block text-sm text-fg-muted">Shortcuts for trying it out: demo values and a 5-minute window when you create a deal.</span>
            </span>
            <span
              aria-hidden="true"
              className={cx(
                "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200",
                demoMode ? "bg-fg" : "bg-field",
              )}
            >
              <span
                className={cx(
                  "absolute top-0.5 left-0.5 size-5 rounded-full bg-canvas shadow-sm transition-transform duration-200 ease-out",
                  demoMode && "translate-x-5",
                )}
              />
            </span>
          </button>
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
      <WithdrawSheet open={withdrawing} onClose={() => setWithdrawing(false)} />
    </>
  );
}
