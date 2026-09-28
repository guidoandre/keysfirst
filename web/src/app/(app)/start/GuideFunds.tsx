"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { LoginButton } from "@/components/wallet/LoginButton";
import { OpenInPhantom } from "@/components/wallet/OpenInPhantom";
import { TestFundsButton } from "@/components/wallet/TestFundsButton";
import { shortAddress } from "@/lib/format";
import { useMounted } from "@/lib/hooks";

/** Step 3 of the guide, live: log in, then get test funds right here. */
export function GuideFunds() {
  const mounted = useMounted();
  const { publicKey } = useWallet();
  if (!mounted || !publicKey) {
    return (
      <div className="max-w-sm space-y-3">
        <LoginButton variant="primary" fullWidth />
        <OpenInPhantom />
      </div>
    );
  }
  return (
    <div className="max-w-sm space-y-3">
      <p className="text-sm text-fg-muted">
        Logged in as <span className="font-semibold text-fg tabular-nums">{shortAddress(publicKey.toBase58())}</span>
      </p>
      <TestFundsButton variant="primary" />
    </div>
  );
}
