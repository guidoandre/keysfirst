"use client";

import type { PublicKey } from "@solana/web3.js";
import { useEffect, useEffectEvent, useState } from "react";
import { Callout } from "@/components/ui/Callout";
import { readBalance } from "@/lib/balance";
import { useConnection } from "@/lib/connection";
import { formatEur } from "@/lib/format";
import { useAccount } from "./AccountProvider";

/**
 * localStorage key of a card payment that hasn't been locked yet (survives a closed tab). Per account, so a payment
 * left half-way by one account never blocks another account testing the same deal in this browser.
 */
export const pendingKey = (dealId: string, account: string) => `keysfirst:card:${dealId}:${account}`;

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

/** Drops the saved session, but only if it is this one (a stale ?paid= must not discard a newer session). */
function forget(dealId: string, account: string, session: string) {
  try {
    if (localStorage.getItem(pendingKey(dealId, account)) === session) localStorage.removeItem(pendingKey(dealId, account));
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
  /** The session needs no more work; `message` explains why when the tenant should know (e.g. an unknown payment). */
  onCancelled: (message?: string) => void;
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
    const me = account.toBase58();
    async function run() {
      const res = await fulfil(session);
      if (cancelled) return;
      if (res.status === 402) {
        // Not paid (e.g. the tenant went back from Stripe's page): forget it quietly.
        forget(dealId, me, session);
        cancelledPayment();
        return;
      }
      if (res.status === 404) {
        // Stripe doesn't know this session: it can never be paid out, so free the card button.
        forget(dealId, me, session);
        stripPaid();
        cancelledPayment(res.body.error ?? "We can't find this card payment. Start the payment again.");
        return;
      }
      if (!res.ok) {
        fail(res.body.error ?? "We couldn't confirm your card payment. Check your connection and try again.");
        return;
      }
      // Both cases can never be finished here: say why once and free the page (a retry would only repeat it).
      if (res.body.deal !== dealId) {
        forget(dealId, me, session);
        stripPaid();
        cancelledPayment("That card payment belongs to a different deal. Open the deal you paid for to lock it.");
        return;
      }
      if (res.body.account !== me) {
        stripPaid();
        cancelledPayment(
          "That card payment was made with another account, and its deposit is in that account's balance. Log in with it to lock the deposit.",
        );
        return;
      }
      if (!lock && alreadyYours) {
        // A stale saved session on a deal this account already locked: nothing left to do, clear it quietly.
        forget(dealId, me, session);
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
      forget(dealId, me, session);
      stripPaid();
      if (lock) ready();
      else done(`Your ${formatEur(amount)} is in your balance. You can withdraw it to your bank from your account menu.`);
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
