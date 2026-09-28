"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatEur } from "@/lib/format";
import { useAccount } from "./AccountProvider";
import { WithdrawSheet } from "./WithdrawSheet";

/** "Your balance · Withdraw to bank", shown only when there is money to withdraw (spec D3). */
export function BalanceCard() {
  const { balance } = useAccount();
  const [open, setOpen] = useState(false);
  if (!balance) return null;
  return (
    <section aria-labelledby="balance" className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-subtle p-5">
      <div>
        <h2 id="balance" className="label text-fg-muted">
          Your balance
        </h2>
        <p className="mt-1 font-display text-section font-bold tabular-nums">{formatEur(balance)}</p>
      </div>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Withdraw to bank
      </Button>
      <WithdrawSheet open={open} onClose={() => setOpen(false)} />
    </section>
  );
}
