"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useSignTransaction, useWallets } from "@privy-io/react-auth/solana";
import { PublicKey, Transaction } from "@solana/web3.js";
import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from "react";
import { accountLabel, pickSigningWallet } from "@/lib/account";
import type { SigningWallet } from "@/lib/send";

export interface Account {
  /** False until Privy has restored the session: show skeletons, not "Log in". */
  ready: boolean;
  address: PublicKey | null;
  label: string | null;
  /** Signs with the account's wallet. Privy wallets sign without a pop-up (spec D2); Phantom shows its own approval. */
  wallet: SigningWallet;
  login: () => void;
  logout: () => Promise<void>;
  balance: bigint | null;
  refreshBalance: () => Promise<void>;
  topUp: () => Promise<void>;
}

const AccountContext = createContext<Account | null>(null);

export function AccountProvider({ children }: { children: ReactNode }) {
  const { ready: privyReady, authenticated, user, login, logout } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();
  const { signTransaction } = useSignTransaction();

  const primary = authenticated ? (user?.wallet?.address ?? null) : null;
  const signer = pickSigningWallet(wallets, primary);
  const connected = signer !== null;
  const address = useMemo(() => (primary && connected ? new PublicKey(primary) : null), [primary, connected]);
  const ready = privyReady && (!authenticated || walletsReady);

  const wallet = useMemo<SigningWallet>(
    () => ({
      publicKey: address,
      signTransaction: signer
        ? async (tx: Transaction) => {
            const { signedTransaction } = await signTransaction({
              transaction: new Uint8Array(tx.serialize({ requireAllSignatures: false, verifySignatures: false })),
              wallet: signer,
              options: { uiOptions: { showWalletUIs: false } },
            });
            return Transaction.from(signedTransaction);
          }
        : undefined,
    }),
    [address, signer, signTransaction],
  );

  // The marketing pages' "Log in" link lands on /deals?login=1: open Privy's modal once it is ready.
  useEffect(() => {
    if (!privyReady || !new URLSearchParams(window.location.search).has("login")) return;
    const timer = setTimeout(() => {
      const url = new URL(window.location.href);
      url.searchParams.delete("login");
      window.history.replaceState(window.history.state, "", url);
      if (!authenticated) login();
    }, 0);
    return () => clearTimeout(timer);
  }, [privyReady, authenticated, login]);

  const noop = useCallback(async () => {}, []);
  const value = useMemo<Account>(
    () => ({
      ready,
      address,
      label: address ? accountLabel(user, address.toBase58()) : null,
      wallet,
      login: () => login(),
      logout,
      balance: null,
      refreshBalance: noop,
      topUp: noop,
    }),
    [ready, address, user, wallet, login, logout, noop],
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount(): Account {
  const account = useContext(AccountContext);
  if (!account) throw new Error("useAccount must be used inside AccountProvider (the (app) route group).");
  return account;
}
