"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ConnectSheet } from "./ConnectSheet";

const ConnectContext = createContext<{ openConnect: () => void } | null>(null);

/** One connect sheet for the whole app. Any "Log in" button opens it; so does ?login=1 (the marketing pages' Log in link). */
export function ConnectProvider({
  children,
  walletError,
  clearWalletError,
}: {
  children: ReactNode;
  walletError: string | null;
  clearWalletError: () => void;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has("login")) return;
    const timer = setTimeout(() => {
      const url = new URL(window.location.href);
      url.searchParams.delete("login");
      window.history.replaceState(window.history.state, "", url);
      clearWalletError();
      setOpen(true);
    }, 0);
    return () => clearTimeout(timer);
  }, [clearWalletError]);

  const openConnect = useCallback(() => {
    clearWalletError();
    setOpen(true);
  }, [clearWalletError]);
  const close = useCallback(() => setOpen(false), []);
  const value = useMemo(() => ({ openConnect }), [openConnect]);

  return (
    <ConnectContext.Provider value={value}>
      {children}
      <ConnectSheet open={open} onClose={close} error={walletError} onClearError={clearWalletError} />
    </ConnectContext.Provider>
  );
}

export function useConnect() {
  const context = useContext(ConnectContext);
  if (!context) throw new Error("useConnect must be used inside ConnectProvider (the (app) route group).");
  return context;
}
