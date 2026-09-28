"use client";

import type { PublicKey } from "@solana/web3.js";
import { useEffect, useEffectEvent } from "react";
import { Callout } from "@/components/ui/Callout";
import { readBalance } from "@/lib/balance";
import { useConnection } from "@/lib/connection";
import { useAccount } from "./AccountProvider";

/** localStorage key of a card payment that hasn't been locked yet (survives a closed tab). */
export const pendingKey = (dealId: string) => `keysfirst:card:${dealId}`;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Back from Stripe: ask the server to confirm the payment and mint the deposit, wait until the balance shows it,
 * then hand back to the deal page, which locks it with the normal fund action (spec §4.3 steps 3–4).
 */
export function CardResume({
  session,
  dealId,
  account,
  amount,
  onReady,
  onError,
}: {
  session: string;
  dealId: string;
  account: PublicKey;
  amount: bigint;
  onReady: () => void;
  onError: (message: string) => void;
}) {
  const { connection } = useConnection();
  const { refreshBalance } = useAccount();
  const ready = useEffectEvent(onReady);
  const fail = useEffectEvent(onError);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const res = await fetch("/api/checkout/fulfil", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session }),
      }).catch(() => null);
      if (cancelled) return;
      if (!res || !res.ok) {
        const body = res ? await res.json().catch(() => ({})) : {};
        fail(body.error ?? "We couldn't confirm your card payment. Check your connection and reload the page.");
        return;
      }
      // The mint is confirmed; RPC nodes can lag a moment behind.
      for (let i = 0; i < 20 && !cancelled; i++) {
        const balance = await readBalance(connection, account).catch(() => 0n);
        if (balance >= amount) break;
        await sleep(1_000);
      }
      if (cancelled) return;
      await refreshBalance();
      try {
        localStorage.removeItem(pendingKey(dealId));
      } catch {
        // Storage blocked: nothing to clean up.
      }
      const url = new URL(window.location.href);
      url.searchParams.delete("paid");
      window.history.replaceState(window.history.state, "", url);
      ready();
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [session, dealId, account, amount, connection, refreshBalance]);

  return (
    <Callout tone="info" role="status" title="Payment received">
      Preparing your deposit. It locks automatically in a few seconds.
    </Callout>
  );
}
