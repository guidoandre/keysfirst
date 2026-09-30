"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { TextField } from "@/components/ui/Field";
import { Sheet } from "@/components/ui/Sheet";
import { useConnection } from "@/lib/connection";
import { formatEur, parseEur } from "@/lib/format";
import { isValidIban, maskIban } from "@/lib/iban";
import { withdrawIx } from "@/lib/instructions";
import { friendlyError, needsTopUp, signAndSend } from "@/lib/send";
import { useAccount } from "./AccountProvider";

/** Amount, name and IBAN; signing removes the money from the account; the payout is a demo (spec §4.4). */
export function WithdrawSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { connection } = useConnection();
  const { address, wallet, balance, refreshBalance, topUp } = useAccount();
  const [amountText, setAmountText] = useState("");
  const [name, setName] = useState("");
  const [iban, setIban] = useState("");
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ amount: string; iban: string } | null>(null);
  // Two instances live on a page (account menu + balance card): field ids must be unique.
  const idBase = useId();

  // "Leave empty to withdraw everything" must use today's balance, not the one read when the page loaded.
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => void refreshBalance(), 0);
    return () => clearTimeout(timer);
  }, [open, refreshBalance]);

  const available = balance ?? 0n;
  // Empty amount means "everything".
  const amount = amountText.trim() === "" ? available : parseEur(amountText);
  const errors = {
    amount: amount === null || amount <= 0n ? "Enter an amount, like 600." : amount > available ? `You have ${formatEur(available)}.` : undefined,
    name: name.trim() === "" ? "Enter the account holder's name." : undefined,
    iban: isValidIban(iban) ? undefined : "Check the IBAN: it should look like DE89 3704 0044 0532 0130 00.",
  };
  const valid = !errors.amount && !errors.name && !errors.iban;

  function close() {
    if (busy) return; // the withdrawal is being sent: its outcome must be seen
    setDone(null);
    setError(null);
    setChecked(false);
    onClose();
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setChecked(true);
    if (!valid || !address || amount === null) return;
    setBusy(true);
    setError(null);
    try {
      await signAndSend(connection, wallet, [withdrawIx(address, amount)]);
      setDone({ amount: formatEur(amount), iban: maskIban(iban) });
      setAmountText("");
      await refreshBalance();
    } catch (e) {
      const message = friendlyError(e, "withdraw");
      if (needsTopUp(message)) void topUp();
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} onClose={close} title="Withdraw to bank" dismissible={!busy}>
      {done ? (
        <div className="space-y-4">
          <Callout tone="success" role="status" title={`${done.amount} is on its way`}>
            To {done.iban}. It usually arrives in 1–2 business days. Demo: no real money moves.
          </Callout>
          <Button fullWidth onClick={close}>
            Done
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-4">
          <p className="text-fg-muted">
            Your balance: <span className="font-semibold text-fg tabular-nums">{formatEur(available)}</span>
          </p>
          <TextField
            id={`${idBase}-amount`}
            label="Amount in €"
            inputMode="decimal"
            // Plain digits: the format the field accepts ("1234.56", not "1,234.56").
            placeholder={(Number(available / 10_000n) / 100).toFixed(2)}
            hint="Leave empty to withdraw everything."
            value={amountText}
            onChange={(e) => setAmountText(e.target.value)}
            error={checked ? errors.amount : undefined}
          />
          <TextField
            id={`${idBase}-name`}
            label="Account holder"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={checked ? errors.name : undefined}
          />
          <TextField
            id={`${idBase}-iban`}
            label="IBAN"
            autoComplete="off"
            spellCheck={false}
            value={iban}
            onChange={(e) => setIban(e.target.value)}
            error={checked ? errors.iban : undefined}
          />
          {error && (
            <Callout tone="danger" role="alert">
              {error}
            </Callout>
          )}
          <Button type="submit" size="lg" fullWidth loading={busy} loadingText="Sending…" disabled={available === 0n}>
            {amount && amount > 0n && amount <= available ? `Withdraw ${formatEur(amount)}` : "Withdraw"}
          </Button>
          <p className="text-sm text-fg-muted">Demo: the money leaves your Keysfirst balance, but no real bank transfer happens.</p>
        </form>
      )}
    </Sheet>
  );
}
