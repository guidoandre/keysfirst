"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

/** Current unix time in seconds, ticking; 0 until mounted (avoids SSR mismatches). */
export function useNow(intervalMs = 1_000): number {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const tick = () => setNow(Math.floor(Date.now() / 1000));
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, intervalMs);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [intervalMs]);
  return now;
}

const noopSubscribe = () => () => {};

/** False during server render and hydration, true afterwards. */
export function useMounted(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

/** Keeps the screen on while `active` (the landlord's handover code). Ignored where the browser can't. */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;
    let sentinel: WakeLockSentinel | null = null;
    let stopped = false;
    const request = () => {
      if (document.visibilityState !== "visible") return;
      navigator.wakeLock.request("screen").then(
        (lock) => {
          if (stopped) void lock.release();
          else sentinel = lock;
        },
        () => undefined,
      );
    };
    request();
    // The browser drops the lock when the tab is hidden; ask again when it comes back.
    document.addEventListener("visibilitychange", request);
    return () => {
      stopped = true;
      document.removeEventListener("visibilitychange", request);
      void sentinel?.release();
    };
  }, [active]);
}
