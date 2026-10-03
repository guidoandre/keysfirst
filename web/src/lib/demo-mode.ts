"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Demo mode: an account setting, off by default, that brings the test shortcuts into the create flow ("Use demo
 * values" and the 5-minute window). Kept in this browser per account (no database); the account sheet switches it.
 */
export const demoModeKey = (account: string) => `keysfirst:demo:${account}`;
const CHANGE = "keysfirst:demo-change";

type Store = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/** On only when this account switched it on here. No account, or storage blocked: off. */
export function readDemoMode(account: string | null, store: Store | null): boolean {
  if (!account || !store) return false;
  try {
    return store.getItem(demoModeKey(account)) === "1";
  } catch {
    return false;
  }
}

/** Saves the switch for this account; does nothing without an account and never throws (blocked storage). */
export function writeDemoMode(account: string | null, on: boolean, store: Store | null): void {
  if (!account || !store) return;
  try {
    if (on) store.setItem(demoModeKey(account), "1");
    else store.removeItem(demoModeKey(account));
  } catch {
    // Storage blocked: the switch can't stay on.
  }
}

function browserStore(): Store | null {
  try {
    return window.localStorage;
  } catch {
    return null; // some privacy modes throw on access
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
  const on = useSyncExternalStore(subscribe, () => readDemoMode(account, browserStore()), () => false);
  const set = useCallback(
    (next: boolean) => {
      writeDemoMode(account, next, browserStore());
      window.dispatchEvent(new Event(CHANGE));
    },
    [account],
  );
  return [on, set];
}
