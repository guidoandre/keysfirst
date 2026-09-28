"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatEur } from "@/lib/format";
import { useAccount } from "./AccountProvider";
import { WithdrawSheet } from "./WithdrawSheet";

/** "Your balance · Withdraw to bank", shown whenever the balance is known, €0.00 included (spec D3). */
export function BalanceCard() {
  const { balance } = useAccount();
  const [open, setOpen] = useState(false);
  if (balance === null) return null;
  const empty = balance === 0n;
  return (
    <>
      <section aria-labelledby="balance" className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-subtle p-5">
        <div>
          <h2 id="balance" className="label text-fg-muted">
            Your balance
          </h2>
          <p className="mt-1 font-display text-section font-bold tabular-nums">{formatEur(balance)}</p>
          {empty && <p className="mt-1 text-sm text-fg-muted">Money you receive shows up here.</p>}
        </div>
        <Button variant="secondary" onClick={() => setOpen(true)} disabled={empty}>
          Withdraw to bank
        </Button>
      </section>
      {/* Outside the balance-dependent markup: the confirmation survives the balance dropping to €0.00. */}
      <WithdrawSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}
