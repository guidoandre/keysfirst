"use client";

import type { PublicKey } from "@solana/web3.js";
import { useEffect, useEffectEvent, useState } from "react";
import { Callout } from "@/components/ui/Callout";
import { readBalance } from "@/lib/balance";
import { useConnection } from "@/lib/connection";
import { formatEur } from "@/lib/format";
import { useAccount } from "./AccountProvider";

/** localStorage key of a card payment that hasn't been locked yet (survives a closed tab). */
export const pendingKey = (dealId: string) => `keysfirst:card:${dealId}`;

type FulfilBody = { error?: string; deal?: string; account?: string; signature?: string };
type FulfilResult = { ok: boolean; status: number; body: FulfilBody };

// At most one fulfil request per session in flight per tab: StrictMode's double effects and remounts share it.
const inflight = new Map<string, Promise<FulfilResult>>();

function fulfil(session: string): Promise<FulfilResult> {
  const existing = inflight.get(session);
  if (existing) return existing;
  const request: Promise<FulfilResult> = fetch("/api/checkout/fulfil", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session }),
  })
    .then(async (res) => ({ ok: res.ok, status: res.status, body: ((await res.json().catch(() => ({}))) ?? {}) as FulfilBody }))
    .catch(() => ({ ok: false, status: 0, body: {} }))
    .finally(() => inflight.delete(session));
  inflight.set(session, request);
  return request;
}

/** Removes ?paid= from the address bar, so a reload doesn't resume the payment again. */
function stripPaid() {
  const url = new URL(window.location.href);
  url.searchParams.delete("paid");
  window.history.replaceState(window.history.state, "", url);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Drops the deal's saved session, but only if it is this one (a stale ?paid= must not discard a newer session). */
function forget(dealId: string, session: string) {
  try {
    if (localStorage.getItem(pendingKey(dealId)) === session) localStorage.removeItem(pendingKey(dealId));
  } catch {
    // Storage blocked: nothing to clean up.
  }
}

/**
 * Back from Stripe: ask the server to confirm the payment and mint the deposit, wait until the balance shows it,
 * then either hand back to the deal page, which locks it with the normal fund action (spec §4.3 steps 3–4), or,
 * when the deal can't take it any more, report that the money is in the balance.
 * Every paid session ends locked, in the balance, or with an error that keeps the session for a retry.
 */
export function CardResume({
  session,
  dealId,
  account,
  amount,
  lock,
  alreadyYours,
  onReady,
  onDone,
  onCancelled,
  onError,
}: {
  session: string;
  dealId: string;
  account: PublicKey;
  amount: bigint;
  /** True while the deal is open: after the payment, the deal page locks the deposit. */
  lock: boolean;
  /** True when this account already locked the deal (status past open): a leftover session needs no action. */
  alreadyYours: boolean;
  onReady: () => void;
  onDone: (message: string) => void;
  onCancelled: () => void;
  onError: (message: string) => void;
}) {
  const { connection } = useConnection();
  const { refreshBalance } = useAccount();
  const [received, setReceived] = useState(false);
  const ready = useEffectEvent(onReady);
  const done = useEffectEvent(onDone);
  const cancelledPayment = useEffectEvent(onCancelled);
  const fail = useEffectEvent(onError);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const res = await fulfil(session);
      if (cancelled) return;
      if (res.status === 402) {
        // Not paid (e.g. the tenant went back from Stripe's page): forget it quietly.
        forget(dealId, session);
        cancelledPayment();
        return;
      }
      if (!res.ok) {
        fail(res.body.error ?? "We couldn't confirm your card payment. Check your connection and try again.");
        return;
      }
      if (res.body.deal !== dealId) {
        forget(dealId, session);
        fail("This payment belongs to a different deal.");
        return;
      }
      if (res.body.account !== account.toBase58()) {
        fail("You paid while logged in with another account. Log in with that account to lock your deposit.");
        return;
      }
      if (!lock && alreadyYours) {
        // A stale saved session on a deal this account already locked: nothing left to do, clear it quietly.
        forget(dealId, session);
        stripPaid();
        cancelledPayment();
        return;
      }
      setReceived(true);
      // The mint is confirmed; RPC nodes can lag a moment behind.
      let arrived = false;
      for (let i = 0; i < 20 && !cancelled; i++) {
        const balance = await readBalance(connection, account).catch(() => 0n);
        if (balance >= amount) {
          arrived = true;
          break;
        }
        await sleep(1_000);
      }
      if (cancelled) return;
      if (!arrived) {
        fail("Your payment arrived. It's taking a moment to show up: reload the page in a minute to lock your deposit.");
        return;
      }
      await refreshBalance();
      if (cancelled) return;
      forget(dealId, session);
      stripPaid();
      if (lock) ready();
      else done(`Your ${formatEur(amount)} is in your balance. You can withdraw it to your bank from My deals.`);
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [session, dealId, account, amount, lock, alreadyYours, connection, refreshBalance]);

  return (
    <Callout tone="info" role="status">
      {!received ? "Checking your card payment…" : lock ? "Payment received. Locking your deposit…" : "Payment received."}
    </Callout>
  );
}
