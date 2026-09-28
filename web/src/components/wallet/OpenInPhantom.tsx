"use client";

import { WalletReadyState } from "@solana/wallet-adapter-base";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { phantomBrowseUrl } from "@/lib/format";
import { useMounted } from "@/lib/hooks";

/** Phone browsers can't reach Phantom; this reopens the page inside Phantom's own browser. */
export function OpenInPhantom() {
  const mounted = useMounted();
  const { wallets } = useWallet();
  const hasWallet = wallets.some((w) => w.readyState === WalletReadyState.Installed);
  if (!mounted || hasWallet) return null;
  return (
    <Callout tone="info" title="On your phone?">
      <p>Open this page inside the Phantom app to log in and approve payments.</p>
      <Button
        className="mt-3"
        onClick={() => {
          window.location.href = phantomBrowseUrl(window.location.href);
        }}
      >
        Open in Phantom
      </Button>
    </Callout>
  );
}
