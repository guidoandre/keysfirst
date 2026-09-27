"use client";

import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import type { ReactNode } from "react";
import { RPC_URL } from "@/lib/config";

// No automatic retries on "429 Too Many Requests": each refusal was retried up to 5 times, which kept
// the whole Wi-Fi network over devnet's rate limit. The deal page's 2-second poll is the retry.
const CONNECTION_CONFIG = { commitment: "confirmed" as const, disableRetryOnRateLimit: true };

/** Phantom (and other Wallet Standard wallets) are detected automatically, so `wallets` stays empty. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ConnectionProvider endpoint={RPC_URL} config={CONNECTION_CONFIG}>
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
