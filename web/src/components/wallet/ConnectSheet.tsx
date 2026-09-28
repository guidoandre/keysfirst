"use client";

import { WalletReadyState, type WalletName } from "@solana/wallet-adapter-base";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button, ButtonLink, buttonClass } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { Sheet } from "@/components/ui/Sheet";
import { phantomBrowseUrl } from "@/lib/format";
import { useMounted } from "@/lib/hooks";

const PHANTOM_DOWNLOAD = "https://phantom.com/download";

export function ConnectSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { wallets, wallet, select, connect, connecting, connected } = useWallet();
  const mounted = useMounted();

  // Close as soon as the wallet is connected.
  useEffect(() => {
    if (open && connected) onClose();
  }, [open, connected, onClose]);

  const detected = wallets
    .filter((w) => w.readyState === WalletReadyState.Installed || w.readyState === WalletReadyState.Loadable)
    .sort((a, b) => Number(b.adapter.name === "Phantom") - Number(a.adapter.name === "Phantom"));
  const isPhone = mounted && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  async function choose(name: WalletName) {
    if (wallet?.adapter.name === name) {
      // Already selected (e.g. after a cancelled attempt): connect directly.
      await connect().catch(() => undefined);
    } else {
      // With autoConnect on, the provider connects right after the selection.
      select(name);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Log in with your wallet">
      <p className="text-fg-muted">
        A wallet is an app like Phantom that holds your money and approves payments. Keysfirst never sees your keys.
      </p>

      {detected.length > 0 ? (
        <ul className="mt-5 space-y-2">
          {detected.map((w) => (
            <li key={w.adapter.name}>
              <button
                type="button"
                onClick={() => void choose(w.adapter.name)}
                disabled={connecting}
                className="flex min-h-14 w-full items-center gap-3 rounded-md border-2 border-fg bg-canvas px-4 text-left font-semibold hover:bg-subtle disabled:cursor-wait disabled:opacity-70"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- the wallet's own data-URI icon */}
                <img src={w.adapter.icon} alt="" width={28} height={28} className="size-7 rounded-sm" />
                <span className="flex-1">{w.adapter.name}</span>
                <span className="text-sm font-normal text-fg-muted">
                  {connecting && wallet?.adapter.name === w.adapter.name ? "Opening…" : "Detected"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : isPhone ? (
        <div className="mt-5 space-y-3">
          <Callout tone="info" title="Open Keysfirst inside Phantom">
            Phone browsers can&apos;t reach your wallet. Phantom opens this page in its own browser, where logging in works.
          </Callout>
          <Button
            size="lg"
            fullWidth
            onClick={() => {
              window.location.href = phantomBrowseUrl(window.location.href);
            }}
          >
            Open in Phantom
          </Button>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          <Callout tone="info" title="No wallet in this browser">
            Install the Phantom browser extension, then reload this page.
          </Callout>
          <ButtonLink href={PHANTOM_DOWNLOAD} external size="lg" fullWidth>
            Install Phantom
          </ButtonLink>
        </div>
      )}

      <p className="mt-5 text-sm text-fg-muted">
        Phantom must be set to Solana Devnet.{" "}
        <Link href="/start#devnet" onClick={onClose} className={buttonClass({ variant: "quiet" })}>
          How?
        </Link>
      </p>
    </Sheet>
  );
}
