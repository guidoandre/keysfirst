"use client";

import type { WalletError } from "@solana/wallet-adapter-base";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { useCallback, useState, type ReactNode } from "react";
import { ConnectProvider } from "@/components/wallet/ConnectProvider";
import { RPC_URL } from "@/lib/config";
import { friendlyError } from "@/lib/send";

// No automatic retries on "429 Too Many Requests": each refusal was retried up to 5 times, which kept
// the whole Wi-Fi network over devnet's rate limit. The deal page's 2-second poll is the retry.
const CONNECTION_CONFIG = { commitment: "confirmed" as const, disableRetryOnRateLimit: true };

/**
 * Phantom (and other Wallet Standard wallets) are detected automatically, so `wallets` stays empty.
 * autoConnect: choosing a wallet in the connect sheet connects it, and a returning visitor is reconnected.
 */
export function Providers({ children }: { children: ReactNode }) {
  const [walletError, setWalletError] = useState<string | null>(null);
  const handleWalletError = useCallback((error: WalletError) => setWalletError(friendlyError(error)), []);
  const clearWalletError = useCallback(() => setWalletError(null), []);

  return (
    <ConnectionProvider endpoint={RPC_URL} config={CONNECTION_CONFIG}>
      <WalletProvider wallets={[]} autoConnect onError={handleWalletError}>
        <ConnectProvider walletError={walletError} clearWalletError={clearWalletError}>
          {children}
        </ConnectProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
