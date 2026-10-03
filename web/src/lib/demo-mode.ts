"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Demo mode: an account setting, off by default, that brings the test shortcuts into the create flow ("Use demo
 * values" and the 5-minute window). Kept in this browser per account (no database); the account sheet switches it.
 */
const key = (account: string) => `keysfirst:demo:${account}`;
const CHANGE = "keysfirst:demo-change";

function read(account: string | null): boolean {
  if (!account) return false;
  try {
    return localStorage.getItem(key(account)) === "1";
  } catch {
    return false; // storage blocked: demo mode stays off
  }
}

function subscribe(onChange: () => void): () => void {
  // "storage" covers other tabs; the custom event covers this tab (the sheet and the create flow on one page).
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE, onChange);
  };
}

export function useDemoMode(account: string | null): [boolean, (on: boolean) => void] {
  const on = useSyncExternalStore(subscribe, () => read(account), () => false);
  const set = useCallback(
    (next: boolean) => {
      if (!account) return;
      try {
        if (next) localStorage.setItem(key(account), "1");
        else localStorage.removeItem(key(account));
      } catch {
        // Storage blocked: the switch can't stay on.
      }
      window.dispatchEvent(new Event(CHANGE));
    },
    [account],
  );
  return [on, set];
}
