"use client";

import { Connection } from "@solana/web3.js";
import { createContext, useContext, useMemo, type ReactNode } from "react";

const ConnectionContext = createContext<Connection | null>(null);

// No automatic retries on "429 Too Many Requests": each refusal was retried up to 5 times, which kept
// the whole Wi-Fi network over devnet's rate limit. The deal page's 2-second poll is the retry.
export function ConnectionProvider({ endpoint, children }: { endpoint: string; children: ReactNode }) {
  const connection = useMemo(() => new Connection(endpoint, { commitment: "confirmed", disableRetryOnRateLimit: true }), [endpoint]);
  return <ConnectionContext.Provider value={connection}>{children}</ConnectionContext.Provider>;
}

/** Same shape as the old Solana wallet adapter's hook, so call sites only change their import. */
export function useConnection(): { connection: Connection } {
  const connection = useContext(ConnectionContext);
  if (!connection) throw new Error("useConnection must be used inside ConnectionProvider (the (app) route group).");
  return { connection };
}
