"use client";

import { useState } from "react";
import { Button, type ButtonVariant } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { useAccount } from "./AccountProvider";

export function TestFundsButton({ variant = "secondary" }: { variant?: ButtonVariant }) {
  const { address: publicKey } = useAccount();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  if (!publicKey) return null;

  async function request() {
    if (!publicKey) return;
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account: publicKey.toBase58() }),
      });
      const body = await res.json();
      setResult(res.ok ? { ok: true, text: "Sent 1,000 Test EUR (and devnet SOL for fees if you had none)." } : { ok: false, text: body.error });
    } catch {
      setResult({ ok: false, text: "Could not reach the faucet. Try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button variant={variant} fullWidth loading={busy} loadingText="Sending test money…" onClick={request}>
        Get test funds
      </Button>
      {result && (
        <Callout tone={result.ok ? "success" : "danger"} role="status">
          {result.text}
        </Callout>
      )}
    </div>
  );
}
