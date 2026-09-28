"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";
import type { ReactNode } from "react";
import { AccountProvider } from "@/components/wallet/AccountProvider";
import { PRIVY_APP_ID, RPC_URL } from "@/lib/config";
import { ConnectionProvider } from "@/lib/connection";

// Phantom and other installed Solana wallets, for "I already have a wallet" (spec D1).
const solanaConnectors = toSolanaWalletConnectors({ shouldAutoConnect: true });

/** One login for the whole app: email, Google or an existing Solana wallet (spec D1). */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ["email", "google", "wallet"],
        appearance: {
          theme: "light",
          accentColor: "#16181d",
          logo: "/icon.png",
          landingHeader: "Log in to Keysfirst",
          loginMessage: "Use your email or Google. No wallet app needed.",
          walletChainType: "solana-only",
          walletList: ["phantom", "detected_solana_wallets"],
        },
        embeddedWallets: { solana: { createOnLogin: "users-without-wallets" }, ethereum: { createOnLogin: "off" } },
        externalWallets: { solana: { connectors: solanaConnectors } },
      }}
    >
      <ConnectionProvider endpoint={RPC_URL}>
        <AccountProvider>{children}</AccountProvider>
      </ConnectionProvider>
    </PrivyProvider>
  );
}
