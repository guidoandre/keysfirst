"use client";

import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { dealSignatures, getProgram, type DealAccount } from "./program";
import { statusOf, timelineTransactionCount, type DealStatus } from "./rules";

export interface DealState {
  address: PublicKey | null;
  /** undefined while loading, null when no deal exists at this address. */
  deal: DealAccount | null | undefined;
  signatures: string[];
  loadError: string | null;
  /** True once the status changed while this page was open (the status chip flips). */
  statusChanged: boolean;
  /** True when this page saw the deal go from locked to released (opens the landlord's Released screen). */
  justReleased: boolean;
  refresh: () => Promise<void>;
}

export function useDeal(id: string): DealState {
  const { connection } = useConnection();
  const program = useMemo(() => getProgram(connection), [connection]);
  const address = useMemo(() => {
    try {
      return new PublicKey(id);
    } catch {
      return null;
    }
  }, [id]);
  const [deal, setDeal] = useState<DealAccount | null | undefined>(undefined);
  const [signatures, setSignatures] = useState<string[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusChanged, setStatusChanged] = useState(false);
  const [justReleased, setJustReleased] = useState(false);
  const signatureCount = useRef(0);
  const lastStatus = useRef<DealStatus | null>(null);

  // The public devnet RPC rate-limits per network (a laptop and a phone on the same Wi-Fi share it),
  // so each poll reads only the deal and fetches the transaction list only while a timeline link is missing.
  const refresh = useCallback(async () => {
    if (!address) return;
    const data = await program.account.deal.fetchNullable(address);
    setDeal(data);
    if (!data) return;
    const status = statusOf(data.status);
    const previous = lastStatus.current;
    lastStatus.current = status;
    if (previous !== null && previous !== status) {
      setStatusChanged(true);
      if (previous === "funded" && status === "released") setJustReleased(true);
    }
    if (signatureCount.current < timelineTransactionCount(status)) {
      const sigs = await dealSignatures(connection, address);
      signatureCount.current = sigs.length;
      setSignatures(sigs);
    }
  }, [address, connection, program]);

  // Poll so the landlord's screen flips to "Released" seconds after the tenant signs.
  // Hidden tabs don't poll; they reload as soon as they are shown again.
  useEffect(() => {
    const load = () => {
      if (document.hidden) return;
      refresh().then(
        () => setLoadError(null),
        (e: unknown) => setLoadError(e instanceof Error ? e.message : String(e)),
      );
    };
    const first = setTimeout(load, 0);
    const timer = setInterval(load, 2_000);
    document.addEventListener("visibilitychange", load);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
      document.removeEventListener("visibilitychange", load);
    };
  }, [refresh]);

  return { address, deal, signatures, loadError, statusChanged, justReleased, refresh };
}
