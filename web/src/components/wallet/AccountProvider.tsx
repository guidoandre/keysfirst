"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useSignTransaction, useWallets } from "@privy-io/react-auth/solana";
import { PublicKey, Transaction } from "@solana/web3.js";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { accountLabel, pickSigningWallet } from "@/lib/account";
import { readBalance } from "@/lib/balance";
import { writeLoggedIn } from "@/lib/logged-in";
import { useConnection } from "@/lib/connection";
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
  /** Asks the server to cover network costs; true when it answered OK. */
  topUp: () => Promise<boolean>;
}

const AccountContext = createContext<Account | null>(null);
const PRIVY_PATIENCE_MS = 5_000;

export function AccountProvider({ children }: { children: ReactNode }) {
  const { ready: privyReady, authenticated, user, login, logout } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();
  const { signTransaction } = useSignTransaction();

  const primary = authenticated ? (user?.wallet?.address ?? null) : null;
  const signer = pickSigningWallet(wallets, primary);
  const connected = signer !== null;
  const address = useMemo(() => (primary && connected ? new PublicKey(primary) : null), [primary, connected]);
  // Right after an email/Google sign-up Privy is still creating (or connecting) the account's own wallet:
  // stay "not ready" (skeletons) instead of showing "Log in". Embedded wallets are 'privy' or 'privy-v2'.
  const clientType = user?.wallet?.walletClientType;
  const embedded = clientType === "privy" || clientType === "privy-v2";
  const embeddedPending = authenticated && (!primary || (embedded && !connected));
  // Privy that never starts (an ad blocker, its servers down) must not leave every page on skeletons: after a few
  // seconds the pages show as logged out, so a deal can still be read.
  const [privyStalled, setPrivyStalled] = useState(false);
  useEffect(() => {
    if (privyReady) return;
    const timer = setTimeout(() => setPrivyStalled(true), PRIVY_PATIENCE_MS);
    return () => clearTimeout(timer);
  }, [privyReady]);
  const ready = privyReady ? (!authenticated || walletsReady) && !embeddedPending : privyStalled;

  const wallet = useMemo<SigningWallet>(
    () => ({
      publicKey: address,
      signTransaction: signer
        ? async (tx: Transaction) => {
            const { signedTransaction } = await signTransaction({
              transaction: new Uint8Array(tx.serialize({ requireAllSignatures: false, verifySignatures: false })),
              wallet: signer,
              // Privy defaults to "solana:mainnet"; this app runs on devnet.
              chain: "solana:devnet",
              options: { uiOptions: { showWalletUIs: false } },
            });
            return Transaction.from(signedTransaction);
          }
        : undefined,
    }),
    [address, signer, signTransaction],
  );

  const { connection } = useConnection();
  const [balance, setBalance] = useState<{ owner: string; amount: bigint } | null>(null);
  const owner = address?.toBase58() ?? null;

  const refreshBalance = useCallback(async () => {
    if (!address) return;
    try {
      setBalance({ owner: address.toBase58(), amount: await readBalance(connection, address) });
    } catch {
      // Devnet busy: keep the last known balance; the next refresh tries again.
    }
  }, [address, connection]);

  const topUp = useCallback(async () => {
    if (!owner) return false;
    const res = await fetch("/api/gas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ account: owner }) }).catch(
      () => null,
    );
    return res?.ok ?? false;
  }, [owner]);

  // Once per browser session and account: cover network costs before the first action (spec D4), read the balance.
  useEffect(() => {
    if (!owner) return;
    const timer = setTimeout(async () => {
      void refreshBalance();
      const key = `keysfirst:gas:${owner}`;
      try {
        if (sessionStorage.getItem(key)) return;
      } catch {
        // Storage blocked: top up anyway (the server skips accounts that have enough).
      }
      // Remember the top-up only once the server confirmed it: a failed one is retried on the next visit.
      if (!(await topUp())) return;
      try {
        sessionStorage.setItem(key, "1");
      } catch {
        // Storage blocked: nothing to remember.
      }
    }, 0);
    const onVisible = () => {
      if (!document.hidden) void refreshBalance();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [owner, refreshBalance, topUp]);

  // Tell the marketing pages' header (no wallet code there) whether to show "Log in" or the account avatar.
  useEffect(() => {
    if (privyReady) writeLoggedIn(authenticated);
  }, [privyReady, authenticated]);

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

  // Logged in but the signing wallet isn't connected here (e.g. Phantom locked or not installed on this device):
  // Privy's login() does nothing on a live session, so log out first and start a fresh login.
  const startLogin = useCallback(() => {
    if (authenticated) void logout().catch(() => undefined).then(() => login());
    else login();
  }, [authenticated, login, logout]);

  const value = useMemo<Account>(
    () => ({
      ready,
      address,
      label: address ? accountLabel(user, address.toBase58()) : null,
      wallet,
      login: startLogin,
      logout,
      balance: balance && balance.owner === owner ? balance.amount : null,
      refreshBalance,
      topUp,
    }),
    [ready, address, owner, user, wallet, startLogin, logout, balance, refreshBalance, topUp],
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount(): Account {
  const account = useContext(AccountContext);
  if (!account) throw new Error("useAccount must be used inside AccountProvider (the (app) route group).");
  return account;
}
