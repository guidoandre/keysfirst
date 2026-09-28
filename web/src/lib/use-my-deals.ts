"use client";

import { useAccount } from "@/components/wallet/AccountProvider";
import { useConnection } from "./connection";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { mergeDeals, toSummary, type DealSummary } from "./dashboard";
import { toDealData } from "./deal-data";
import { getProgram } from "./program";
import { friendlyError } from "./send";

// Deal account layout: 8-byte discriminator, then landlord (32 bytes), then tenant (32 bytes).
const LANDLORD_OFFSET = 8;
const TENANT_OFFSET = 40;
// Two account lookups per refresh are heavier than the deal page's poll: refresh on demand, never on a timer.
const MIN_REFRESH_GAP_MS = 15_000;

export type MyDealsState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; deals: DealSummary[] }
  | { status: "error"; message: string };

type Stored = MyDealsState & { wallet: string | null };

/** The connected wallet's deals as landlord and as tenant, read straight from Solana (no database). */
export function useMyDeals(): { state: MyDealsState; refresh: () => void; wallet: string | null } {
  const { connection } = useConnection();
  const { address: publicKey } = useAccount();
  const program = useMemo(() => getProgram(connection), [connection]);
  const wallet = publicKey?.toBase58() ?? null;
  const [stored, setStored] = useState<Stored>({ status: "idle", wallet: null });
  const lastFetch = useRef(0);

  const load = useCallback(async () => {
    if (!wallet) return;
    lastFetch.current = Date.now();
    setStored((previous) => (previous.status === "ready" && previous.wallet === wallet ? previous : { status: "loading", wallet }));
    try {
      const [asLandlord, asTenant] = await Promise.all([
        program.account.deal.all([{ memcmp: { offset: LANDLORD_OFFSET, bytes: wallet } }]),
        program.account.deal.all([{ memcmp: { offset: TENANT_OFFSET, bytes: wallet } }]),
      ]);
      const summaries = [...asLandlord, ...asTenant]
        .map((item) => toSummary(item.publicKey.toBase58(), toDealData(item.account), wallet))
        .filter((d): d is DealSummary => d !== null);
      setStored({ status: "ready", deals: mergeDeals(summaries), wallet });
    } catch (e) {
      setStored({ status: "error", message: friendlyError(e), wallet });
    }
  }, [program, wallet]);

  useEffect(() => {
    if (!wallet) return;
    const first = setTimeout(() => void load(), 0);
    const onVisible = () => {
      if (!document.hidden && Date.now() - lastFetch.current > MIN_REFRESH_GAP_MS) void load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(first);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load, wallet]);

  const state: MyDealsState = !wallet ? { status: "idle" } : stored.wallet === wallet ? stored : { status: "loading" };
  return { state, refresh: () => void load(), wallet };
}
