"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useState } from "react";

export function TestFundsButton() {
  const { publicKey } = useWallet();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  if (!publicKey) return null;

  async function request() {
    if (!publicKey) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account: publicKey.toBase58() }),
      });
      const body = await res.json();
      setMessage(res.ok ? "Sent 1,000 Test EUR (and devnet SOL for fees if you had none)." : body.error);
    } catch {
      setMessage("Could not reach the faucet. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="text-center text-sm">
      <button type="button" onClick={request} disabled={busy} className="underline disabled:opacity-50">
        {busy ? "Sending test money…" : "Get test funds (devnet)"}
      </button>
      {message && <p className="mt-1 text-stone-600">{message}</p>}
    </div>
  );
}
