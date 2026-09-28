"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useState } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Sheet } from "@/components/ui/Sheet";
import { shortAddress } from "@/lib/format";
import { TestFundsButton } from "./TestFundsButton";

/** The logged-in state: short address + a menu (My deals, Get test funds, Copy address, Log out). */
export function WalletChip() {
  const { publicKey, disconnect } = useWallet();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  if (!publicKey) return null;
  const address = publicKey.toBase58();

  async function copy() {
    try {
      await navigator.clipboard.writeText(address);
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
        className="inline-flex h-11 items-center gap-2 rounded-full border-[1.5px] border-field px-3.5 text-sm font-semibold tabular-nums hover:bg-subtle"
      >
        <span aria-hidden="true" className="size-2 rounded-full bg-released" />
        <span className="sr-only">Your wallet: </span>
        {shortAddress(address)}
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Your wallet">
        <p className="break-all rounded-md bg-subtle p-3 font-mono text-sm text-fg-muted">{address}</p>
        <div className="mt-4 grid gap-2">
          <ButtonLink href="/deals" variant="secondary" fullWidth onClick={() => setOpen(false)}>
            My deals
          </ButtonLink>
          <Button variant="secondary" fullWidth onClick={copy}>
            <Icon name={copied ? "check" : "copy"} size={18} />
            {copied ? "Copied" : "Copy address"}
          </Button>
          <TestFundsButton />
          <Button
            variant="quiet"
            className="mt-2 justify-center"
            onClick={() => {
              void disconnect();
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
