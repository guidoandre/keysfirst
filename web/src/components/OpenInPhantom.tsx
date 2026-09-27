"use client";

import { WalletReadyState } from "@solana/wallet-adapter-base";
import { useWallet } from "@solana/wallet-adapter-react";
import { phantomBrowseUrl } from "@/lib/format";
import { useMounted } from "@/lib/hooks";

/** Phone browsers can't reach Phantom; this reopens the page inside Phantom's own browser. */
export function OpenInPhantom() {
  const mounted = useMounted();
  const { wallets } = useWallet();
  const hasWallet = wallets.some((w) => w.readyState === WalletReadyState.Installed);
  if (!mounted || hasWallet) return null;
  return (
    <div className="mt-4 rounded-xl bg-stone-100 p-4 text-sm">
      <p>On your phone? Open this page inside the Phantom app to connect your wallet.</p>
      <button
        type="button"
        onClick={() => {
          window.location.href = phantomBrowseUrl(window.location.href);
        }}
        className="mt-2 rounded-lg bg-violet-600 px-4 py-2 font-semibold text-white"
      >
        Open in Phantom
      </button>
    </div>
  );
}
